const NAVIGATION_START_EVENT = "tatvivah:navigation-start";

export function startNavigationFeedback() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAVIGATION_START_EVENT));
}

export { NAVIGATION_START_EVENT };