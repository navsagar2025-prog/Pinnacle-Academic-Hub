import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  value: string;
  label: string;
  color?: string;
}

export default function StatCard({ value, label, color }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Text style={[styles.value, { color: color ?? colors.primary }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
});
