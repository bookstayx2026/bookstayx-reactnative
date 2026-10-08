import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react-native";
import { getProperty, type Property } from "@/data/discovery";
import { useCustomerData } from "@/components/customer";
import { useAuth, type AuthSession } from "@/components/auth";
import {
  confirmMockPayment,
  getProtectedOwnerDashboard,
  initiateBooking,
  initiatePayment,
  loadPublicProperty,
  quoteBooking,
  type AccommodationItemInput,
  type BookingQuote,
} from "@/services/api";
import { colors, fontFamilies, radii } from "@/theme";
import { getRememberedReferralCode } from "@/services/referrals/attribution";

function extractIdentityDetails(session: AuthSession | null) {
  if (!session) return { name: "", email: "", phone: "" };
  const raw = (session.identity || {}) as Record<string, any>;

  const name =
    raw.name ||
    raw.full_name ||
    raw.fullName ||
    raw.owner_name ||
    raw.ownerName ||
    raw.username ||
    "";

  const email =
    raw.email ||
    raw.owner_email ||
    raw.ownerEmail ||
    "";

  const rawMobile =
    raw.mobile ||
    raw.phone ||
    raw.ownerNumber ||
    raw.owner_number ||
    raw.whatsapp ||
    "";

  const cleanPhone = String(rawMobile).replace(/\D/g, "").slice(-10);

  return { name, email, phone: cleanPhone };
}

