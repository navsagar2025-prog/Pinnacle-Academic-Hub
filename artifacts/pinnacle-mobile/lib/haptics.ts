import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const isNative = Platform.OS !== "web";

export function lightHaptic() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function mediumHaptic() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function heavyHaptic() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function successHaptic() {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function errorHaptic() {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function warningHaptic() {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
