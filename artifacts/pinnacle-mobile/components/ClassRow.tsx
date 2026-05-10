import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  subject: string;
  topic?: string;
  time: string;
  date?: string;
  teacher?: string;
  batch?: string;
}

export default function ClassRow({
  subject,
  topic,
  time,
  date,
  teacher,
  batch,
}: Props) {
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
      <View
        style={[
          styles.icon,
          {
            backgroundColor: colors.primary + "18",
            borderRadius: colors.radius - 4,
          },
        ]}
      >
        <Feather name="video" size={18} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.subject, { color: colors.foreground }]}>
          {subject}
          {topic ? ` — ${topic}` : ""}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {[teacher, batch, date, time].filter(Boolean).join(" · ")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  icon: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  subject: {
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
  },
});
