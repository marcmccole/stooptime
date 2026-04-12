export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      color: "#1A1A1A",
    }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 32 }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
      </a>

      <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 36, fontWeight: 700, lineHeight: 1.15, marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 40 }}>Last updated: April 2026</p>

      <Section title="What we collect">
        <p>When you host or RSVP to a block party on Stoop, we collect the information you give us directly: your name, email address, and optional details like household size, a family photo, and a short note about yourself.</p>
        <p>We also collect basic usage data (pages visited, actions taken) through Mixpanel to understand how people use the product.</p>
      </Section>

      <Section title="How we use it">
        <p>We use your information to run the event — sending RSVP confirmations, notifying hosts when neighbors sign up, and delivering messages between guests. We do not sell your data or use it for advertising.</p>
      </Section>

      <Section title="Who can see your information">
        <p>Your name and any household details you share are visible to other attendees of the same event. Your email address is never shown publicly — it is only used to send you event-related emails.</p>
      </Section>

      <Section title="Photos">
        <p>Photos you upload are stored securely and displayed to other attendees of your event. You can remove your photo at any time by contacting us.</p>
      </Section>

      <Section title="Data retention">
        <p>We retain event and RSVP data for 12 months after the event date, then delete it. You can request deletion of your data at any time by emailing <a href="mailto:support@stooptime.com" style={{ color: "#E8521A" }}>support@stooptime.com</a>.</p>
      </Section>

      <Section title="Third-party services">
        <p>Stoop uses Supabase for data storage, Resend for email delivery, and Mixpanel for analytics. Each operates under their own privacy policies.</p>
      </Section>

      <Section title="Contact">
        <p>Questions? Email us at <a href="mailto:support@stooptime.com" style={{ color: "#E8521A" }}>support@stooptime.com</a>.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1A1A1A" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "#444", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}
