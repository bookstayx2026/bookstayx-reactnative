import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, layout } from "@/theme";
import { useContentMaxWidth, useIsDesktop } from "@/hooks/use-window-class";

type AppScreenProps = PropsWithChildren<{
  footer?: ReactNode;
  scroll?: boolean;
  fullWidth?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
}>;

export function AppScreen({
  children,
  footer,
  scroll = true,
  fullWidth = false,
  contentContainerStyle,
  scrollProps,
}: AppScreenProps) {
  const maxWidth = useContentMaxWidth();
  const isDesktop = useIsDesktop();
  const defaultPaddingBottom = isDesktop ? layout.desktopBottomReserve : layout.bottomChromeReserve;

  const content = (
    <View
      style={[
        styles.content,
        {
          maxWidth: fullWidth ? "100%" : maxWidth,
          paddingBottom: defaultPaddingBottom,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
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
        <View style={styles.flexCenter}>{content}</View>
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
  flexCenter: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    width: "100%",
  },
  content: {
    width: "100%",
    maxWidth: layout.sourceMaxWidth,
    flexGrow: 1,
    backgroundColor: colors.background,
  },
});
