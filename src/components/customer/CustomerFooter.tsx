import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { ShieldCheck, Sparkles } from "lucide-react-native";
import { colors, fontFamilies, layout, radii, spacing } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

export function CustomerFooter() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  if (!isDesktop) return null;

  const navigate = (href: string) => router.push(href as Href);

  return (
    <View style={styles.footerRoot}>
      <View style={styles.footerInner}>
        <View style={styles.columnsRow}>
          {/* Column 1: Brand & Bio */}
          <View style={styles.brandCol}>
            <Image
              source={require("../../../assets/images/bookstayx-logo.png")}
              contentFit="contain"
              style={styles.logo}
            />
            <Text style={styles.brandBio}>
              Curated luxury glamping, lakeside domes, and private hillside villas across Pawna Lake,
              Lonavala, and the Konkan coast.
            </Text>
            <View style={styles.badgeRow}>
              <ShieldCheck size={14} color={colors.gold} />
              <Text style={styles.badgeText}>100% Verified Luxury Stays</Text>
            </View>
          </View>

          {/* Column 2: Explore */}
          <View style={styles.linksCol}>
            <Text style={styles.colTitle}>Explore</Text>
            <Pressable
              onPress={() => navigate("/")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Home</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/properties")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>All Stays & Villas</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/locations")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Destinations</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/saved")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Saved Stays</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/referrals")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <View style={styles.referralLinkRow}>
                <Text style={[styles.linkText, styles.referralLinkText]}>Refer & Earn ₹500</Text>
                <Sparkles size={12} color={colors.success} />
              </View>
            </Pressable>
          </View>

          {/* Column 3: Policies & Legal */}
          <View style={styles.linksCol}>
            <Text style={styles.colTitle}>Policies & Legal</Text>
            <Pressable
              onPress={() => navigate("/terms")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Terms & Conditions</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/privacy")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/refund-policy")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Refund & Cancellation</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/terms")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Guest Guidelines</Text>
            </Pressable>
          </View>

          {/* Column 4: Guest Support & Concierge */}
          <View style={styles.linksCol}>
            <Text style={styles.colTitle}>Support & Concierge</Text>
            <Pressable
              onPress={() => navigate("/bookings")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Manage Bookings</Text>
            </Pressable>
            <Pressable
              onPress={() => navigate("/profile")}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>Customer Account</Text>
            </Pressable>
            <Text style={styles.contactInfo}>
              Concierge: support@bookstayx.com{"\n"}
              Pawna • Lonavala • Alibagh • Konkan
            </Text>
          </View>
        </View>

        {/* Bottom copyright line */}
        <View style={styles.bottomBar}>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} BookStayX. All rights reserved.
          </Text>
          <Text style={styles.tagline}>
            Crafted for Extraordinary Escapes in Maharashtra.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerRoot: {
    width: "100%",
    backgroundColor: "#06080b",
    borderTopWidth: 1,
    borderTopColor: "rgba(224, 184, 74, 0.15)",
    marginTop: 64,
  },
  footerInner: {
    width: "100%",
    maxWidth: layout.expandedContentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: 40,
    paddingTop: 54,
    paddingBottom: 36,
  },
  columnsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 36,
  },
  brandCol: {
    flex: 1.3,
    minWidth: 260,
  },
  logo: {
    width: 160,
    height: 48,
    marginBottom: 14,
  },
  brandBio: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 22,
    maxWidth: 300,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    alignSelf: "flex-start",
  },
  badgeText: {
    color: colors.goldPale,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  linksCol: {
    flex: 1,
    minWidth: 180,
  },
  colTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  linkItem: {
    paddingVertical: 7,
    ...Platform.select({
      web: { cursor: "pointer", outlineStyle: "none" } as any,
      default: {},
    }),
  },
  linkPressed: {
    opacity: 0.7,
  },
  linkText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 20,
  },
  referralLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  referralLinkText: {
    color: colors.success,
    fontFamily: fontFamilies.sansSemiBold,
  },
  contactInfo: {
    marginTop: 14,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  copyrightText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
  },
  tagline: {
    color: "rgba(224, 184, 74, 0.7)",
    fontFamily: fontFamilies.displayItalic,
    fontSize: 14,
  },
});
