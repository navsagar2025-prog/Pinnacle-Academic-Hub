import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { type ComponentProps, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useRole, type Role } from "@/context/RoleContext";
import {
  authenticate,
  getBiometricPreference,
  getSupportedBiometricType,
  isBiometricAvailable,
  setBiometricPreference,
} from "@/lib/biometric";

type FeatherName = ComponentProps<typeof Feather>["name"];

const ROLES: {
  id: Role;
  label: string;
  sub: string;
  icon: FeatherName;
  color: string;
}[] = [
  {
    id: "student",
    label: "Student",
    sub: "View classes, materials & schedule",
    icon: "book-open",
    color: "#4A90D9",
  },
  {
    id: "parent",
    label: "Parent",
    sub: "Track fees, attendance & timetable",
    icon: "users",
    color: "#0D7377",
  },
  {
    id: "teacher",
    label: "Teacher",
    sub: "Manage batches, materials & scan",
    icon: "edit-3",
    color: "#C9A84C",
  },
  {
    id: "admin",
    label: "Administrator",
    sub: "Full access to all management tools",
    icon: "shield",
    color: "#E05C5C",
  },
];

type BiometricState = "checking" | "cleared" | "blocked";

export default function RoleSelectorScreen() {
  const { role, setRole, loading } = useRole();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [biometricState, setBiometricState] = useState<BiometricState>("checking");
  const [biometricLabel, setBiometricLabel] = useState("Biometric");

  useEffect(() => {
    if (loading) return;
    if (!role) {
      setBiometricState("cleared");
      return;
    }

    async function checkBiometric() {
      const enabled = await getBiometricPreference();
      if (!enabled) {
        setBiometricState("cleared");
        return;
      }
      const available = await isBiometricAvailable();
      if (!available) {
        await setBiometricPreference(false);
        setBiometricState("cleared");
        return;
      }
      const label = await getSupportedBiometricType();
      setBiometricLabel(label);
      const ok = await authenticate(`Use ${label} to open Pinnacle`);
      setBiometricState(ok ? "cleared" : "blocked");
    }

    checkBiometric();
  }, [loading, role]);

  if (loading || (role && biometricState === "checking")) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: "#0A1F5C" }]}>
        <View style={[styles.logoCircle, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="award" size={40} color="#C9A84C" />
        </View>
        <ActivityIndicator color="#C9A84C" size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (role && biometricState === "cleared") {
    if (role === "student") return <Redirect href="/(student)" />;
    if (role === "parent") return <Redirect href="/(parent)" />;
    if (role === "teacher") return <Redirect href="/(teacher)" />;
    if (role === "admin") return <Redirect href="/(admin)" />;
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.primary }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 32, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBlock}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: "rgba(255,255,255,0.15)" },
            ]}
          >
            <Feather name="award" size={40} color="#C9A84C" />
          </View>
          <Text style={[styles.appName, { fontFamily: "PlayfairDisplay_800ExtraBold" }]}>PINNACLE</Text>
          <Text style={[styles.appSub, { fontFamily: "PlusJakartaSans_400Regular" }]}>Academic Classes · Greater Noida</Text>
        </View>

        <View style={styles.divider} />

        {biometricState === "blocked" ? (
          <>
            <Text style={styles.prompt}>Biometric authentication failed</Text>
            <View style={styles.cards}>
              <TouchableOpacity
                onPress={async () => {
                  setBiometricState("checking");
                  const ok = await authenticate(`Use ${biometricLabel} to open Pinnacle`);
                  setBiometricState(ok ? "cleared" : "blocked");
                }}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: colors.radius,
                    justifyContent: "center",
                  },
                ]}
              >
                <Feather name="shield" size={20} color="#C9A84C" />
                <Text style={[styles.cardLabel, { marginLeft: 10 }]}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole(null)}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: colors.radius,
                    justifyContent: "center",
                  },
                ]}
              >
                <Feather name="log-out" size={20} color="rgba(255,255,255,0.5)" />
                <Text style={[styles.cardSub, { marginLeft: 10, fontSize: 14 }]}>Sign out and switch role</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.prompt}>Select your role to continue</Text>
            <View style={styles.cards}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.card,
                    {
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.cardIcon,
                      {
                        backgroundColor: r.color + "35",
                        borderRadius: colors.radius - 4,
                      },
                    ]}
                  >
                    <Feather name={r.icon} size={24} color={r.color} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>{r.label}</Text>
                    <Text style={styles.cardSub}>{r.sub}</Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color="rgba(255,255,255,0.4)"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.footer}>
          Demo platform · KCK Corporate Services Pvt. Ltd.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 20,
  },
  logoBlock: {
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  appSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 24,
  },
  prompt: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    padding: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  footer: {
    marginTop: 32,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
});
