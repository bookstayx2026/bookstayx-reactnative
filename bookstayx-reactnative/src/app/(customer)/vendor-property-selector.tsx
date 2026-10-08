import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Building2, ChevronRight, Flame, Home, Sparkles } from "lucide-react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/components/auth";
import { AppScreen, PressableScale } from "@/components/foundation";
import { useCustomerChrome } from "@/components/customer";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { developmentLogin } from "@/services/api";
import { PROPERTY_CATEGORY_LIST, type PropertyCategoryConfig } from "@/config/property-categories";

function getCategoryIcon(iconType: PropertyCategoryConfig["iconType"], size = 26, color = colors.gold) {
  switch (iconType) {
    case "camping":
      return <Flame size={size} color={color} strokeWidth={1.8} />;
    case "resort":
      return <Sparkles size={size} color={color} strokeWidth={1.8} />;
    case "homestay":
      return <Home size={size} color={color} strokeWidth={1.8} />;
    case "villa":
    default:
      return <Building2 size={size} color={color} strokeWidth={1.8} />;
  }
}

export default function VendorPropertySelectorScreen() {
  const { onScroll } = useCustomerChrome();
  const { ready, session, signIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!ready) return <View style={styles.loading}><ActivityIndicator color={colors.gold} /></View>;
  if (session?.role === "owner") return <Redirect href="/owner" />;

  const handleSelectCategory = async (cat: PropertyCategoryConfig) => {
    setError("");
    setSelectedCategory(cat.key);
    try {
      const result = await developmentLogin("owner", cat.key);
      await signIn({ role: "owner", tokens: result.tokens, identity: result.identity });
      router.replace("/owner");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Development login failed.");
      setSelectedCategory(null);
    }
  };

  return (
    <AppScreen contentContainerStyle={styles.screen} scrollProps={{ onScroll, scrollEventThrottle: 16 }}>
      <Pressable
        accessibilityLabel="Back to login choices"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.back}
      >
        <ArrowLeft color={colors.text} size={22} />
      </Pressable>

      <View style={styles.intro}>
        <Text style={styles.welcome}>VENDOR DEVELOPMENT ACCESS</Text>
        <Text style={styles.title}>Select Property Category</Text>
        <Text style={styles.subtitle}>
          Choose a property category below to test BookStayX Owner CRM with isolated units, calendar tariffs, and guest bookings.
        </Text>
        <View style={styles.devBadge}>
          <Text style={styles.devNotice}>Development one-click login is active</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {PROPERTY_CATEGORY_LIST.map((cat) => {
          const isLoading = selectedCategory === cat.key;
          const isSelected = selectedCategory === cat.key;

          return (
            <PressableScale
              key={cat.key}
              accessibilityLabel={`Select ${cat.title} category`}
              accessibilityRole="button"
              disabled={selectedCategory !== null}
              onPress={() => handleSelectCategory(cat)}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    {getCategoryIcon(cat.iconType, 26, colors.gold)}
                  </View>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{cat.badge}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{cat.title}</Text>
                  <Text style={styles.cardDescription}>{cat.subtitle}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.demoPill}>
                    <Text style={styles.demoLabel}>Demo Property:</Text>
                    <Text numberOfLines={1} style={styles.demoValue}>{cat.demoPropertyName}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.gold} />
                    ) : (
                      <>
                        <Text style={styles.actionText}>Enter Dashboard</Text>
                        <ChevronRight size={18} color={colors.gold} strokeWidth={2.2} />
                      </>
                    )}
                  </View>
                </View>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  screen: {
    minHeight: "100%",
    paddingTop: 110,
    paddingHorizontal: layout.screenInset,
    paddingBottom: layout.bottomChromeReserve + 36,
    backgroundColor: colors.background,
  },
  back: {
    position: "absolute",
    top: 54,
    left: layout.screenInset,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(201, 205, 212, 0.18)",
    backgroundColor: colors.surfaceRaised,
    zIndex: 10,
  },
  intro: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  welcome: {
    color: colors.goldPale,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 3.5,
    textAlign: "center",
  },
  title: {
    marginTop: 12,
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 30,
    lineHeight: 38,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 480,
    marginTop: 10,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  devBadge: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.28)",
  },
  devNotice: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  errorBox: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  errorText: {
    color: "#FCA5A5",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    textAlign: "center",
  },
  grid: {
    gap: 16,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    borderRadius: radii.largePanel,
    borderWidth: 1,
    borderColor: "rgba(201, 205, 212, 0.18)",
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201, 205, 212, 0.14)",
    backgroundColor: colors.surfaceStrong,
  },
  badgeText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  cardBody: {
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 20,
    lineHeight: 26,
  },
  cardDescription: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  cardFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  demoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  demoLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  demoValue: {
    flex: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
});
