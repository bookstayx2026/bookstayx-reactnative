import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, layout } from "@/theme";

type AppScreenProps = PropsWithChildren<{
  footer?: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
}>;

export function AppScreen({
  children,
  footer,
  scroll = true,
  contentContainerStyle,
  scrollProps,
}: AppScreenProps) {
  const content = (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {scroll ? (
        <ScrollView
          {...scrollProps}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{content}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: layout.sourceMaxWidth,
    flexGrow: 1,
    backgroundColor: colors.background,
  },
});
