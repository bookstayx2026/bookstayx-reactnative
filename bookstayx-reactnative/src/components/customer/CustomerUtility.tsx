import type { PropsWithChildren } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { ArrowRight, CalendarDays, CreditCard, Heart, MapPin, Ticket, type LucideIcon } from "lucide-react-native";
import type { Property } from "@/data/discovery";
import type { LocalBooking } from "./CustomerDataContext";
import { colors, fontFamilies, layout } from "@/theme";
import { useIsDesktop, useResponsiveValue } from "@/hooks/use-window-class";
import { ticketIdForDisplay } from "@/utils/ticket-id";

export function UtilityHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const isDesktop = useIsDesktop();
  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <Text style={[styles.title, isDesktop && styles.titleDesktop]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>{subtitle}</Text> : null}
    </View>
  );
}

export function UtilitySection({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.section, style]}>{children}</View>;
}

export function EmptyState({
  Icon,
  title,
  copy,
  action,
  onAction,
}: {
  Icon: LucideIcon;
  title: string;
  copy: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color={colors.gold} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
      <Pressable onPress={onAction} style={styles.emptyAction}>
        <Text style={styles.emptyActionText}>{action}</Text>
        <ArrowRight size={15} color={colors.actionInk} />
      </Pressable>
    </View>
  );
}

export function SavedCard({
  property,
  onRemove,
  style,
}: {
  property: Property;
  onRemove: () => void;
  style?: ViewStyle;
}) {
  const savedWidth = useResponsiveValue<any>({
    compact: "48.2%",
    medium: "31.5%",
    expanded: "23.5%",
  });

  return (
    <Pressable
      onPress={() => router.push(`/properties/${property.id}` as Href)}
      style={[styles.saved, { width: savedWidth }, style]}
    >
      <View style={styles.savedImage}>
        <Image source={property.image} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["transparent", "rgba(5,7,9,.76)"]} style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityLabel={`Remove ${property.name} from saved`}
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={styles.heart}
        >
          <Heart size={16} color="#fff" fill="#E11D48" />
        </Pressable>
      </View>
      <View style={styles.savedBody}>
        <Text numberOfLines={1} style={styles.savedTitle}>
          {property.name}
        </Text>
        <View style={styles.inline}>
          <MapPin size={10} color={colors.textMuted} />
          <Text numberOfLines={1} style={styles.savedMeta}>
            {property.locationLabel}
          </Text>
        </View>
        <Text style={styles.savedPrice}>
          ₹{property.priceAmount.toLocaleString("en-IN")}{" "}
          <Text style={styles.savedMeta}>/ night</Text>
        </Text>
      </View>
    </Pressable>
  );
}

