require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

function getRedirectUri(req) {
  if (process.env.REDIRECT_URI) return process.env.REDIRECT_URI;

  const protoHeader = req?.headers?.["x-forwarded-proto"];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || req?.protocol;
  const host = req?.get?.("host");
  if (!proto || !host) throw new Error("Missing REDIRECT_URI and cannot infer from request");
  return `${proto}://${host}/auth/callback`;
}

function createOAuthClient(req) {
  if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Missing GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET)
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  const redirectUri = getRedirectUri(req);

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

function getCalendarId(req) {
  return (
    req.body?.calendarId ||
    req.query?.calendarId ||
    process.env.GOOGLE_CALENDAR_ID ||
    "primary"
  );
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// 1️⃣ LOGIN
app.get("/auth/google", (req, res) => {
  const oauth2Client = createOAuthClient(req);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/contacts.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  });
  res.redirect(url);
});

// 2️⃣ CALLBACK
app.get("/auth/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const oauth2Client = createOAuthClient(req);

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // récupérer profil
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const user = await oauth2.userinfo.get();

    const wantsJson =
      req.query.json === "1" ||
      (req.headers.accept && req.headers.accept.includes("application/json"));

    if (!wantsJson) {
      const payload = JSON.stringify({
        user: user.data,
        tokens,
      });

      return res
        .status(200)
        .type("html")
        .send(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connexion...</title>
  </head>
  <body>
    <script>
      (function () {
        const data = ${payload};
        sessionStorage.setItem('google_auth', JSON.stringify(data));
        window.location.replace('/');
      })();
    </script>
  </body>
</html>`);
    }

    res.json({
      message: "Login réussi",
      user: user.data,
      tokens,
    });
  } catch (err) {
    const details = err?.response?.data || err?.errors || undefined;
    res.status(500).json({
      error: err?.message || "OAuth callback failed",
      details,
    });
  }
});

app.get("/people/me", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const oauth2Client = createOAuthClient(req);
    oauth2Client.setCredentials({ access_token: token });

    const people = google.people({ version: "v1", auth: oauth2Client });
    const me = await people.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses,photos",
    });

    res.json(me.data);
  } catch (err) {
    res.status(500).json({ error: err?.message || "People API failed" });
  }
});

app.get("/gmail/labels", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const oauth2Client = createOAuthClient(req);
    oauth2Client.setCredentials({ access_token: token });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const labels = await gmail.users.labels.list({ userId: "me" });
    res.json(labels.data.labels || []);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Gmail labels failed" });
  }
});

app.post("/gmail/send", async (req, res) => {
  try {
    const token = getBearerToken(req) || req.body?.access_token;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const { to, subject, text } = req.body;
    if (!to) return res.status(400).json({ error: "Missing to" });
    if (!subject) return res.status(400).json({ error: "Missing subject" });
    if (!text) return res.status(400).json({ error: "Missing text" });

    const oauth2Client = createOAuthClient(req);
    oauth2Client.setCredentials({ access_token: token });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const messageParts = [
      `To: ${to}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${subject}`,
      "",
      text,
    ];
    const message = messageParts.join("\r\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    const sent = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    res.json(sent.data);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Gmail send failed" });
  }
});

// 3️⃣ CRÉER UNE RÉSERVATION
app.post("/create-event", async (req, res) => {
  try {
    const token = getBearerToken(req) || req.body?.access_token;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const { summary, start, end } = req.body;
    if (!summary) return res.status(400).json({ error: "Missing summary" });
    if (!start) return res.status(400).json({ error: "Missing start" });
    if (!end) return res.status(400).json({ error: "Missing end" });

    const oauth2Client = createOAuthClient(req);
    oauth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const event = await calendar.events.insert({
      calendarId: getCalendarId(req),
      requestBody: {
        summary,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

    res.json(event.data);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Create event failed" });
  }
});

// 4️⃣ LISTER LES ÉVÉNEMENTS
app.post("/events", async (req, res) => {
  try {
    const token = getBearerToken(req) || req.body?.access_token;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const oauth2Client = createOAuthClient(req);
    oauth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const events = await calendar.events.list({
      calendarId: getCalendarId(req),
      maxResults: req.body?.maxResults || 50,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: req.body?.timeMin,
      timeMax: req.body?.timeMax,
    });

    res.json(events.data.items);
  } catch (err) {
    res.status(500).json({ error: err?.message || "List events failed" });
  }
});

// 5️⃣ SUPPRIMER ÉVÉNEMENT
app.post("/delete-event", async (req, res) => {
  try {
    const token = getBearerToken(req) || req.body?.access_token;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: "Missing eventId" });

    const oauth2Client = createOAuthClient(req);
    oauth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    await calendar.events.delete({
      calendarId: getCalendarId(req),
      eventId,
    });

    res.json({ message: "Supprimé" });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Delete event failed" });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});