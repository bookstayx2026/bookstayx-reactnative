import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { ArrowRight, Heart, MapPin, Star } from "lucide-react-native";
import type { Location, Property } from "@/data/discovery";
import { colors, fontFamilies, radii, spacing } from "@/theme";
import { useIsDesktop, useResponsiveValue, useWindowClass } from "@/hooks/use-window-class";
import { useCustomerData } from "@/components/customer/CustomerDataContext";

function getLocationTag(location: Location) {
  const dist = (location.district || "").toLowerCase();
  if (dist.includes("raigad")) return "RAIGAD, INDIA";
  if (dist.includes("ratnagiri")) return "RATNAGIRI, INDIA";
  if (dist.includes("sindhudurg")) return "SINDHUDURG, INDIA";
  if (dist.includes("pune") || dist.includes("maval")) return "PUNE, INDIA";
  return "MAHARASHTRA, INDIA";
}

export function LocationCard({
  location,
  compact = false,
  rank,
  style,
}: {
  location: Location;
  compact?: boolean;
  rank?: number;
  style?: ViewStyle;
}) {
  const isDesktop = useIsDesktop();
  const windowClass = useWindowClass();

  const webWidth = useResponsiveValue<string>({
    compact: "calc(50% - 8px)",
    medium: "calc((100% - 32px) / 3)",
    expanded: "calc((100% - 48px) / 4)",
  });

  const nativeWidth = useResponsiveValue<any>({
    compact: "48%",
    medium: "31.5%",
    expanded: "23.5%",
  });

  const responsiveWidth = Platform.OS === "web" ? webWidth : nativeWidth;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${location.name}`}
      onPress={() => router.push(`/locations/${location.slug}` as Href)}
      style={({ pressed }) => [
        styles.location,
        { width: responsiveWidth },
        compact ? styles.locationCompact : null,
        isDesktop && styles.locationDesktop,
        Platform.select({
          web: {
            cursor: "pointer",
            outlineStyle: "none",
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease",
          } as any,
          default: {},
        }),
        style,
        pressed && styles.pressed,
      ]}
    >
      <Image source={location.image} contentFit="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(5,7,9,0.1)", "rgba(5,7,9,0.35)", "rgba(5,7,9,0.92)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Top badges */}
      <View style={[styles.locationTopRow, isDesktop && styles.locationTopRowDesktop]}>
        {rank ? (
          <View style={[styles.rank, isDesktop && styles.rankDesktop]}>
            <Text style={[styles.rankText, isDesktop && styles.rankTextDesktop]}>#{rank}</Text>
          </View>
        ) : (
          <View style={[styles.pin, isDesktop && styles.pinDesktop]}>
            <MapPin size={isDesktop ? 12 : 10} color={colors.gold} />
          </View>
        )}
        {location.rating ? (
          <View style={[styles.locationRatingBadge, isDesktop && styles.locationRatingBadgeDesktop]}>
            <Star size={isDesktop ? 10.5 : 9} fill={colors.gold} color={colors.gold} />
            <Text style={[styles.locationRatingText, isDesktop && styles.locationRatingTextDesktop]}>
              {location.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bottom copy */}
      <View style={[styles.locationCopy, isDesktop && styles.locationCopyDesktop]}>
        <View style={styles.categoryRow}>
          <Text numberOfLines={1} style={[styles.locationTag, isDesktop && styles.locationTagDesktop]}>
            {getLocationTag(location)}
          </Text>
          {location.category ? (
            <Text numberOfLines={1} style={[styles.categoryDotText, isDesktop && styles.categoryDotTextDesktop]}>
              • {location.category.replace(" Destination", "")}
            </Text>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[
            compact ? styles.locationNameCompact : styles.locationName,
            isDesktop && styles.locationNameDesktop,
          ]}
        >
          {location.name.replace(" Beach", "")}
        </Text>
      </View>
    </Pressable>
  );
}

export function PropertyCard({
  property,
  grid = false,
  style,
}: {
  property: Property;
  grid?: boolean;
  style?: ViewStyle;
}) {
  const windowClass = useWindowClass();
  const isDesktop = useIsDesktop();
  const { toggleSaved, isSaved } = useCustomerData();
  const saved = isSaved(property.id);

  const webGridWidth = useResponsiveValue<string>({
    compact: "calc(50% - 8px)",
    medium: "calc((100% - 32px) / 3)",
    expanded: "calc((100% - 60px) / 4)",
  });
  const nativeGridWidth = useResponsiveValue<any>({
    compact: "48.2%",
    medium: "31.5%",
    expanded: "23.5%",
  });
  const gridWidth = Platform.OS === "web" ? webGridWidth : nativeGridWidth;

  return (
    <Pressable
      accessibilityLabel={`Open ${property.name}`}
      onPress={() => router.push(`/properties/${property.id}` as Href)}
      style={({ pressed }) => [
        grid ? [styles.propertyGrid, { width: gridWidth }] : styles.property,
        Platform.select({
          web: {
            cursor: "pointer",
            outlineStyle: "none",
          } as any,
          default: {},
        }),
        style,
        pressed && styles.pressed,
      ]}
    >
      <View style={grid ? styles.propertyGridImage : styles.propertyImage}>
        <Image source={property.image} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(5,7,9,0.15)", "transparent", "rgba(5,7,9,0.75)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        {property.badge ? (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{property.badge}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityLabel={saved ? `Remove ${property.name} from saved` : `Save ${property.name}`}
          onPress={(e) => {
            e.stopPropagation();
            toggleSaved(property.id);
          }}
          style={({ pressed }) => [
            styles.heartButton,
            pressed && styles.pressed,
            Platform.select({
              web: { cursor: "pointer" } as any,
              default: {},
            }),
          ]}
        >
          <Heart
            size={14}
            color={saved ? "#E11D48" : "#fff"}
            fill={saved ? "#E11D48" : "transparent"}
          />
        </Pressable>
      </View>
      <View style={[styles.propertyBody, grid && styles.propertyGridBody]}>
        <Text numberOfLines={1} style={styles.propertyName}>
          {property.name}
        </Text>
        {grid ? (
          <View style={styles.inlineLocation}>
            <MapPin size={11} color={colors.gold} />
            <Text numberOfLines={1} style={styles.locationText}>
              {property.locationLabel}
            </Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          {property.meta.slice(0, 3).map((item) => (
            <Text key={item} numberOfLines={1} style={styles.meta}>
              • {item}
            </Text>
          ))}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            <Text style={styles.startingFrom}>Starting from </Text>
            ₹{property.priceAmount.toLocaleString("en-IN")}
            <Text style={styles.night}>/night</Text>
          </Text>
          {grid ? (
            <View style={styles.ratingBadge}>
              <Star size={10} fill={colors.gold} color={colors.gold} />
              <Text style={styles.ratingValue}>
                {property.rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewsCount}>({property.reviews})</Text>
            </View>
          ) : (
            <View style={styles.arrowCircle}>
              <ArrowRight size={13} color={colors.gold} strokeWidth={2.2} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  location: {
    aspectRatio: 3 / 3.4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.15)",
  },
  locationCompact: { aspectRatio: 3 / 3.2 },
  locationTopRow: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 14, 18, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
  },
  rank: {
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 14, 18, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
  },
  rankText: { color: colors.gold, fontFamily: fontFamilies.sansBold, fontSize: 8.5 },
  locationRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
    backgroundColor: "rgba(11, 14, 18, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    paddingHorizontal: 5.5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  locationRatingText: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
  },
  locationCopy: { position: "absolute", left: 8, right: 8, bottom: 8 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationTag: {
    color: "rgba(224, 184, 74, 0.95)",
    fontFamily: fontFamilies.sansBold,
    fontSize: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  categoryDotText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 8,
  },
  locationName: { color: colors.text, fontFamily: fontFamilies.displayMedium, fontSize: 15, marginTop: 2 },
  locationNameCompact: { color: colors.text, fontFamily: fontFamilies.sansBold, fontSize: 11.5, lineHeight: 14, marginTop: 2 },
  locationNameDesktop: { fontSize: 17, lineHeight: 21, marginTop: 3 },
  locationDesktop: {
    borderRadius: 20,
    borderColor: "rgba(224, 184, 74, 0.2)",
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
      } as any,
      default: {},
    }),
  },
  locationTopRowDesktop: {
    left: 12,
    right: 12,
    top: 12,
  },
  locationCopyDesktop: {
    left: 12,
    right: 12,
    bottom: 12,
  },
  pinDesktop: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  rankDesktop: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
  },
  rankTextDesktop: {
    fontSize: 9.5,
  },
  locationRatingBadgeDesktop: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
    gap: 3.5,
  },
  locationRatingTextDesktop: {
    fontSize: 10,
  },
  locationTagDesktop: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  categoryDotTextDesktop: {
    fontSize: 9,
  },
  locationSub: { marginTop: 2, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 9 },
  property: {
    width: 290,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    backgroundColor: "#0d1014",
  },
  propertyGrid: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "rgba(14, 18, 24, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.14)",
    marginBottom: 6,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
      } as any,
      default: {},
    }),
  },
  propertyImage: { height: 165 },
  propertyGridImage: { aspectRatio: 16 / 11 },
  heartButton: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(5, 7, 9, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    position: "absolute",
    left: 10,
    top: 10,
    maxWidth: "75%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(10, 28, 20, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(61, 255, 138, 0.35)",
  },
  badgeText: {
    color: "#4ADE80",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  propertyBody: { padding: spacing.md },
  propertyGridBody: {
    padding: 13,
  },
  propertyName: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  inlineLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
    flexShrink: 1,
  },
  locationText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  metaRow: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  meta: {
    color: colors.textSubtle,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  priceRow: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.07)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  startingFrom: {
    color: colors.gold,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    fontWeight: "normal",
  },
  night: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
    fontWeight: "normal",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  ratingValue: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  reviewsCount: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
