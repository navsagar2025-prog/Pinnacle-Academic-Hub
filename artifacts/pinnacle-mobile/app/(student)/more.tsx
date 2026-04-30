import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { type ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useRole } from "@/context/RoleContext";
import { useColors } from "@/hooks/useColors";

type FeatherName = ComponentProps<typeof Feather>["name"];

type NavItem = {
  label: string;
  sub: string;
  icon: FeatherName;
  route: string;
  color: string;
};

const navItems: NavItem[] = [
  {
    label: "Recorded Classes",
    sub: "Watch missed or past lectures",
    icon: "play-circle",
    route: "/(student)/recordings",
    color: "#0D7377",
  },
  {
    label: "Practice Papers",
    sub: "Mock tests and past papers with scores",
    icon: "edit-3",
    route: "/(student)/papers",
    color: "#8B1A1A",
  },
  {
    label: "Fee Status",
    sub: "Payment history and next due date",
    icon: "credit-card",
    route: "/(student)/fees",
    color: "#C9A84C",
  },
];

export default function StudentMore() {
  const colors = useColors();
  const router = useRouter();
  const { setRole } = useRole();

  return (
    <ScreenContainer>
      <SectionHeader title="Resources" />
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.route}
          onPress={() => router.push(item.route as never)}
          activeOpacity={0.7}
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
              { backgroundColor: item.color + "15", borderRadius: colors.radius - 4 },
            ]}
          >
            <Feather name={item.icon} size={22} color={item.color} />
          </View>
          <View style={styles.navText}>
            <Text
              style={[
                styles.navLabel,
                { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" },
              ]}
            >
              {item.label}
            </Text>
            <Text style={[styles.navSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      ))}

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
