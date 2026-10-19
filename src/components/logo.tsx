export function ForkliftMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a5c" />
          <stop offset="1" stopColor="#ff5a2a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#fm-g)" />
      {/* mast + forks */}
      <path d="M9 9h3v27H9z" fill="#071f1e" />
      <path d="M5 33h12v3H5z" fill="#071f1e" />
      {/* body + cab */}
      <path d="M17 24h9l3-7h5l2 7h2.5a2.5 2.5 0 0 1 2.5 2.5V33H17z" fill="#071f1e" />
      <path d="M30.6 19.5h2.2l1.3 4.5h-5.2z" fill="#ff8a5c" />
      {/* wheels */}
      <circle cx="22.5" cy="36.5" r="4" fill="#071f1e" stroke="url(#fm-g)" strokeWidth="1.5" />
      <circle cx="36" cy="36.5" r="3.2" fill="#071f1e" stroke="url(#fm-g)" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <ForkliftMark />
      <span className={`font-display leading-[1.05] font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        <span className={`block text-[11px] tracking-[0.28em] uppercase ${light ? "text-accent" : "text-brand-2"}`}>De Baat</span>
        <span className="block text-lg">Trading</span>
      </span>
    </span>
  );
}
