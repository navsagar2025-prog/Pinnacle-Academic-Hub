import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useRole } from "@/context/RoleContext";
import { useColors } from "@/hooks/useColors";
import {
  authenticate,
  getBiometricPreference,
  getSupportedBiometricType,
  isBiometricAvailable,
  setBiometricPreference,
} from "@/lib/biometric";

export default function TeacherMore() {
  const colors = useColors();
  const { setRole } = useRole();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function loadBiometricState() {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const [enabled, label] = await Promise.all([
          getBiometricPreference(),
          getSupportedBiometricType(),
        ]);
        setBiometricEnabled(enabled);
        setBiometricLabel(label);
      }
    }
    loadBiometricState();
  }, []);

  async function handleBiometricToggle(value: boolean) {
    if (toggling) return;
    setToggling(true);
    try {
      if (value) {
        const ok = await authenticate(`Confirm your ${biometricLabel} to enable biometric login`);
        if (ok) {
          await setBiometricPreference(true);
          setBiometricEnabled(true);
        }
      } else {
        await setBiometricPreference(false);
        setBiometricEnabled(false);
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Settings" />

      {biometricAvailable && (
        <View
          style={[
            styles.navCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: "#C9A84C15", borderRadius: colors.radius - 4 },
            ]}
          >
            <Feather name="shield" size={22} color="#C9A84C" />
          </View>
          <View style={styles.navText}>
            <Text
              style={[
                styles.navLabel,
                { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" },
              ]}
            >
              {biometricLabel} Login
            </Text>
            <Text style={[styles.navSub, { color: colors.mutedForeground }]}>
              {biometricEnabled
                ? "Enabled — app will prompt on next open"
                : "Unlock the app with your biometrics"}
            </Text>
          </View>
          {toggling ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          )}
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <SectionHeader title="Account" />
        <TouchableOpacity
          onPress={() => setRole(null)}
          style={[
            styles.navCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
            <Feather name="log-out" size={22} color={colors.mutedForeground} />
          </View>
          <View style={styles.navText}>
            <Text style={[styles.navLabel, { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" }]}>
              Switch Role
            </Text>
            <Text style={[styles.navSub, { color: colors.mutedForeground }]}>
              Return to the role selector
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  navText: {
    flex: 1,
    gap: 3,
  },
  navLabel: {
    fontSize: 15,
  },
  navSub: {
    fontSize: 12,
  },
});
