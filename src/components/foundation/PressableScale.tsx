import { useState, type PropsWithChildren } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { motion } from "@/theme";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { focusRingProps, useFinePointer } from "@/hooks/use-fine-pointer";

type PressableScaleProps = PropsWithChildren<
  Omit<PressableProps, "style"> & {
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    hoverStyle?: StyleProp<ViewStyle>;
  }
>;

export function PressableScale({
  children,
  disabled,
  onPressIn,
  onPressOut,
  style,
  containerStyle,
  hoverStyle,
  ...props
}: PressableScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();

  const animate = (value: number) => {
    if (reducedMotion) return;
    Animated.timing(scale, {
      toValue: value,
      duration: motion.pressMs,
      easing: Easing.bezier(motion.easeOut[0], motion.easeOut[1], motion.easeOut[2], motion.easeOut[3]),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <Animated.View style={[containerStyle, reducedMotion ? null : { transform: [{ scale }] }, disabled && { opacity: 0.5 }]}>
      <Pressable
        {...props}
        {...focusRingProps()}
        disabled={disabled}
        onPressIn={(event) => {
          animate(motion.pressScale);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animate(1);
          onPressOut?.(event);
        }}
        style={(state) => [
          style,
          finePointer && state.hovered && !state.pressed && hoverStyle,
          reducedMotion && state.pressed && { opacity: 0.84 },
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
