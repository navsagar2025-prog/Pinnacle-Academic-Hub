import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Step = "capture" | "reviewing" | "processing" | "done" | "error";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

async function callScanApi(imageUri: string): Promise<{ text: string; latex?: string }> {
  const formData = new FormData();
  const filename = imageUri.split("/").pop() ?? "scan.jpg";
  formData.append("image", {
    uri: imageUri,
    name: filename,
    type: "image/jpeg",
  } as unknown as Blob);

  const response = await fetch(`${BASE_URL}/api/scan`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Scan failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function callExportApi(endpoint: string, text: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, title: "Scanned Document — Pinnacle" }),
  });
  if (!response.ok) throw new Error(`Export failed (${response.status})`);
  return response.blob();
}

async function saveAndShare(blob: Blob, filename: string) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: blob.type ?? "application/octet-stream" });
  } else {
    Alert.alert("Saved", `File saved to: ${fileUri}`);
  }
}

export default function AdminScan() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Camera Unavailable", "Please use Choose from Gallery on web.", [{ text: "OK" }]);
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Camera access is needed to scan documents.", [{ text: "OK" }]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("reviewing");
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Photo library access is needed.", [{ text: "OK" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("reviewing");
    }
  };

  const runOcr = async () => {
    if (!imageUri) return;
    setScanning(true);
    setStep("processing");
    try {
      const result = await callScanApi(imageUri);
      setExtractedText(result.text || result.latex || "No text detected.");
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Scan failed");
      setStep("error");
    } finally {
      setScanning(false);
    }
  };

  const handleExport = async (type: "pdf" | "docx") => {
    if (!extractedText) return;
    setExporting(true);
    try {
      const blob = await callExportApi(`/api/export/${type}`, extractedText);
      await saveAndShare(blob, `pinnacle-scan.${type}`);
    } catch (err) {
      Alert.alert("Export Failed", err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const reset = () => { setStep("capture"); setImageUri(null); setExtractedText(null); setErrorMsg(null); };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topPad + 8, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {step === "capture" && (
        <View>
          <View style={[styles.hero, { backgroundColor: colors.maroon + "0A", borderColor: colors.maroon + "30", borderRadius: colors.radius }]}>
            <View style={[styles.scanIcon, { backgroundColor: colors.maroon + "18", borderRadius: 48 }]}>
              <Feather name="camera" size={48} color={colors.maroon} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Scan Document</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Scan handwritten notes, worksheets, or test papers for digital archiving
            </Text>
          </View>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={[styles.btn, { backgroundColor: colors.maroon, borderRadius: colors.radius, marginTop: 20 }]}>
            <Feather name="camera" size={20} color="#FFFFFF" />
            <Text style={[styles.btnLabel, { color: "#FFFFFF" }]}>Open Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromGallery} activeOpacity={0.8} style={[styles.btn, { backgroundColor: colors.muted, borderRadius: colors.radius, marginTop: 10 }]}>
            <Feather name="image" size={20} color={colors.foreground} />
            <Text style={[styles.btnLabel, { color: colors.foreground }]}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {(step === "reviewing" || step === "processing") && imageUri && (
        <View style={{ gap: 16 }}>
          <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Review Image</Text>
          <Image source={{ uri: imageUri }} style={[styles.preview, { borderRadius: colors.radius, borderColor: colors.border }]} resizeMode="contain" />
          {step === "reviewing" && (
            <>
              <TouchableOpacity onPress={runOcr} activeOpacity={0.8} style={[styles.btn, { backgroundColor: colors.maroon, borderRadius: colors.radius }]}>
                <Feather name="zap" size={20} color="#FFFFFF" />
                <Text style={[styles.btnLabel, { color: "#FFFFFF" }]}>Extract Text</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset} style={[styles.btn, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                <Feather name="refresh-ccw" size={18} color={colors.foreground} />
                <Text style={[styles.btnLabel, { color: colors.foreground }]}>Retake</Text>
              </TouchableOpacity>
            </>
          )}
          {step === "processing" && (
            <View style={{ alignItems: "center", gap: 12, paddingVertical: 16 }}>
              <ActivityIndicator size="large" color={colors.maroon} />
              <Text style={[styles.btnLabel, { color: colors.mutedForeground }]}>Extracting text...</Text>
            </View>
          )}
        </View>
      )}

      {step === "error" && (
        <View style={{ gap: 12 }}>
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "40", borderRadius: colors.radius }]}>
            <Feather name="alert-circle" size={24} color={colors.destructive} />
            <Text style={[styles.errorMsg, { color: colors.mutedForeground, flex: 1 }]}>{errorMsg}</Text>
          </View>
          <TouchableOpacity onPress={reset} style={[styles.btn, { backgroundColor: colors.maroon, borderRadius: colors.radius }]}>
            <Feather name="refresh-ccw" size={18} color="#FFFFFF" />
            <Text style={[styles.btnLabel, { color: "#FFFFFF" }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === "done" && extractedText && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <Text style={[styles.stepLabel, { color: colors.success }]}>Text extracted successfully</Text>
          </View>
          <View style={[styles.textBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.extractedText, { color: colors.foreground }]}>{extractedText}</Text>
          </View>
          <TouchableOpacity onPress={() => handleExport("pdf")} disabled={exporting} activeOpacity={0.8} style={[styles.btn, { backgroundColor: exporting ? colors.muted : colors.secondary, borderRadius: colors.radius }]}>
            {exporting ? <ActivityIndicator size="small" color={colors.secondaryForeground} /> : <Feather name="file" size={20} color={colors.secondaryForeground} />}
            <Text style={[styles.btnLabel, { color: colors.secondaryForeground }]}>Export as PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExport("docx")} disabled={exporting} activeOpacity={0.8} style={[styles.btn, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            {exporting ? <ActivityIndicator size="small" color={colors.foreground} /> : <Feather name="file-text" size={20} color={colors.foreground} />}
            <Text style={[styles.btnLabel, { color: colors.foreground }]}>Export as DOCX</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reset} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Scan another document</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    padding: 16,
  },
  errorMsg: {
    fontSize: 13,
    lineHeight: 18,
  },
  textBox: {
    borderWidth: 1,
    padding: 16,
  },
  extractedText: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
