import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import DemoBanner from "@/components/DemoBanner";
import { useColors } from "@/hooks/useColors";

type Step = "viewfinder" | "crop" | "processing" | "done" | "error";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

function hasLatex(text: string): boolean {
  return /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\[a-zA-Z]+\{)/.test(text);
}

function buildKatexHtml(latex: string): string {
  const safe = latex
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    body { margin:16px; font-family: -apple-system, sans-serif; font-size:14px; line-height:1.6; color:#0A1F5C; background:#F7F8FC; }
    .katex { font-size:1.1em; }
  </style>
</head>
<body>
  <div id="content">${safe}</div>
  <script>
    renderMathInElement(document.getElementById("content"), {
      delimiters:[
        {left:"$$",right:"$$",display:true},
        {left:"$",right:"$",display:false},
        {left:"\\\\(",right:"\\\\)",display:false},
        {left:"\\\\[",right:"\\\\]",display:true}
      ]
    });
    // Notify height for WebView scrolling
    function sendHeight() {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "height", value: document.body.scrollHeight })
      );
    }
    window.addEventListener("load", sendHeight);
    setTimeout(sendHeight, 500);
  </script>
</body>
</html>`;
}

async function callScanApi(imageUri: string): Promise<{ text: string; latex?: string }> {
  const formData = new FormData();
  const filename = imageUri.split("/").pop() ?? "scan.jpg";
  formData.append("image", { uri: imageUri, name: filename, type: "image/jpeg" } as unknown as Blob);
  const response = await fetch(`${BASE_URL}/api/scan`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`Scan failed (${response.status}): ${await response.text().catch(() => "")}`);
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
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: blob.type ?? "application/octet-stream" });
  } else {
    Alert.alert("Saved", `File saved to: ${fileUri}`);
  }
}

export default function TeacherScan() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>("viewfinder");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState(200);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const capture = async () => {
    if (Platform.OS === "web") {
      pickFromGallery();
      return;
    }
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9, skipProcessing: true });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setStep("crop");
      }
    } catch {
      Alert.alert("Capture Failed", "Could not capture photo. Please try again.", [{ text: "OK" }]);
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
      setStep("crop");
    }
  };

  const runOcr = async () => {
    if (!imageUri) return;
    setStep("processing");
    try {
      const result = await callScanApi(imageUri);
      setExtractedText(result.latex || result.text || "No text detected in this image.");
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to extract text");
      setStep("error");
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

  const reset = () => { setStep("viewfinder"); setImageUri(null); setExtractedText(null); setErrorMsg(null); };

  if (step === "viewfinder") {
    if (Platform.OS === "web") {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ paddingHorizontal: 16, paddingTop: topPad + 8 }}>
            <DemoBanner />
          </View>
          <View style={[styles.webFallback, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "30", borderRadius: colors.radius, margin: 16 }]}>
            <View style={[styles.scanIconWrap, { backgroundColor: colors.primary + "15", borderRadius: 48 }]}>
              <Feather name="camera" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.webTitle, { color: colors.foreground, fontFamily: "PlayfairDisplay_700Bold" }]}>Scan a Document</Text>
            <Text style={[styles.webSub, { color: colors.mutedForeground }]}>Camera viewfinder is available on iOS and Android</Text>
            <TouchableOpacity onPress={pickFromGallery} activeOpacity={0.8} style={[styles.galleryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Feather name="image" size={18} color={colors.primaryForeground} />
              <Text style={[styles.galleryBtnLabel, { color: colors.primaryForeground }]}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!permission) return null;

    if (!permission.granted) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 32, gap: 16 }}>
          <Feather name="camera-off" size={48} color={colors.mutedForeground} style={{ alignSelf: "center" }} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center", fontFamily: "PlayfairDisplay_700Bold" }}>Camera Access Required</Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: "center" }}>Allow camera access to scan documents with the in-app viewfinder.</Text>
          <TouchableOpacity onPress={requestPermission} style={[styles.galleryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
            <Text style={[styles.galleryBtnLabel, { color: colors.primaryForeground }]}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromGallery} style={[styles.galleryBtn, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            <Feather name="image" size={18} color={colors.foreground} />
            <Text style={[styles.galleryBtnLabel, { color: colors.foreground }]}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={StyleSheet.absoluteFill}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
          <View style={[styles.viewfinderOverlay, { paddingTop: topPad }]}>
            <View style={[styles.viewfinderHeader]}>
              <Text style={styles.viewfinderTitle}>Scan Document</Text>
              <TouchableOpacity onPress={pickFromGallery} style={styles.galleryPill}>
                <Feather name="image" size={16} color="#FFFFFF" />
                <Text style={styles.galleryPillText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cropGuideArea}>
              <View style={[styles.cropBorder, { borderColor: "#C9A84C" }]}>
                <View style={[styles.cropCorner, styles.cropTL, { borderColor: "#C9A84C" }]} />
                <View style={[styles.cropCorner, styles.cropTR, { borderColor: "#C9A84C" }]} />
                <View style={[styles.cropCorner, styles.cropBL, { borderColor: "#C9A84C" }]} />
                <View style={[styles.cropCorner, styles.cropBR, { borderColor: "#C9A84C" }]} />
                <Text style={styles.cropHint}>Position document inside the guide</Text>
              </View>
            </View>

            <View style={styles.captureRow}>
              <TouchableOpacity onPress={capture} activeOpacity={0.8} style={styles.captureBtn}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === "crop" && imageUri) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        <View style={[styles.cropOverlay, { paddingTop: topPad, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.cropSuggestionBox}>
            <Feather name="crop" size={18} color="#C9A84C" />
            <Text style={styles.cropSuggestionText}>
              Auto-crop suggestion: ensure the document fills the frame for best OCR accuracy
            </Text>
          </View>
          <View style={styles.cropActions}>
            <TouchableOpacity onPress={reset} style={[styles.cropBtn, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
              <Feather name="refresh-ccw" size={18} color="#FFFFFF" />
              <Text style={styles.cropBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={runOcr} style={[styles.cropBtn, { backgroundColor: "#C9A84C" }]}>
              <Feather name="zap" size={18} color="#000000" />
              <Text style={[styles.cropBtnText, { color: "#000" }]}>Extract Text</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (step === "processing") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontSize: 15, color: colors.mutedForeground, fontFamily: "PlusJakartaSans_500Medium" }}>Extracting text via OCR…</Text>
      </View>
    );
  }

  if (step === "error") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: "center", gap: 16 }}>
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "40", borderRadius: colors.radius }]}>
          <Feather name="alert-circle" size={24} color={colors.destructive} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive, marginBottom: 4 }}>Scan Failed</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{errorMsg}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={reset} activeOpacity={0.8} style={[styles.galleryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Feather name="refresh-ccw" size={18} color={colors.primaryForeground} />
          <Text style={[styles.galleryBtnLabel, { color: colors.primaryForeground }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "done" && extractedText) {
    const showKatex = hasLatex(extractedText);
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: topPad + 8 }}>
          <DemoBanner />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.success }}>Text extracted successfully</Text>
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {showKatex ? (
            <>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Rendered Preview (KaTeX)
              </Text>
              <View style={[styles.webViewBox, { borderColor: colors.border, borderRadius: colors.radius, height: webViewHeight }]}>
                <WebView
                  source={{ html: buildKatexHtml(extractedText) }}
                  style={{ borderRadius: colors.radius }}
                  scrollEnabled={false}
                  onMessage={(e) => {
                    try {
                      const msg = JSON.parse(e.nativeEvent.data);
                      if (msg.type === "height") setWebViewHeight(Math.max(100, Math.min(400, msg.value)));
                    } catch {}
                  }}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Extracted Text
              </Text>
              <View style={[styles.textBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Text style={{ fontSize: 13, lineHeight: 22, color: colors.foreground, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                  {extractedText}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, gap: 10, paddingTop: 12 }}>
          <TouchableOpacity onPress={() => handleExport("pdf")} disabled={exporting} activeOpacity={0.8}
            style={[styles.galleryBtn, { backgroundColor: exporting ? colors.muted : colors.secondary, borderRadius: colors.radius, opacity: exporting ? 0.7 : 1 }]}>
            {exporting ? <ActivityIndicator size="small" color={colors.secondaryForeground} /> : <Feather name="file" size={18} color={colors.secondaryForeground} />}
            <Text style={[styles.galleryBtnLabel, { color: colors.secondaryForeground }]}>Export as PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExport("docx")} disabled={exporting} activeOpacity={0.8}
            style={[styles.galleryBtn, { backgroundColor: colors.muted, borderRadius: colors.radius, opacity: exporting ? 0.7 : 1 }]}>
            {exporting ? <ActivityIndicator size="small" color={colors.foreground} /> : <Feather name="file-text" size={18} color={colors.foreground} />}
            <Text style={[styles.galleryBtnLabel, { color: colors.foreground }]}>Export as DOCX</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reset} style={{ alignItems: "center", paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Scan another document</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  webFallback: {
    alignItems: "center",
    padding: 32,
    gap: 12,
    borderWidth: 1,
  },
  scanIconWrap: {
    width: 96,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  webTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  webSub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  galleryBtnLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  viewfinderOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  viewfinderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  viewfinderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  galleryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  galleryPillText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cropGuideArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cropBorder: {
    width: "100%",
    height: 300,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  cropCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  cropTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  cropTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  cropBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  cropBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  cropHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  captureRow: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  cropSuggestionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C9A84C60",
  },
  cropSuggestionText: {
    flex: 1,
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  cropActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },
  cropBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cropBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    padding: 16,
  },
  webViewBox: {
    borderWidth: 1,
    overflow: "hidden",
  },
  textBox: {
    borderWidth: 1,
    padding: 16,
    maxHeight: 280,
  },
});
