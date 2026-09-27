"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, buttonClass, Card, inputClass } from "./ui";

export function JoinCodeForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Accept either a bare code or a pasted link like https://…/t/ABC123
    const fromUrl = value.match(/\/t\/([A-Za-z0-9]+)/)?.[1];
    const code = (fromUrl ?? value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) {
      setError("That doesn't look like a trip code. It should be 6 letters and numbers.");
      return;
    }
    router.push(`/t/${code}`);
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <label htmlFor="code" className="sr-only">
          Trip code or link
        </label>
        <input
          id="code"
          className={inputClass + " h-14 text-center font-mono text-xl tracking-[0.3em] uppercase"}
          placeholder="ABC234"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {error && <Alert>{error}</Alert>}
        <button type="submit" className={buttonClass("primary", "lg") + " w-full"} disabled={!value.trim()}>
          Continue
        </button>
      </form>
    </Card>
  );
}
