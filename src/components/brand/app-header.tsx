/** Fixed application wordmark, including the device's top safe area. */
export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border-light bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-center px-4">
        <span
          aria-label="Petfinder"
          className="inline-flex min-h-11 items-center font-[family-name:var(--font-montserrat)] text-xl tracking-[-0.04em] whitespace-nowrap"
        >
          <span className="font-black text-primary">PET</span>
          <span className="font-light text-text italic">FINDER.</span>
        </span>
      </div>
    </header>
  );
}
