import { Redirect } from "expo-router";

// Profile is presented as a modal (components/ProfileSheet.tsx) triggered from the dock's tab
// press listener in (tabs)/_layout.tsx, not a real screen — this route only exists because
// Tabs.Screen requires one. Redirect back if it's ever reached directly (e.g. a deep link).
export default function ProfileRoute() {
  return <Redirect href="/(tabs)" />;
}
