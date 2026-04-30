import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const batches = [
  {
    name: "JEE 2026 — Evening",
    stream: "JEE Main + Advanced",
    students: 48,
    time: "5:00 PM – 7:00 PM",
    days: "Mon, Wed, Fri",
    room: "Room 101",
  },
  {
    name: "NEET 2026 — Evening",
    stream: "NEET Biology + Physics",
    students: 42,
    time: "7:00 PM – 9:00 PM",
    days: "Mon, Thu",
    room: "Room 102",
  },
  {
    name: "Class 12 PCM — Day",
    stream: "Board + JEE Foundation",
    students: 37,
    time: "10:00 AM – 12:00 PM",
    days: "Tue, Thu, Sat",
    room: "Room 103",
  },
];

export default function TeacherBatches() {
  const colors = useColors();

  return (
    <ScreenContainer>
      <View style={{ marginTop: 16 }}>
        <SectionHeader title={`${batches.length} Active Batches`} />
        {batches.map((b, i) => (
          <View
            key={i}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.batchName, { color: colors.foreground }]}>
                  {b.name}
                </Text>
                <Text style={[styles.stream, { color: colors.mutedForeground }]}>
                  {b.stream}
                </Text>
              </View>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: colors.gold + "20",
                    borderRadius: 8,
                  },
                ]}
              >
                <Feather name="users" size={12} color={colors.gold} />
                <Text style={[styles.countText, { color: colors.gold }]}>
                  {b.students}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Feather name="clock" size={13} color={colors.mutedForeground} />
                <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                  {b.time}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="calendar" size={13} color={colors.mutedForeground} />
                <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                  {b.days}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                  {b.room}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  batchName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  stream: {
    fontSize: 12,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 12,
  },
});
