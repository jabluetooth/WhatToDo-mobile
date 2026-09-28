import { Redirect } from "expo-router";

// The Write tab opens the composer (app/compose.tsx) from its tab-press listener in
// (tabs)/_layout.tsx; this route only exists because Tabs.Screen needs one. If it's ever reached
// directly (a deep link), send it on to the composer.
export default function WriteRoute() {
  return <Redirect href="/compose" />;
}
