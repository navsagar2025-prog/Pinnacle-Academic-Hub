import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  date: string;
  title: string;
  tag?: string;
}

export default function NoticeRow({ date, title, tag }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View
        style={[
          styles.datePill,
          { backgroundColor: colors.muted, borderRadius: 6 },
        ]}
      >
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
          {date}
        </Text>
      </View>
      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {tag && (
        <View
          style={[
            styles.tag,
            { backgroundColor: colors.primary + "18", borderRadius: 4 },
          ]}
        >
          <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  datePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    fontWeight: "600",
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
