import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  AirVent,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleParking,
  CookingPot,
  Droplets,
  Flame,
  Heart,
  MapPin,
  Minus,
  Plus,
  Refrigerator,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  Tv,
  Users,
  Waves,
  Wifi,
  Zap,
} from "lucide-react-native";
import { getProperty, images } from "@/data/discovery";
import { loadPropertyCalendar, loadPublicProperty, type CalendarDay } from "@/services/api";
import { useWindowClass } from "@/hooks/use-window-class";
import { colors, fontFamilies, layout } from "@/theme";

const amenities = [
  { label: "Wi-Fi", Icon: Wifi },
  { label: "AC", Icon: AirVent },
  { label: "Kitchen", Icon: CookingPot },
  { label: "TV", Icon: Tv },
  { label: "Refrigerator", Icon: Refrigerator },
  { label: "Parking", Icon: CircleParking },
  { label: "Power Backup", Icon: Zap },
];
const features = [
  { label: "Sea View", Icon: Waves },
  { label: "Private Pool", Icon: Droplets },
  { label: "Beach Access", Icon: Trees },
  { label: "Lawn", Icon: Trees },
];
const activities = [
  { title: "Bonfire Nights", image: images.valley },
  { title: "Kayaking", image: images.lake },
  { title: "Beach Walks", image: images.beach2 },
  { title: "Cycling", image: images.hills },
];
const trust = [
  { label: "Best Price Guarantee", Icon: Sparkles },
  { label: "Secure Booking", Icon: ShieldCheck },
  { label: "Instant Confirmation", Icon: CheckCircle2 },
  { label: "24/7 Guest Support", Icon: Users },
];
type Tab = "descriptions" | "amenities" | "activities" | "schedule";
const addDays = (date: Date, n: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
};
const dateLabel = (date: Date) =>
  `${date.getDate()} ${date.toLocaleString("en-IN", { month: "short" })} '${String(date.getFullYear()).slice(-2)}`;

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bundledProperty = getProperty(id) || getProperty("pawna-lakeview-villa")!;
  const [remoteProperty, setRemoteProperty] = useState<typeof bundledProperty | null>(null);
  const [availability, setAvailability] = useState<CalendarDay[]>([]);
  const property = remoteProperty || bundledProperty;
  const windowClass = useWindowClass();
  const wide = windowClass !== "compact";
  const [saved, setSaved] = useState(false);
  const [guests, setGuests] = useState(1);
  const [checkIn, setCheckIn] = useState(() => addDays(new Date(), 2));
  const [checkOut, setCheckOut] = useState(() => addDays(new Date(), 3));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("descriptions");
  const [openPolicy, setOpenPolicy] = useState<string | null | undefined>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([loadPublicProperty(id), loadPropertyCalendar(id).catch(() => [])]).then(([nextProperty, nextAvailability]) => {
      if (!active) return;
      setRemoteProperty(nextProperty);
      setAvailability(nextAvailability);
    });
    return () => { active = false; };
  }, [id]);
  const maxGuests =
    property.category === "villas" ? 8 : property.category === "hotel" ? 2 : 4;
  const bedrooms = Number(
    property.meta.join(" ").match(/(\d+) Bedrooms?/i)?.[1] ||
      (property.category === "villas" ? 2 : 1),
  );
  const nights = Math.max(
    1,
    Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000),
  );
  const total = property.priceAmount * nights;
  const about =
    property.id === "seaside-serenity-villa"
      ? "Wake up to the sound of waves at this exclusive beachfront villa in Alibagh. Featuring a private infinity pool, lush lawns, and direct beach access — perfect for families and groups seeking a serene coastal escape."
      : `Experience ${property.name} in ${property.locationLabel}. A handpicked BookStayX stay with premium comforts, thoughtful hospitality, and unforgettable views — ideal for your next Konkan getaway.`;
  const startBooking = () =>
    router.push({
      pathname: "/booking-review",
      params: {
        id: property.id,
        guests: String(guests),
        nights: String(nights),
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
      },
    });
  const booking = (
    <BookingCard
      property={property}
      guests={guests}
      maxGuests={maxGuests}
      checkIn={checkIn}
      checkOut={checkOut}
      onGuests={setGuests}
      onCalendar={() => setCalendarOpen(true)}
      onBook={startBooking}
    />
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={[styles.page, wide && styles.pageWide]}>
          <View style={wide && styles.wideTop}>
            <Hero
              property={property}
              saved={saved}
              onSaved={() => setSaved(!saved)}
              maxGuests={maxGuests}
              bedrooms={bedrooms}
            />
            {wide ? <View style={styles.wideBooking}>{booking}</View> : null}
          </View>
          {wide ? null : <View style={styles.bookingWrap}>{booking}</View>}
          <View style={styles.tabs}>
            {(
              [
                ["descriptions", "Descriptions", Sparkles],
                ["amenities", "Amenities", Wifi],
                ["activities", "Activities", Flame],
                ["schedule", "Property Schedule", CalendarDays],
              ] as const
            ).map(([key, label, Icon]) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, tab === key && styles.tabActive]}
              >
                <Icon
                  size={14}
                  color={tab === key ? colors.gold : colors.textMuted}
                />
                <Text
                  style={[styles.tabText, tab === key && styles.tabTextActive]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.content}>
            <TabContent tab={tab} about={about} />
            <View style={styles.policies}>
              {[
                [
                  "love",
                  "What you'll love",
                  "Private spaces with premium interiors and curated comforts. Scenic views, peaceful surroundings, thoughtful hospitality, and space for families or small groups.",
                ],
                [
                  "rules",
                  "Rules & Policies",
                  "Check-in from 2:00 PM. Check-out by 11:00 AM. Guests must carry a valid government ID. Quiet hours are 10:00 PM – 7:00 AM.",
                ],
                [
                  "cancel",
                  "Cancellation & Refund Policies",
                  "Free cancellation up to 48 hours before check-in. Eligible refunds are processed within 5–7 business days.",
                ],
              ].map(([key, title, copy]) => (
                <Pressable
                  key={key}
                  onPress={() => setOpenPolicy(openPolicy === key ? null : key)}
                  style={styles.policy}
                >
                  <View style={styles.policyHead}>
                    <Text style={styles.policyTitle}>{title}</Text>
                    <ChevronDown
                      size={17}
                      color={
                        openPolicy === key ? colors.gold : colors.textMuted
                      }
                    />
                  </View>
                  {openPolicy === key ? (
                    <Text style={styles.policyCopy}>{copy}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, wide && styles.footerWide]}>
        <View>
          <Text style={styles.footerLabel}>Total Price</Text>
          <Text style={styles.footerPrice}>
            ₹{total.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.footerMeta}>
            {nights} {nights === 1 ? "Night" : "Nights"} • {guests}{" "}
            {guests === 1 ? "Guest" : "Guests"}
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={startBooking} style={styles.continue}>
          <Text style={styles.continueText}>Continue Booking</Text>
          <ArrowRight size={15} color={colors.actionInk} />
        </Pressable>
      </View>
      <CalendarSheet
        visible={calendarOpen}
        availability={availability}
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setCalendarOpen(false)}
        onApply={(a, b) => {
          setCheckIn(a);
          setCheckOut(b);
          setCalendarOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function Hero({
  property,
  saved,
  onSaved,
  maxGuests,
  bedrooms,
}: {
  property: ReturnType<typeof getProperty> extends infer T
    ? Exclude<T, undefined>
    : never;
  saved: boolean;
  onSaved: () => void;
  maxGuests: number;
  bedrooms: number;
}) {
  return (
    <View style={styles.hero}>
      <Image
        source={property.image}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(0,0,0,.58)", "transparent", "rgba(5,7,9,.98)"]}
        locations={[0, 0.36, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroActions}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.circle}
        >
          <ChevronLeft size={22} color="white" />
        </Pressable>
        <View style={styles.actionRow}>
          <Pressable
            accessibilityLabel={saved ? "Unsave property" : "Save property"}
            onPress={onSaved}
            style={styles.circle}
          >
            <Heart
              size={19}
              color={saved ? "#E11D48" : "white"}
              fill={saved ? "#E11D48" : "transparent"}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Share property"
            onPress={() =>
              Share.share({
                message: `${property.name} — ${property.locationLabel}`,
              })
            }
            style={styles.circle}
          >
            <Share2 size={19} color="white" />
          </Pressable>
        </View>
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.badge}>{property.badge}</Text>
        <View style={styles.heroTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{property.name}</Text>
            <View style={styles.inline}>
              <MapPin size={13} color={colors.gold} />
              <Text numberOfLines={1} style={styles.location}>
                {property.locationLabel}, Maharashtra
              </Text>
            </View>
            <View style={styles.specs}>
              <Spec Icon={Users} text={`Max ${maxGuests} Guests`} />
              <Spec Icon={BedDouble} text={`${bedrooms} Bedrooms`} />
              <Spec Icon={Bath} text={`${bedrooms >= 2 ? 2 : 1} Bathrooms`} />
            </View>
          </View>
          <View style={styles.ratingBox}>
            <View style={styles.inline}>
              <Star size={12} fill={colors.gold} color={colors.gold} />
              <Text style={styles.rating}>{property.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({property.reviews})</Text>
            </View>
            <Text style={styles.loved}>Loved by Guests</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
function Spec({ Icon, text }: { Icon: typeof Users; text: string }) {
  return (
    <View style={styles.inline}>
      <Icon size={12} color={colors.gold} />
      <Text style={styles.spec}>{text}</Text>
    </View>
  );
}

function BookingCard({
  property,
  guests,
  maxGuests,
  checkIn,
  checkOut,
  onGuests,
  onCalendar,
  onBook,
}: {
  property: NonNullable<ReturnType<typeof getProperty>>;
  guests: number;
  maxGuests: number;
  checkIn: Date;
  checkOut: Date;
  onGuests: (n: number) => void;
  onCalendar: () => void;
  onBook: () => void;
}) {
  return (
    <View style={styles.booking}>
      <View style={styles.bookingHead}>
        <View>
          <Text style={styles.muted}>Starting from</Text>
          <Text style={styles.price}>
            ₹{property.priceAmount.toLocaleString("en-IN")}{" "}
            <Text style={styles.perNight}>/ night</Text>
          </Text>
          <Text style={styles.free}>Free cancellation before 48 hrs</Text>
        </View>
        <Text style={styles.max}>Max {maxGuests} persons</Text>
      </View>
      <View style={styles.selectRow}>
        <DateChip
          label="Check-in"
          value={dateLabel(checkIn)}
          onPress={onCalendar}
        />
        <View style={styles.guests}>
          <View style={styles.inline}>
            <Pressable
              accessibilityLabel="Decrease guests"
              disabled={guests <= 1}
              onPress={() => onGuests(Math.max(1, guests - 1))}
              style={styles.step}
            >
              <Minus
                size={14}
                color={guests <= 1 ? colors.textMuted : "white"}
              />
            </Pressable>
            <Text style={styles.guestCount}>{guests}</Text>
            <Pressable
              accessibilityLabel="Increase guests"
              disabled={guests >= maxGuests}
              onPress={() => onGuests(Math.min(maxGuests, guests + 1))}
              style={styles.step}
            >
              <Plus
                size={14}
                color={guests >= maxGuests ? colors.textMuted : "white"}
              />
            </Pressable>
          </View>
          <Text style={styles.person}>Persons</Text>
        </View>
        <DateChip
          label="Check-out"
          value={dateLabel(checkOut)}
          onPress={onCalendar}
        />
      </View>
      <Pressable onPress={onCalendar} style={styles.calendarButton}>
        <CalendarDays size={16} color={colors.gold} />
        <Text style={styles.calendarText}>Availability Calendar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onBook} style={styles.book}>
        <Text style={styles.bookText}>Book Now</Text>
        <ArrowRight size={17} color={colors.actionInk} />
      </Pressable>
      <View style={styles.trust}>
        {trust.map(({ label, Icon }) => (
          <View key={label} style={styles.trustItem}>
            <Icon size={14} color={colors.gold} />
            <Text style={styles.trustText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
function DateChip({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.dateChip}>
      <Text style={styles.muted}>{label}</Text>
      <View style={styles.inline}>
        <Text style={styles.dateValue}>{value}</Text>
        <CalendarDays size={13} color={colors.gold} />
      </View>
    </Pressable>
  );
}

function TabContent({ tab, about }: { tab: Tab; about: string }) {
  if (tab === "amenities")
    return (
      <>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenities}>
          {amenities.map(({ label, Icon }) => (
            <View key={label} style={styles.amenity}>
              <Icon size={19} color={colors.gold} />
              <Text style={styles.amenityText}>{label}</Text>
            </View>
          ))}
        </View>
      </>
    );
  if (tab === "activities")
    return (
      <>
        <Text style={styles.sectionTitle}>Activities</Text>
        <View style={styles.activities}>
          {activities.map((a) => (
            <View key={a.title} style={styles.activity}>
              <Image
                source={a.image}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,.9)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.activityTitle}>{a.title}</Text>
            </View>
          ))}
        </View>
      </>
    );
  if (tab === "schedule")
    return (
      <>
        <Text style={styles.sectionTitle}>Property Schedule</Text>
        <View style={styles.schedule}>
          <View style={styles.scheduleCard}>
            <CalendarDays size={17} color={colors.gold} />
            <Text style={styles.muted}>Check-in</Text>
            <Text style={styles.scheduleValue}>2:00 PM onwards</Text>
          </View>
          <View style={styles.scheduleCard}>
            <Car size={17} color={colors.gold} />
            <Text style={styles.muted}>Check-out</Text>
            <Text style={styles.scheduleValue}>11:00 AM</Text>
          </View>
        </View>
        <Text style={styles.note}>
          * Early check-in or late check-out is subject to availability.
        </Text>
      </>
    );
  return (
    <>
      <Text style={styles.sectionTitle}>About this property</Text>
      <Text style={styles.about}>{about}</Text>
      <View style={styles.features}>
        {features.map(({ label, Icon }) => (
          <View key={label} style={styles.feature}>
            <Icon size={14} color={colors.gold} />
            <Text style={styles.featureText}>{label}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function CalendarSheet({
  visible,
  availability,
  checkIn,
  checkOut,
  onClose,
  onApply,
}: {
  visible: boolean;
  availability: CalendarDay[];
  checkIn: Date;
  checkOut: Date;
  onClose: () => void;
  onApply: (a: Date, b: Date) => void;
}) {
  const [start, setStart] = useState(checkIn);
  const options = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1)),
    [],
  );
  const end = addDays(start, 1);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <View>
              <Text style={styles.sheetTitle}>Select dates</Text>
              <Text style={styles.muted}>
                Choose an available check-in date
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <View style={styles.selectedDates}>
            <View>
              <Text style={styles.muted}>Check-in</Text>
              <Text style={styles.selectedValue}>{dateLabel(start)}</Text>
            </View>
            <ArrowRight size={16} color={colors.gold} />
            <View>
              <Text style={styles.muted}>Check-out</Text>
              <Text style={styles.selectedValue}>{dateLabel(end)}</Text>
            </View>
          </View>
          <Text style={styles.month}>
            {new Date().toLocaleString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <View style={styles.days}>
            {options.map((d, i) => {
              const selected = d.toDateString() === start.toDateString();
              const liveDay = availability.find((item) => new Date(item.date).toDateString() === d.toDateString());
              const booked = liveDay ? liveDay.status === "booked" || liveDay.status === "blocked" : false;
              return (
                <Pressable
                  accessibilityLabel={`${dateLabel(d)}${booked ? ", booked" : ""}`}
                  key={d.toISOString()}
                  disabled={booked}
                  onPress={() => setStart(d)}
                  style={[
                    styles.day,
                    booked && styles.dayBooked,
                    selected && styles.daySelected,
                  ]}
                >
                  <Text
                    style={[styles.dayName, selected && styles.daySelectedText]}
                  >
                    {d
                      .toLocaleString("en-IN", { weekday: "short" })
                      .slice(0, 1)}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      selected && styles.daySelectedText,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.legend}>
            <Text style={styles.available}>● Available</Text>
            <Text style={styles.booked}>● Booked</Text>
          </View>
          <Pressable onPress={() => onApply(start, end)} style={styles.confirm}>
            <Text style={styles.bookText}>Confirm Dates</Text>
            <ArrowRight size={16} color={colors.actionInk} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 104, alignItems: "center" },
  page: { width: "100%", maxWidth: layout.sourceMaxWidth },
  pageWide: { maxWidth: 960, paddingTop: 18 },
  wideTop: { flexDirection: "row", gap: 18, paddingHorizontal: 18 },
  wideBooking: { flex: 1, justifyContent: "center" },
  hero: { height: 420, overflow: "hidden" },
  heroActions: {
    position: "absolute",
    top: Platform.OS === "web" ? 14 : 8,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionRow: { flexDirection: "row", gap: 8 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.15)",
    backgroundColor: "rgba(0,0,0,.48)",
  },
  heroCopy: { position: "absolute", left: 16, right: 16, bottom: 20 },
  badge: {
    alignSelf: "flex-start",
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: "rgba(224,184,74,.45)",
    backgroundColor: "rgba(0,0,0,.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    overflow: "hidden",
  },
  heroTitleRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  heroTitle: {
    color: "white",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 28,
    lineHeight: 31,
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 5 },
  location: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  specs: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  spec: { color: "white", fontFamily: fontFamilies.sans, fontSize: 10.5 },
  ratingBox: {
    padding: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224,184,74,.55)",
    backgroundColor: "rgba(0,0,0,.58)",
  },
  rating: {
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  ratingCount: { color: colors.textSecondary, fontSize: 10 },
  loved: {
    marginTop: 4,
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
  },
  bookingWrap: { paddingHorizontal: 16, marginTop: -4 },
  booking: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224,184,74,.25)",
    backgroundColor: "#10141B",
    padding: 14,
  },
  bookingHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  muted: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  price: {
    marginTop: 4,
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 22,
  },
  perNight: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  free: {
    marginTop: 7,
    color: "#34D399",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10.5,
  },
  max: {
    alignSelf: "flex-start",
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(224,184,74,.35)",
    backgroundColor: "rgba(224,184,74,.1)",
  },
  selectRow: { marginTop: 14, flexDirection: "row", gap: 7 },
  dateChip: {
    flex: 1,
    minHeight: 57,
    justifyContent: "center",
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
    backgroundColor: colors.surface,
  },
  dateValue: {
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  guests: {
    minWidth: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
    backgroundColor: colors.surface,
  },
  step: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.15)",
  },
  guestCount: {
    minWidth: 18,
    textAlign: "center",
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  person: { marginTop: 2, color: colors.textMuted, fontSize: 9.5 },
  calendarButton: {
    marginTop: 12,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224,184,74,.45)",
    backgroundColor: "rgba(224,184,74,.08)",
  },
  calendarText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  book: {
    marginTop: 10,
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.goldAction,
  },
  bookText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  trust: { marginTop: 14, flexDirection: "row" },
  trustItem: { width: "25%", alignItems: "center", gap: 5 },
  trustText: {
    maxWidth: 74,
    textAlign: "center",
    color: "#C4A35A",
    fontFamily: fontFamilies.sans,
    fontSize: 8,
    lineHeight: 10,
  },
  tabs: {
    marginTop: 16,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,.1)",
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: colors.gold },
  tabText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
    textAlign: "center",
  },
  tabTextActive: { color: colors.gold },
  content: { padding: 20 },
  sectionTitle: {
    color: "white",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 23,
  },
  about: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 21,
  },
  features: { marginTop: 15, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
    backgroundColor: colors.surfaceRaised,
  },
  featureText: {
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  amenities: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 9 },
  amenity: {
    width: "22.8%",
    minHeight: 77,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    backgroundColor: colors.surfaceRaised,
  },
  amenityText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 9,
    textAlign: "center",
  },
  activities: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  activity: {
    width: "48%",
    height: 128,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  activityTitle: {
    padding: 10,
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  schedule: { marginTop: 14, flexDirection: "row", gap: 10 },
  scheduleCard: {
    flex: 1,
    gap: 5,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    backgroundColor: colors.surfaceRaised,
  },
  scheduleValue: {
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  note: {
    marginTop: 10,
    color: colors.gold,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  policies: { marginTop: 30, gap: 10 },
  policy: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    backgroundColor: colors.surfaceRaised,
  },
  policyHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  policyTitle: {
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  policyCopy: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 19,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.1)",
    backgroundColor: "rgba(11,14,17,.98)",
  },
  footerWide: { paddingHorizontal: "12%" },
  footerLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  footerPrice: {
    marginTop: 3,
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
  },
  footerMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  continue: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.goldAction,
  },
  continueText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  modal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,.72)",
  },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    backgroundColor: "#10141B",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,.18)",
  },
  sheetHead: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: "white",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
  },
  close: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  selectedDates: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  selectedValue: {
    marginTop: 4,
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  month: {
    marginTop: 18,
    textAlign: "center",
    color: "white",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  days: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  day: {
    width: 41,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 10,
    backgroundColor: "rgba(20,83,45,.55)",
  },
  dayBooked: { backgroundColor: "rgba(127,29,29,.55)", opacity: 0.75 },
  daySelected: { backgroundColor: colors.gold },
  dayName: {
    color: "#86EFAC",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
  },
  dayNumber: {
    color: "#86EFAC",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  daySelectedText: { color: colors.actionInk },
  legend: { marginTop: 15, flexDirection: "row", gap: 18 },
  available: {
    color: "#86EFAC",
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  booked: { color: "#FCA5A5", fontFamily: fontFamilies.sans, fontSize: 10.5 },
  confirm: {
    marginTop: 18,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.goldAction,
  },
});
