import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  variant?: "primary" | "secondary" | "outline" | "destructive";
  icon?: React.ReactNode;
  small?: boolean;
}

export default function DemoButton({
  label,
  variant = "primary",
  icon,
  small = false,
}: Props) {
  const colors = useColors();

  const handlePress = () => {
    Alert.alert(
      "Demo Mode",
      "This action is disabled in the demo. All features are active in the live platform.",
      [{ text: "Got it", style: "default" }]
    );
  };

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.secondary
        : variant === "destructive"
          ? colors.destructive
          : "transparent";

  const textColor =
    variant === "outline" ? colors.primary : colors.primaryForeground;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: colors.primary,
          borderWidth: variant === "outline" ? 1.5 : 0,
          paddingVertical: small ? 6 : 10,
          paddingHorizontal: small ? 12 : 16,
          borderRadius: colors.radius,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: small ? 12 : 14,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontWeight: "600",
  },
});
