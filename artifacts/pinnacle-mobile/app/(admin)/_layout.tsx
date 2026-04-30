import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="students">
        <Icon sf={{ default: "graduationcap", selected: "graduationcap.fill" }} />
        <Label>Students</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="finance">
        <Icon sf={{ default: "indianrupeesign.circle", selected: "indianrupeesign.circle.fill" }} />
        <Label>Finance</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notices">
        <Icon sf={{ default: "bell", selected: "bell.fill" }} />
        <Label>Notices</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis", selected: "ellipsis.circle.fill" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.maroon,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="chart.bar" tintColor={color} size={24} /> : <Feather name="bar-chart-2" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="graduationcap" tintColor={color} size={24} /> : <Feather name="book-open" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="indianrupeesign.circle" tintColor={color} size={24} /> : <Feather name="credit-card" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: "Notices",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bell" tintColor={color} size={24} /> : <Feather name="bell" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="ellipsis" tintColor={color} size={24} /> : <Feather name="more-horizontal" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="batches" options={{ href: null }} />
    </Tabs>
  );
}

export default function AdminTabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
