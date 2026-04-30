import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ClassRow from "@/components/ClassRow";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const TABS = ["Upcoming", "Live Now", "Completed"];

const upcoming = [
  {
    subject: "Physics",
    topic: "Thermodynamics — Laws & Applications",
    date: "Today",
    time: "5:00 – 7:00 PM",
    teacher: "Dr. Ramesh Kumar",
  },
  {
    subject: "Chemistry",
    topic: "Organic Chemistry — Reaction Mechanisms",
    date: "Tomorrow",
    time: "5:00 – 7:00 PM",
    teacher: "Ms. Priya Sharma",
  },
  {
    subject: "Mathematics",
    topic: "Integral Calculus — Definite Integrals",
    date: "26 Apr",
    time: "5:00 – 7:00 PM",
    teacher: "Mr. Ajay Tiwari",
  },
  {
    subject: "Physics",
    topic: "Wave Optics",
    date: "28 Apr",
    time: "5:00 – 7:00 PM",
    teacher: "Dr. Ramesh Kumar",
  },
  {
    subject: "Biology",
    topic: "Human Physiology",
    date: "29 Apr",
    time: "10:00 AM – 12:00 PM",
    teacher: "Ms. Nidhi Verma",
  },
];

const liveNow = [
  {
    subject: "Chemistry",
    topic: "Equilibrium — Live Session",
    time: "NOW",
    teacher: "Ms. Priya Sharma",
    batch: "JEE 2026",
  },
];

const completed = [
  {
    subject: "Physics",
    topic: "Motion — Kinematics",
    date: "22 Apr",
    time: "5:00 – 7:00 PM",
    teacher: "Dr. Ramesh Kumar",
  },
  {
    subject: "Mathematics",
    topic: "Limits & Continuity",
    date: "21 Apr",
    time: "5:00 – 7:00 PM",
    teacher: "Mr. Ajay Tiwari",
  },
];

export default function StudentClasses() {
  const colors = useColors();
  const [tab, setTab] = useState(0);
  const data = [upcoming, liveNow, completed][tab];

  return (
    <ScreenContainer>
      <View style={[styles.tabRow, { marginTop: 16, marginBottom: 12 }]}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(i)}
            style={[
              styles.tabBtn,
              {
                backgroundColor:
                  tab === i ? colors.primary : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: tab === i ? colors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 1 && liveNow.length > 0 && (
        <View
          style={[
            styles.liveBanner,
            {
              backgroundColor: colors.destructive + "15",
              borderColor: colors.destructive,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.liveDot} />
          <Text style={[styles.liveText, { color: colors.destructive }]}>
            1 class is LIVE right now
          </Text>
        </View>
      )}

      {data.map((c, i) => (
        <ClassRow key={i} {...c} />
      ))}

      {data.length === 0 && (
        <View style={styles.empty}>
          <Feather name="video-off" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No classes in this category
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  liveText: {
    fontSize: 13,
    fontWeight: "600",
  },
  empty: {
    marginTop: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
