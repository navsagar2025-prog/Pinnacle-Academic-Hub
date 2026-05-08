import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PaymentSheet, { type PaymentResult } from "@/components/PaymentSheet";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { useFeePayments } from "@/lib/feeStore";
import { lightHaptic, mediumHaptic } from "@/lib/haptics";

const NEXT_DUE = {
  amount: 12500,
  due: "May 10, 2025",
  forMonth: "May 2025",
  course: "JEE 2026 Batch",
};

const baseHistory = [
  { month: "April 2025", amount: 12500, date: "2 Apr", mode: "Online · UPI" },
  { month: "March 2025", amount: 12500, date: "1 Mar", mode: "Online · Card" },
  { month: "February 2025", amount: 12500, date: "3 Feb", mode: "Cash" },
  { month: "January 2025", amount: 12500, date: "5 Jan", mode: "Online · UPI" },
  { month: "December 2024", amount: 15000, date: "4 Dec", mode: "Online · Net Banking" },
];

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function ParentFees() {
  const colors = useColors();
  const { payments, addPayment } = useFeePayments();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isPaidForMay = useMemo(
    () => payments.some((p) => p.forMonth === NEXT_DUE.forMonth),
    [payments],
  );

  const allHistory = useMemo(() => {
    const userPaid = payments.map((p) => {
      const d = new Date(p.paidAt);
      return {
        month: p.forMonth,
        amount: p.amount,
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        mode: p.method,
      };
    });
    return [...userPaid, ...baseHistory];
  }, [payments]);

  const totals = useMemo(() => {
    const paidExtra = payments.reduce((s, p) => s + p.amount, 0);
    return {
      totalPaid: 62500 + paidExtra,
      due: isPaidForMay ? 0 : 12500,
      total: 150000,
    };
  }, [payments, isPaidForMay]);

  const openPay = () => {
    if (isPaidForMay) {
      lightHaptic();
      Alert.alert("Already Paid", `${NEXT_DUE.forMonth} fee has been paid. Thank you!`);
      return;
    }
    mediumHaptic();
    setSheetOpen(true);
  };

  const handleSuccess = async (r: PaymentResult) => {
    await addPayment({
      txnId: r.txnId,
      amount: r.amount,
      method: r.methodLabel,
      paidAt: r.paidAt,
      forMonth: NEXT_DUE.forMonth,
    });
    setSheetOpen(false);
    setTimeout(
      () =>
        Alert.alert(
          "Payment Successful",
          `${fmtINR(r.amount)} paid for ${NEXT_DUE.forMonth}.\nReference: ${r.txnId.toUpperCase()}`,
        ),
      450,
    );
  };

  return (
    <ScreenContainer>
      <View
        style={[
          styles.nextDue,
          { backgroundColor: colors.primary, borderRadius: colors.radius, marginTop: 16 },
        ]}
      >
        <Text style={[styles.dueLabel, { color: "rgba(255,255,255,0.7)" }]}>Next Fee Due</Text>
        <Text style={[styles.dueAmount, { color: "#FFFFFF" }]}>{fmtINR(NEXT_DUE.amount)}</Text>
        <Text style={[styles.dueDate, { color: "rgba(255,255,255,0.8)" }]}>Due: {NEXT_DUE.due}</Text>
        <TouchableOpacity
          onPress={openPay}
          activeOpacity={0.85}
          style={[
            styles.payBtn,
            {
              backgroundColor: isPaidForMay ? "rgba(255,255,255,0.15)" : colors.gold,
              borderRadius: colors.radius - 4,
            },
          ]}
        >
          <Feather name={isPaidForMay ? "check-circle" : "credit-card"} size={16} color="#FFFFFF" />
          <Text style={styles.payLabel}>{isPaidForMay ? "Paid" : "Pay Now"}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryRow, { marginTop: 16, marginBottom: 20 }]}>
        {[
          { label: "Total Paid", value: fmtINR(totals.totalPaid), color: colors.success },
          { label: "Due Amount", value: fmtINR(totals.due), color: totals.due === 0 ? colors.success : colors.warning },
          { label: "Total Fees", value: fmtINR(totals.total), color: colors.primary },
        ].map((s, i) => (
          <View
            key={i}
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Payment History" />
      {allHistory.map((f, i) => (
        <View
          key={i + f.month + f.date}
          style={[
            styles.feeRow,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View style={[styles.checkIcon, { backgroundColor: colors.success + "18", borderRadius: 16 }]}>
            <Feather name="check-circle" size={18} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.month, { color: colors.foreground }]}>{f.month}</Text>
            <Text style={[styles.feeDate, { color: colors.mutedForeground }]} numberOfLines={1}>
              Paid on {f.date} · {f.mode}
            </Text>
          </View>
          <Text style={[styles.feeAmt, { color: colors.foreground }]}>{fmtINR(f.amount)}</Text>
        </View>
      ))}

      <PaymentSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={handleSuccess}
        amount={NEXT_DUE.amount}
        description={`${NEXT_DUE.forMonth} fee · ${NEXT_DUE.course}`}
        payerName="Suresh Mehta"
        payerEmail="suresh.mehta@example.com"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nextDue: { padding: 20, gap: 6 },
  dueLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  dueAmount: { fontSize: 32, fontWeight: "800" },
  dueDate: { fontSize: 13 },
  payBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  payLabel: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: { flex: 1, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700" },
  summaryLabel: { fontSize: 10, textAlign: "center", fontWeight: "500" },
  feeRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  checkIcon: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  month: { fontSize: 13, fontWeight: "600" },
  feeDate: { fontSize: 11, marginTop: 2 },
  feeAmt: { fontSize: 15, fontWeight: "700" },
});
