import Link from "next/link";

export function SellerFooter() {
  return (
    <footer className="border-t border-border-soft bg-background">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-3 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Seller Console · Performance Dashboard
        </p>
        <Link
          href="/contact"
          className="text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:text-gold"
        >
          Support
        </Link>
      </div>
    </footer>
  );
}
