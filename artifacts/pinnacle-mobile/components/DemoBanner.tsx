import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

/**
 * Persistent banner shown on all portal screens indicating demo mode.
 * All write actions are disabled; data is illustrative only.
 */
export default function DemoBanner() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.gold + "22",
          borderColor: colors.gold + "60",
        },
      ]}
    >
      <Feather name="info" size={12} color={colors.gold} />
      <Text style={[styles.text, { color: colors.gold }]}>
        Demo Mode — data is illustrative; write actions are disabled
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
});
