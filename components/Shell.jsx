function Shell({ title, actions, children }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold leading-none">MonAPP</div>
            <div className="mt-1 text-xs text-slate-300">{title}</div>
          </div>
          <div className="flex items-center gap-3">{actions}</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">{children}</main>
    </div>
  );
}

export default Shell;
