import { useState, type PropsWithChildren } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { motion } from "@/theme";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type PressableScaleProps = PropsWithChildren<
  Omit<PressableProps, "style"> & {
    style?: StyleProp<ViewStyle>;
  }
>;

export function PressableScale({
  children,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...props
}: PressableScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();

  const animate = (value: number) => {
    if (reducedMotion) return;
    Animated.timing(scale, {
      toValue: value,
      duration: motion.pressMs,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, disabled && { opacity: 0.5 }]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={(event) => {
          animate(motion.pressScale);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animate(1);
          onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
