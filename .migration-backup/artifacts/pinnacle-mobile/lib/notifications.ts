import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const NOTIF_PREF_KEY = "pinnacle_notifications_enabled";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPushPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      await AsyncStorage.setItem(NOTIF_PREF_KEY, "true");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getNotificationPreference(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIF_PREF_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function scheduleClassReminder(subject: string, classDate: Date): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const thirtyMinBefore = new Date(classDate.getTime() - 30 * 60 * 1000);
  if (thirtyMinBefore <= new Date()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Class starting in 30 min",
        body: `${subject} class is starting soon. Get ready!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: thirtyMinBefore,
      },
    });
  } catch {
    return null;
  }
}

export async function scheduleFeeDueReminder(amount: string, dueDate: Date): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const dayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
  if (dayBefore <= new Date()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Fee Payment Reminder",
        body: `Your fee of ${amount} is due tomorrow. Pay now to avoid late charges.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dayBefore,
      },
    });
  } catch {
    return null;
  }
}

export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
