import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, Mail, Phone, User, Users } from "lucide-react-native";
import { getProperty } from "@/data/discovery";
import { useCustomerData } from "@/components/customer";
import { initiateBooking } from "@/services/api";
import { colors, fontFamilies, layout } from "@/theme";

export default function BookingReview() {
  const params = useLocalSearchParams<{ id?: string; guests?: string; nights?: string; checkIn?: string; checkOut?: string; referralCode?: string }>();
  const property = getProperty(params.id || "") || getProperty("pawna-lakeview-villa")!;
  const guests = Math.max(1, Number(params.guests) || 1);
  const nights = Math.max(1, Number(params.nights) || 1);
  const total = property.priceAmount * nights;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { confirmBooking } = useCustomerData();

  const submit = async () => {
    const next: Record<string, string> = {};
    const cleanPhone = phone.replace(/\D/g, "");
    if (name.trim().length < 2) next.name = "Enter the guest's full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(cleanPhone)) next.phone = "Enter a 10-digit mobile number.";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const checkIn = params.checkIn || new Date().toISOString();
      const checkOut = params.checkOut || new Date(Date.now() + nights * 86_400_000).toISOString();
      const remote = await initiateBooking({
        propertyId: property.id,
        propertyName: property.name,
        propertyType: property.category === "villas" ? "VILLA" : "CAMPING",
        guestName: name.trim(),
        guestPhone: cleanPhone,
        checkIn,
        checkOut,
        advanceAmount: Math.round(total * 0.5),
        totalAmount: total,
        persons: guests,
        maxCapacity: property.category === "villas" ? 8 : guests,
        referralCode: params.referralCode,
      });
      confirmBooking({ property, guests, nights, dateRange: formatRange(checkIn, checkOut), total, bookingCode: remote.booking_id, status: "pending" });
      setConfirmed(remote.booking_id);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit this booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) return <SafeAreaView style={styles.safe}><View style={styles.success}><View style={styles.successIcon}><CheckCircle2 size={39} color={colors.success} /></View><Text style={styles.successTitle}>Booking request created</Text><Text style={styles.successCopy}>Your BookStayX booking reference is {confirmed}. It is saved as pending while payment integration is completed.</Text><Pressable onPress={() => router.replace("/bookings")} style={styles.primary}><Text style={styles.primaryText}>View My Bookings</Text><ArrowRight size={16} color={colors.actionInk} /></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"><View style={styles.page}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={22} color="white" /></Pressable><View><Text style={styles.heading}>Review booking</Text><Text style={styles.subheading}>Confirm your stay and guest details.</Text></View></View>
    <View style={styles.property}><Image source={property.image} contentFit="cover" style={styles.image} /><View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={styles.propertyName}>{property.name}</Text><Text numberOfLines={1} style={styles.meta}>{property.locationLabel}</Text><View style={styles.facts}><Fact Icon={CalendarDays} text={`${nights} ${nights === 1 ? "night" : "nights"}`} /><Fact Icon={Users} text={`${guests} ${guests === 1 ? "guest" : "guests"}`} /></View></View></View>
    <Text style={styles.sectionTitle}>Guest details</Text><Field Icon={User} label="Full name" value={name} onChange={setName} placeholder="Primary guest name" error={errors.name} /><Field Icon={Mail} label="Email address" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} keyboardType="email-address" /><Field Icon={Phone} label="Mobile number" value={phone} onChange={setPhone} placeholder="10-digit mobile number" error={errors.phone} keyboardType="phone-pad" />
    <View style={styles.priceBox}><Row label={`Stay total (${nights} ${nights === 1 ? "night" : "nights"})`} value={`₹${total.toLocaleString("en-IN")}`} /><Row label="Advance payable" value={`₹${Math.round(total * 0.5).toLocaleString("en-IN")}`} /><View style={styles.divider} /><Row label="Total booking value" value={`₹${total.toLocaleString("en-IN")}`} strong /></View>
    {submitError ? <View accessibilityLiveRegion="polite" style={styles.errorBox}><Text style={styles.error}>{submitError}</Text></View> : null}
    <Text style={styles.disclaimer}>Submitting creates a live booking request and temporarily reserves the selected dates while payment is completed.</Text>
    <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={[styles.primary, submitting && styles.disabled]}>{submitting ? <ActivityIndicator color={colors.actionInk} /> : <><Text style={styles.primaryText}>Continue to Payment</Text><ArrowRight size={16} color={colors.actionInk} /></>}</Pressable>
  </View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const formatRange = (start: string, end: string) => `${new Date(start).toLocaleDateString("en-IN")} – ${new Date(end).toLocaleDateString("en-IN")}`;
