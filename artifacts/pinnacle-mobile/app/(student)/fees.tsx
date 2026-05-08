import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { mediumHaptic, warningHaptic } from "@/lib/haptics";

const nextDue = { amount: "₹12,500", due: "May 10, 2025", course: "JEE 2026 Batch" };

const feeHistory = [
  { month: "April 2025", amount: "₹12,500", status: "Paid", date: "2 Apr 2025", ref: "TXN-8821" },
  { month: "March 2025", amount: "₹12,500", status: "Paid", date: "1 Mar 2025", ref: "TXN-8654" },
  { month: "February 2025", amount: "₹12,500", status: "Paid", date: "3 Feb 2025", ref: "TXN-8412" },
  { month: "January 2025", amount: "₹12,500", status: "Paid", date: "6 Jan 2025", ref: "TXN-8201" },
  { month: "December 2024", amount: "₹12,500", status: "Paid", date: "4 Dec 2024", ref: "TXN-7988" },
];

export default function StudentFees() {
  const colors = useColors();
  const demo = () => {
    warningHaptic();
    Alert.alert("Demo Mode", "Payment is disabled in demo.", [{ text: "OK" }]);
  };
  const copyRef = (ref: string) => {
    mediumHaptic();
    Alert.alert("Reference", ref, [{ text: "OK" }]);
  };

  return (
    <ScreenContainer>
      <View style={[styles.nextDueCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
        <Text style={[styles.nextDueLabel, { color: "rgba(255,255,255,0.7)" }]}>
          Next Fee Due · {nextDue.course}
        </Text>
        <Text style={[styles.nextDueAmount, { color: "#FFFFFF", fontFamily: "PlayfairDisplay_800ExtraBold" }]}>
          {nextDue.amount}
        </Text>
        <Text style={[styles.nextDueDue, { color: "rgba(255,255,255,0.75)" }]}>Due on {nextDue.due}</Text>
        <TouchableOpacity
          onPress={demo}
          style={[styles.payBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)", borderRadius: colors.radius - 4 }]}
        >
          <Feather name="credit-card" size={16} color="#FFFFFF" />
          <Text style={[styles.payBtnText, { color: "#FFFFFF" }]}>Pay Online (Demo Disabled)</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 8 }}>
        <SectionHeader title="Payment History" />
        {feeHistory.map((f, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => copyRef(f.ref)}
            activeOpacity={0.8}
            style={[styles.feeRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <View style={styles.feeLeft}>
              <View style={[styles.paidIcon, { backgroundColor: colors.success + "15", borderRadius: 20 }]}>
                <Feather name="check-circle" size={16} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.month, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}>{f.month}</Text>
                <Text style={[styles.ref, { color: colors.mutedForeground }]}>{f.ref} · {f.date}</Text>
              </View>
            </View>
            <View style={styles.feeRight}>
              <Text style={[styles.amount, { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" }]}>{f.amount}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + "18" }]}>
                <Text style={[styles.statusText, { color: colors.success }]}>{f.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nextDueCard: { padding: 20, marginTop: 4, gap: 8 },
  nextDueLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  nextDueAmount: { fontSize: 36, fontWeight: "800" },
  nextDueDue: { fontSize: 13 },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderWidth: 1, marginTop: 8 },
  payBtnText: { fontSize: 14, fontWeight: "600" },
  feeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, padding: 12, marginBottom: 8 },
  feeLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  paidIcon: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  month: { fontSize: 13 },
  ref: { fontSize: 11, marginTop: 2 },
  feeRight: { alignItems: "flex-end", gap: 4 },
  amount: { fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
});
