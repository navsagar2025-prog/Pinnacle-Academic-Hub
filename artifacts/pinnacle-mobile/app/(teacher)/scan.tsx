import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import { useColors } from "@/hooks/useColors";

type Step = "capture" | "reviewing" | "done";

export default function TeacherScan() {
  const colors = useColors();
  const [step, setStep] = useState<Step>("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [text, setText] = useState<string | null>(null);

  const pickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Demo Mode", "Camera scan is available on the mobile app.", [{ text: "OK" }]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.9,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("reviewing");
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("reviewing");
    }
  };

  const runOcr = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 2000));
    setText(
      "Physics — Thermodynamics Notes\n\nFirst Law of Thermodynamics:\ndQ = dU + dW\n\nwhere:\ndQ = heat added to the system\ndU = change in internal energy\ndW = work done by the system\n\nIsothermal Process: ΔU = 0\nAdiabatic Process: dQ = 0\nIsochoric Process: dW = 0"
    );
    setScanning(false);
    setStep("done");
  };

  const reset = () => {
    setStep("capture");
    setImageUri(null);
    setText(null);
  };

  const exportDemo = () => {
    Alert.alert("Demo Mode", "Export is disabled in demo. Available in the live platform.", [{ text: "OK" }]);
  };

  return (
    <ScreenContainer>
      {step === "capture" && (
        <View style={{ marginTop: 16 }}>
          <View
            style={[
              styles.hero,
              {
                backgroundColor: colors.primary + "0A",
                borderColor: colors.primary + "30",
                borderRadius: colors.radius,
              },
            ]}
          >
            <View
              style={[
                styles.scanIcon,
                { backgroundColor: colors.primary + "18", borderRadius: 48 },
              ]}
            >
              <Feather name="camera" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              Scan a Document
            </Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Capture handwritten notes, worksheets, or question papers and convert to digital text
            </Text>
          </View>

          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
            style={[
              styles.btn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                marginTop: 20,
              },
            ]}
          >
            <Feather name="camera" size={20} color={colors.primaryForeground} />
            <Text style={[styles.btnLabel, { color: colors.primaryForeground }]}>
              Open Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromGallery}
            activeOpacity={0.8}
            style={[
              styles.btn,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
                marginTop: 10,
              },
            ]}
          >
            <Feather name="image" size={20} color={colors.foreground} />
            <Text style={[styles.btnLabel, { color: colors.foreground }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === "reviewing" && imageUri && (
        <View style={{ marginTop: 16, gap: 16 }}>
          <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
            Review Image
          </Text>
          <Image
            source={{ uri: imageUri }}
            style={[styles.preview, { borderRadius: colors.radius, borderColor: colors.border }]}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={runOcr}
            activeOpacity={0.8}
            style={[
              styles.btn,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <Feather name="zap" size={20} color={colors.primaryForeground} />
            <Text style={[styles.btnLabel, { color: colors.primaryForeground }]}>
              Extract Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={reset}
            style={[
              styles.btn,
              { backgroundColor: colors.muted, borderRadius: colors.radius },
            ]}
          >
            <Feather name="refresh-ccw" size={18} color={colors.foreground} />
            <Text style={[styles.btnLabel, { color: colors.foreground }]}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}

      {scanning && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Extracting text...
          </Text>
        </View>
      )}

      {step === "done" && text && (
        <View style={{ marginTop: 16, gap: 12 }}>
          <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
            Extracted Text
          </Text>
          <View
            style={[
              styles.textBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.extractedText, { color: colors.foreground }]}>
              {text}
            </Text>
          </View>

          <TouchableOpacity
            onPress={exportDemo}
            activeOpacity={0.8}
            style={[
              styles.btn,
              { backgroundColor: colors.secondary, borderRadius: colors.radius },
            ]}
          >
            <Feather name="download" size={20} color={colors.secondaryForeground} />
            <Text style={[styles.btnLabel, { color: colors.secondaryForeground }]}>
              Export as PDF
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={exportDemo}
            style={[
              styles.btn,
              { backgroundColor: colors.muted, borderRadius: colors.radius },
            ]}
          >
            <Feather name="file" size={18} color={colors.foreground} />
            <Text style={[styles.btnLabel, { color: colors.foreground }]}>
              Export as DOCX
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reset} style={styles.resetLink}>
            <Text style={[styles.resetText, { color: colors.mutedForeground }]}>
              Scan another document
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    padding: 32,
    gap: 12,
    borderWidth: 1,
  },
  scanIcon: {
    width: 96,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  heroSub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  preview: {
    width: "100%",
    height: 260,
    borderWidth: 1,
  },
  loadingOverlay: {
    marginTop: 32,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  textBox: {
    borderWidth: 1,
    padding: 16,
  },
  extractedText: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "monospace",
  },
  resetLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resetText: {
    fontSize: 13,
  },
});
