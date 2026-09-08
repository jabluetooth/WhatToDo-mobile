import { useCallback, useEffect, useState } from "react";
import { isDailyReminderEnabled, setDailyReminderEnabled } from "@/lib/notifications";

export function useDailyReminder() {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isDailyReminderEnabled().then(setEnabled);
  }, []);

  const toggle = useCallback(async () => {
    const ok = await setDailyReminderEnabled(!enabled);
    if (ok) {
      setEnabled((current) => !current);
      setError(null);
    } else {
      setError("Enable notifications in your device settings to get a daily reminder.");
    }
  }, [enabled]);

  return { enabled, toggle, error };
}
