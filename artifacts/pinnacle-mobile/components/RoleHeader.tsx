import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useRole } from "@/context/RoleContext";

interface Props {
  name: string;
  sub: string;
  roleLabel: string;
}

export default function RoleHeader({ name, sub, roleLabel }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setRole } = useRole();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSwitch = () => {
    Alert.alert("Switch Role", "Return to the role selector?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Switch",
        style: "destructive",
        onPress: () => setRole(null),
      },
    ]);
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.primary,
          paddingTop: topPad + 12,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <View style={styles.roleRow}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: colors.gold + "30" },
              ]}
            >
              <Text style={[styles.roleLabel, { color: colors.gold }]}>
                {roleLabel}
              </Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.primaryForeground }]}>
            {name}
          </Text>
          <Text
            style={[styles.sub, { color: colors.primaryForeground + "BB" }]}
          >
            {sub}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSwitch}
          style={[
            styles.switchBtn,
            { backgroundColor: colors.primaryForeground + "20" },
          ]}
        >
          <Feather
            name="refresh-ccw"
            size={16}
            color={colors.primaryForeground}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textBlock: {
    gap: 4,
  },
  roleRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  sub: {
    fontSize: 13,
  },
  switchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
});
