import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface InterestRow {
  id: string;
  email: string;
  address: string;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function AdminInterestPage() {
  const { data, error } = await supabaseAdmin
    .from("interest_registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace" }}>
        <p style={{ color: "red" }}>Error: {error.message}</p>
      </div>
    );
  }

  const rows: InterestRow[] = data ?? [];

  // Group by neighborhood
  const byNeighborhood: Record<string, number> = {};
  for (const row of rows) {
    const key = row.neighborhood ?? "Unknown";
    byNeighborhood[key] = (byNeighborhood[key] ?? 0) + 1;
  }
  const neighborhoods = Object.entries(byNeighborhood).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{
      maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#1A1A1A",
    }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 32 }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
      </a>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Interest registrations</h1>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 40 }}>
        People who want a block party but haven't hosted yet.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 24, marginBottom: 48, flexWrap: "wrap" }}>
        <StatCard label="Total registrations" value={rows.length} />
        <StatCard label="Neighborhoods" value={neighborhoods.length} />
      </div>

      {/* By neighborhood */}
      {neighborhoods.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1A1A1A" }}>By neighborhood</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {neighborhoods.map(([name, count]) => (
              <div key={name} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", background: "#F9F6F3", borderRadius: 8,
              }}>
                <div style={{
                  flex: 1, height: 6, background: "#E8E8E8", borderRadius: 3, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 3, background: "#E8521A",
                    width: `${Math.round((count / rows.length) * 100)}%`,
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: "right" }}>{count}</span>
                <span style={{ fontSize: 14, color: "#444", minWidth: 160 }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>All registrations</h2>
      {rows.length === 0 ? (
        <p style={{ fontSize: 14, color: "#999" }}>No registrations yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #E8E8E8" }}>
                {["Email", "Address", "Neighborhood", "Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} style={{ borderBottom: "0.5px solid #F0EEEB" }}>
                  <td style={{ padding: "10px 12px", color: "#1A1A1A" }}>{row.email}</td>
                  <td style={{ padding: "10px 12px", color: "#444", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.address}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{row.neighborhood ?? "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#999", whiteSpace: "nowrap" }}>
                    {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: "#F9F6F3", borderRadius: 12,
      padding: "20px 28px", minWidth: 140,
    }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: "#E8521A", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}
