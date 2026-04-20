"use client";

interface InterestLayoutProps {
  backHref?: string;
  children: React.ReactNode;
}

export default function InterestLayout({ backHref = "/", children }: InterestLayoutProps) {
  return (
    <div className="wizard-page">
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
        <a href={backHref} style={{ color: "#AAAAAA", display: "flex", alignItems: "center", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/stoop.svg" alt="Stoop" style={{ height: 28 }} />
        </a>
        <div style={{ width: 20 }} />
      </header>

      <div className="wizard-inner">
        {children}
      </div>
    </div>
  );
}
