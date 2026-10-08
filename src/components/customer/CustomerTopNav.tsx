import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { usePathname, useRouter, type Href } from "expo-router";
import { Bell, Building2, Heart, Menu, Sparkles, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/foundation";
import { colors, fontFamilies, layout, radii, spacing } from "@/theme";
import { useCustomerChrome } from "./CustomerChromeContext";
import { useIsDesktop } from "@/hooks/use-window-class";
import { focusRingProps, useFinePointer } from "@/hooks/use-fine-pointer";
import { useAuth } from "@/components/auth";

type IconButtonProps = {
  label: string;
  badge?: number;
  onPress: () => void;
  children: React.ReactNode;
};

function IconButton({ label, badge, onPress, children }: IconButtonProps) {
  const finePointer = useFinePointer();
  const [hot, setHot] = useState(false);
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onHoverIn={() => setHot(true)}
      onHoverOut={() => setHot(false)}
      onPress={onPress}
      style={styles.iconHit}
    >
      <View style={[styles.iconButton, finePointer && hot && styles.iconButtonHover]}>
        <View style={styles.iconButtonContent}>
          {children}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

function DesktopNavLink({
  item,
  active,
  onPress,
}: {
  item: { label: string; href: string; highlight?: boolean };
  active: boolean;
  onPress: () => void;
}) {
  const finePointer = useFinePointer();
  const [hot, setHot] = useState(false);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      {...focusRingProps()}
      hitSlop={{ top: 6, bottom: 6 }}
      onHoverIn={() => setHot(true)}
      onHoverOut={() => setHot(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.desktopNavLink,
        active && styles.desktopNavLinkActive,
        pressed && styles.desktopNavLinkPressed,
        Platform.OS === "web" && { cursor: "pointer" },
      ]}
    >
      {item.highlight ? <Sparkles size={13} color={colors.success} /> : null}
      <Text
        style={[
          styles.desktopNavText,
          active && styles.desktopNavTextActive,
          item.highlight && styles.desktopNavTextHighlight,
          finePointer && hot && !active && !item.highlight && styles.desktopNavTextHot,
        ]}
      >
        {item.label}
      </Text>
      {active ? <View style={styles.desktopActiveIndicator} /> : null}
    </Pressable>
  );
}

const DESKTOP_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Locations", href: "/locations" },
  { label: "My Bookings", href: "/bookings" },
  { label: "Refer & Earn", href: "/referrals", highlight: true },
];

