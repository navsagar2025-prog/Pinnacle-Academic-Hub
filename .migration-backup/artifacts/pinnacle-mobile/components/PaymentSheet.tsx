import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { errorHaptic, lightHaptic, mediumHaptic, successHaptic } from "@/lib/haptics";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export type PaymentResult = {
  txnId: string;
  amount: number;
  method: PaymentMethod;
  methodLabel: string;
  paidAt: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: PaymentResult) => void;
  amount: number;
  description: string;
  payerName: string;
  payerEmail?: string;
};

type Stage = "select" | "details" | "processing" | "success" | "failed";

const METHODS: { id: PaymentMethod; label: string; icon: keyof typeof Feather.glyphMap; sub: string }[] = [
  { id: "upi", label: "UPI", icon: "smartphone", sub: "Google Pay, PhonePe, Paytm, BHIM" },
  { id: "card", label: "Cards", icon: "credit-card", sub: "Credit / Debit / ATM Card" },
  { id: "netbanking", label: "Net Banking", icon: "globe", sub: "All major Indian banks" },
  { id: "wallet", label: "Wallet", icon: "briefcase", sub: "Paytm, Mobikwik, Freecharge" },
];

const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const genTxn = () =>
  "pay_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export default function PaymentSheet({
  visible,
  onClose,
  onSuccess,
  amount,
  description,
  payerName,
  payerEmail,
}: Props) {
  const colors = useColors();
  const [stage, setStage] = useState<Stage>("select");
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  // Form fields
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [bank, setBank] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      // Reset state on open
      setStage("select");
      setMethod(null);
      setErrorMsg(null);
      setUpiId("");
      setCardNum("");
      setCardExp("");
      setCardCvv("");
      setCardName("");
      setBank(null);
      setWallet(null);
      successScale.setValue(0);
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim, successScale]);

  const handleClose = () => {
    if (stage === "processing") return; // Block close mid-charge
    lightHaptic();
    onClose();
  };

  const pickMethod = (m: PaymentMethod) => {
    mediumHaptic();
    setMethod(m);
    setStage("details");
  };

  const validate = (): string | null => {
    if (method === "upi") {
      if (!/^[\w.\-]{2,}@[\w]{2,}$/.test(upiId.trim())) return "Enter a valid UPI ID (e.g. name@bank)";
    } else if (method === "card") {
      const digits = cardNum.replace(/\s/g, "");
      if (digits.length < 12 || digits.length > 19) return "Enter a valid card number";
      if (!/^\d{2}\/\d{2}$/.test(cardExp)) return "Expiry must be MM/YY";
      if (!/^\d{3,4}$/.test(cardCvv)) return "Enter a valid CVV";
      if (cardName.trim().length < 2) return "Enter the cardholder name";
    } else if (method === "netbanking") {
      if (!bank) return "Select your bank";
    } else if (method === "wallet") {
      if (!wallet) return "Select a wallet";
    }
    return null;
  };

  const submitPay = () => {
    const err = validate();
    if (err) {
      errorHaptic();
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    mediumHaptic();
    setStage("processing");
    // Simulate Razorpay charge round-trip ~2.4s
    setTimeout(() => {
      // Demo: 95% success rate. CVV ending in "00" forces failure for testing.
      const forceFail = method === "card" && cardCvv.endsWith("00");
      const success = !forceFail && Math.random() < 0.97;
      if (success) {
        successHaptic();
        setStage("success");
        Animated.spring(successScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          const methodLabel =
            method === "upi"
              ? `UPI · ${upiId}`
              : method === "card"
                ? `Card · **** ${cardNum.replace(/\s/g, "").slice(-4)}`
                : method === "netbanking"
                  ? `Net Banking · ${bank}`
                  : `Wallet · ${wallet}`;
          onSuccess({
            txnId: genTxn(),
            amount,
            method: method as PaymentMethod,
            methodLabel,
            paidAt: new Date().toISOString(),
          });
        }, 1400);
      } else {
        errorHaptic();
        setStage("failed");
      }
    }, 2400);
  };

  const formatCardNum = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExp = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "/" + digits.slice(2);
  };

  const banks = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra", "Yes Bank", "PNB"];
  const wallets = ["Paytm", "Mobikwik", "Freecharge", "Amazon Pay", "JioMoney"];

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kavWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.brandRow}>
                  <View style={[styles.brandDot, { backgroundColor: colors.primary }]}>
                    <Text style={styles.brandLetter}>P</Text>
                  </View>
                  <Text style={[styles.brandName, { color: colors.foreground }]}>
                    Pinnacle Academic Classes
                  </Text>
                </View>
                <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {description}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                disabled={stage === "processing"}
                accessibilityRole="button"
                accessibilityLabel="Close payment sheet"
                accessibilityState={{ disabled: stage === "processing" }}
                hitSlop={10}
              >
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Amount strip */}
            <View style={[styles.amountStrip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Amount</Text>
              <Text style={[styles.amountValue, { color: colors.foreground }]}>{formatINR(amount)}</Text>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {stage === "select" && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                    Choose Payment Method
                  </Text>
                  {METHODS.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => pickMethod(m.id)}
                      activeOpacity={0.75}
                      style={[
                        styles.methodRow,
                        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                      ]}
                    >
                      <View
                        style={[
                          styles.methodIcon,
                          { backgroundColor: colors.primary + "15", borderRadius: colors.radius - 4 },
                        ]}
                      >
                        <Feather name={m.icon} size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodLabel, { color: colors.foreground }]}>{m.label}</Text>
                        <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>{m.sub}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                  <View style={[styles.testBadge, { borderColor: colors.border }]}>
                    <Feather name="info" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.testBadgeText, { color: colors.mutedForeground }]}>
                      Test Mode · No real money will be charged
                    </Text>
                  </View>
                </>
              )}

              {stage === "details" && method === "upi" && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Pay via UPI</Text>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>UPI ID</Text>
                  <TextInput
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="yourname@okhdfcbank"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                  />
                  <Text style={[styles.helper, { color: colors.mutedForeground }]}>
                    A collect request will be sent to your UPI app.
                  </Text>
                </>
              )}

              {stage === "details" && method === "card" && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Card Details</Text>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Card Number</Text>
                  <TextInput
                    value={cardNum}
                    onChangeText={(v) => setCardNum(formatCardNum(v))}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    style={[
                      styles.input,
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                  />
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Expiry</Text>
                      <TextInput
                        value={cardExp}
                        onChangeText={(v) => setCardExp(formatExp(v))}
                        placeholder="MM/YY"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="number-pad"
                        style={[
                          styles.input,
                          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                        ]}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>CVV</Text>
                      <TextInput
                        value={cardCvv}
                        onChangeText={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="number-pad"
                        secureTextEntry
                        style={[
                          styles.input,
                          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Cardholder Name</Text>
                  <TextInput
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder={payerName}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="characters"
                    style={[
                      styles.input,
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                  />
                  <Text style={[styles.helper, { color: colors.mutedForeground }]}>
                    Tip: Use any number. CVV ending in 00 will simulate a failed payment.
                  </Text>
                </>
              )}

              {stage === "details" && method === "netbanking" && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Choose Bank</Text>
                  {banks.map((b) => (
                    <TouchableOpacity
                      key={b}
                      onPress={() => {
                        lightHaptic();
                        setBank(b);
                      }}
                      style={[
                        styles.bankRow,
                        {
                          backgroundColor: bank === b ? colors.primary + "12" : colors.card,
                          borderColor: bank === b ? colors.primary : colors.border,
                          borderRadius: colors.radius - 4,
                        },
                      ]}
                    >
                      <Feather
                        name={bank === b ? "check-circle" : "circle"}
                        size={18}
                        color={bank === b ? colors.primary : colors.mutedForeground}
                      />
                      <Text style={[styles.bankName, { color: colors.foreground }]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {stage === "details" && method === "wallet" && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Choose Wallet</Text>
                  {wallets.map((w) => (
                    <TouchableOpacity
                      key={w}
                      onPress={() => {
                        lightHaptic();
                        setWallet(w);
                      }}
                      style={[
                        styles.bankRow,
                        {
                          backgroundColor: wallet === w ? colors.primary + "12" : colors.card,
                          borderColor: wallet === w ? colors.primary : colors.border,
                          borderRadius: colors.radius - 4,
                        },
                      ]}
                    >
                      <Feather
                        name={wallet === w ? "check-circle" : "circle"}
                        size={18}
                        color={wallet === w ? colors.primary : colors.mutedForeground}
                      />
                      <Text style={[styles.bankName, { color: colors.foreground }]}>{w}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {stage === "processing" && (
                <View style={styles.centerStage}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.centerTitle, { color: colors.foreground, marginTop: 16 }]}>
                    Processing payment…
                  </Text>
                  <Text style={[styles.centerSub, { color: colors.mutedForeground }]}>
                    Please don't close the app
                  </Text>
                </View>
              )}

              {stage === "success" && (
                <View style={styles.centerStage}>
                  <Animated.View
                    style={[
                      styles.successIcon,
                      { backgroundColor: colors.success + "20", transform: [{ scale: successScale }] },
                    ]}
                  >
                    <Feather name="check" size={44} color={colors.success} />
                  </Animated.View>
                  <Text style={[styles.centerTitle, { color: colors.foreground, marginTop: 14 }]}>
                    Payment Successful
                  </Text>
                  <Text style={[styles.centerSub, { color: colors.mutedForeground }]}>
                    {formatINR(amount)} paid
                  </Text>
                </View>
              )}

              {stage === "failed" && (
                <View style={styles.centerStage}>
                  <View style={[styles.successIcon, { backgroundColor: colors.destructive + "20" }]}>
                    <Feather name="x" size={44} color={colors.destructive} />
                  </View>
                  <Text style={[styles.centerTitle, { color: colors.foreground, marginTop: 14 }]}>
                    Payment Failed
                  </Text>
                  <Text style={[styles.centerSub, { color: colors.mutedForeground }]}>
                    Your bank declined the transaction. No money was deducted.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      lightHaptic();
                      setErrorMsg(null);
                      setStage("details");
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Try payment again"
                    style={[
                      styles.retryBtn,
                      { borderColor: colors.primary, borderRadius: colors.radius - 4 },
                    ]}
                  >
                    <Text style={[styles.retryText, { color: colors.primary }]}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {errorMsg && stage === "details" && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
              )}
            </ScrollView>

            {/* Footer with Pay button */}
            {stage === "details" && (
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    lightHaptic();
                    setStage("select");
                    setErrorMsg(null);
                  }}
                  style={styles.backBtn}
                >
                  <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitPay}
                  activeOpacity={0.85}
                  disabled={stage !== "details"}
                  accessibilityRole="button"
                  accessibilityLabel={`Pay ${formatINR(amount)} securely`}
                  accessibilityState={{ disabled: stage !== "details" }}
                  style={[styles.payBtn, { backgroundColor: colors.primary, borderRadius: colors.radius - 4 }]}
                >
                  <Feather name="lock" size={14} color={colors.primaryForeground} />
                  <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>
                    Pay {formatINR(amount)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Razorpay-style branding */}
            <View style={[styles.poweredBy, { borderTopColor: colors.border }]}>
              <Feather name="shield" size={11} color={colors.mutedForeground} />
              <Text style={[styles.poweredText, { color: colors.mutedForeground }]}>
                Secured by 256-bit encryption · Powered by Razorpay
              </Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  kavWrap: { justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  brandLetter: { color: "#fff", fontWeight: "800", fontSize: 13 },
  brandName: { fontSize: 14, fontWeight: "700" },
  headerSub: { fontSize: 11, marginTop: 4 },
  amountStrip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12 },
  amountLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "600" },
  amountValue: { fontSize: 22, fontWeight: "800" },
  body: { padding: 18, gap: 10 },
  sectionTitle: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "700", marginBottom: 6 },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1 },
  methodIcon: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  methodLabel: { fontSize: 14, fontWeight: "700" },
  methodSub: { fontSize: 11, marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  cardRow: { flexDirection: "row", gap: 10 },
  helper: { fontSize: 11, marginTop: 8, fontStyle: "italic" },
  bankRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderWidth: 1, marginBottom: 6 },
  bankName: { fontSize: 13, fontWeight: "600" },
  centerStage: { alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 4 },
  centerTitle: { fontSize: 16, fontWeight: "700" },
  centerSub: { fontSize: 13, textAlign: "center", paddingHorizontal: 24 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  retryBtn: { borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 },
  retryText: { fontSize: 13, fontWeight: "700" },
  errorText: { fontSize: 12, marginTop: 8, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, gap: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 8 },
  backText: { fontSize: 13, fontWeight: "600" },
  payBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  payBtnText: { fontSize: 14, fontWeight: "700" },
  poweredBy: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderTopWidth: 1 },
  poweredText: { fontSize: 10, fontWeight: "500" },
  testBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, marginTop: 8, borderWidth: 1, borderRadius: 6, borderStyle: "dashed" },
  testBadgeText: { fontSize: 11, fontWeight: "500" },
});
