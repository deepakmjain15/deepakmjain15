import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-sm text-subtle">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">We couldn&apos;t find that trip</h1>
      <p className="mt-3 text-muted">
        Double-check the link or code with your coordinator. Codes are 6 characters, like <span className="font-mono">K7PQ2M</span>.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/join">Enter a code</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </main>
  );
}
