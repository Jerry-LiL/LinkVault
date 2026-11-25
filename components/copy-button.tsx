"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [label, setLabel] = useState("Copy");

  return (
    <button
      type="button"
      className="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setLabel("Copied");
        } catch {
          setLabel("Copy failed");
        }
        window.setTimeout(() => setLabel("Copy"), 1600);
      }}
    >
      {label}
    </button>
  );
}
