import React from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DemoBanner from "@/components/DemoBanner";
import { useColors } from "@/hooks/useColors";

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  padBottom?: number;
  showDemoBanner?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function ScreenContainer({
  children,
  scrollable = true,
  padBottom = 100,
  showDemoBanner = true,
  onRefresh,
  refreshing = false,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!scrollable) {
    return (
      <View
        style={[
          styles.fixed,
          {
            backgroundColor: colors.background,
            paddingTop: topPad,
            paddingBottom: bottomPad + padBottom,
            paddingHorizontal: 16,
          },
        ]}
      >
        {showDemoBanner && <DemoBanner />}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + padBottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {showDemoBanner && <DemoBanner />}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fixed: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 0,
  },
});
