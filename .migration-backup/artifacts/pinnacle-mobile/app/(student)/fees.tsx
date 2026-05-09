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
  course: "JEE 2026 Batch",
  forMonth: "May 2025",
};

const baseHistory = [
  { month: "April 2025", amount: 12500, date: "2 Apr 2025", ref: "TXN-8821", method: "UPI · arjun@okhdfcbank" },
  { month: "March 2025", amount: 12500, date: "1 Mar 2025", ref: "TXN-8654", method: "Card · **** 4321" },
  { month: "February 2025", amount: 12500, date: "3 Feb 2025", ref: "TXN-8412", method: "Net Banking · HDFC" },
  { month: "January 2025", amount: 12500, date: "6 Jan 2025", ref: "TXN-8201", method: "UPI · arjun@okhdfcbank" },
  { month: "December 2024", amount: 12500, date: "4 Dec 2024", ref: "TXN-7988", method: "Card · **** 4321" },
];

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN");
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function StudentFees() {
  const colors = useColors();
  const { payments, addPayment } = useFeePayments();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isPaidForMay = useMemo(
    () => payments.some((p) => p.forMonth === NEXT_DUE.forMonth),
    [payments],
  );

  const allHistory = useMemo(() => {
    const userPaid = payments.map((p) => ({
      month: p.forMonth,
      amount: p.amount,
      date: fmtDate(p.paidAt),
      ref: p.txnId.toUpperCase(),
      method: p.method,
    }));
    return [...userPaid, ...baseHistory];
  }, [payments]);

  const openPay = () => {
    if (isPaidForMay) {
      lightHaptic();
      Alert.alert("Already Paid", `Your ${NEXT_DUE.forMonth} fee has been paid. Thank you!`);
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
    // Wait for Modal unmount + iOS dismiss animation before showing Alert
    // to avoid the alert being swallowed by the unmounting modal.
    setTimeout(
      () =>
        Alert.alert(
          "Payment Successful",
          `${fmtINR(r.amount)} paid for ${NEXT_DUE.forMonth}.\nReference: ${r.txnId.toUpperCase()}`,
          [{ text: "OK" }],
        ),
      450,
    );
  };

  const copyRef = (ref: string) => {
    mediumHaptic();
    Alert.alert("Reference", ref, [{ text: "OK" }]);
  };

  return (
    <ScreenContainer>
      <View style={[styles.nextDueCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
        <Text style={[styles.nextDueLabel, { color: "rgba(255,255,255,0.7)" }]}>
          Next Fee Due · {NEXT_DUE.course}
        </Text>
        <Text style={[styles.nextDueAmount, { color: "#FFFFFF", fontFamily: "PlayfairDisplay_800ExtraBold" }]}>
          {fmtINR(NEXT_DUE.amount)}
        </Text>
        <Text style={[styles.nextDueDue, { color: "rgba(255,255,255,0.75)" }]}>Due on {NEXT_DUE.due}</Text>
        <TouchableOpacity
          onPress={openPay}
          activeOpacity={0.85}
          style={[
            styles.payBtn,
            {
              backgroundColor: isPaidForMay ? "rgba(255,255,255,0.15)" : "#FFFFFF",
              borderColor: "rgba(255,255,255,0.3)",
              borderRadius: colors.radius - 4,
            },
          ]}
        >
          <Feather
            name={isPaidForMay ? "check-circle" : "credit-card"}
            size={16}
            color={isPaidForMay ? "#FFFFFF" : colors.primary}
          />
          <Text
            style={[
              styles.payBtnText,
              { color: isPaidForMay ? "#FFFFFF" : colors.primary },
            ]}
          >
            {isPaidForMay ? "Paid for May 2025" : "Pay Now"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 8 }}>
        <SectionHeader title="Payment History" />
        {allHistory.map((f, i) => (
          <TouchableOpacity
            key={i + f.ref}
            onPress={() => copyRef(f.ref)}
            activeOpacity={0.8}
            style={[styles.feeRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <View style={styles.feeLeft}>
              <View style={[styles.paidIcon, { backgroundColor: colors.success + "15", borderRadius: 20 }]}>
                <Feather name="check-circle" size={16} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.month, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                  {f.month}
                </Text>
                <Text style={[styles.ref, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {f.ref} · {f.date}
                </Text>
                <Text style={[styles.method, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {f.method}
                </Text>
              </View>
            </View>
            <View style={styles.feeRight}>
              <Text style={[styles.amount, { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" }]}>
                {fmtINR(f.amount)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + "18" }]}>
                <Text style={[styles.statusText, { color: colors.success }]}>Paid</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <PaymentSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={handleSuccess}
        amount={NEXT_DUE.amount}
        description={`${NEXT_DUE.forMonth} fee · ${NEXT_DUE.course}`}
        payerName="Arjun Mehta"
        payerEmail="arjun.mehta@example.com"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nextDueCard: { padding: 20, marginTop: 4, gap: 8 },
  nextDueLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  nextDueAmount: { fontSize: 36, fontWeight: "800" },
  nextDueDue: { fontSize: 13 },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderWidth: 1, marginTop: 8 },
  payBtnText: { fontSize: 14, fontWeight: "700" },
  feeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderWidth: 1, padding: 12, marginBottom: 8 },
  feeLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  paidIcon: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  month: { fontSize: 13 },
  ref: { fontSize: 11, marginTop: 2 },
  method: { fontSize: 11, marginTop: 2 },
  feeRight: { alignItems: "flex-end", gap: 4, marginLeft: 8 },
  amount: { fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
});
