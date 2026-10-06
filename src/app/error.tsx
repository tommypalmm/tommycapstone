"use client";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap narrow">
      <div className="msg error" role="alert">
        <strong>Something went wrong.</strong>
        <p>Please try again in a moment.</p>
        <button className="secondary" onClick={reset} style={{ marginTop: 8 }}>
          Try again
        </button>
      </div>
    </main>
  );
}
