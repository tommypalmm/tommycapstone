"use client";

// Error state for every owner screen: shown instead of a blank page when data can't load.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="msg error" role="alert">
      <strong>Something went wrong loading this page.</strong>
      <p>Your data is safe. Check your connection and try again.</p>
      <button className="secondary" onClick={reset} style={{ marginTop: 8 }}>
        Try again
      </button>
    </div>
  );
}
