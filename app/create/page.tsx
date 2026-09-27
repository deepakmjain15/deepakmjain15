import type { Metadata } from "next";
import { CreateTripForm } from "@/components/CreateTripForm";

export const metadata: Metadata = { title: "Create a trip" };

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-brand">New trip</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Start planning together</h1>
      <p className="mt-2 mb-8 text-muted">Takes 30 seconds. You&apos;ll get a link to share with your group.</p>
      <CreateTripForm />
    </main>
  );
}
