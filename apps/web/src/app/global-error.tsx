"use client";

import "client-only";

import { type FC, useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Replaces the root layout when it fails, so it brings its own document and styles
const GlobalError: FC<Props> = ({ error, retry }) => {
  useEffect(() => {
    console.error("Global error message:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          background: "#0f0f0f",
          color: "#fafafa",
          display: "flex",
          fontFamily: "system-ui, -apple-system, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100dvh",
          padding: 24,
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "26rem" }}>
          <h1>Flag on the play!</h1>
          <p style={{ color: "#a3a3a3" }}>Something went wrong loading the app.</p>
          <button
            onClick={retry}
            style={{
              background: "#15803d",
              border: 0,
              borderRadius: 10,
              color: "inherit",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 600,
              padding: "12px 16px",
            }}
            type="button"
          >
            Please try again
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
