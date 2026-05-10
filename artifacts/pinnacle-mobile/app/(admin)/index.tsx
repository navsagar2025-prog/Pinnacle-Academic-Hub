import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ClassRow from "@/components/ClassRow";
import DemoButton from "@/components/DemoButton";
import LiveClassCard from "@/components/LiveClassCard";
import NoticeRow from "@/components/NoticeRow";
import RoleHeader from "@/components/RoleHeader";
import ScheduleClassSheet from "@/components/ScheduleClassSheet";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";
import { mediumHaptic } from "@/lib/haptics";
import { bucketize, useLiveClasses } from "@/lib/liveClassStore";

const enquiries = [
  { name: "Ananya Singh", course: "JEE 2026", date: "Today, 10:12 AM", status: "New" },
  { name: "Rohan Gupta", course: "NEET 2026", date: "Today, 9:04 AM", status: "New" },
  { name: "Priya Sharma", course: "Class 12 PCM", date: "Yesterday", status: "Contacted" },
];

const todayClasses = [
  { subject: "Physics", time: "5:00 PM", batch: "JEE 2026 — Eve", teacher: "Dr. Ramesh Kumar" },
  { subject: "Biology", time: "5:30 PM", batch: "NEET 2026 — Day", teacher: "Ms. Priya Sharma" },
  { subject: "Maths", time: "6:00 PM", batch: "Cl-12 PCM — Eve", teacher: "Mr. Ajay Tiwari" },
];

const pendingTasks = [
  { task: "Approve 4 new student registrations", urgent: true },
  { task: "Upload April fee receipts", urgent: true },
  { task: "Schedule May mock tests", urgent: false },
];

export default function AdminDashboard() {
  const colors = useColors();
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const { items: liveClasses } = useLiveClasses();
  const { liveNow, upcoming } = bucketize(liveClasses);
  const featured = liveNow[0] ?? upcoming[0] ?? null;
  return (
    <>
      <RoleHeader
        name="Admin — Pinnacle"
        sub="Pinnacle Academic Classes · Greater Noida"
        roleLabel="Admin"
      />
      <ScreenContainer>
        <View style={[styles.statsGrid, { marginTop: 16 }]}>
          {[
            { label: "Students", value: "512", sub: "+18 this month", color: colors.primary },
            { label: "Teachers", value: "12", sub: "3 subjects each", color: colors.secondary },
            { label: "Batches", value: "24", sub: "8 streams", color: colors.gold },
            { label: "Fee (Apr)", value: "₹18.4L", sub: "82% of target", color: colors.primary },
            { label: "Pending Fees", value: "₹4.1L", sub: "68 students", color: colors.maroon },
            { label: "Enquiries", value: "27", sub: "+12 this week", color: colors.secondary },
          ].map((s, i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.foreground }]}>{s.label}</Text>
              <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <SectionHeader
            title="Pending Tasks"
            action={<DemoButton label="View All" variant="outline" small />}
          />
          {pendingTasks.map((t, i) => (
            <View
              key={i}
              style={[
                styles.task,
                {
                  backgroundColor: colors.card,
                  borderColor: t.urgent ? colors.maroon : colors.border,
                  borderRadius: colors.radius,
                  borderLeftColor: t.urgent ? colors.maroon : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.taskDot,
                  { backgroundColor: t.urgent ? colors.maroon : colors.border },
                ]}
              />
              <Text style={[styles.taskText, { color: colors.foreground }]}>{t.task}</Text>
              {t.urgent && (
                <View style={[styles.urgentBadge, { backgroundColor: colors.maroon + "18", borderRadius: 4 }]}>
                  <Text style={[styles.urgentText, { color: colors.maroon }]}>Urgent</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <SectionHeader
            title="Live Classes"
            action={
              <TouchableOpacity
                onPress={() => {
                  mediumHaptic();
                  setScheduleVisible(true);
                }}
                style={[
                  styles.scheduleBtn,
                  { backgroundColor: colors.primary, borderRadius: colors.radius - 4 },
                ]}
              >
                <Feather name="plus" size={12} color={colors.primaryForeground} />
                <Text style={[styles.scheduleBtnText, { color: colors.primaryForeground }]}>
                  Schedule
                </Text>
              </TouchableOpacity>
            }
          />
          {featured ? (
            <LiveClassCard liveClass={featured} variant="featured" />
          ) : (
            <View
              style={[
                styles.emptyLive,
                { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
              ]}
            >
              <Feather name="video-off" size={20} color={colors.mutedForeground} />
              <Text style={[styles.emptyLiveText, { color: colors.mutedForeground }]}>
                No upcoming live classes — tap Schedule to add one
              </Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 8 }}>
          <SectionHeader title="Today's Classes" />
          {todayClasses.map((c, i) => (
            <ClassRow key={i} {...c} />
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <SectionHeader
            title="Recent Enquiries"
            action={<DemoButton label="Add" variant="outline" small />}
          />
          {enquiries.map((e, i) => (
            <View
              key={i}
              style={[
                styles.enquiryRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary + "18", borderRadius: 18 },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {e.name[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.enquiryName, { color: colors.foreground }]}>{e.name}</Text>
                <Text style={[styles.enquiryMeta, { color: colors.mutedForeground }]}>
                  {e.course} · {e.date}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      e.status === "New"
                        ? colors.secondary + "18"
                        : colors.muted,
                    borderRadius: 4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        e.status === "New"
                          ? colors.secondary
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {e.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScreenContainer>
      <ScheduleClassSheet visible={scheduleVisible} onClose={() => setScheduleVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "31%",
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  statSub: {
    fontSize: 10,
  },
  task: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 8,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: "700",
  },
  enquiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  enquiryName: {
    fontSize: 13,
    fontWeight: "600",
  },
  enquiryMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scheduleBtnText: { fontSize: 11, fontWeight: "700" },
  emptyLive: {
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  emptyLiveText: { fontSize: 12, textAlign: "center" },
});
