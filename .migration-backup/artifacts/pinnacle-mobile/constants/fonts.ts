/**
 * Pinnacle Academic Classes — brand typography constants.
 * Playfair Display is used for headings; Plus Jakarta Sans for body text.
 * These must be loaded in _layout.tsx before use.
 */
const fonts = {
  heading: {
    regular: "PlayfairDisplay_600SemiBold",
    bold: "PlayfairDisplay_700Bold",
    extraBold: "PlayfairDisplay_800ExtraBold",
  },
  body: {
    regular: "PlusJakartaSans_400Regular",
    medium: "PlusJakartaSans_500Medium",
    semibold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
  },
  mono: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
} as const;

export default fonts;
