// Shared, server-rendered building blocks for empty, error, and feedback states.

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function param(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const error = param(sp, "error");
  const ok = param(sp, "ok");
  return (
    <>
      {error && (
        <div className="msg error" role="alert">
          {error}
        </div>
      )}
      {ok && (
        <div className="msg ok" role="status">
          {ok}
        </div>
      )}
    </>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function ErrorBox({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="msg error" role="alert">
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  );
}

export function StatusTag({ status }: { status: string }) {
  return <span className={`tag ${status}`}>{status.replace("_", "-")}</span>;
}
