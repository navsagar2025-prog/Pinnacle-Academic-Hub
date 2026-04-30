import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React from "react";
import {
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

const ROLES: {
  id: Role;
  label: string;
  sub: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "student",
    label: "Student",
    sub: "View classes, materials & schedule",
    icon: "book-open",
    color: "#0A1F5C",
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
    color: "#8B1A1A",
  },
];

export default function RoleSelectorScreen() {
  const { role, setRole } = useRole();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (role) {
    if (role === "student") return <Redirect href="/(student)/" />;
    if (role === "parent") return <Redirect href="/(parent)/" />;
    if (role === "teacher") return <Redirect href="/(teacher)/" />;
    if (role === "admin") return <Redirect href="/(admin)/" />;
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
          <Text style={styles.appName}>PINNACLE</Text>
          <Text style={styles.appSub}>Academic Classes · Greater Noida</Text>
        </View>

        <View style={styles.divider} />

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
                    backgroundColor: r.color + "30",
                    borderRadius: colors.radius - 4,
                  },
                ]}
              >
                <Feather name={r.icon as any} size={24} color={r.color} />
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
