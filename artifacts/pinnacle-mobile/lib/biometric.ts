import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const BIOMETRIC_PREF_KEY = "pinnacle_biometric_enabled";

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const supported = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return supported && enrolled;
  } catch {
    return false;
  }
}

export async function getSupportedBiometricType(): Promise<string> {
  if (Platform.OS === "web") return "none";
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Fingerprint";
    return "Biometric";
  } catch {
    return "Biometric";
  }
}

export async function authenticate(reason = "Verify your identity to continue"): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function getBiometricPreference(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(BIOMETRIC_PREF_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function setBiometricPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_PREF_KEY, enabled ? "true" : "false");
  } catch {}
}
