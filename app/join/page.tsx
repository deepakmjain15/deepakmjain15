import type { Metadata } from "next";
import { JoinCodeForm } from "@/components/JoinCodeForm";

export const metadata: Metadata = { title: "Join a trip" };

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-20">
      <p className="text-sm font-medium text-brand">Join a trip</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Enter your trip code</h1>
      <p className="mt-2 mb-8 text-muted">
        It&apos;s the 6-character code your coordinator shared. Opening their link works too.
      </p>
      <JoinCodeForm />
    </main>
  );
}
