import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const ENABLED_KEY = "whattodo_daily_reminder_enabled";
const NOTIFICATION_ID_KEY = "whattodo_daily_reminder_notification_id";
const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function isDailyReminderEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ENABLED_KEY)) === "true";
}

export async function setDailyReminderEnabled(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return false;

    const existingId = await SecureStore.getItemAsync(NOTIFICATION_ID_KEY);
    if (existingId) await Notifications.cancelScheduledNotificationAsync(existingId);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's app idea is waiting",
        body: "Open What To Do to see what you could build today.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
      },
    });
    await SecureStore.setItemAsync(NOTIFICATION_ID_KEY, id);
    await SecureStore.setItemAsync(ENABLED_KEY, "true");
    return true;
  }

  const existingId = await SecureStore.getItemAsync(NOTIFICATION_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await SecureStore.deleteItemAsync(NOTIFICATION_ID_KEY);
  }
  await SecureStore.setItemAsync(ENABLED_KEY, "false");
  return true;
}
