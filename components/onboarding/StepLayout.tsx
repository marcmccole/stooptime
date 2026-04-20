interface StepLayoutProps {
  step: number;
  total?: number;
  backHref?: string;
  children: React.ReactNode;
}

export default function StepLayout({ step, total = 7, backHref, children }: StepLayoutProps) {
  const pct = Math.round((step / total) * 100);

  return (
    <div className="wizard-page">
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px 12px",
        maxWidth: 520,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {backHref ? (
            <a href={backHref} style={{ color: "#AAAAAA", display: "flex", alignItems: "center", textDecoration: "none" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
              </svg>
            </a>
          ) : (
            <div style={{ width: 20 }} />
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            color: "#BBBBBB", textTransform: "uppercase",
          }}>
            Step {step} of {total}
          </span>
        </div>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/stoop.svg" alt="Stoop" style={{ height: 28 }} />
        </a>
      </header>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#F0EEEB", maxWidth: 520, width: "100%", margin: "0 auto" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "#E8521A",
          borderRadius: "0 2px 2px 0",
          transition: "width 0.35s ease",
        }} />
      </div>

      {/* Content */}
      <div className="wizard-inner">
        {children}
      </div>
    </div>
  );
}
