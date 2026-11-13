import Image from "next/image";

export default function LogoLoader() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* SUBTLE LEDGER BACKDROP */}
      <div
        aria-hidden
        className="ledger-grid pointer-events-none absolute inset-0"
      />

      {/* AMBIENT BRAND GLOW */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-1/4 h-72 w-72 rounded-full bg-tertiary/[0.12] blur-3xl"
      />

      <div
        role="status"
        aria-live="polite"
        className="relative flex w-full max-w-xs flex-col items-center text-center"
      >
        {/* LOGO TILE */}
        <div className="relative animate-breathe motion-reduce:animate-none">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-[30px] bg-primary/15 blur-xl"
          />
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-border bg-white p-3 shadow-[0_18px_40px_-20px_rgba(1,56,168,0.5)]">
            <Image
              src="/skledge-logo.png"
              alt="SK-Ledge logo"
              width={96}
              height={96}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* SESSION DOT */}
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-success" />
          </span>
        </div>

        {/* WORDMARK */}
        <div className="mt-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
            SK-Ledge
          </p>
          <h1 className="mt-2 text-lg font-black tracking-tight text-primary-foreground">
            Secure Ledger Portal
          </h1>
          <p className="mt-1 text-xs text-secondary-foreground">
            Preparing your barangay dashboard
          </p>
        </div>

        {/* PROGRESS SWEEP */}
        <div className="mt-8 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/70">
            <div className="h-full w-1/3 animate-sweep rounded-full motion-reduce:animate-none" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground/80">
            <span>Verifying access</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-tertiary" />
              Sepolia ledger
            </span>
          </div>
        </div>

        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
