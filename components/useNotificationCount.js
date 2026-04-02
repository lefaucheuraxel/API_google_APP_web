'use client';

import { useEffect, useRef, useState } from 'react';

export default function useNotificationCount({ enabled } = {}) {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const esRef = useRef(null);

  async function refresh() {
    try {
      const res = await fetch('/api/notifications/unread');
      const data = await res.json();
      if (res.ok) setCount(Number(data?.count || 0));
      setReady(true);
    } catch {
      setReady(true);
    }
  }

  useEffect(() => {
    if (!enabled) return;

    refresh();

    let intervalId = null;

    try {
      const es = new EventSource('/api/notifications/stream');
      esRef.current = es;

      es.addEventListener('message', (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (typeof payload.count === 'number') setCount(payload.count);
          setReady(true);
        } catch {
          // ignore
        }
      });

      es.addEventListener('error', () => {
        try {
          es.close();
        } catch {
          // ignore
        }
        esRef.current = null;
      });
    } catch {
      // ignore
    }

    intervalId = setInterval(refresh, 15000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { count, ready, refresh };
}