export function BookingCard({
  booking,
  onPayment,
  paying,
  style,
}: {
  booking: LocalBooking;
  onPayment?: (booking: LocalBooking) => void;
  paying?: boolean;
  style?: ViewStyle;
}) {
  const isDesktop = useIsDesktop();
  const paymentDue = booking.status === "pending" && booking.paymentStatus !== "SUCCESS";

  const statusConfig = {
    confirmed: {
      label: "CONFIRMED",
      bg: "rgba(34, 197, 94, 0.14)",
      border: "rgba(34, 197, 94, 0.38)",
      text: "#4ADE80",
      dot: "#22C55E",
    },
    pending: {
      label: "PENDING CONFIRMATION",
      bg: "rgba(234, 179, 8, 0.14)",
      border: "rgba(234, 179, 8, 0.38)",
      text: "#FACC15",
      dot: "#EAB308",
    },
    completed: {
      label: "COMPLETED",
      bg: "rgba(59, 130, 246, 0.14)",
      border: "rgba(59, 130, 246, 0.38)",
      text: "#60A5FA",
      dot: "#3B82F6",
    },
    cancelled: {
      label: "CANCELLED",
      bg: "rgba(239, 68, 68, 0.14)",
      border: "rgba(239, 68, 68, 0.38)",
      text: "#F87171",
      dot: "#EF4444",
    },
  }[booking.status] || {
    label: booking.status.toUpperCase(),
    bg: "rgba(255, 255, 255, 0.1)",
    border: "rgba(255, 255, 255, 0.2)",
    text: colors.text,
    dot: colors.gold,
  };

  return (
    <Pressable
      accessibilityLabel={`Booking for ${booking.name}`}
      onPress={() => router.push(`/properties/${booking.propertyId}` as Href)}
      style={({ pressed }) => [
        styles.booking,
        isDesktop && styles.bookingDesktop,
        Platform.select({
          web: {
            cursor: "pointer",
            outlineStyle: "none",
            transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
          } as any,
          default: {},
        }),
        style,
        pressed && styles.pressed,
      ]}
    >
      {/* Property Thumbnail & Status Overlay */}
      <View style={[styles.bookingImageContainer, isDesktop && styles.bookingImageContainerDesktop]}>
        <Image source={booking.image} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(5,7,9,0.3)", "transparent", "rgba(5,7,9,0.75)"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Booking Details & Action Body */}
      <View style={[styles.bookingBody, isDesktop && styles.bookingBodyDesktop]}>
        
        {/* Main Details Info */}
        <View style={[styles.bookingMainInfo, isDesktop && styles.bookingMainInfoDesktop]}>
          {/* Header Row: Ticket ID & Location */}
          <View style={styles.bookingHeaderRow}>
            <View style={styles.refBadge}>
              <Text style={styles.code}>TICKET ID: {ticketIdForDisplay(booking.ticketId, booking.bookingCode)}</Text>
            </View>
            <View style={styles.inlineLocation}>
              <MapPin size={11} color={colors.gold} />
              <Text numberOfLines={1} style={styles.locationText}>
                {booking.location}
              </Text>
            </View>
          </View>

          {/* Property Name */}
          <Text numberOfLines={1} style={[styles.bookingTitle, isDesktop && styles.bookingTitleDesktop]}>
            {booking.name}
          </Text>

          {/* Modern Horizontal Spec Chips */}
          <View style={[styles.metaRow, { flexWrap: "wrap", gap: 6 }]}>
            {booking.items && booking.items.length > 0 ? (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillTextGold}>
                  🏠 {booking.items.map((it) => `${it.unit_name} (${it.unit_quantity}u)`).join(", ")}
                </Text>
              </View>
            ) : booking.unitName ? (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillTextGold}>🏠 {booking.unitName}</Text>
              </View>
            ) : null}
            <View style={styles.metaPill}>
              <CalendarDays size={12} color={colors.gold} />
              <Text style={styles.metaPillText}>{booking.dateRange}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillTextGold}>{booking.nights}N</Text>
              <Text style={styles.metaPillText}>•</Text>
              <Text style={styles.metaPillText}>🕒 {booking.checkInTime || "02:00 PM"}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                👨 {booking.maleGuestCount ?? booking.guests}M • 👩 {booking.femaleGuestCount ?? 0}F
              </Text>
              <Text style={styles.metaPillText}>•</Text>
              <Text style={styles.metaPillText}>
                🥗 {booking.vegGuestCount ?? booking.guests}V • 🍗 {booking.nonVegGuestCount ?? 0}NV
              </Text>
            </View>
          </View>
        </View>

        {/* Price & Action Section */}
        <View style={[styles.bookingActionCol, isDesktop && styles.bookingActionColDesktop]}>
          <View style={[styles.priceContainer, isDesktop && styles.priceContainerDesktop]}>
            <Text style={styles.priceSub}>Total Booking Amount</Text>
            <Text style={styles.amount}>₹{booking.totalAmount.toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.bookingActions}>
            {/* View Ticket Button */}
            <Pressable
              accessibilityRole="button"
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: "/ticket",
                  params: { booking_id: booking.bookingCode },
                });
              }}
              style={({ pressed }) => [
                styles.ticketBtn,
                pressed && styles.pressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <Ticket size={13} color={colors.gold} />
              <Text style={styles.ticketBtnText}>View Ticket</Text>
            </Pressable>

            {/* Pay Advance Button (if applicable) */}
            {paymentDue && onPayment ? (
              <Pressable
                accessibilityRole="button"
                disabled={paying}
                onPress={(event) => {
                  event.stopPropagation();
                  onPayment(booking);
                }}
                style={({ pressed }) => [
                  styles.payButton,
                  paying && { opacity: 0.6 },
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <CreditCard size={13} color="#120e06" />
                <Text style={styles.payText}>
                  {paying ? "Processing..." : "Pay Advance"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  header: { paddingHorizontal: 20, paddingTop: 86, paddingBottom: 18 },
  headerDesktop: { paddingTop: 104, paddingBottom: 24 },
  title: { color: "white", fontFamily: fontFamilies.displaySemiBold, fontSize: 29 },
  titleDesktop: { fontSize: 36 },
  subtitle: { marginTop: 5, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 12.5 },
  subtitleDesktop: { fontSize: 14, marginTop: 8 },
  section: { paddingHorizontal: 16 },
  empty: { marginTop: 48, alignItems: "center", paddingHorizontal: 28 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceRaised,
  },
  emptyTitle: { marginTop: 18, color: "white", fontFamily: fontFamilies.displaySemiBold, fontSize: 24 },
  emptyCopy: {
    maxWidth: 380,
    marginTop: 8,
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 22,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: colors.goldAction,
  },
  emptyActionText: { color: colors.actionInk, fontFamily: fontFamilies.sansSemiBold, fontSize: 13 },
  saved: { overflow: "hidden", borderRadius: 14, backgroundColor: colors.surfaceStrong, marginBottom: 14 },
  savedImage: { aspectRatio: 4 / 3 },
  heart: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,.48)",
  },
  savedBody: { padding: 12 },
  savedTitle: { color: "white", fontFamily: fontFamilies.sansSemiBold, fontSize: 13.5 },
  inline: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 },
  savedMeta: { color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 10 },
  savedPrice: { marginTop: 8, color: colors.gold, fontFamily: fontFamilies.sansBold, fontSize: 12.5 },

  // Booking Card Styles (Listed layout)
  booking: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.3)",
      } as any,
      default: {},
    }),
  },
  bookingDesktop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 16,
    width: "100%",
  },
  bookingImageContainer: {
    height: 165,
    position: "relative",
  },
  bookingImageContainerDesktop: {
    width: 210,
    height: 122,
    borderRadius: 12,
    overflow: "hidden",
  },
  statusBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      web: { backdropFilter: "blur(6px)" } as any,
      default: {},
    }),
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  bookingBody: {
    padding: 14,
    gap: 12,
    flex: 1,
  },
  bookingBodyDesktop: {
    padding: 0,
    paddingLeft: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  bookingMainInfo: {
    flex: 1,
    gap: 5,
  },
  bookingMainInfoDesktop: {
    gap: 5,
  },
  bookingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  refBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
  },
  code: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  inlineLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  bookingTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    lineHeight: 20,
  },
  bookingTitleDesktop: {
    fontSize: 17.5,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 2,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
  },
  metaPillText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  metaPillTextGold: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  bookingActionCol: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.07)",
    paddingTop: 10,
  },
  bookingActionColDesktop: {
    flexDirection: "column",
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 0,
    paddingLeft: 20,
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 180,
    gap: 10,
  },
  priceContainer: {
    flexDirection: "column",
  },
  priceContainerDesktop: {
    alignItems: "flex-end",
  },
  priceSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  amount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16.5,
    marginTop: 1,
  },
  bookingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ticketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  ticketBtnText: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: colors.gold,
  },
  payText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },
});