export default function BookingReview() {
  const params = useLocalSearchParams<{
    id?: string;
    unitId?: string;
    guests?: string;
    males?: string;
    females?: string;
    veg?: string;
    nonVeg?: string;
    nights?: string;
    checkIn?: string;
    checkOut?: string;
    hasFood?: string;
    referralCode?: string;
    unitQuantity?: string;
    accommodationItems?: string;
  }>();

  const { session } = useAuth();
  const initialDetails = extractIdentityDetails(session);

  const [property, setProperty] = useState<Property>(
    () => getProperty(params.id || "") || getProperty("pawna-lakeview-villa")!
  );

  const accommodationItems: AccommodationItemInput[] | undefined = useMemo(() => {
    if (!params.accommodationItems) return undefined;
    try {
      const parsed = JSON.parse(params.accommodationItems);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          unitId: Number(item.unitId),
          persons: Number(item.persons),
          unitQuantity: item.unitQuantity ? Number(item.unitQuantity) : undefined,
        }));
      }
    } catch {}
    return undefined;
  }, [params.accommodationItems]);

  const selectedUnit =
    property.units?.find((u) => String(u.id) === String(params.unitId)) ||
    property.units?.[0];

  const unitQuantity = Math.max(1, Number(params.unitQuantity) || 1);

  const isFoodUnit =
    params.hasFood !== undefined
      ? params.hasFood === "true"
      : selectedUnit
      ? selectedUnit.hasFood !== false
      : property.hasFood !== false;

  const guests = Math.max(1, Number(params.guests) || 1);
  const males = params.males !== undefined ? Number(params.males) : guests;
  const females = params.females !== undefined ? Number(params.females) : 0;
  const veg = isFoodUnit ? (params.veg !== undefined ? Number(params.veg) : guests) : 0;
  const nonVeg = isFoodUnit ? (params.nonVeg !== undefined ? Number(params.nonVeg) : 0) : 0;
  const nights = Math.max(1, Number(params.nights) || 1);
  const checkInStr = params.checkIn || new Date().toISOString();
  const checkOutStr =
    params.checkOut || new Date(Date.now() + nights * 86_400_000).toISOString();

  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState("");

  const total = quote?.totalAmount ?? (property.priceAmount * nights * unitQuantity);
  const advanceAmount = quote?.advanceAmount ?? Math.round(total * 0.5);
  const dueAtCheckIn = Math.max(0, total - advanceAmount);

  const [name, setName] = useState<string>(initialDetails.name);
  const [email, setEmail] = useState<string>(initialDetails.email);
  const [phone, setPhone] = useState<string>(initialDetails.phone);

  useEffect(() => {
    if (!session) return;
    const details = extractIdentityDetails(session);

    setName((prev: string) => (prev.trim() ? prev : details.name));
    setEmail((prev: string) => (prev.trim() ? prev : details.email));
    setPhone((prev: string) => (prev.trim() ? prev : details.phone));

    if (session.role === "owner" && session.tokens?.accessToken) {
      let active = true;
      void getProtectedOwnerDashboard(session.tokens.accessToken)
        .then((res) => {
          if (!active || !res?.owner) return;
          const ownerName = res.owner.name || "";
          const ownerPhone = (res.owner.mobile || res.owner.whatsapp || "")
            .replace(/\D/g, "")
            .slice(-10);
          if (ownerName) setName((prev: string) => (prev.trim() ? prev : ownerName));
          if (ownerPhone) setPhone((prev: string) => (prev.trim() ? prev : ownerPhone));
        })
        .catch(() => {
          // ignore error
        });
      return () => {
        active = false;
      };
    }
  }, [session]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { confirmBooking } = useCustomerData();

  useEffect(() => {
    let active = true;
    void loadPublicProperty(params.id || "").then((remote) => {
      if (active && remote) setProperty(remote);
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    let active = true;
    void quoteBooking({
      propertyId: params.id || property.id,
      unitId: Number(params.unitId) || undefined,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      persons: guests,
      unitQuantity,
      accommodationItems,
    })
      .then((result) => {
        if (active) setQuote(result);
      })
      .catch((error) => {
        if (active) {
          setQuote(null);
          setQuoteError(
            error instanceof Error ? error.message : "Unable to verify availability."
          );
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id, params.unitId, checkInStr, checkOutStr, guests, nights, property.id, unitQuantity, accommodationItems]);

  const submit = async () => {
    if (submitting) return;
    const next: Record<string, string> = {};
    const cleanPhone = phone.replace(/\D/g, "");
    if (name.trim().length < 2) next.name = "Enter the guest's full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(cleanPhone)) next.phone = "Enter a 10-digit mobile number.";
    if (!quote) next.quote = quoteError || "Selected dates could not be verified.";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;

    if (!session?.tokens?.accessToken) {
      router.push({ pathname: "/login", params: { returnTo: "/booking-review" } });
      return;
    }

    setSubmitting(true);
    try {
      const referralCode =
        params.referralCode || (await getRememberedReferralCode()) || undefined;
      const remote = await initiateBooking(session.tokens.accessToken, {
        propertyId: params.id || property.id,
        unitId: Number(params.unitId) || undefined,
        guestName: name.trim(),
        checkIn: checkInStr,
        checkOut: checkOutStr,
        persons: guests,
        vegGuestCount: veg,
        nonVegGuestCount: nonVeg,
        maleGuestCount: males,
        femaleGuestCount: females,
        referralCode,
        unitQuantity,
        accommodationItems,
      });

      confirmBooking({
        property,
        guests,
        nights: remote.quote.nights,
        dateRange: formatRange(checkInStr, checkOutStr),
        total: remote.quote.totalAmount,
        bookingCode: remote.booking.booking_id,
        status: "confirmed",
      });

      setConfirmed(remote.booking.booking_id);

      try {
        const payment = await initiatePayment(
          session.tokens.accessToken,
          remote.booking.booking_id
        );
        if (payment.already_paid) {
          setPaymentMessage(
            "Booking confirmed! Your reservation is locked and active."
          );
        } else if (payment.mock && payment.mock_token) {
          await confirmMockPayment(session.tokens.accessToken, payment.mock_token);
          setPaymentMessage(
            "Direct booking confirmed! Your reservation is active on the calendar and owner dashboard."
          );
        } else if (payment.checkout_url) {
          setPaymentMessage(
            "Secure Razorpay Checkout has opened. Return to BookStayX after completing payment."
          );
          await Linking.openURL(payment.checkout_url);
        }
      } catch (paymentError) {
        setPaymentMessage(
          paymentError instanceof Error && paymentError.message.includes("not configured")
            ? "Booking is reserved for 15 minutes. Razorpay will become available after gateway credentials are configured."
            : "Booking was created, but payment could not open. You can retry from My Bookings."
        );
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit this booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  if (confirmed) {
    return (
      <SafeAreaView style={styles.backdrop}>
        <View style={[styles.popupCard, isWide ? styles.successCardWide : styles.successCardNarrow]}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={36} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Booking Request Created!</Text>
          <Text style={styles.successRefLabel}>BOOKING REFERENCE</Text>
          <View style={styles.successRefBox}>
            <Text style={styles.successRefCode}>{confirmed}</Text>
          </View>
          <Text style={styles.successCopy}>
            We have notified the property host. {paymentMessage}
          </Text>

          <View style={styles.successSummaryBox}>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Property</Text>
              <Text style={styles.successRowVal}>{property.name}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Stay Dates</Text>
              <Text style={styles.successRowVal}>
                {formatRange(checkInStr, checkOutStr)}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Total Value</Text>
              <Text style={styles.successRowValGold}>
                ₹{total.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/bookings")}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>View My Bookings</Text>
            <ArrowRight size={16} color={colors.actionInk} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(property.id ? `/properties/${property.id}` : "/");
    }
  };

  return (
    <SafeAreaView style={styles.backdrop}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.centerWrap}
      >
        <ScrollView
          contentContainerStyle={styles.scrollWrap}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.popupCard, isWide ? styles.popupCardWide : styles.popupCardNarrow]}>
            {/* Pop-up Header */}
            <View style={styles.popupHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.popupTitle, isWide && styles.popupTitleWide]}>
                  Review & Confirm
                </Text>
                <Text style={styles.popupSubtitle}>
                  Provide guest details to secure your dates
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Pop-up Body: 2 Columns on wide screen, 1 Column on mobile */}
            <View style={isWide ? styles.wideBodyGrid : styles.mobileBodyGrid}>
              {/* Left Column: Property & Price Summary */}
              <View style={isWide ? styles.wideColLeft : styles.mobileColSection}>
                {/* Property Snippet Card */}
                <View style={isWide ? styles.propertyCardWide : styles.propertyCard}>
                  <Image
                    source={property.image}
                    contentFit="cover"
                    style={isWide ? styles.propertyImageWide : styles.propertyImage}
                  />
                  <View style={styles.propertyMeta}>
                    <Text numberOfLines={1} style={styles.propertyName}>
                      {property.name}
                    </Text>
                    <View style={styles.locationRow}>
                      <MapPin size={11} color={colors.gold} />
                      <Text numberOfLines={1} style={styles.locationText}>
                        {property.locationLabel}
                      </Text>
                    </View>
                    <View style={styles.stayPillsRow}>
                      <View style={styles.stayPill}>
                        <CalendarDays size={11} color={colors.gold} />
                        <Text style={styles.stayPillText}>
                          {formatRange(checkInStr, checkOutStr)} ({nights}N)
                        </Text>
                      </View>
                      <View style={styles.stayPill}>
                        <Users size={11} color={colors.gold} />
                        <Text style={styles.stayPillText}>
                          {guests} {guests === 1 ? "Guest" : "Guests"} ({males}M, {females}F)
                        </Text>
                      </View>
                      {isFoodUnit && (veg > 0 || nonVeg > 0) ? (
                        <View style={styles.stayPill}>
                          <Text style={styles.stayPillText}>
                            🥗 {veg} Veg • 🍗 {nonVeg} Non-Veg
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {quote?.accommodationItems && quote.accommodationItems.length > 0 ? (
                      <View style={{ marginTop: 8, gap: 4 }}>
                        <Text style={styles.unitChipLabel}>Accommodations Reserved:</Text>
                        {quote.accommodationItems.map((item) => (
                          <View key={item.unitId} style={styles.unitChipRow}>
                            <Text style={styles.unitChipName}>
                              {item.unitName} ({item.unitQuantity} {item.unitQuantity === 1 ? "unit" : "units"}, {item.persons} {item.persons === 1 ? "guest" : "guests"})
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : selectedUnit ? (
                      <View style={styles.unitChipRow}>
                        <Text style={styles.unitChipLabel}>Stay Unit:</Text>
                        <Text style={styles.unitChipName}>{selectedUnit.name}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Price Breakdown Box */}
                <View style={styles.priceBox}>
                  {quoteLoading ? (
                    <View style={styles.quoteLoader}>
                      <ActivityIndicator size="small" color={colors.gold} />
                      <Text style={styles.quoteLoaderText}>Calculating verified quote...</Text>
                    </View>
                  ) : (
                    <>
                      {quote?.accommodationItems && quote.accommodationItems.length > 0 ? (
                        quote.accommodationItems.map((item) => (
                          <View key={item.unitId} style={styles.priceRow}>
                            <Text style={styles.priceLabel}>
                              {item.unitName} ({item.unitQuantity}u for {item.persons}p × {nights}n)
                            </Text>
                            <Text style={styles.priceVal}>₹{item.subtotal.toLocaleString("en-IN")}</Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>
                            Stay Fare ({nights} {nights === 1 ? "night" : "nights"})
                          </Text>
                          <Text style={styles.priceVal}>₹{total.toLocaleString("en-IN")}</Text>
                        </View>
                      )}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Sanitization & Taxes</Text>
                        <Text style={styles.priceValFree}>Included (₹0)</Text>
                      </View>
                      <View style={styles.priceDivider} />
                      <View style={styles.priceRow}>
                        <Text style={styles.priceTotalLabel}>Total Booking Value</Text>
                        <Text style={styles.priceTotalVal}>
                          ₹{total.toLocaleString("en-IN")}
                        </Text>
                      </View>

                      {/* Advance vs Due breakdown */}
                      <View style={styles.advanceContainer}>
                        <View style={styles.advanceRow}>
                          <View>
                            <Text style={styles.advanceTitle}>Advance Payable Now</Text>
                            <Text style={styles.advanceSub}>50% deposit to lock dates</Text>
                          </View>
                          <Text style={styles.advanceAmount}>
                            ₹{advanceAmount.toLocaleString("en-IN")}
                          </Text>
                        </View>
                        <View style={styles.dueRow}>
                          <Text style={styles.dueLabel}>Remaining Due at Check-in</Text>
                          <Text style={styles.dueAmount}>
                            ₹{dueAtCheckIn.toLocaleString("en-IN")}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Right Column: Guest Details Form & Actions */}
              <View style={isWide ? styles.wideColRight : styles.mobileColSection}>
                {/* Guest Details Form */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Primary Guest Details</Text>

                  <Field
                    Icon={User}
                    label="Full Name *"
                    value={name}
                    onChange={setName}
                    placeholder="Full name of primary guest"
                    error={errors.name}
                  />

                  <Field
                    Icon={Mail}
                    label="Email Address *"
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.com"
                    error={errors.email}
                    keyboardType="email-address"
                  />

                  <Field
                    Icon={Phone}
                    label="Mobile Number *"
                    value={phone}
                    onChange={setPhone}
                    placeholder="10-digit mobile number"
                    error={errors.phone}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Error alerts if any */}
                {quoteError ? (
                  <View accessibilityLiveRegion="polite" style={styles.errorBox}>
                    <Text style={styles.errorText}>{quoteError}</Text>
                  </View>
                ) : null}

                {submitError ? (
                  <View accessibilityLiveRegion="polite" style={styles.errorBox}>
                    <Text style={styles.errorText}>{submitError}</Text>
                  </View>
                ) : null}

                {/* Action CTA Button */}
                <View style={isWide ? styles.wideCtaWrap : styles.mobileCtaWrap}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={submitting || quoteLoading || !quote}
                    onPress={() => void submit()}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      (submitting || quoteLoading || !quote) && styles.btnDisabled,
                      pressed && styles.pressed,
                      Platform.select({
                        web: { cursor: "pointer", outlineStyle: "none" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.actionInk} />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>
                          Pay ₹{advanceAmount.toLocaleString("en-IN")} & Confirm
                        </Text>
                        <ArrowRight size={16} color={colors.actionInk} />
                      </>
                    )}
                  </Pressable>

                  {/* Security note & trust badges */}
                  <View style={styles.securityRow}>
                    <Lock size={11} color={colors.textMuted} />
                    <Text style={styles.securityText}>
                      256-Bit Encrypted • Free 48h Cancellation
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const formatRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getDate()} ${s.toLocaleString("en-IN", { month: "short" })} – ${e.getDate()} ${e.toLocaleString("en-IN", { month: "short" })}`;
};

function Field({
  Icon,
  label,
  value,
  onChange,
  placeholder,
  error,
  keyboardType,
}: {
  Icon: typeof User;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldInputRow, error ? styles.fieldInputError : null]}>
        <Icon size={15} color={colors.gold} />
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType ? "none" : "words"}
          style={styles.textInput}
        />
      </View>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollWrap: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    width: "100%",
  },
  popupCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(12, 16, 23, 0.98)",
    ...Platform.select({
      web: {
        boxShadow: "0 28px 72px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(224, 184, 74, 0.12)",
      } as any,
      default: {},
    }),
  },
  popupCardWide: {
    maxWidth: 780,
    padding: 26,
  },
  popupCardNarrow: {
    maxWidth: 480,
    padding: 20,
  },
  successCardWide: {
    maxWidth: 540,
    padding: 30,
  },
  successCardNarrow: {
    maxWidth: 440,
    padding: 22,
  },
  wideBodyGrid: {
    flexDirection: "row",
    gap: 24,
    alignItems: "stretch",
  },
  mobileBodyGrid: {
    gap: 14,
  },
  wideColLeft: {
    flex: 1,
    gap: 14,
    justifyContent: "space-between",
  },
  wideColRight: {
    flex: 1.15,
    gap: 12,
    justifyContent: "space-between",
  },
  mobileColSection: {
    gap: 12,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  popupTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
  },
  popupTitleWide: {
    fontSize: 25,
  },
  popupSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  propertyCard: {
    flexDirection: "row",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(18, 24, 34, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  propertyCardWide: {
    flexDirection: "row",
    gap: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(18, 24, 34, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  propertyImage: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  propertyImageWide: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  propertyMeta: {
    flex: 1,
    justifyContent: "center",
  },
  propertyName: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  stayPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  stayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  stayPillText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  unitChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  unitChipLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  unitChipName: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  formSection: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
    marginBottom: 2,
  },
  fieldWrap: {},
  fieldLabel: {
    marginBottom: 4,
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10.5,
  },
  fieldInputRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(8, 11, 16, 0.8)",
  },
  fieldInputError: {
    borderColor: colors.danger,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    outlineStyle: "none" as never,
  },
  fieldErrorText: {
    marginTop: 3,
    color: "#F87171",
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  priceBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(6, 9, 13, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 4,
  },
  quoteLoader: {
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  quoteLoaderText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  priceVal: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  priceValFree: {
    color: "#4ADE80",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  priceDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 4,
  },
  priceTotalLabel: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  priceTotalVal: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14.5,
  },
  advanceContainer: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    gap: 4,
  },
  advanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  advanceTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  advanceSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9,
  },
  advanceAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(224, 184, 74, 0.12)",
  },
  dueLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  dueAmount: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  errorBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  errorText: {
    color: "#F87171",
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  wideCtaWrap: {
    marginTop: "auto",
    paddingTop: 8,
  },
  mobileCtaWrap: {
    marginTop: 8,
  },
  primaryBtn: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.goldAction,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 20px rgba(224, 184, 74, 0.28)",
      } as any,
      default: {},
    }),
  },
  primaryBtnText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  securityText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(61, 255, 138, 0.4)",
    backgroundColor: "rgba(61, 255, 138, 0.1)",
    marginBottom: 12,
    alignSelf: "center",
  },
  successTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
    textAlign: "center",
  },
  successRefLabel: {
    marginTop: 12,
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 1,
    textAlign: "center",
  },
  successRefBox: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignSelf: "center",
  },
  successRefCode: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    letterSpacing: 1.2,
  },
  successCopy: {
    marginTop: 10,
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    lineHeight: 18,
  },
  successSummaryBox: {
    width: "100%",
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(5, 7, 9, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successRowLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  successRowVal: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  successRowValGold: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
