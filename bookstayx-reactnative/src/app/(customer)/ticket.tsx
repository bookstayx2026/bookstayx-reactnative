import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  FileText,
  Hash,
  MessageCircle,
  Phone,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UtensilsCrossed,
} from "lucide-react-native";
import { getProperty } from "@/data/discovery";
import { useIsDesktop, useIsMobile } from "@/hooks/use-window-class";
import { getBookingTicket, type BookingTicket } from "@/services/api";
import { colors, fontFamilies, layout } from "@/theme";
import { ticketIdForDisplay } from "@/utils/ticket-id";

const INK = "#082817";
const FOREST = "#075334";
const GREEN = "#007842";
const GOLD = "#F4D67E";
const AMBER = "#F8AE2B";
const PAPER = "#FFFCF5";
const MUTED = "#70695E";
const PENDING_STATUSES = [
  "PAYMENT_PENDING",
  "PAYMENT_SUCCESS",
  "PENDING_OWNER_CONFIRMATION",
  "BOOKING_REQUEST_SENT_TO_OWNER",
  "OWNER_CONFIRMED",
];

const money = (value?: string | number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const stayDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const paymentDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

export default function TicketScreen() {
  const params = useLocalSearchParams<{ booking_id?: string; token?: string; payment_result?: string }>();
  const missing = !params.booking_id && !params.token;
  const [ticket, setTicket] = useState<BookingTicket | null>(null);
  const [loading, setLoading] = useState(!missing);
  const [error, setError] = useState(missing ? "Booking reference is missing." : "");
  const desktop = useIsDesktop();
  const compact = useIsMobile();

  const load = useCallback(async () => {
    if (missing) return;
    try {
      setError("");
      setTicket(await getBookingTicket(params.booking_id, params.token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load this booking.");
    } finally {
      setLoading(false);
    }
  }, [missing, params.booking_id, params.token]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!ticket || !PENDING_STATUSES.includes(ticket.booking_status)) return;
    const timer = setTimeout(() => void load(), 5000);
    return () => clearTimeout(timer);
  }, [ticket, load]);

  const confirmed = ticket?.booking_status === "TICKET_GENERATED" || ticket?.booking_status === "CONFIRMED";
  const failed = Boolean(
    ticket?.booking_status?.includes("CANCEL") ||
    ticket?.booking_status === "PAYMENT_FAILED" ||
    ticket?.booking_status === "FRAUD_DETECTED" ||
    params.payment_result === "failed"
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroller}
        contentContainerStyle={[s.scrollContent, compact && s.scrollContentCompact, desktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {loading && !ticket ? (
          <Status icon={<ActivityIndicator color={GOLD} size="large" />} title="Loading booking status…" copy="We’re securely retrieving your booking details." />
        ) : error ? (
          <Status icon={<ReceiptText size={38} color={colors.danger} />} title="Ticket unavailable" copy={error} action="Try Again" onAction={() => { setLoading(true); void load(); }} />
        ) : ticket && confirmed ? (
          <ConfirmedTicket ticket={ticket} compact={compact} desktop={desktop} />
        ) : ticket ? (
          <Status
            icon={failed ? <ReceiptText size={38} color={colors.danger} /> : <Clock3 size={38} color={GOLD} />}
            title={failed ? "Booking cancelled" : "We’re confirming your stay"}
            copy={failed
              ? ticket.payment_failure_reason || "This booking could not be completed. Check My Bookings for the latest update."
              : ticket.booking_status === "OWNER_CONFIRMED"
                ? "The owner has confirmed your stay. Your e-ticket is being generated now."
                : "Payment was received. Your e-ticket will appear here after owner confirmation."}
            booking={ticket}
            action="My Bookings"
            onAction={() => router.replace("/bookings")}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConfirmedTicket({ ticket, compact, desktop }: { ticket: BookingTicket; compact: boolean; desktop: boolean }) {
  const due = Number(ticket.due_amount ?? Number(ticket.total_amount || 0) - Number(ticket.advance_amount || 0));
  const shortTicketId = ticketIdForDisplay(ticket.ticket_id, ticket.booking_id);
  const phone = ticket.owner_phone?.replace(/\D/g, "") || "918806092609";
  const localProperty = ticket.property_slug ? getProperty(ticket.property_slug) : undefined;
  const heroSource: ImageSource = ticket.property_image
    ? { uri: ticket.property_image }
    : localProperty?.image || require("../../../assets/images/discovery/villa1.jpg");

  const hasMeals =
    ticket.has_food !== false &&
    ((Number(ticket.veg_guest_count) > 0) || (Number(ticket.nonveg_guest_count) > 0));

  const share = () => {
    const accomLine =
      ticket.items && ticket.items.length > 0
        ? [
            `*Accommodations:* ${ticket.items
              .map(
                (it) =>
                  `${it.unit_name} (${it.unit_quantity} units, ${it.persons} guests)`
              )
              .join(", ")}`,
          ]
        : ticket.unit_name
        ? [`*Accommodation:* ${ticket.unit_name}`]
        : [];

    const mealLine = hasMeals
      ? [`*Meals:* ${ticket.veg_guest_count ?? ticket.persons ?? 1} Veg, ${ticket.nonveg_guest_count ?? 0} Non-Veg`]
      : [];

    const message = [
      "*BOOKSTAYX E-TICKET*",
      `*Ticket ID:* ${shortTicketId}`,
      `*Property:* ${ticket.property_name}`,
      `*Guest:* ${ticket.guest_name || "Guest"}`,
      ...accomLine,
      `*Final Booking Amount:* ${money(ticket.total_amount)}`,
      `*Check-in:* ${stayDate(ticket.checkin_datetime)} · ${ticket.check_in_time || "02:00 PM"}`,
      `*Check-out:* ${stayDate(ticket.checkout_datetime)} · ${ticket.check_out_time || "11:00 AM"}`,
      `*Guests:* ${ticket.male_guest_count ?? ticket.persons ?? 1} Male, ${ticket.female_guest_count ?? 0} Female`,
      ...mealLine,
      `*Paid:* ${money(ticket.advance_amount)}`,
      `*Due at site:* ${money(due)}`,
      `*Support:* ${phone}`,
    ].join("\n");
    void Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
  };

  return (
    <View style={[s.page, compact && s.pageCompact, desktop && s.pageDesktop]}>
      <View style={[s.hero, compact && s.heroCompact, desktop && s.heroDesktop]}>
        <Image source={heroSource} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(0,0,0,.58)", "rgba(0,0,0,.14)", "rgba(0,0,0,.83)"]}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.heroTop, compact && s.heroTopCompact]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to bookings" onPress={() => router.replace("/bookings")} style={({ pressed }) => [s.heroBack, pressed && s.pressed]}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>
          <View style={s.confirmedBadge}>
            <ShieldCheck size={20} color={GOLD} fill={GOLD} strokeWidth={1.7} />
            <Text style={s.confirmedText}>CONFIRMED</Text>
          </View>
        </View>
        <View style={[s.heroBottom, compact && s.heroBottomCompact]}>
          <Text style={[s.heroTitle, compact && s.heroTitleCompact, desktop && s.heroTitleDesktop]}>{ticket.property_name}</Text>
          <Text style={s.heroBrand}>BOOKSTAYX LUXURY STAYS</Text>
          <View style={[s.ticketIdPill, compact && s.ticketIdPillCompact]}>
            <Hash size={18} color={GOLD} strokeWidth={3} />
            <Text selectable style={[s.ticketIdText, compact && s.ticketIdTextCompact]}>TICKET ID: {shortTicketId}</Text>
          </View>
        </View>
      </View>

      <View style={s.paper}>
        <View style={[s.paperInner, compact && s.paperInnerCompact, desktop && s.paperInnerDesktop]}>
          <View style={[s.twoColumns, compact && s.compactColumns]}>
            <Identity compact={compact} icon={<UserRound size={20} color={INK} fill={INK} />} label="GUEST NAME" value={ticket.guest_name || "Guest"} />
            <View style={[s.verticalRule, compact && s.compactDivider]} />
            <Identity compact={compact} icon={<Phone size={20} color={INK} fill={INK} />} label="CONTACT NUMBER" value={ticket.guest_phone || "—"} />
          </View>
          <View style={[s.rule, compact && s.ruleCompact]}>
            <View style={[s.notch, s.notchLeft, desktop && s.notchLeftDesktop]} />
            <View style={[s.notch, s.notchRight, desktop && s.notchRightDesktop]} />
          </View>
          <View style={[s.twoColumns, compact && s.compactColumns]}>
            <StayDate compact={compact} label="CHECK-IN" date={stayDate(ticket.checkin_datetime)} time={ticket.check_in_time || "02:00 PM"} />
            <View style={[s.verticalRule, compact && s.compactDivider]} />
            <StayDate compact={compact} label="CHECK-OUT" date={stayDate(ticket.checkout_datetime)} time={ticket.check_out_time || "11:00 AM"} />
          </View>

          <View style={[s.rule, compact && s.ruleCompact]}>
            <View style={[s.notch, s.notchLeft, desktop && s.notchLeftDesktop]} />
            <View style={[s.notch, s.notchRight, desktop && s.notchRightDesktop]} />
          </View>

          <View style={[s.twoColumns, compact && s.compactColumns]}>
            <View style={[s.infoCell, compact && s.infoCellCompact]}>
              <View style={[s.infoIcon, compact && s.infoIconCompact, { backgroundColor: "#EBF3FE" }]}>
                <UserRound size={compact ? 16 : 20} color="#2563EB" />
              </View>
              <View style={s.infoCopy}>
                <Text style={[s.infoLabel, compact && s.infoLabelCompact]}>GUESTS BREAKDOWN</Text>
                <Text style={[s.infoValue, compact && s.infoValueCompact]}>
                  👨 {ticket.male_guest_count ?? ticket.persons ?? 1} Male &bull; 👩 {ticket.female_guest_count ?? 0} Female
                </Text>
              </View>
            </View>
            <View style={[s.verticalRule, compact && s.compactDivider]} />
            <View style={[s.infoCell, compact && s.infoCellCompact]}>
              <View style={[s.infoIcon, compact && s.infoIconCompact, { backgroundColor: hasMeals ? "#E8F5E9" : "#FFF7ED" }]}>
                {hasMeals ? (
                  <UtensilsCrossed size={compact ? 16 : 20} color="#16A34A" />
                ) : (
                  <ShieldCheck size={compact ? 16 : 20} color="#EA580C" />
                )}
              </View>
              <View style={s.infoCopy}>
                <Text style={[s.infoLabel, compact && s.infoLabelCompact]}>
                  {hasMeals ? "MEAL PREFERENCES" : "MEAL SERVICE"}
                </Text>
                <Text style={[s.infoValue, compact && s.infoValueCompact]}>
                  {hasMeals
                    ? `🥗 ${ticket.veg_guest_count ?? ticket.persons ?? 1} Veg • 🍗 ${ticket.nonveg_guest_count ?? 0} Non-Veg`
                    : "🚫 Room Only (No Meals Included)"}
                </Text>
              </View>
            </View>
          </View>

          {ticket.items && ticket.items.length > 0 ? (
            <>
              <View style={[s.rule, compact && s.ruleCompact]}>
                <View style={[s.notch, s.notchLeft, desktop && s.notchLeftDesktop]} />
                <View style={[s.notch, s.notchRight, desktop && s.notchRightDesktop]} />
              </View>
              <View style={[s.infoCell, compact && s.infoCellCompact, { width: "100%", paddingVertical: 4 }]}>
                <View style={[s.infoIcon, compact && s.infoIconCompact, { backgroundColor: "#FEF3C7" }]}>
                  <BedDouble size={compact ? 16 : 20} color="#D97706" />
                </View>
                <View style={[s.infoCopy, { flex: 1 }]}>
                  <Text style={[s.infoLabel, compact && s.infoLabelCompact]}>ACCOMMODATIONS BOOKED</Text>
                  {ticket.items.map((it, idx) => (
                    <Text key={idx} style={[s.infoValue, compact && s.infoValueCompact, { marginTop: idx > 0 ? 3 : 0 }]}>
                      • {it.unit_name}: {it.unit_quantity} {it.unit_quantity === 1 ? "unit" : "units"} for {it.persons} {it.persons === 1 ? "guest" : "guests"} (₹{Number(it.subtotal).toLocaleString("en-IN")})
                    </Text>
                  ))}
                </View>
              </View>
            </>
          ) : ticket.unit_name ? (
            <>
              <View style={[s.rule, compact && s.ruleCompact]}>
                <View style={[s.notch, s.notchLeft, desktop && s.notchLeftDesktop]} />
                <View style={[s.notch, s.notchRight, desktop && s.notchRightDesktop]} />
              </View>
              <View style={[s.infoCell, compact && s.infoCellCompact, { width: "100%", paddingVertical: 4 }]}>
                <View style={[s.infoIcon, compact && s.infoIconCompact, { backgroundColor: "#FEF3C7" }]}>
                  <BedDouble size={compact ? 16 : 20} color="#D97706" />
                </View>
                <View style={[s.infoCopy, { flex: 1 }]}>
                  <Text style={[s.infoLabel, compact && s.infoLabelCompact]}>ACCOMMODATION</Text>
                  <Text style={[s.infoValue, compact && s.infoValueCompact]}>
                    {ticket.unit_name} {ticket.unit_quantity ? `(${ticket.unit_quantity} units)` : ""}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          <View style={[s.financePanel, compact && s.financePanelCompact]}>
            <View style={[s.financeTotalRow, compact && s.financeTotalRowCompact]}>
              <View style={s.financeTotalLeft}>
                <ReceiptText size={compact ? 16 : 19} color={INK} />
                <Text style={[s.financeTotalLabel, compact && s.financeTotalLabelCompact]}>FINAL BOOKING AMOUNT</Text>
              </View>
              <Text style={[s.financeTotalAmount, compact && s.financeTotalAmountCompact]}>
                {money(ticket.total_amount)}
              </Text>
            </View>
            <View style={[s.financeDivider, compact && s.financeDividerCompact]} />
            <View style={[s.financeRow, compact && s.financeRowCompact]}>
              <View style={[s.financeTile, s.financePaid, compact && s.financeTileCompact]}>
                <View style={[s.moneyIconPaid, compact && s.moneyIconCompact]}><Check size={compact ? 18 : 24} color="#FFFFFF" strokeWidth={3} /></View>
                <View style={s.financeCopy}>
                  <Text style={[s.paidLabel, compact && s.financeLabelCompact]}>PAID</Text>
                  <Text style={[s.paidAmount, compact && s.compactAmount]}>{money(ticket.advance_amount)}</Text>
                </View>
              </View>
              <View style={[s.financeTile, s.financeDue, compact && s.financeTileCompact]}>
                <View style={[s.moneyIconDue, compact && s.moneyIconCompact]}><Coins size={compact ? 18 : 25} color="#A45B00" /></View>
                <View style={s.financeCopy}>
                  <Text style={[s.dueLabel, compact && s.financeLabelCompact]}>DUE AT SITE</Text>
                  <Text style={[s.dueAmount, compact && s.compactAmount]}>{money(due)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[s.support, compact && s.supportCompact]}>
            <View style={s.supportHeading}><View style={s.supportLine} /><Text style={s.supportLabel}>OFFICIAL SUPPORT</Text><View style={s.supportLine} /></View>
            <Text style={[s.supportBrand, compact && s.supportBrandCompact]}>BookStayX</Text>
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`tel:${phone}`)} style={({ pressed }) => [s.supportPhone, compact && s.supportPhoneCompact, pressed && s.pressed]}>
              <Phone size={20} color={FOREST} />
              <Text style={[s.supportPhoneText, compact && s.supportPhoneTextCompact]}>{phone}</Text>
            </Pressable>
          </View>

          <View style={[s.secureStrip, compact && s.secureStripCompact]}>
            <ShieldCheck size={22} color={FOREST} fill="#D5E9D4" />
            <Text style={s.secureText}>SECURE PAYMENT</Text>
            <ChevronRight size={21} color={INK} />
          </View>
          <View style={[s.dashedRule, compact && s.dashedRuleCompact]}>
            <View style={[s.notch, s.notchLeft, desktop && s.notchLeftDesktop]} />
            <View style={[s.notch, s.notchRight, desktop && s.notchRightDesktop]} />
          </View>

          <PaymentRecord compact={compact} icon={<FileText size={19} color="#5A5447" />} label="ORDER ID" value={ticket.order_id || ticket.booking_id} />
          <PaymentRecord compact={compact} icon={<ShieldCheck size={19} color="#5A5447" />} label="TRANSACTION ID" value={ticket.transaction_id || "—"} />
          <View style={[s.paymentFooter, compact && s.paymentFooterCompact]}>
            <View style={[s.footerDatum, compact && s.footerDatumCompact]}>
              <View style={[s.recordIcon, compact && s.recordIconCompact]}><CheckCircle2 size={18} color={GREEN} fill="#DCF0DD" /></View>
              <View style={s.recordCopy}><Text style={s.recordLabel}>STATUS</Text><Text style={s.statusPaid}>PAID</Text></View>
            </View>
            <View style={[s.verticalRule, compact && s.compactDivider]} />
            <View style={[s.footerDatum, compact && s.footerDatumCompact]}>
              <View style={[s.recordIcon, compact && s.recordIconCompact]}><Clock3 size={18} color="#5A5447" /></View>
              <View style={s.recordCopy}><Text style={s.recordLabel}>PAYMENT DATE</Text><Text style={[s.recordValue, compact && s.recordValueCompact]}>{paymentDate(ticket.created_at)}</Text></View>
            </View>
          </View>
        </View>
      </View>

      <View style={[s.actions, compact && s.actionsCompact]}>
        <Pressable accessibilityRole="button" onPress={share} style={({ pressed }) => [s.whatsApp, compact && s.actionCompact, pressed && s.pressed]}>
          <LinearGradient colors={["#0EAC69", "#005F39"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.actionFill, compact && s.actionFillCompact]}>
            <MessageCircle size={21} color="#FFFFFF" />
            <Text style={[s.whatsAppText, compact && s.actionTextCompact]}>WhatsApp</Text>
            {!compact && <ChevronRight size={20} color="#FFFFFF" />}
          </LinearGradient>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/bookings")} style={({ pressed }) => [s.goBack, compact && s.actionCompact, pressed && s.pressed]}>
          <LinearGradient colors={["#FFD47C", "#F1A629"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.actionFill, compact && s.actionFillCompact]}>
            <ArrowLeft size={21} color="#0C130E" />
            <Text style={[s.goBackText, compact && s.actionTextCompact]}>Go Back</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function Identity({ icon, label, value, compact }: { icon: React.ReactNode; label: string; value: string; compact: boolean }) {
  return <View style={[s.infoCell, compact && s.infoCellCompact]}><View style={[s.infoIcon, compact && s.infoIconCompact]}>{icon}</View><View style={s.infoCopy}><Text style={[s.infoLabel, compact && s.infoLabelCompact]}>{label}</Text><Text style={[s.infoValue, compact && s.infoValueCompact]}>{value}</Text></View></View>;
}

function StayDate({ label, date, time, compact }: { label: string; date: string; time: string; compact: boolean }) {
  return <View style={[s.infoCell, compact && s.infoCellCompact]}><View style={[s.dateIcon, compact && s.dateIconCompact]}><CalendarDays size={compact ? 17 : 21} color="#D67A00" /></View><View style={s.infoCopy}><Text style={[s.infoLabel, compact && s.infoLabelCompact]}>{label}</Text><Text style={[s.dateValue, compact && s.dateValueCompact]}>{date}</Text><Text style={[s.timeValue, compact && s.timeValueCompact]}>{time}</Text></View></View>;
}

function PaymentRecord({ icon, label, value, compact }: { icon: React.ReactNode; label: string; value: string; compact: boolean }) {
  return <View style={[s.paymentRecord, compact && s.paymentRecordCompact]}><View style={[s.recordIcon, compact && s.recordIconCompact]}>{icon}</View><View style={s.recordCopy}><Text style={s.recordLabel}>{label}</Text><Text selectable style={[s.recordValue, compact && s.recordValueCompact, Platform.OS === "web" && ({ overflowWrap: "anywhere" } as unknown as TextStyle)]}>{value}</Text></View></View>;
}

function Status({ icon, title, copy, booking, action, onAction }: { icon: React.ReactNode; title: string; copy: string; booking?: BookingTicket; action?: string; onAction?: () => void }) {
  return <View style={s.statusCard}>
    <View style={s.statusIcon}>{icon}</View>
    <Text style={s.statusTitle}>{title}</Text>
    <Text style={s.statusCopy}>{copy}</Text>
    {booking ? <View style={s.statusDetails}>
      <StatusDetail label="Booking ID" value={booking.booking_id} />
      <StatusDetail label="Property" value={booking.property_name} />
      <StatusDetail label="Advance Paid" value={money(booking.advance_amount)} />
    </View> : null}
    {action && onAction ? <Pressable onPress={onAction} style={({ pressed }) => [s.statusAction, pressed && s.pressed]}><RefreshCw size={16} color={INK} /><Text style={s.statusActionText}>{action}</Text></Pressable> : null}
    {action !== "My Bookings" ? <Pressable accessibilityRole="button" onPress={() => router.replace("/bookings")} style={({ pressed }) => [s.statusBack, pressed && s.pressed]}><Text style={s.statusBackText}>Back to Bookings</Text></Pressable> : null}
  </View>;
}

function StatusDetail({ label, value }: { label: string; value: string }) {
  return <View style={s.statusDetailRow}><Text style={s.statusDetailLabel}>{label}</Text><Text style={s.statusDetailValue}>{value}</Text></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, minHeight: 0, backgroundColor: "#090C0B" },
  scroller: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: 88, paddingBottom: 120 },
  scrollContentCompact: { paddingTop: 12, paddingBottom: 30 },
  scrollContentDesktop: { paddingTop: 112, paddingBottom: 54 },
  page: { width: "100%", maxWidth: 690, paddingHorizontal: 12 },
  pageCompact: { paddingHorizontal: 8 },
  pageDesktop: { paddingHorizontal: 0 },
  hero: { height: 265, overflow: "hidden", borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: INK },
  heroCompact: { height: 225 },
  heroDesktop: { height: 310 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  heroTopCompact: { padding: 12 },
  heroBack: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,.65)", backgroundColor: "rgba(0,0,0,.42)" },
  confirmedBadge: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 15, borderRadius: 23, borderWidth: 1, borderColor: GOLD, backgroundColor: "rgba(6,42,23,.88)" },
  confirmedText: { color: "#FFFFFF", fontFamily: fontFamilies.sansBold, fontSize: 12, letterSpacing: 2.5 },
  heroBottom: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingBottom: 34 },
  heroBottomCompact: { paddingHorizontal: 18, paddingBottom: 24 },
  heroTitle: { color: PAPER, fontFamily: fontFamilies.displayBold, fontSize: 35, lineHeight: 39, textShadowColor: "rgba(0,0,0,.55)", textShadowRadius: 8 },
  heroTitleCompact: { fontSize: 28, lineHeight: 31 },
  heroTitleDesktop: { fontSize: 46, lineHeight: 51 },
  heroBrand: { marginTop: 4, color: GOLD, fontFamily: fontFamilies.sansBold, fontSize: 11, letterSpacing: 3.2 },
  ticketIdPill: { alignSelf: "flex-start", maxWidth: "100%", minHeight: 42, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingHorizontal: 15, paddingVertical: 7, borderRadius: 25, borderWidth: 1.5, borderColor: GOLD, backgroundColor: "rgba(8,16,11,.88)" },
  ticketIdPillCompact: { minHeight: 36, marginTop: 10, paddingHorizontal: 12, paddingVertical: 5 },
  ticketIdText: { flexShrink: 1, color: GOLD, fontFamily: fontFamilies.sansBold, fontSize: 14, lineHeight: 19, letterSpacing: 1.1 },
  ticketIdTextCompact: { fontSize: 12, lineHeight: 17 },
  paper: { marginTop: -18, borderRadius: 25, borderWidth: 1, borderColor: "#E8D6A8", backgroundColor: PAPER, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  paperInner: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 26 },
  paperInnerCompact: { paddingHorizontal: 18, paddingTop: 19, paddingBottom: 20 },
  paperInnerDesktop: { paddingHorizontal: 34, paddingTop: 32, paddingBottom: 30 },
  twoColumns: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  compactColumns: { flexDirection: "row", gap: 7 },
  verticalRule: { width: 1, backgroundColor: "#D7D1C3" },
  compactDivider: { width: 1, height: "auto" },
  infoCell: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9 },
  infoCellCompact: { flex: 1, width: "auto", minHeight: 55, gap: 6 },
  infoIcon: { width: 38, height: 38, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#E8F1E6" },
  infoIconCompact: { width: 28, height: 28, borderRadius: 14 },
  dateIcon: { width: 38, height: 38, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#FFF3D9" },
  dateIconCompact: { width: 28, height: 28, borderRadius: 9 },
  infoCopy: { flex: 1, minWidth: 0 },
  infoLabel: { color: MUTED, fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1.3 },
  infoLabelCompact: { fontSize: 9, letterSpacing: 0.3 },
  infoValue: { marginTop: 4, color: INK, fontFamily: fontFamilies.sansBold, fontSize: 15, lineHeight: 20 },
  infoValueCompact: { marginTop: 3, fontSize: 13, lineHeight: 16 },
  dateValue: { marginTop: 4, color: INK, fontFamily: fontFamilies.sansBold, fontSize: 17, lineHeight: 21 },
  dateValueCompact: { marginTop: 3, fontSize: 13, lineHeight: 16 },
  timeValue: { marginTop: 2, color: MUTED, fontFamily: fontFamilies.sansSemiBold, fontSize: 13 },
  timeValueCompact: { fontSize: 11 },
  rule: { height: 1, marginVertical: 22, backgroundColor: "#D7D1C3" },
  ruleCompact: { marginVertical: 14 },
  notch: { width: 24, height: 24, position: "absolute", top: -12, borderRadius: 12, backgroundColor: "#090C0B" },
  notchLeft: { left: -30 },
  notchRight: { right: -30 },
  notchLeftDesktop: { left: -46 },
  notchRightDesktop: { right: -46 },
  financePanel: { marginTop: 26, padding: 9, borderRadius: 20, borderWidth: 1, borderColor: "#E1D2AA", backgroundColor: "#FFFAEF" },
  financePanelCompact: { marginTop: 17, padding: 6, borderRadius: 15 },
  financeTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  financeTotalRowCompact: {
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 4,
  },
  financeTotalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  financeTotalLabel: {
    color: INK,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  financeTotalLabelCompact: {
    fontSize: 10,
    letterSpacing: 0.7,
  },
  financeTotalAmount: {
    color: INK,
    fontFamily: fontFamilies.sansBold,
    fontSize: 22,
    lineHeight: 26,
  },
  financeTotalAmountCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  financeDivider: {
    height: 1,
    backgroundColor: "#E2D3AB",
    marginHorizontal: 4,
    marginBottom: 8,
  },
  financeDividerCompact: {
    marginBottom: 6,
  },
  financeRow: { flexDirection: "row", gap: 8 },
  financeRowCompact: { flexDirection: "row", gap: 6 },
  financeTile: { flex: 1, minWidth: 0, minHeight: 100, flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 17 },
  financeTileCompact: { flex: 1, width: "auto", minHeight: 74, gap: 5, padding: 7, borderRadius: 12 },
  financePaid: { backgroundColor: "#EFF7ED" },
  financeDue: { backgroundColor: "#FFF3DB" },
  moneyIconPaid: { width: 35, height: 35, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: GREEN },
  moneyIconDue: { width: 35, height: 35, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#FFE6B2" },
  moneyIconCompact: { width: 26, height: 26, borderRadius: 13 },
  financeCopy: { flex: 1, minWidth: 0 },
  paidLabel: { color: GREEN, fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1.7 },
  paidAmount: { marginTop: 5, color: GREEN, fontFamily: fontFamilies.sansBold, fontSize: 19, lineHeight: 24 },
  dueLabel: { color: "#A45B00", fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1.4 },
  financeLabelCompact: { fontSize: 9, letterSpacing: 0.3 },
  dueAmount: { marginTop: 5, color: "#A45B00", fontFamily: fontFamilies.sansBold, fontSize: 19, lineHeight: 24 },
  compactAmount: { marginTop: 3, fontSize: 18, lineHeight: 22 },
  support: { alignItems: "center", marginTop: 27 },
  supportCompact: { marginTop: 17 },
  supportHeading: { width: "100%", flexDirection: "row", alignItems: "center", gap: 14 },
  supportLine: { flex: 1, height: 1, backgroundColor: "#D7D1C3" },
  supportLabel: { color: MUTED, fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 2.3 },
  supportBrand: { marginTop: 7, color: INK, fontFamily: fontFamilies.displayBold, fontSize: 28 },
  supportBrandCompact: { marginTop: 4, fontSize: 24 },
  supportPhone: { minHeight: 44, minWidth: 230, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 7, paddingHorizontal: 20, borderRadius: 24, backgroundColor: "#E7F2E4" },
  supportPhoneCompact: { minHeight: 39, marginTop: 4 },
  supportPhoneText: { color: INK, fontFamily: fontFamilies.sansBold, fontSize: 21 },
  supportPhoneTextCompact: { fontSize: 18 },
  secureStrip: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 13, marginTop: 24, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: "#BDD9B7", backgroundColor: "#EAF4E8" },
  secureStripCompact: { minHeight: 44, marginTop: 17 },
  secureText: { flex: 1, color: INK, fontFamily: fontFamilies.sansBold, fontSize: 11, letterSpacing: 2.1, textAlign: "center" },
  dashedRule: { marginTop: 23, marginBottom: 21, borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#D8D1C3" },
  dashedRuleCompact: { marginTop: 17, marginBottom: 15 },
  paymentRecord: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 19 },
  paymentRecordCompact: { gap: 9, marginBottom: 13 },
  recordIcon: { width: 36, height: 36, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#F5F0E5" },
  recordIconCompact: { width: 28, height: 28, borderRadius: 9 },
  recordCopy: { flex: 1, minWidth: 0 },
  recordLabel: { color: MUTED, fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1.1 },
  recordValue: { marginTop: 4, color: "#202420", fontFamily: fontFamilies.sansMedium, fontSize: 12, lineHeight: 18 },
  recordValueCompact: { fontSize: 10.5, lineHeight: 15 },
  paymentFooter: { flexDirection: "row", gap: 12, marginTop: 2 },
  paymentFooterCompact: { flexDirection: "row", gap: 7 },
  footerDatum: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  footerDatumCompact: { flex: 1, width: "auto", gap: 5 },
  statusPaid: { marginTop: 3, color: GREEN, fontFamily: fontFamilies.sansBold, fontSize: 16 },
  actions: { flexDirection: "row", gap: 10, marginTop: 17 },
  actionsCompact: { flexDirection: "row", gap: 8 },
  actionCompact: { flex: 1, width: "auto", minHeight: 50 },
  whatsApp: { flex: 1, minHeight: 57, overflow: "hidden", borderRadius: 17, borderWidth: 1, borderColor: "#36CD7E", backgroundColor: "#007C4D" },
  whatsAppText: { color: "#FFFFFF", fontFamily: fontFamilies.sansBold, fontSize: 16 },
  goBack: { flex: 1, minHeight: 57, overflow: "hidden", borderRadius: 17, borderWidth: 1, borderColor: "#FFD268", backgroundColor: AMBER },
  actionFill: { flex: 1, minHeight: 55, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 8 },
  actionFillCompact: { minHeight: 48, gap: 6 },
  goBackText: { color: "#0C130E", fontFamily: fontFamilies.sansBold, fontSize: 16 },
  actionTextCompact: { fontSize: 14 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.975 }] },
  statusCard: { width: "100%", maxWidth: layout.sourceMaxWidth, minHeight: 430, alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surfaceRaised },
  statusIcon: { width: 76, height: 76, alignItems: "center", justifyContent: "center", borderRadius: 38, backgroundColor: "rgba(224,184,74,.08)" },
  statusTitle: { marginTop: 18, color: colors.text, fontFamily: fontFamilies.displaySemiBold, fontSize: 29, textAlign: "center" },
  statusCopy: { maxWidth: 390, marginTop: 8, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 20, textAlign: "center" },
  statusDetails: { width: "100%", marginTop: 20, padding: 15, gap: 11, borderRadius: 13, backgroundColor: colors.surface },
  statusDetailRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  statusDetailLabel: { color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 12 },
  statusDetailValue: { flex: 1, color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 12, textAlign: "right" },
  statusAction: { minWidth: 180, minHeight: 50, marginTop: 22, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, backgroundColor: colors.goldAction },
  statusActionText: { color: colors.actionInk, fontFamily: fontFamilies.sansBold, fontSize: 13 },
  statusBack: { minHeight: 44, marginTop: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  statusBackText: { color: colors.textSecondary, fontFamily: fontFamilies.sansSemiBold, fontSize: 13 },
});
