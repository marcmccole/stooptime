"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepLayout from "@/components/onboarding/StepLayout";
import { savePartyState, getPartyState } from "@/lib/party-state";
import { track } from "@/lib/mixpanel";
import { supabase } from "@/lib/supabase";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  // Mon-first offset: Sun=6, Mon=0, Tue=1, …
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Step4() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/host/auth");
    });
  }, [router]);

  const today = new Date();
  const isStreetClosure = getPartyState().size === "street_closure";
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + (isStreetClosure ? 30 : 5));
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [time, setTime] = useState("14:00");

  const cells = getCalendarCells(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const threshold = new Date(minDate); threshold.setHours(0, 0, 0, 0);
    return d < threshold;
  };

  const isWeekend = (day: number) => {
    const dow = new Date(viewYear, viewMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  // Which day-of-week is a Saturday in this grid? (index in 0-6, Mon=0)
  const hasSaturdayTip = cells.some(d => d !== null && isWeekend(d) && new Date(viewYear, viewMonth, d).getDay() === 6);

  const ready = selectedDay !== null;

  return (
    <StepLayout step={4} backHref="/host/auth">
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
        When's the party?
      </h1>
      <p style={{ fontSize: 15, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>
        Pick a date that works for you. You can change it later.
      </p>

      {isStreetClosure && (
        <div style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          background: "#FDF0E8", border: "1px solid #F5B898",
          borderRadius: 10, padding: "12px 14px", marginBottom: 20,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🚧</span>
          <p style={{ margin: 0, fontSize: 13, color: "#C8401A", lineHeight: 1.5 }}>
            <strong>Street closures need lead time.</strong> Your city requires at least 30 days' notice to process a permit. We've greyed out dates that won't work.
          </p>
        </div>
      )}

      {/* Calendar */}
      <div style={{ background: "#fff", border: "1.5px solid #E8E8E8", borderRadius: 14, padding: "16px 12px", marginBottom: 16 }}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 4px" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#999", display: "flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#999", display: "flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{
              textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              color: d === "SAT" || d === "SUN" ? "#E8521A" : "#AAAAAA",
              padding: "4px 0",
            }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const past = isPast(day);
            const weekend = isWeekend(day);
            const selected = selectedDay === day;
            const todayMark = isToday(day);
            return (
              <div
                key={i}
                onClick={() => !past && setSelectedDay(day)}
                className={[
                  "cal-day",
                  weekend && !selected ? "cal-day-weekend" : "",
                  selected ? "cal-day-selected" : "",
                  todayMark && !selected ? "cal-day-today" : "",
                  past ? "cal-day-past" : "",
                ].join(" ")}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Saturday tip */}
      {hasSaturdayTip && !selectedDay && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#FDF0E8", borderRadius: 8, padding: "10px 14px", marginBottom: 20,
        }}>
          <span style={{ fontSize: 16 }}>☀️</span>
          <span style={{ fontSize: 13, color: "#C8401A", lineHeight: 1.4 }}>
            Saturday afternoons tend to get the best turnout.
          </span>
        </div>
      )}

      {/* Time picker */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
          Starting at
        </label>
        <select
          value={time}
          onChange={e => setTime(e.target.value)}
          style={{
            width: "100%", padding: "13px 14px",
            border: "1.5px solid #E8E8E8", borderRadius: 8,
            fontSize: 15, fontFamily: "inherit", color: "#1A1A1A",
            background: "#fff", cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23AAAAAA' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
          }}
        >
          {Array.from({ length: 24 * 2 }, (_, i) => {
            const h = Math.floor(i / 2);
            const m = i % 2 === 0 ? "00" : "30";
            const ampm = h < 12 ? "AM" : "PM";
            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            const value = `${String(h).padStart(2, "0")}:${m}`;
            const label = `${h12}:${m} ${ampm}`;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
      </div>

      <div style={{ marginTop: "auto" }}>
        <a
          href={ready ? "/host/vibe" : undefined}
          onClick={() => {
            if (ready && selectedDay !== null) {
              savePartyState({ date: { year: viewYear, month: viewMonth, day: selectedDay }, time });
              track("Date Selected", {
                date: `${viewYear}-${viewMonth + 1}-${selectedDay}`,
                time,
                is_weekend: isWeekend(selectedDay),
              });
            }
          }}
          className="btn-primary"
          style={{
            display: "block", textAlign: "center",
            opacity: ready ? 1 : 0.45,
            pointerEvents: ready ? "auto" : "none",
          }}
        >
          Continue
        </a>
        <p style={{ fontSize: 12, color: "#CCCCCC", textAlign: "center", marginTop: 12 }}>
          You can change this later if you need to
        </p>
      </div>
    </StepLayout>
  );
}

