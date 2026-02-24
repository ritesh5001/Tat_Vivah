export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">About Us</p>
        <h1 className="mt-4 font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
          About TatVivah
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
          TatVivah is a premium marketplace for curated Indian fashion, connecting customers with trusted sellers and timeless craftsmanship.
        </p>
      </div>
    </div>
  );
}
