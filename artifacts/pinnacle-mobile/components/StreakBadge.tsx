import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface Props {
  days: number;
}

export default function StreakBadge({ days }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: "#C9A84C18", borderColor: "#C9A84C40", borderRadius: colors.radius - 4 }]}>
      <Animated.Text style={[styles.flame, animStyle]}>🔥</Animated.Text>
      <View>
        <Text style={[styles.days, { color: "#C9A84C", fontFamily: "PlusJakartaSans_700Bold" }]}>
          {days} day streak
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Keep it up!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  flame: { fontSize: 22 },
  days: { fontSize: 13 },
  sub: { fontSize: 10, marginTop: 1 },
});
