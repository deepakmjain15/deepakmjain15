import { Logo } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>Decision support for group trips. The final call is always yours.</p>
      </div>
    </footer>
  );
}
