import { StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { usePathname, useRouter, type Href } from "expo-router";
import { Bell, Heart, Menu } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/foundation";
import { colors, layout, radii, spacing } from "@/theme";
import { useCustomerChrome } from "./CustomerChromeContext";

type IconButtonProps = {
  label: string;
  badge?: number;
  onPress: () => void;
  children: React.ReactNode;
};

function IconButton({ label, badge, onPress, children }: IconButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.iconButton}
    >
      <View style={styles.iconButtonContent}>
        {children}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

export function CustomerTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { openMenu, scrolled } = useCustomerChrome();
  const homeOverlay = pathname === "/" && !scrolled;

  const navigate = (href: string) => router.push(href as Href);

  return (
    <View style={[styles.stage, { paddingTop: Math.max(10, insets.top) }]}>
      {!homeOverlay ? (
        <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.frostTint} />
        </BlurView>
      ) : null}
      <View style={styles.navRow}>
        <PressableScale
          accessibilityLabel="BookStayX home"
          accessibilityRole="button"
          onPress={() => navigate("/")}
          style={styles.logoButton}
        >
          <Image
            source={require("../../../assets/images/bookstayx-logo.png")}
            contentFit="contain"
            style={styles.logo}
          />
        </PressableScale>

        <View style={styles.actions}>
          <IconButton label="Saved" onPress={() => navigate("/saved")}>
            <Heart color={colors.text} size={18} strokeWidth={1.65} />
          </IconButton>
          <IconButton label="Notifications" badge={3} onPress={() => navigate("/notifications")}>
            <Bell color={colors.text} size={18} strokeWidth={1.65} />
          </IconButton>
          <IconButton label="Menu" onPress={openMenu}>
            <Menu color={colors.text} size={19} strokeWidth={1.65} />
          </IconButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: "absolute",
    zIndex: 40,
    top: 0,
    alignSelf: "center",
    width: "100%",
    maxWidth: layout.sourceMaxWidth,
    overflow: "hidden",
    pointerEvents: "box-none",
  },
  frostTint: { flex: 1, backgroundColor: "rgba(16, 18, 21, 0.68)" },
  navRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  logoButton: { width: 139, height: 42 },
  logo: { width: "100%", height: "100%" },
  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  iconButton: {
    width: 37,
    height: 37,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.18)",
    overflow: "visible",
  },
  iconButtonContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 15,
    height: 15,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.surface, fontFamily: "Inter_700Bold", fontSize: 9, lineHeight: 12 },
});
