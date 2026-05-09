import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DemoButton from "@/components/DemoButton";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const TABS = ["Overview", "Due", "Recent"];

const dueList = [
  { name: "Rohan Sharma", batch: "JEE 2026", amount: "₹12,500", due: "Apr 10" },
  { name: "Karan Patel", batch: "NEET 2026", amount: "₹12,500", due: "Apr 10" },
  { name: "Mihir Rao", batch: "Cl-12 PCM", amount: "₹10,000", due: "Apr 15" },
  { name: "Sunita Yadav", batch: "Foundation", amount: "₹8,000", due: "Apr 15" },
  { name: "Vikram Singh", batch: "JEE 2026", amount: "₹12,500", due: "Apr 20" },
];

const recentPayments = [
  { name: "Arjun Mehta", batch: "JEE 2026", amount: "₹12,500", date: "2 Apr", mode: "Online" },
  { name: "Priya Singh", batch: "NEET 2026", amount: "₹12,500", date: "1 Apr", mode: "Cash" },
  { name: "Ananya Verma", batch: "Cl-12 PCM", amount: "₹10,000", date: "1 Apr", mode: "Online" },
  { name: "Vaibhav Gupta", batch: "Foundation", amount: "₹8,000", date: "31 Mar", mode: "Online" },
];

export default function AdminFinance() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.primary, borderRadius: colors.radius, marginTop: 16 },
        ]}
      >
        <Text style={styles.summaryLabel}>April 2025 Collection</Text>
        <Text style={styles.summaryAmount}>₹18,40,000</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemValue}>₹4,10,000</Text>
            <Text style={styles.summaryItemLabel}>Pending</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemValue}>82%</Text>
            <Text style={styles.summaryItemLabel}>Target Met</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemValue}>444</Text>
            <Text style={styles.summaryItemLabel}>Paid</Text>
          </View>
        </View>
      </View>

      <View style={[styles.tabRow, { marginTop: 16, marginBottom: 16 }]}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(i)}
            style={[
              styles.tabBtn,
              {
                backgroundColor: tab === i ? colors.maroon : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: tab === i ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 0 && (
        <View style={{ gap: 8 }}>
          {[
            { label: "Total Enrolled", value: "512", color: colors.primary },
            { label: "Fees Paid", value: "444 students", color: colors.success },
            { label: "Fees Due", value: "68 students", color: colors.maroon },
            { label: "Monthly Target", value: "₹22,40,000", color: colors.foreground },
            { label: "Collected", value: "₹18,40,000", color: colors.primary },
          ].map((r, i) => (
            <View
              key={i}
              style={[
                styles.overviewRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>
                {r.label}
              </Text>
              <Text style={[styles.overviewValue, { color: r.color }]}>{r.value}</Text>
            </View>
          ))}
        </View>
      )}

      {tab === 1 && (
        <View>
          <SectionHeader
            title={`${dueList.length} pending`}
            action={<DemoButton label="Send Reminders" variant="outline" small />}
          />
          {dueList.map((d, i) => (
            <View
              key={i}
              style={[
                styles.feeRow,
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
                  { backgroundColor: colors.maroon + "18", borderRadius: 18 },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.maroon }]}>
                  {d.name[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feeName, { color: colors.foreground }]}>{d.name}</Text>
                <Text style={[styles.feeMeta, { color: colors.mutedForeground }]}>
                  {d.batch} · Due: {d.due}
                </Text>
              </View>
              <Text style={[styles.feeAmt, { color: colors.maroon }]}>{d.amount}</Text>
            </View>
          ))}
        </View>
      )}

      {tab === 2 && (
        <View>
          <SectionHeader title="Recent Payments" action={<DemoButton label="Export" variant="outline" small />} />
          {recentPayments.map((p, i) => (
            <View
              key={i}
              style={[
                styles.feeRow,
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
                  { backgroundColor: colors.success + "18", borderRadius: 18 },
                ]}
              >
                <Feather name="check" size={16} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feeName, { color: colors.foreground }]}>{p.name}</Text>
                <Text style={[styles.feeMeta, { color: colors.mutedForeground }]}>
                  {p.batch} · {p.date} · {p.mode}
                </Text>
              </View>
              <Text style={[styles.feeAmt, { color: colors.success }]}>{p.amount}</Text>
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 20,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 0,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summaryItemLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    marginVertical: 4,
  },
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
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 14,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  overviewValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  feeRow: {
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
  feeName: {
    fontSize: 13,
    fontWeight: "600",
  },
  feeMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  feeAmt: {
    fontSize: 14,
    fontWeight: "700",
  },
});
