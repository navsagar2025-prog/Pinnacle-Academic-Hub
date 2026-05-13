import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { mediumHaptic } from "@/lib/haptics";
import { useRefresh } from "@/lib/useRefresh";
import {
  fetchFeeReceiptHtml,
  fetchFees,
  hasWebsiteBase,
  type FeeRecord,
  type FeeSummary,
} from "@/lib/api";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN");
const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: "#D1FAE5", text: "#065F46" },
  partial: { bg: "#FEF3C7", text: "#92400E" },
  due: { bg: "#FEE2E2", text: "#991B1B" },
  overdue: { bg: "#FCA5A5", text: "#7F1D1D" },
  waived: { bg: "#F3F4F6", text: "#6B7280" },
};

const STATUS_ICONS: Record<string, FeatherName> = {
  paid: "check-circle",
  partial: "clock",
  due: "alert-circle",
  overdue: "alert-triangle",
  waived: "minus-circle",
};

export default function ParentFees() {
  const colors = useColors();
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptHtml, setReceiptHtml] = useState<string | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasWebsiteBase()) { setLoading(false); return; }
    const result = await fetchFees();
    if (result) {
      setRecords(result.data);
      setSummary(result.summary);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const { refreshing, onRefresh } = useRefresh(load);

  const openReceipt = async (record: FeeRecord) => {
    mediumHaptic();
    setLoadingReceiptId(record.id);
    const html = await fetchFeeReceiptHtml(record.id);
    setLoadingReceiptId(null);
    if (!html) {
      Alert.alert("Receipt", "Could not load receipt. Please try again.");
      return;
    }
    setReceiptHtml(html);
  };

  const nextDueRecord = records
    .filter(r => r.status === "due" || r.status === "overdue")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!hasWebsiteBase()) {
    return (
      <ScreenContainer>
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="wifi-off" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Fee data unavailable in this environment.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
        {nextDueRecord ? (
          <View style={[styles.nextDue, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
            <Text style={[styles.dueLabel, { color: "rgba(255,255,255,0.7)" }]}>Next Fee Due</Text>
            <Text style={[styles.dueAmount, { color: "#FFFFFF" }]}>
              {fmtINR(nextDueRecord.amount - nextDueRecord.paidAmount)}
            </Text>
            <Text style={[styles.duePeriod, { color: "rgba(255,255,255,0.8)" }]}>{nextDueRecord.period}</Text>
            <Text style={[styles.dueDate, { color: "rgba(255,255,255,0.7)" }]}>
              Due: {fmtDate(nextDueRecord.dueDate)}
            </Text>
          </View>
        ) : (
          <View style={[styles.allClearCard, { backgroundColor: colors.success + "18", borderRadius: colors.radius, borderColor: colors.success + "40", borderWidth: 1 }]}>
            <Feather name="check-circle" size={22} color={colors.success} />
            <Text style={[styles.allClearText, { color: colors.success }]}>All fees paid — no outstanding dues</Text>
          </View>
        )}

        {summary && (
          <View style={[styles.summaryRow, { marginTop: 12, marginBottom: 4 }]}>
            {[
              { label: "Total Fees", value: fmtINR(summary.totalFee), color: colors.primary },
              { label: "Total Paid", value: fmtINR(summary.totalPaid), color: colors.success },
              { label: "Outstanding", value: fmtINR(summary.totalDue), color: summary.totalDue > 0 ? "#EF4444" : colors.success },
            ].map((s, i) => (
              <View key={i} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Payment History" />
          {records.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Feather name="credit-card" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No fee records yet.</Text>
            </View>
          ) : (
            records.map(f => {
              const sc = STATUS_COLORS[f.status] ?? STATUS_COLORS.due;
              const icon: FeatherName = STATUS_ICONS[f.status] ?? "circle";
              const isPaid = f.status === "paid";
              return (
                <View
                  key={f.id}
                  style={[styles.feeRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
                >
                  <View style={[styles.iconBox, { backgroundColor: sc.bg, borderRadius: 20 }]}>
                    <Feather name={icon} size={16} color={sc.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.period, { color: colors.foreground }]}>{f.period}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                      Due: {fmtDate(f.dueDate)}{f.paidDate ? ` · Paid: ${fmtDate(f.paidDate)}` : ""}
                    </Text>
                    {f.paymentMethod && (
                      <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {f.paymentMethod}{f.transactionRef ? ` · ${f.transactionRef}` : ""}
                      </Text>
                    )}
                  </View>
                  <View style={styles.feeRight}>
                    <Text style={[styles.amount, { color: colors.foreground }]}>{fmtINR(f.amount)}</Text>
                    {f.paidAmount > 0 && f.paidAmount < f.amount && (
                      <Text style={[styles.paidAmt, { color: colors.success }]}>₹{f.paidAmount.toLocaleString("en-IN")} paid</Text>
                    )}
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>{f.status}</Text>
                    </View>
                    {isPaid && (
                      <TouchableOpacity
                        onPress={() => openReceipt(f)}
                        style={[styles.receiptBtn, { borderColor: colors.border }]}
                        activeOpacity={0.7}
                        disabled={loadingReceiptId !== null}
                      >
                        {loadingReceiptId === f.id ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Feather name="file-text" size={13} color={colors.primary} />
                        )}
                        <Text style={[styles.receiptBtnText, { color: colors.primary }]}>Receipt</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScreenContainer>

      <Modal visible={receiptHtml !== null} animationType="slide" onRequestClose={() => setReceiptHtml(null)}>
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Fee Receipt</Text>
            <TouchableOpacity onPress={() => setReceiptHtml(null)} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          {receiptHtml && (
            <WebView
              source={{ html: receiptHtml }}
              style={{ flex: 1 }}
              originWhitelist={["*"]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  nextDue: { padding: 20, gap: 4 },
  dueLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  dueAmount: { fontSize: 32, fontWeight: "800" },
  duePeriod: { fontSize: 13 },
  dueDate: { fontSize: 12 },
  allClearCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  allClearText: { fontSize: 14, fontWeight: "600" },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: { flex: 1, borderWidth: 1, padding: 10, alignItems: "center", gap: 3 },
  summaryValue: { fontSize: 14, fontWeight: "700" },
  summaryLabel: { fontSize: 10, textAlign: "center", fontWeight: "500" },
  feeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  iconBox: { width: 32, height: 32, justifyContent: "center", alignItems: "center", marginTop: 2 },
  period: { fontSize: 13, fontWeight: "600" },
  meta: { fontSize: 11, marginTop: 2 },
  feeRight: { alignItems: "flex-end", gap: 4, minWidth: 72 },
  amount: { fontSize: 14, fontWeight: "700" },
  paidAmt: { fontSize: 10 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  receiptBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 2 },
  receiptBtnText: { fontSize: 11, fontWeight: "600" },
  emptyBox: { borderWidth: 1, padding: 32, alignItems: "center", gap: 12, marginTop: 8 },
  emptyText: { fontSize: 13, textAlign: "center" },
  receiptHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  receiptTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  closeBtn: { padding: 4 },
});
