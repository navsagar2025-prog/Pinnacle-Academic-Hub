import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const feeHistory = [
  { month: "April 2025", amount: "₹12,500", status: "Paid", date: "2 Apr", mode: "Online" },
  { month: "March 2025", amount: "₹12,500", status: "Paid", date: "1 Mar", mode: "Online" },
  { month: "February 2025", amount: "₹12,500", status: "Paid", date: "3 Feb", mode: "Cash" },
  { month: "January 2025", amount: "₹12,500", status: "Paid", date: "5 Jan", mode: "Online" },
  { month: "December 2024", amount: "₹15,000", status: "Paid", date: "4 Dec", mode: "Online" },
];

export default function ParentFees() {
  const colors = useColors();
  const demo = () => Alert.alert("Demo Mode", "Payment is disabled in demo.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <View
        style={[
          styles.nextDue,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
            marginTop: 16,
          },
        ]}
      >
        <Text style={[styles.dueLabel, { color: "rgba(255,255,255,0.7)" }]}>
          Next Fee Due
        </Text>
        <Text style={[styles.dueAmount, { color: "#FFFFFF" }]}>₹12,500</Text>
        <Text style={[styles.dueDate, { color: "rgba(255,255,255,0.8)" }]}>
          Due: May 10, 2025
        </Text>
        <TouchableOpacity
          onPress={demo}
          style={[
            styles.payBtn,
            { backgroundColor: colors.gold, borderRadius: colors.radius - 4 },
          ]}
          activeOpacity={0.8}
        >
          <Feather name="credit-card" size={16} color="#FFFFFF" />
          <Text style={styles.payLabel}>Pay Now</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.summaryRow,
          { marginTop: 16, marginBottom: 20 },
        ]}
      >
        {[
          { label: "Total Paid", value: "₹62,500", color: colors.success },
          { label: "Due Amount", value: "₹12,500", color: colors.warning },
          { label: "Total Fees", value: "₹1,50,000", color: colors.primary },
        ].map((s, i) => (
          <View
            key={i}
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.summaryValue, { color: s.color }]}>
              {s.value}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Payment History" />
      {feeHistory.map((f, i) => (
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
              styles.checkIcon,
              {
                backgroundColor: colors.success + "18",
                borderRadius: 16,
              },
            ]}
          >
            <Feather name="check-circle" size={18} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.month, { color: colors.foreground }]}>{f.month}</Text>
            <Text style={[styles.feeDate, { color: colors.mutedForeground }]}>
              Paid on {f.date} · {f.mode}
            </Text>
          </View>
          <Text style={[styles.feeAmt, { color: colors.foreground }]}>{f.amount}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nextDue: {
    padding: 20,
    gap: 6,
  },
  dueLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dueAmount: {
    fontSize: 32,
    fontWeight: "800",
  },
  dueDate: {
    fontSize: 13,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  payLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  checkIcon: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  month: {
    fontSize: 13,
    fontWeight: "600",
  },
  feeDate: {
    fontSize: 11,
    marginTop: 2,
  },
  feeAmt: {
    fontSize: 15,
    fontWeight: "700",
  },
});