function Fact({ Icon, text }: { Icon: typeof CalendarDays; text: string }) { return <View style={styles.inline}><Icon size={13} color={colors.gold} /><Text style={styles.fact}>{text}</Text></View>; }
function Field({ Icon, label, value, onChange, placeholder, error, keyboardType }: { Icon: typeof User; label: string; value: string; onChange: (value: string) => void; placeholder: string; error?: string; keyboardType?: "email-address" | "phone-pad" }) { return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><View style={[styles.field, error && styles.fieldError]}><Icon size={17} color={colors.textMuted} /><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} keyboardType={keyboardType} autoCapitalize={keyboardType ? "none" : "words"} style={styles.input} /></View>{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <View style={styles.row}><Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text><Text style={[styles.rowValue, strong && styles.total]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, scroll: { alignItems: "center", paddingBottom: 30 }, page: { width: "100%", maxWidth: layout.sourceMaxWidth, padding: 16 },
  header: { paddingTop: 8, flexDirection: "row", alignItems: "center", gap: 13 }, back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", backgroundColor: colors.surfaceRaised }, heading: { color: colors.text, fontFamily: fontFamilies.displaySemiBold, fontSize: 27 }, subheading: { marginTop: 2, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 11.5 },
  property: { marginTop: 22, flexDirection: "row", gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.surfaceStrong }, image: { width: 98, height: 88, borderRadius: 12 }, propertyName: { color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 14 }, meta: { marginTop: 5, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 10.5 }, facts: { marginTop: 12, flexDirection: "row", gap: 12 }, inline: { flexDirection: "row", alignItems: "center", gap: 5 }, fact: { color: colors.textSecondary, fontFamily: fontFamilies.sansMedium, fontSize: 10.5 },
  sectionTitle: { marginTop: 26, marginBottom: 13, color: colors.text, fontFamily: fontFamilies.displaySemiBold, fontSize: 22 }, fieldWrap: { marginBottom: 14 }, label: { marginBottom: 6, color: colors.textSecondary, fontFamily: fontFamilies.sansMedium, fontSize: 11.5 }, field: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,.12)", backgroundColor: colors.surfaceRaised }, fieldError: { borderColor: colors.danger }, input: { flex: 1, color: colors.text, fontFamily: fontFamilies.sans, fontSize: 16, outlineStyle: "none" as never }, error: { color: "#F87171", fontFamily: fontFamilies.sans, fontSize: 10.5 }, errorBox: { marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,.4)", backgroundColor: "rgba(239,68,68,.08)" },
  priceBox: { marginTop: 12, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surfaceStrong }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 5 }, rowLabel: { color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 11.5 }, rowValue: { color: colors.textSecondary, fontFamily: fontFamilies.sansSemiBold, fontSize: 11.5 }, strong: { color: colors.text, fontFamily: fontFamilies.sansSemiBold }, total: { color: colors.gold, fontSize: 17 }, divider: { height: 1, marginVertical: 8, backgroundColor: "rgba(255,255,255,.08)" }, disclaimer: { marginTop: 12, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 10.5, lineHeight: 16 },
  primary: { marginTop: 18, minHeight: 50, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, backgroundColor: colors.goldAction }, primaryText: { color: colors.actionInk, fontFamily: fontFamilies.sansSemiBold, fontSize: 13.5 }, disabled: { opacity: 0.65 },
  success: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }, successIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(61,255,138,.35)", backgroundColor: "rgba(61,255,138,.08)" }, successTitle: { marginTop: 20, color: colors.text, fontFamily: fontFamilies.displaySemiBold, fontSize: 29 }, successCopy: { maxWidth: 330, marginTop: 9, textAlign: "center", color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 12.5, lineHeight: 20 },
});