export function CustomerTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { openMenu, scrolled } = useCustomerChrome();
  const isDesktop = useIsDesktop();
  const { session } = useAuth();
  const isCustomer = session?.role === "customer";
  const isOwner = session?.role === "owner" || session?.role === "admin";
  const isHome = pathname === "/";
  const showBackground = scrolled || !isHome || isDesktop;

  const navigate = (href: string) => router.push(href as Href);

  return (
    <View style={[styles.stage, { paddingTop: Math.max(isDesktop ? 12 : 8, insets.top) }]}>
      {showBackground ? (
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={[styles.frostTint, scrolled && styles.frostTintScrolled]} />
        </BlurView>
      ) : (
        <LinearGradient
          colors={["rgba(5,7,9,0.85)", "rgba(5,7,9,0.4)", "transparent"]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[styles.navRow, isDesktop && styles.navRowDesktop]}>
        <PressableScale
          accessibilityLabel="BookStayX home"
          accessibilityRole="button"
          onPress={() => navigate("/")}
          style={isDesktop ? styles.logoButtonDesktop : styles.logoButton}
        >
          <Image
            source={require("../../../assets/images/bookstayx-logo.png")}
            contentFit="contain"
            style={styles.logo}
          />
        </PressableScale>

        {isDesktop ? (
          <View style={styles.desktopCenterNav}>
            {DESKTOP_NAV_ITEMS.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <DesktopNavLink
                  key={item.href}
                  item={item}
                  active={active}
                  onPress={() => navigate(item.href)}
                />
              );
            })}
          </View>
        ) : null}

        <View style={styles.actions}>
          <IconButton label="Saved" onPress={() => navigate("/saved")}>
            <Heart color={pathname === "/saved" ? colors.gold : colors.text} size={18} strokeWidth={1.65} />
          </IconButton>
          <IconButton label="Notifications" badge={3} onPress={() => navigate("/notifications")}>
            <Bell color={pathname === "/notifications" ? colors.gold : colors.text} size={18} strokeWidth={1.65} />
          </IconButton>

          {isDesktop ? (
            isCustomer ? (
              <PressableScale
                accessibilityLabel="My Account"
                accessibilityRole="button"
                onPress={() => navigate("/profile")}
                style={styles.desktopProfileButton}
              >
                <User size={13} color={colors.gold} strokeWidth={2} />
                <Text style={styles.desktopProfileText}>My Account</Text>
              </PressableScale>
            ) : isOwner ? (
              <PressableScale
                accessibilityLabel="Owner Portal"
                accessibilityRole="button"
                onPress={() => navigate("/owner")}
                style={styles.desktopOwnerButton}
              >
                <Building2 size={13} color={colors.gold} strokeWidth={1.8} />
                <Text style={styles.desktopOwnerText}>Owner Portal</Text>
              </PressableScale>
            ) : (
              <PressableScale
                accessibilityLabel="Sign In"
                accessibilityRole="button"
                onPress={() => navigate("/login")}
                style={styles.desktopSignInButton}
              >
                <User size={12} color="#120D04" strokeWidth={2.4} />
                <Text style={styles.desktopSignInText}>Sign In</Text>
              </PressableScale>
            )
          ) : null}

          {!isDesktop ? (
            <IconButton label="Menu" onPress={openMenu}>
              <Menu color={colors.text} size={19} strokeWidth={1.65} />
            </IconButton>
          ) : null}
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
    left: 0,
    right: 0,
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  frostTint: {
    flex: 1,
    backgroundColor: "rgba(8, 10, 13, 0.78)",
  },
  frostTintScrolled: {
    backgroundColor: "rgba(8, 10, 13, 0.94)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 184, 74, 0.18)",
  },
  navRow: {
    width: "100%",
    maxWidth: layout.headerMaxWidth,
    alignSelf: "center",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  navRowDesktop: {
    minHeight: 68,
    paddingHorizontal: 44,
    paddingBottom: spacing.sm,
  },
  logoButton: { width: 139, height: 42 },
  logoButtonDesktop: { width: 156, height: 46 },
  logo: { width: "100%", height: "100%" },
  desktopCenterNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  desktopNavLink: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  desktopNavLinkActive: {},
  desktopNavLinkPressed: {
    opacity: 0.8,
  },
  desktopNavText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 14,
    letterSpacing: 0.2,
    ...Platform.select({
      web: {
        transitionProperty: "color",
        transitionDuration: "160ms",
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
      } as object,
      default: {},
    }),
  },
  desktopNavTextHot: {
    color: colors.text,
  },
  desktopNavTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
  },
  desktopNavTextHighlight: {
    color: colors.success,
  },
  desktopActiveIndicator: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
  },
  desktopOwnerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      } as object,
      default: {},
    }),
  },
  desktopOwnerText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
  desktopProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      } as object,
      default: {},
    }),
  },
  desktopProfileText: {
    color: colors.goldPale,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
  desktopSignInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
    backgroundColor: colors.goldAction,
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 2px 10px rgba(217, 165, 42, 0.28)",
      } as object,
      default: {},
    }),
  },
  desktopSignInText: {
    color: "#120D04",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconHit: {
    width: 44,
    height: 44,
    margin: -3,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "visible",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionProperty: "border-color, background-color",
        transitionDuration: "160ms",
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
      } as object,
      default: {},
    }),
  },
  iconButtonHover: {
    borderColor: "rgba(224, 184, 74, 0.55)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
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
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.actionInk, fontFamily: fontFamilies.sansBold, fontSize: 9, lineHeight: 12 },
});
