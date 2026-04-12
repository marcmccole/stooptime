import mixpanel from "mixpanel-browser";

let initialized = false;

function init() {
  if (initialized || typeof window === "undefined") return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) { console.warn("[Mixpanel] NEXT_PUBLIC_MIXPANEL_TOKEN is not set"); return; }
  mixpanel.init(token, { persistence: "localStorage", ignore_dnt: true, debug: true });
  initialized = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  init();
  if (!initialized) return;
  mixpanel.track(event, props);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  init();
  if (!initialized) return;
  mixpanel.identify(userId);
  if (traits) mixpanel.people.set(traits);
}

export function reset() {
  if (!initialized) return;
  mixpanel.reset();
}
