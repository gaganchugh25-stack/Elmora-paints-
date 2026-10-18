export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={diagonal ? { transform: "rotate(-45deg)" } : undefined}
    >
      <path
        d="M4 12h15m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Wordmark() {
  return (
    <a href="#home" className="wordmark" aria-label="Elmora Paints home">
      <svg className="brand-petals" viewBox="0 0 64 38" aria-hidden="true">
        <path d="M32 35C17 19 21 9 32 1c11 10 15 19 0 34" fill="#ee4b2b" />
        <path d="M29 37C9 36 2 25 2 14c17-1 26 7 27 23" fill="#f59b22" />
        <path d="M35 37C55 36 62 25 62 14c-17-1-26 7-27 23" fill="#eab329" />
      </svg>
      <span>Elmora</span>
      <small>PAINTS</small>
    </a>
  );
}
export function SectionTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {children && <div className="section-intro">{children}</div>}
    </div>
  );
}
