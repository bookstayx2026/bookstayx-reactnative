import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, type Href } from "expo-router";
import {
  AirVent,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleParking,
  CookingPot,
  Droplets,
  Flame,
  Heart,
  Home,
  MapPin,
  Minus,
  Plus,
  Refrigerator,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Tent,
  Trees,
  Tv,
  User,
  UserCheck,
  Users,
  Utensils,
  Waves,
  Wifi,
  X,
  Zap,
} from "lucide-react-native";
import { getProperty, images, type Property } from "@/data/discovery";
import { loadPropertyAvailability, loadPublicProperty, type CalendarDay } from "@/services/api";
import { useIsDesktop, useIsTablet, useWindowClass } from "@/hooks/use-window-class";
import { colors, fontFamilies, layout, radii, spacing } from "@/theme";
import { CustomerFooter, useCustomerData } from "@/components/customer";

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

const dayName = (date: Date) =>
  date.toLocaleDateString("en-IN", { weekday: "short" });

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const DEMO_OCTOBER_BOOKED_DAYS = [
  "2026-10-09",
  "2026-10-10",
  "2026-10-11",
  "2026-10-16",
  "2026-10-17",
  "2026-10-18",
  "2026-10-24",
  "2026-10-25",
  "2026-10-31",
];

interface AvailabilityState {
  isBooked: boolean;
  isPending: boolean;
  isLimited: boolean;
  isPartial: boolean;
  availableQuantity: number;
  totalInventory: number;
  bookedQuantity: number;
}

const getDayAvailabilityState = (
  d: Date,
  availability: CalendarDay[] = [],
  isVilla = true,
  fallbackTotalInventory = 1
): AvailabilityState => {
  const dStr = isoDay(d);
  if (availability.length === 0 && DEMO_OCTOBER_BOOKED_DAYS.includes(dStr)) {
    if (isVilla) {
      return {
        isBooked: true,
        isPending: false,
        isLimited: false,
        isPartial: false,
        availableQuantity: 0,
        totalInventory: 1,
        bookedQuantity: 1,
      };
    }
    const totalInv = Math.max(1, fallbackTotalInventory);
    const booked = Math.min(2, Math.max(0, totalInv - 1));
    const avail = Math.max(1, totalInv - booked);
    return {
      isBooked: false,
      isPending: false,
      isLimited: avail <= 2,
      isPartial: booked > 0,
      availableQuantity: avail,
      totalInventory: totalInv,
      bookedQuantity: booked,
    };
  }
  const match = availability.find(
    (item) => item.date.slice(0, 10) === dStr || new Date(item.date).toDateString() === d.toDateString()
  );
  if (!match) {
    const totalInv = isVilla ? 1 : Math.max(1, fallbackTotalInventory);
    return {
      isBooked: false,
      isPending: false,
      isLimited: false,
      isPartial: false,
      availableQuantity: totalInv,
      totalInventory: totalInv,
      bookedQuantity: 0,
    };
  }

  const raw = match as any;
  const totalInv = isVilla
    ? 1
    : Number(raw.total_inventory ?? raw.totalInventory ?? fallbackTotalInventory ?? 1);
  const bookedQty = Number(raw.booked_quantity ?? raw.bookedQuantity ?? (match.status === "booked" ? totalInv : 0));
  const blockedQty = Number(raw.blocked_quantity ?? raw.blockedQuantity ?? 0);

  const rawAvail = raw.available_quantity ?? raw.availableQuantity;
  const availableQuantity = rawAvail !== undefined
    ? Number(rawAvail)
    : Math.max(0, totalInv - bookedQty - blockedQty);

  if (isVilla) {
    const isBooked =
      match.status === "booked" ||
      raw.is_booked === true ||
      availableQuantity === 0;
    const isPending =
      !isBooked &&
      (match.status === "pending" ||
        match.status === "blocked" ||
        raw.is_soft_locked === true ||
        raw.is_pending === true ||
        raw.soft_available_quantity === 0 ||
        raw.softAvailableQuantity === 0);
    return {
      isBooked,
      isPending,
      isLimited: false,
      isPartial: false,
      availableQuantity: isBooked ? 0 : 1,
      totalInventory: 1,
      bookedQuantity: isBooked ? 1 : 0,
    };
  }

  // Non-villa (quantity-based: Camping & Cottages, Resort, Homestay)
  // ONLY mark booked (red) when availableQuantity <= 0
  const isBooked = availableQuantity <= 0;
  const isLimited = !isBooked && (availableQuantity <= 2 || availableQuantity / totalInv <= 0.35);
  const isPartial = !isBooked && availableQuantity < totalInv && !isLimited;
  const isPending = !isBooked && (raw.soft_available_quantity === 0 || raw.softAvailableQuantity === 0);

  return {
    isBooked,
    isPending,
    isLimited,
    isPartial,
    availableQuantity,
    totalInventory: totalInv,
    bookedQuantity: bookedQty,
  };
};

const isDayUnavailable = (
  d: Date,
  availability: CalendarDay[] = [],
  requestedUnits = 1,
  isVilla = true,
  totalInventory = 1
) => {
  const state = getDayAvailabilityState(d, availability, isVilla, totalInventory);
  if (isVilla) {
    return state.isBooked || state.isPending;
  }
  return state.availableQuantity < requestedUnits;
};

const checkUnavailableRange = (
  start: Date,
  end: Date,
  availability: CalendarDay[] = [],
  requestedUnits = 1,
  isVilla = true,
  totalInventory = 1
) => {
  if (end <= start) {
    return { isInvalid: true, bookedDates: [] as string[], minAvailableAcrossStay: 0 };
  }
  const nightsCount = Math.round((end.getTime() - start.getTime()) / 86400000);
  const bookedDates: string[] = [];
  let minAvailableAcrossStay = isVilla ? 1 : totalInventory;

  for (let i = 0; i < nightsCount; i++) {
    const currentNight = addDays(start, i);
    const dayState = getDayAvailabilityState(currentNight, availability, isVilla, totalInventory);
    if (isVilla) {
      if (dayState.isBooked || dayState.isPending) {
        bookedDates.push(dateLabel(currentNight));
        minAvailableAcrossStay = 0;
      }
    } else {
      if (dayState.availableQuantity < minAvailableAcrossStay) {
        minAvailableAcrossStay = dayState.availableQuantity;
      }
      if (dayState.availableQuantity < requestedUnits) {
        bookedDates.push(`${dateLabel(currentNight)} (${dayState.availableQuantity} left)`);
      }
    }
  }

  return {
    isInvalid: bookedDates.length > 0,
    bookedDates,
    minAvailableAcrossStay: Math.max(0, minAvailableAcrossStay),
  };
};

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bundledProperty = getProperty(id) || getProperty("pawna-lakeview-villa")!;
  const [remoteProperty, setRemoteProperty] = useState<Property | null>(null);
  const [availability, setAvailability] = useState<CalendarDay[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number>();
  const property = remoteProperty || bundledProperty;
  const gallery =
    property.gallery && property.gallery.length > 0
      ? property.gallery
      : [property.image];

  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  const windowClass = useWindowClass();
  const wide = windowClass !== "compact";

  const { toggleSaved, isSaved } = useCustomerData();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const saved = isSaved(property.id) || (id ? isSaved(id) : false);
  const [guests, setGuests] = useState(1);
  const [males, setMales] = useState(1);
  const [females, setFemales] = useState(0);
  const [veg, setVeg] = useState(1);
  const [nonVeg, setNonVeg] = useState(0);
  const [checkIn, setCheckIn] = useState(() => addDays(new Date(), 2));
  const [checkOut, setCheckOut] = useState(() => addDays(new Date(), 3));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"checkIn" | "checkOut">("checkIn");
  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const [tab, setTab] = useState<Tab>("descriptions");
  const [openPolicy, setOpenPolicy] = useState<string | null | undefined>("love");

  const [unitAvailabilityMap, setUnitAvailabilityMap] = useState<Record<number, CalendarDay[]>>({});

  useEffect(() => {
    let active = true;
    void loadPublicProperty(id).then((nextProperty) => {
      if (!active) return;
      setRemoteProperty(nextProperty);
      setSelectedUnitId(nextProperty?.units?.[0]?.id);
    });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!property.units || property.units.length === 0) return;
    let active = true;
    property.units.forEach((u) => {
      void loadPropertyAvailability(id, u.id)
        .then((result) => {
          if (!active) return;
          setUnitAvailabilityMap((prev) => ({
            ...prev,
            [u.id]: result.days,
          }));
        })
        .catch(() => {});
    });
    return () => {
      active = false;
    };
  }, [id, property.units]);

  useEffect(() => {
    let active = true;
    void loadPropertyAvailability(id, selectedUnitId)
      .then((result) => {
        if (!active) return;
        setAvailability(result.days);
        if (selectedUnitId) {
          setUnitAvailabilityMap((prev) => ({
            ...prev,
            [selectedUnitId]: result.days,
          }));
        }
        if (!selectedUnitId && result.selectedUnit?.id) {
          setSelectedUnitId(result.selectedUnit.id);
        }
      })
      .catch(() => {
        if (active) setAvailability([]);
      });
    return () => {
      active = false;
    };
  }, [id, selectedUnitId]);

  const selectedUnit =
    property.units?.find((unit) => unit.id === selectedUnitId) || property.units?.[0];

  const isVilla = property.category === "villa";
  const unitTotalInventory = isVilla ? 1 : (selectedUnit?.totalInventory || 1);
  const [unitQuantity, setUnitQuantity] = useState(1);
  const bedrooms = selectedUnit?.bedrooms || (property as any).bedrooms || 1;

  // Person-based accommodation selection map: unitId -> assignedPersons
  const [assignedPersonsMap, setAssignedPersonsMap] = useState<Record<number, number>>({});

  const handleAssignedPersonsChange = (unitId: number, nextPersons: number) => {
    setAssignedPersonsMap((prev) => ({
      ...prev,
      [unitId]: Math.max(0, nextPersons),
    }));
  };

  const isMultiAccom = !isVilla && Boolean(property.units && property.units.length > 0);

  const activeAccommodationItems = useMemo(() => {
    if (!isMultiAccom || !property.units) return [];
    return property.units
      .filter((u) => (assignedPersonsMap[u.id] || 0) > 0)
      .map((u) => {
        const persons = assignedPersonsMap[u.id] || 0;
        const cap = u.totalPersons || 1;
        const requiredUnits = Math.ceil(persons / cap);
        const uDays = unitAvailabilityMap[u.id] || [];
        const itemNights = Array.from({ length: nights }, (_, index) => {
          const date = isoDay(addDays(checkIn, index));
          return uDays.find((day) => day.date.slice(0, 10) === date)?.price ?? u.weekdayPrice ?? property.priceAmount;
        });
        const unitNightly = itemNights[0] ?? (u.weekdayPrice || property.priceAmount);
        const subtotal = itemNights.reduce((sum, p) => sum + p, 0) * requiredUnits;
        return {
          unitId: u.id,
          unitName: u.name,
          persons,
          unitQuantity: requiredUnits,
          pricePerUnitNight: unitNightly,
          subtotal,
          totalPersonsPerUnit: cap,
          totalInventory: u.totalInventory || 1,
        };
      });
  }, [isMultiAccom, property.units, assignedPersonsMap, unitAvailabilityMap, nights, checkIn, property.priceAmount]);

  const totalAssignedGuests = useMemo(() => {
    return activeAccommodationItems.reduce((sum, item) => sum + item.persons, 0);
  }, [activeAccommodationItems]);

  const totalPropertyCapacity = useMemo(() => {
    if (property.units && property.units.length > 0) {
      return property.units.reduce(
        (sum, u) => sum + (u.totalInventory || 1) * (u.totalPersons || 1),
        0
      );
    }
    return property.maxCapacity || (isVilla ? 8 : 4);
  }, [property.units, property.maxCapacity, isVilla]);

  const maxGuestsPerUnit =
    selectedUnit?.totalPersons ||
    (isVilla ? (property.maxCapacity || 8) : 4);

  const effectiveMaxGuests = isVilla
    ? maxGuestsPerUnit
    : isMultiAccom
    ? Math.max(1, totalAssignedGuests)
    : maxGuestsPerUnit * unitQuantity;
  const maxGuests = effectiveMaxGuests;

  const handleGuestsChange = (nextGuests: number) => {
    const validGuests = Math.max(1, Math.min(effectiveMaxGuests, nextGuests));
    setGuests(validGuests);
    setMales((prevM) => {
      const m = Math.min(prevM, validGuests);
      setFemales(validGuests - m);
      return m;
    });
    setVeg((prevV) => {
      const v = Math.min(prevV, validGuests);
      setNonVeg(validGuests - v);
      return v;
    });
  };

  const handleMalesChange = (val: number) => {
    const m = Math.max(0, Math.min(guests, val));
    setMales(m);
    setFemales(guests - m);
  };

  const handleFemalesChange = (val: number) => {
    const f = Math.max(0, Math.min(guests, val));
    setFemales(f);
    setMales(guests - f);
  };

  const handleVegChange = (val: number) => {
    const v = Math.max(0, Math.min(guests, val));
    setVeg(v);
    setNonVeg(guests - v);
  };

  const handleNonVegChange = (val: number) => {
    const nv = Math.max(0, Math.min(guests, val));
    setNonVeg(nv);
    setVeg(guests - nv);
  };

  useEffect(() => {
    setUnitQuantity((prev) => Math.max(1, Math.min(prev, Math.max(1, unitTotalInventory))));
  }, [selectedUnitId, unitTotalInventory]);

  // Synchronize guests and demographics when multi-accommodation selection changes
  useEffect(() => {
    if (isMultiAccom) {
      const targetGuests = totalAssignedGuests;
      setGuests(targetGuests);
      setMales((prevM) => {
        const m = Math.min(prevM, targetGuests);
        setFemales(targetGuests - m);
        return m;
      });
      setVeg((prevV) => {
        const v = Math.min(prevV, targetGuests);
        setNonVeg(targetGuests - v);
        return v;
      });
    }
  }, [isMultiAccom, totalAssignedGuests]);

  // Safely normalize guests when effectiveMaxGuests changes (e.g. unit quantity reduced for non-multi)
  useEffect(() => {
    if (!isMultiAccom && guests > effectiveMaxGuests) {
      handleGuestsChange(effectiveMaxGuests);
    }
  }, [isMultiAccom, effectiveMaxGuests]);

  const selectedNightPrices = Array.from({ length: nights }, (_, index) => {
    const date = isoDay(addDays(checkIn, index));
    return availability.find((day) => day.date.slice(0, 10) === date)?.price;
  });

  const nightlyPrice =
    selectedNightPrices[0] || selectedUnit?.weekdayPrice || property.priceAmount;

  const multiAccomTotal = useMemo(() => {
    return activeAccommodationItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [activeAccommodationItems]);

  const total = isMultiAccom
    ? multiAccomTotal
    : selectedNightPrices.reduce<number>(
        (sum, price) => sum + (price || selectedUnit?.weekdayPrice || property.priceAmount),
        0
      ) * (isVilla ? 1 : unitQuantity);

  const about =
    property.description ||
    (property.id === "seaside-serenity-villa"
      ? "Wake up to the sound of waves at this exclusive beachfront villa in Alibagh. Featuring a private infinity pool, lush lawns, and direct beach access — perfect for families and groups seeking a serene coastal escape."
      : `Experience ${property.name} in ${property.locationLabel}. A handpicked BookStayX stay with premium comforts, thoughtful hospitality, and unforgettable views — ideal for your next Konkan getaway.`);

  const displayProperty: Property = { ...property, priceAmount: nightlyPrice };

  const rangeCheck = useMemo(() => {
    if (!isMultiAccom) {
      return checkUnavailableRange(checkIn, checkOut, availability, isVilla ? 1 : unitQuantity, isVilla, unitTotalInventory);
    }
    if (activeAccommodationItems.length === 0) {
      return { isInvalid: false, bookedDates: [], minAvailableAcrossStay: 0 };
    }
    const bookedDateSet = new Set<string>();
    let anyInvalid = false;
    for (const item of activeAccommodationItems) {
      const uDays = unitAvailabilityMap[item.unitId] || [];
      const check = checkUnavailableRange(checkIn, checkOut, uDays, item.unitQuantity, false, item.totalInventory);
      if (check.isInvalid) {
        anyInvalid = true;
        check.bookedDates.forEach((d) => bookedDateSet.add(d));
      }
    }
    return {
      isInvalid: anyInvalid,
      bookedDates: Array.from(bookedDateSet),
      minAvailableAcrossStay: anyInvalid ? 0 : 1,
    };
  }, [isMultiAccom, activeAccommodationItems, checkIn, checkOut, availability, isVilla, unitQuantity, unitTotalInventory, unitAvailabilityMap]);

  const isDatesUnavailable = rangeCheck.isInvalid;
  const isNoAccomSelected = isMultiAccom && activeAccommodationItems.length === 0;

  const isFoodUnit = isMultiAccom
    ? property.hasFood !== false
    : selectedUnit
    ? selectedUnit.hasFood !== false
    : property.hasFood !== false;

  const startBooking = () => {
    if (isDatesUnavailable) {
      setCalendarTarget("checkIn");
      setCalendarOpen(true);
      return;
    }
    if (isMultiAccom && activeAccommodationItems.length === 0) {
      return;
    }

    const accommodationItemsPayload = isMultiAccom
      ? activeAccommodationItems.map((item) => ({
          unitId: item.unitId,
          persons: item.persons,
          unitQuantity: item.unitQuantity,
        }))
      : undefined;

    router.push({
      pathname: "/booking-review",
      params: {
        id: property.id,
        guests: String(isMultiAccom ? totalAssignedGuests : guests),
        males: String(males),
        females: String(females),
        veg: isFoodUnit ? String(veg) : "0",
        nonVeg: isFoodUnit ? String(nonVeg) : "0",
        hasFood: isFoodUnit ? "true" : "false",
        nights: String(nights),
        checkIn: isoDay(checkIn),
        checkOut: isoDay(checkOut),
        unitId: isMultiAccom
          ? String(activeAccommodationItems[0]?.unitId || "")
          : selectedUnit?.id
          ? String(selectedUnit.id)
          : undefined,
        unitQuantity: isMultiAccom
          ? String(activeAccommodationItems[0]?.unitQuantity || 1)
          : !isVilla
          ? String(unitQuantity)
          : undefined,
        accommodationItems: accommodationItemsPayload
          ? JSON.stringify(accommodationItemsPayload)
          : undefined,
      },
    });
  };

  const bookingCard = (
    <BookingCard
      property={displayProperty}
      units={property.units || []}
      selectedUnitId={selectedUnit?.id}
      onUnit={setSelectedUnitId}
      guests={isMultiAccom ? totalAssignedGuests : guests}
      maxGuests={maxGuests}
      males={males}
      females={females}
      veg={veg}
      nonVeg={nonVeg}
      hasFood={isFoodUnit}
      onMales={handleMalesChange}
      onFemales={handleFemalesChange}
      onVeg={handleVegChange}
      onNonVeg={handleNonVegChange}
      checkIn={checkIn}
      checkOut={checkOut}
      isDatesUnavailable={isDatesUnavailable}
      bookedDates={rangeCheck.bookedDates}
      onGuests={handleGuestsChange}
      unitQuantity={unitQuantity}
      onUnitQuantityChange={setUnitQuantity}
      maxAvailableUnits={rangeCheck.minAvailableAcrossStay || unitTotalInventory}
      totalInventory={unitTotalInventory}
      isVilla={isVilla}
      availability={availability}
      unitAvailabilityMap={unitAvailabilityMap}
      isMultiAccom={isMultiAccom}
      activeAccommodationItems={activeAccommodationItems}
      assignedPersonsMap={assignedPersonsMap}
      onAssignedPersonsChange={handleAssignedPersonsChange}
      onCalendar={(target = "checkIn", unitId?: number) => {
        if (unitId && unitId !== selectedUnitId) {
          setSelectedUnitId(unitId);
        }
        setCalendarTarget(target);
        setCalendarOpen(true);
      }}
      onBook={startBooking}
    />
  );

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          wide && styles.scrollWide,
          isDesktop && styles.scrollDesktop,
        ]}
      >
        <View
          style={[
            styles.container,
            isTablet && styles.containerTablet,
            isDesktop && styles.containerDesktop,
          ]}
        >
          {/* Desktop & Tablet Top Bar (Breadcrumb + Actions) */}
          {wide ? (
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Back to properties"
                onPress={() => router.push("/properties" as Href)}
                style={({ pressed }) => [
                  styles.backLink,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <ArrowLeft size={15} color={colors.gold} />
                <Text style={styles.backLinkText}>Back to All Properties</Text>
              </Pressable>

              <View style={styles.topActions}>
                <Pressable
                  accessibilityLabel={saved ? "Unsave property" : "Save property"}
                  onPress={() => toggleSaved(property.id)}
                  style={({ pressed }) => [
                    styles.actionCircle,
                    pressed && styles.pressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Heart
                    size={15}
                    color={saved ? "#E11D48" : colors.text}
                    fill={saved ? "#E11D48" : "transparent"}
                  />
                  <Text style={[styles.actionLabel, saved && { color: "#E11D48" }]}>
                    {saved ? "Saved" : "Save"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Share property"
                  onPress={() =>
                    Share.share({
                      message: `${property.name} — ${property.locationLabel}`,
                    })
                  }
                  style={({ pressed }) => [
                    styles.actionCircle,
                    pressed && styles.pressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Share2 size={15} color={colors.text} />
                  <Text style={styles.actionLabel}>Share</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Desktop & Tablet Page Header (Title + Location + Rating) */}
          {wide ? (
            <View style={styles.desktopHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{property.badge}</Text>
                  </View>
                  <View style={styles.tierPill}>
                    <Text style={styles.tierPillText}>{property.tier.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.desktopTitle}>{property.name}</Text>

                <View style={styles.desktopLocationRow}>
                  <MapPin size={14} color={colors.gold} />
                  <Text style={styles.desktopLocationText}>
                    {property.locationLabel}, Maharashtra
                  </Text>
                </View>
              </View>

              <View style={styles.desktopRatingBox}>
                <View style={styles.ratingInline}>
                  <Star size={14} fill={colors.gold} color={colors.gold} />
                  <Text style={styles.ratingNumber}>
                    {property.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.ratingCount}>({property.reviews})</Text>
                </View>
                <Text style={styles.lovedTag}>100% Verified Stay</Text>
              </View>
            </View>
          ) : null}

          {/* Mobile Only: Top Immersive Hero */}
          {!wide ? (
            <HeroMobile
              property={property}
              saved={saved}
              onSaved={() => toggleSaved(property.id)}
              maxGuests={totalPropertyCapacity}
              bedrooms={bedrooms}
            />
          ) : null}

          {/* Mobile Booking Card directly below Hero Image */}
          {!wide ? (
            <View style={styles.mobileBookingContainer}>
              {bookingCard}
            </View>
          ) : null}

          {/* Main 2-Column Split on Wide Screens: Left = Image + Details, Right = Booking Card */}
          <View style={[styles.mainLayout, wide && styles.mainLayoutWide]}>
            {/* Left Column (Image Showcase + Specs + Tabs + Policies) */}
            <View style={[styles.leftColumn, wide && styles.leftColumnWide]}>
              {/* Desktop / Tablet Image Showcase in Vertical Form */}
              {wide ? (
                <View style={styles.desktopImageWrapper}>
                  <View style={[styles.desktopImageCard, isTablet && styles.desktopImageCardTablet]}>
                    <Image
                      source={gallery[activeImgIndex] || property.image}
                      contentFit="cover"
                      style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                      colors={["rgba(5,7,9,0.1)", "transparent", "rgba(5,7,9,0.75)"]}
                      locations={[0, 0.4, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.desktopImageBadge}>
                      <Sparkles size={12} color={colors.gold} />
                      <Text style={styles.desktopImageBadgeText}>Curated Luxury Stay</Text>
                    </View>
                  </View>

                  {gallery.length > 1 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.thumbnailRow}
                    >
                      {gallery.map((img, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setActiveImgIndex(idx)}
                          style={[
                            styles.thumbCard,
                            activeImgIndex === idx && styles.thumbCardActive,
                          ]}
                        >
                          <Image
                            source={img}
                            contentFit="cover"
                            style={StyleSheet.absoluteFill}
                          />
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
              ) : null}

              {/* Specs Chips Row */}
              <View style={[styles.specsContainer, !wide && styles.specsContainerMobile]}>
                <Spec Icon={Users} text={`Max ${totalPropertyCapacity} Guests`} />
                <Spec Icon={BedDouble} text={`${bedrooms} Bedrooms`} />
                <Spec Icon={Bath} text={`${bedrooms >= 2 ? 2 : 1} Bathrooms`} />
                <Spec Icon={Sparkles} text={property.badge} highlight />
              </View>

              {/* Segmented Navigation Tabs */}
              <View style={[styles.tabs, !wide && styles.tabsMobile]}>
                {(
                  [
                    ["descriptions", "Descriptions", Sparkles],
                    ["amenities", "Amenities", Wifi],
                    ["activities", "Activities", Flame],
                    ["schedule", "Schedule", CalendarDays],
                  ] as const
                ).map(([key, label, Icon]) => {
                  const active = tab === key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      onPress={() => setTab(key)}
                      style={({ pressed }) => [
                        styles.tab,
                        active && styles.tabActive,
                        pressed && styles.pressed,
                        Platform.select({
                          web: { cursor: "pointer", outlineStyle: "none" } as any,
                          default: {},
                        }),
                      ]}
                    >
                      <Icon
                        size={14}
                        color={active ? colors.gold : colors.textMuted}
                      />
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Tab Content Panel */}
              <View style={[styles.tabContentPanel, !wide && styles.tabContentPanelMobile]}>
                <TabContent tab={tab} about={about} property={property} wide={wide} />
              </View>

              {/* Expandable Policies Accordion */}
              <View style={[styles.policiesContainer, !wide && styles.policiesContainerMobile]}>
                <Text style={styles.sectionHeading}>Stay Policies & Information</Text>
                {[
                  [
                    "love",
                    "What you'll love",
                    "Private spaces with premium interiors and curated comforts. Scenic views, peaceful surroundings, thoughtful hospitality, and space for families or small groups.",
                  ],
                  [
                    "rules",
                    "Rules & Policies",
                    `Check-in from ${property.checkInTime || "2:00 PM"}. Check-out by ${property.checkOutTime || "11:00 AM"}. Guests must carry a valid government ID. Quiet hours are 10:00 PM – 7:00 AM.`,
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
                    style={({ pressed }) => [
                      styles.policyCard,
                      openPolicy === key && styles.policyCardOpen,
                      pressed && styles.pressed,
                      Platform.select({
                        web: { cursor: "pointer", outlineStyle: "none" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    <View style={styles.policyHead}>
                      <Text style={styles.policyTitle}>{title}</Text>
                      <ChevronDown
                        size={18}
                        color={openPolicy === key ? colors.gold : colors.textMuted}
                        style={openPolicy === key ? { transform: [{ rotate: "180deg" }] } : undefined}
                      />
                    </View>
                    {openPolicy === key ? (
                      <Text style={styles.policyCopy}>{copy}</Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Right Column: Sticky Booking Card right next to the image on Desktop */}
            {wide ? (
              <View style={styles.rightColumn}>{bookingCard}</View>
            ) : null}
          </View>
        </View>

        {/* Desktop Footer */}
        <CustomerFooter />
      </ScrollView>

      {/* Sticky Bottom Bar for Mobile Only */}
      {!wide ? (
        <View style={styles.mobileStickyFooter}>
          <View>
            <Text style={styles.footerLabel}>
              {isDatesUnavailable ? "Dates Status" : "Total Price"}
            </Text>
            <Text
              style={[
                styles.footerPrice,
                isDatesUnavailable && { color: "#EF4444", fontSize: 15 },
              ]}
            >
              {isDatesUnavailable ? "Unavailable" : `₹${total.toLocaleString("en-IN")}`}
            </Text>
            <Text style={styles.footerMeta}>
              {isDatesUnavailable
                ? "Overlaps booked dates"
                : isNoAccomSelected
                ? "No accommodation selected"
                : `${nights} ${nights === 1 ? "Night" : "Nights"} • ${guests} ${guests === 1 ? "Guest" : "Guests"}`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isDatesUnavailable || isNoAccomSelected}
            onPress={isDatesUnavailable ? () => setCalendarOpen(true) : isNoAccomSelected ? undefined : startBooking}
            style={[
              styles.mobileContinueBtn,
              (isDatesUnavailable || isNoAccomSelected) && styles.mobileContinueBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.mobileContinueText,
                (isDatesUnavailable || isNoAccomSelected) && styles.mobileContinueTextDisabled,
              ]}
            >
              {isDatesUnavailable ? "Change Dates" : isNoAccomSelected ? "Add Guests" : "Continue"}
            </Text>
            <ArrowRight
              size={15}
              color={(isDatesUnavailable || isNoAccomSelected) ? colors.textMuted : colors.actionInk}
            />
          </Pressable>
        </View>
      ) : null}

      {/* Interactive Square Calendar Modal */}
      <CalendarSheet
        visible={calendarOpen}
        initialTarget={calendarTarget}
        availability={availability}
        checkIn={checkIn}
        checkOut={checkOut}
        nightlyPrice={nightlyPrice}
        units={property.units || []}
        selectedUnitId={selectedUnit?.id}
        onSelectUnit={(id) => setSelectedUnitId(id)}
        isVilla={isVilla}
        totalInventory={unitTotalInventory}
        stayTypeName={selectedUnit?.name || property.name}
        unitQuantity={unitQuantity}
        onClose={() => setCalendarOpen(false)}
        onApply={(a, b) => {
          setCheckIn(a);
          setCheckOut(b);
          setCalendarOpen(false);
        }}
      />
    </View>
  );
}

function HeroMobile({
  property,
  saved,
  onSaved,
  maxGuests,
  bedrooms,
}: {
  property: Property;
  saved: boolean;
  onSaved: () => void;
  maxGuests: number;
  bedrooms: number;
}) {
  return (
    <View style={styles.mobileHero}>
      <Image
        source={property.image}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          "rgba(5,7,9,0.45)",
          "transparent",
          "rgba(5,7,9,0.85)",
          "rgba(5,7,9,0.98)",
        ]}
        locations={[0, 0.3, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Mobile-only floating actions */}
      <View style={styles.mobileHeroActions}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.mobileCircleBtn}
        >
          <ChevronLeft size={22} color="white" />
        </Pressable>
        <View style={styles.mobileActionRow}>
          <Pressable
            accessibilityLabel={saved ? "Unsave property" : "Save property"}
            onPress={onSaved}
            style={styles.mobileCircleBtn}
          >
            <Heart
              size={18}
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
            style={styles.mobileCircleBtn}
          >
            <Share2 size={18} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Hero Meta Overlay */}
      <View style={styles.mobileHeroCopy}>
        <View style={styles.badgeRow}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{property.badge}</Text>
          </View>
          <View style={styles.tierPill}>
            <Text style={styles.tierPillText}>{property.tier.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.mobileHeroTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mobileHeroTitle}>
              {property.name}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.gold} />
              <Text numberOfLines={1} style={styles.locationText}>
                {property.locationLabel}, Maharashtra
              </Text>
            </View>
          </View>

          <View style={styles.ratingCard}>
            <View style={styles.ratingInline}>
              <Star size={14} fill={colors.gold} color={colors.gold} />
              <Text style={styles.ratingNumber}>
                {property.rating.toFixed(1)}
              </Text>
              <Text style={styles.ratingCount}>({property.reviews})</Text>
            </View>
            <Text style={styles.lovedTag}>100% Verified Stay</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Spec({
  Icon,
  text,
  highlight = false,
}: {
  Icon: typeof Users;
  text: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.specChip, highlight && styles.specChipHighlight]}>
      <Icon size={13} color={colors.gold} />
      <Text style={[styles.specText, highlight && styles.specTextHighlight]}>
        {text}
      </Text>
    </View>
  );
}

function AccommodationTypesPanel({
  units,
  assignedPersonsMap = {},
  onAssignedPersonsChange,
  checkIn,
  checkOut,
  unitAvailabilityMap = {},
  fallbackAvailability = [],
  onCalendar,
}: {
  units: NonNullable<Property["units"]>;
  assignedPersonsMap?: Record<number, number>;
  onAssignedPersonsChange?: (unitId: number, count: number) => void;
  checkIn: Date;
  checkOut: Date;
  unitAvailabilityMap?: Record<number, CalendarDay[]>;
  fallbackAvailability?: CalendarDay[];
  onCalendar: (target?: "checkIn" | "checkOut", unitId?: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const windowClass = useWindowClass();
  const isMobile = windowClass === "compact";

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tent") || lower.includes("camp")) {
      return Tent;
    }
    if (
      lower.includes("cottage") ||
      lower.includes("cabin") ||
      lower.includes("villa") ||
      lower.includes("house") ||
      lower.includes("chalet")
    ) {
      return Home;
    }
    return BedDouble;
  };

  return (
    <View style={styles.accomContainer}>
      {/* Header */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle Accommodation Types panel"
        onPress={() => setIsExpanded((prev) => !prev)}
        style={styles.accomHeader}
      >
        <View style={styles.accomHeaderLeft}>
          <Text style={styles.accomTitle}>Accommodation Types</Text>
          <Text style={styles.accomSubtitle}>
            {units.length} {units.length === 1 ? "option" : "options"} available for selected dates
          </Text>
        </View>
        <View style={styles.accomToggleBtn}>
          {isExpanded ? (
            <ChevronUp size={14} color={colors.gold} />
          ) : (
            <ChevronDown size={14} color={colors.gold} />
          )}
        </View>
      </Pressable>

      {/* List of Accommodation Types (Horizontal Ribbons) */}
      {isExpanded ? (
        <View style={styles.accomList}>
          {units.map((unit) => {
            const assignedPersons = assignedPersonsMap[unit.id] || 0;
            const isSelected = assignedPersons > 0;
            const cap = unit.totalPersons || 2;
            const requiredUnits = Math.ceil(assignedPersons / cap);
            const totalInv = unit.totalInventory || 1;
            const totalSeats = totalInv * cap;
            const unitDays =
              unitAvailabilityMap[unit.id] ||
              (isSelected ? fallbackAvailability : []);
            const rangeCheck = checkUnavailableRange(
              checkIn,
              checkOut,
              unitDays,
              1,
              false,
              totalInv
            );
            const minAvailable = rangeCheck.minAvailableAcrossStay;
            const availableSeats = Math.max(0, minAvailable * cap);
            const isSoldOut = minAvailable <= 0 || availableSeats <= 0;
            const maxAssignablePersons = availableSeats;
            const IconComp = getCategoryIcon(unit.name);

            const nights = Math.max(
              1,
              Math.round(
                (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
              )
            );
            const itemNights = Array.from({ length: nights }, (_, index) => {
              const date = isoDay(addDays(checkIn, index));
              return (
                unitDays.find((day) => day.date.slice(0, 10) === date)?.price ??
                unit.weekdayPrice ??
                0
              );
            });
            const unitNightly = itemNights[0] ?? unit.weekdayPrice ?? 0;
            const unitStayTotal = itemNights.reduce((sum, p) => sum + p, 0);
            const subtotal = unitStayTotal * requiredUnits;

            return (
              <View
                key={unit.id}
                style={[
                  styles.ribbonRow,
                  isMobile && styles.ribbonRowMobileContainer,
                  isSelected && styles.ribbonRowSelected,
                  !isSelected && !isSoldOut && styles.ribbonRowUnselected,
                  isSoldOut && styles.ribbonRowSoldOut,
                ]}
              >
                {!isMobile ? (
                  /* ================= DESKTOP & TABLET: SINGLE HORIZONTAL RIBBON ================= */
                  <View style={styles.ribbonDesktopContent}>
                    {/* Col 1: Icon + Name + Price + Meta */}
                    <View style={styles.ribbonColInfo}>
                      <View
                        style={[
                          styles.ribbonIconBox,
                          isSelected && styles.ribbonIconBoxSelected,
                        ]}
                      >
                        <IconComp
                          size={15}
                          color={isSelected ? colors.actionInk : colors.gold}
                        />
                      </View>
                      <View style={styles.ribbonInfoText}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.ribbonName,
                            isSelected && styles.ribbonNameSelected,
                          ]}
                        >
                          {unit.name}
                        </Text>
                        <View style={styles.ribbonPriceRow}>
                          <Text
                            style={[
                              styles.ribbonPriceText,
                              isSelected && styles.ribbonPriceTextSelected,
                              isSoldOut && styles.ribbonPriceTextSoldOut,
                            ]}
                          >
                            ₹{unitNightly.toLocaleString("en-IN")}
                          </Text>
                          <Text style={styles.ribbonPriceSub}>/ night</Text>
                        </View>
                        <Text numberOfLines={1} style={styles.ribbonMeta}>
                          {cap} Guests/Unit • {totalSeats} seats
                        </Text>
                      </View>
                    </View>

                    {/* Col 2: Availability Count + Status */}
                    <View style={styles.ribbonColAvail}>
                      <Text
                        style={[
                          styles.ribbonAvailCount,
                          isSoldOut
                            ? styles.ribbonAvailCountSoldOut
                            : styles.ribbonAvailCountAvail,
                        ]}
                      >
                        {isSoldOut ? `0/${totalSeats}` : `${availableSeats}/${totalSeats}`}
                      </Text>
                      <View
                        style={[
                          styles.ribbonStatusPill,
                          isSoldOut
                            ? styles.ribbonStatusPillSoldOut
                            : styles.ribbonStatusPillAvail,
                        ]}
                      >
                        <View
                          style={[
                            styles.ribbonStatusDot,
                            isSoldOut
                              ? styles.ribbonStatusDotSoldOut
                              : styles.ribbonStatusDotAvail,
                          ]}
                        />
                        <Text
                          style={[
                            styles.ribbonStatusPillText,
                            isSoldOut
                              ? styles.ribbonStatusTextSoldOut
                              : styles.ribbonStatusTextAvail,
                          ]}
                        >
                          {isSoldOut ? "Sold Out" : "Available"}
                        </Text>
                      </View>
                    </View>

                    {/* Col 3: Person Quantity Selector */}
                    <View style={styles.ribbonColQty}>
                      <Text
                        style={[
                          styles.ribbonQtyLabel,
                          isSelected && styles.ribbonQtyLabelSelected,
                        ]}
                      >
                        Guests
                      </Text>
                      <View
                        style={[
                          styles.ribbonStepperBox,
                          isSelected && styles.ribbonStepperBoxActive,
                          !isSelected && styles.ribbonStepperBoxInactive,
                        ]}
                      >
                        <Pressable
                          accessibilityLabel="Decrease guests"
                          disabled={assignedPersons <= 0}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            onAssignedPersonsChange?.(
                              unit.id,
                              Math.max(0, assignedPersons - 1)
                            );
                          }}
                          style={[
                            styles.ribbonStepBtn,
                            assignedPersons <= 0 &&
                              styles.ribbonStepBtnDisabled,
                          ]}
                        >
                          <Minus
                            size={10}
                            color={
                              assignedPersons <= 0
                                ? colors.textMuted
                                : colors.text
                            }
                          />
                        </Pressable>

                        <Text
                          style={[
                            styles.ribbonQtyNum,
                            isSelected && styles.ribbonQtyNumActive,
                            !isSelected && styles.ribbonQtyNumInactive,
                          ]}
                        >
                          {assignedPersons}
                        </Text>

                        <Pressable
                          accessibilityLabel="Increase guests"
                          disabled={
                            isSoldOut || assignedPersons >= maxAssignablePersons
                          }
                          onPress={(e) => {
                            e.stopPropagation?.();
                            onAssignedPersonsChange?.(
                              unit.id,
                              Math.min(
                                maxAssignablePersons,
                                assignedPersons + 1
                              )
                            );
                          }}
                          style={[
                            styles.ribbonStepBtn,
                            (isSoldOut ||
                              assignedPersons >= maxAssignablePersons) &&
                              styles.ribbonStepBtnDisabled,
                          ]}
                        >
                          <Plus
                            size={10}
                            color={
                              isSoldOut ||
                              assignedPersons >= maxAssignablePersons
                                ? colors.textMuted
                                : colors.text
                            }
                          />
                        </Pressable>
                      </View>

                      <Text numberOfLines={1} style={styles.ribbonQtyNote}>
                        {isSoldOut
                          ? "Sold Out"
                          : assignedPersons > 0
                          ? `${requiredUnits} ${
                              requiredUnits === 1 ? "unit" : "units"
                            } • ₹${subtotal.toLocaleString("en-IN")}`
                          : `Tap + to add`}
                      </Text>
                    </View>

                    {/* Col 4: Calendar */}
                    <View style={styles.ribbonColCal}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`View availability calendar for ${unit.name}`}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          onCalendar("checkIn", unit.id);
                        }}
                        style={({ pressed }) => [
                          styles.ribbonCalBtn,
                          isSelected && styles.ribbonCalBtnSelected,
                          pressed && styles.pressed,
                          Platform.select({
                            web: {
                              cursor: "pointer",
                              outlineStyle: "none",
                            } as any,
                            default: {},
                          }),
                        ]}
                      >
                        <CalendarDays
                          size={14}
                          color={isSelected ? colors.actionInk : colors.gold}
                        />
                        <Text
                          style={[
                            styles.ribbonCalText,
                            isSelected && styles.ribbonCalTextSelected,
                          ]}
                        >
                          Calendar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  /* ================= MOBILE: COMPACT RESPONSIVE RIBBON ================= */
                  <View style={styles.ribbonMobileContent}>
                    {/* Tier 1: Info (Left) + Calendar (Right) */}
                    <View style={styles.ribbonMobileTop}>
                      <View style={styles.ribbonColInfo}>
                        <View
                          style={[
                            styles.ribbonIconBox,
                            isSelected && styles.ribbonIconBoxSelected,
                          ]}
                        >
                          <IconComp
                            size={14}
                            color={isSelected ? colors.actionInk : colors.gold}
                          />
                        </View>
                        <View style={styles.ribbonInfoText}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.ribbonName,
                              isSelected && styles.ribbonNameSelected,
                            ]}
                          >
                            {unit.name}
                          </Text>
                          <View style={styles.ribbonPriceRow}>
                            <Text
                              style={[
                                styles.ribbonPriceText,
                                isSelected && styles.ribbonPriceTextSelected,
                                isSoldOut && styles.ribbonPriceTextSoldOut,
                              ]}
                            >
                              ₹{unitNightly.toLocaleString("en-IN")}
                            </Text>
                            <Text style={styles.ribbonPriceSub}>/ night</Text>
                          </View>
                          <Text numberOfLines={1} style={styles.ribbonMeta}>
                            {cap} Guests/Unit • {totalSeats} seats
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`View availability calendar for ${unit.name}`}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          onCalendar("checkIn", unit.id);
                        }}
                        style={({ pressed }) => [
                          styles.ribbonCalBtn,
                          isSelected && styles.ribbonCalBtnSelected,
                          pressed && styles.pressed,
                          Platform.select({
                            web: {
                              cursor: "pointer",
                              outlineStyle: "none",
                            } as any,
                            default: {},
                          }),
                        ]}
                      >
                        <CalendarDays
                          size={13}
                          color={isSelected ? colors.actionInk : colors.gold}
                        />
                        <Text
                          style={[
                            styles.ribbonCalText,
                            isSelected && styles.ribbonCalTextSelected,
                          ]}
                        >
                          Calendar
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.ribbonMobileDivider} />

                    {/* Tier 2: Availability (Left) + Quantity (Right) */}
                    <View style={styles.ribbonMobileBottom}>
                      {/* Availability */}
                      <View style={styles.ribbonColAvailMobile}>
                        <Text
                          style={[
                            styles.ribbonAvailCount,
                            isSoldOut
                              ? styles.ribbonAvailCountSoldOut
                              : styles.ribbonAvailCountAvail,
                          ]}
                        >
                          {isSoldOut
                            ? `0/${totalSeats}`
                            : `${availableSeats}/${totalSeats}`}
                        </Text>
                        <View
                          style={[
                            styles.ribbonStatusPill,
                            isSoldOut
                              ? styles.ribbonStatusPillSoldOut
                              : styles.ribbonStatusPillAvail,
                          ]}
                        >
                          <View
                            style={[
                              styles.ribbonStatusDot,
                              isSoldOut
                                ? styles.ribbonStatusDotSoldOut
                                : styles.ribbonStatusDotAvail,
                            ]}
                          />
                          <Text
                            style={[
                              styles.ribbonStatusPillText,
                              isSoldOut
                                ? styles.ribbonStatusTextSoldOut
                                : styles.ribbonStatusTextAvail,
                            ]}
                          >
                            {isSoldOut ? "Sold Out" : "Available"}
                          </Text>
                        </View>
                      </View>

                      {/* Quantity Stepper */}
                      <View style={styles.ribbonColQtyMobile}>
                        <View
                          style={[
                            styles.ribbonStepperBox,
                            isSelected && styles.ribbonStepperBoxActive,
                            !isSelected && styles.ribbonStepperBoxInactive,
                          ]}
                        >
                          <Pressable
                            accessibilityLabel="Decrease guests"
                            disabled={assignedPersons <= 0}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              onAssignedPersonsChange?.(
                                unit.id,
                                Math.max(0, assignedPersons - 1)
                              );
                            }}
                            style={[
                              styles.ribbonStepBtn,
                              assignedPersons <= 0 &&
                                styles.ribbonStepBtnDisabled,
                            ]}
                          >
                            <Minus
                              size={10}
                              color={
                                assignedPersons <= 0
                                  ? colors.textMuted
                                  : colors.text
                              }
                            />
                          </Pressable>

                          <Text
                            style={[
                              styles.ribbonQtyNum,
                              isSelected && styles.ribbonQtyNumActive,
                              !isSelected && styles.ribbonQtyNumInactive,
                            ]}
                          >
                            {assignedPersons}
                          </Text>

                          <Pressable
                            accessibilityLabel="Increase guests"
                            disabled={
                              isSoldOut ||
                              assignedPersons >= maxAssignablePersons
                            }
                            onPress={(e) => {
                              e.stopPropagation?.();
                              onAssignedPersonsChange?.(
                                unit.id,
                                Math.min(
                                  maxAssignablePersons,
                                  assignedPersons + 1
                                )
                              );
                            }}
                            style={[
                              styles.ribbonStepBtn,
                              (isSoldOut ||
                                assignedPersons >= maxAssignablePersons) &&
                                styles.ribbonStepBtnDisabled,
                            ]}
                          >
                            <Plus
                              size={10}
                              color={
                                isSoldOut ||
                                assignedPersons >= maxAssignablePersons
                                  ? colors.textMuted
                                  : colors.text
                              }
                            />
                          </Pressable>
                        </View>

                        <Text numberOfLines={1} style={styles.ribbonQtyNote}>
                          {isSoldOut
                            ? "Sold Out"
                            : assignedPersons > 0
                            ? `${requiredUnits} ${
                                requiredUnits === 1 ? "unit" : "units"
                              } • ₹${subtotal.toLocaleString("en-IN")}`
                            : `Tap + to add`}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function BookingCard({
  property,
  units,
  selectedUnitId,
  onUnit,
  guests,
  maxGuests,
  males,
  females,
  veg,
  nonVeg,
  hasFood = true,
  onMales,
  onFemales,
  onVeg,
  onNonVeg,
  checkIn,
  checkOut,
  isDatesUnavailable = false,
  bookedDates = [],
  onGuests,
  unitQuantity = 1,
  onUnitQuantityChange,
  maxAvailableUnits = 1,
  totalInventory = 1,
  isVilla = true,
  availability = [],
  unitAvailabilityMap = {},
  onCalendar,
  onBook,
  isMultiAccom = false,
  activeAccommodationItems = [],
  assignedPersonsMap = {},
  onAssignedPersonsChange,
}: {
  property: Property;
  units: NonNullable<Property["units"]>;
  selectedUnitId?: number;
  onUnit: (id: number) => void;
  guests: number;
  maxGuests: number;
  males: number;
  females: number;
  veg: number;
  nonVeg: number;
  hasFood?: boolean;
  onMales: (val: number) => void;
  onFemales: (val: number) => void;
  onVeg: (val: number) => void;
  onNonVeg: (val: number) => void;
  checkIn: Date;
  checkOut: Date;
  isDatesUnavailable?: boolean;
  bookedDates?: string[];
  onGuests: (n: number) => void;
  unitQuantity?: number;
  onUnitQuantityChange?: (n: number) => void;
  maxAvailableUnits?: number;
  totalInventory?: number;
  isVilla?: boolean;
  availability?: CalendarDay[];
  unitAvailabilityMap?: Record<number, CalendarDay[]>;
  onCalendar: (target?: "checkIn" | "checkOut", unitId?: number) => void;
  onBook: () => void;
  isMultiAccom?: boolean;
  activeAccommodationItems?: Array<{
    unitId: number;
    unitName: string;
    persons: number;
    unitQuantity: number;
    pricePerUnitNight: number;
    subtotal: number;
    totalPersonsPerUnit: number;
    totalInventory: number;
  }>;
  assignedPersonsMap?: Record<number, number>;
  onAssignedPersonsChange?: (unitId: number, count: number) => void;
}) {
  const windowClass = useWindowClass();
  const isTablet = useIsTablet();
  const wide = windowClass !== "compact";

  const nights = Math.max(
    1,
    Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
  );
  const multiAccomTotal = activeAccommodationItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = isMultiAccom
    ? multiAccomTotal
    : property.priceAmount * nights * (isVilla ? 1 : unitQuantity);
  const isNoAccomSelected = isMultiAccom && activeAccommodationItems.length === 0;

  return (
    <View
      style={[
        styles.bookingCard,
        wide && styles.bookingCardWide,
        isTablet && styles.bookingCardTablet,
      ]}
    >
      <View style={styles.bookingCardTop}>
        {/* Header Price */}
        <View style={styles.bookingHeader}>
          <View>
            <View style={styles.priceHeadingRow}>
              <Text style={styles.priceLabel}>Price starting at</Text>
              <View style={styles.bestPriceBadge}>
                <Sparkles size={10} color={colors.gold} />
                <Text style={styles.bestPriceText}>Best Rate</Text>
              </View>
            </View>
            <View style={styles.priceAmountRow}>
              <Text style={styles.priceAmount}>
                ₹{property.priceAmount.toLocaleString("en-IN")}
              </Text>
              <Text style={styles.pricePerNight}> / night</Text>
            </View>
          </View>
          <View style={styles.freeCancelPill}>
            <ShieldCheck size={12} color="#4ADE80" />
            <Text style={styles.freeCancelText}>Free Cancel 48h</Text>
          </View>
        </View>

        {/* Two Separate Date Selectors (Check-In and Check-Out) */}
        <View style={styles.configCard}>
          <View style={styles.configDatesRow}>
            {/* Separate Check-In Selector Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select Check-In date"
              onPress={() => onCalendar("checkIn")}
              style={({ pressed }) => [
                styles.configDateHalf,
                pressed && styles.pressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <View style={styles.configColHeader}>
                <CalendarDays size={11} color={colors.gold} />
                <Text style={styles.configColLabel}>CHECK-IN</Text>
              </View>
              <Text numberOfLines={1} style={styles.configDateValue}>
                {dateLabel(checkIn)}
              </Text>
              <Text style={styles.configDayName}>{dayName(checkIn)}</Text>
            </Pressable>

            <View style={styles.configDividerVertical} />

            {/* Separate Check-Out Selector Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select Check-Out date"
              onPress={() => onCalendar("checkOut")}
              style={({ pressed }) => [
                styles.configDateHalf,
                pressed && styles.pressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <View style={styles.configColHeader}>
                <CalendarDays size={11} color={colors.gold} />
                <Text style={styles.configColLabel}>CHECK-OUT</Text>
              </View>
              <Text numberOfLines={1} style={styles.configDateValue}>
                {dateLabel(checkOut)}
              </Text>
              <Text style={styles.configDayName}>{dayName(checkOut)}</Text>
            </Pressable>
          </View>

          <View style={styles.configDividerHorizontal} />

          {/* Sub-bar with Nights count & Stay Scope Info */}
          <View style={styles.configSubRow}>
            <View style={styles.nightsChip}>
              <Text style={styles.nightsChipText}>
                {nights} {nights === 1 ? "Night" : "Nights"} Selected
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.nightsSubNote}>
                {isVilla ? "Whole Villa Stay" : "Accommodation Selected"}
              </Text>
            </View>
          </View>
        </View>

        {/* Accommodation Types Panel for multi-unit properties (Camping & Cottages, Resorts, Homestays) */}
        {!isVilla && units.length > 0 ? (
          <AccommodationTypesPanel
            units={units}
            assignedPersonsMap={assignedPersonsMap}
            onAssignedPersonsChange={onAssignedPersonsChange}
            checkIn={checkIn}
            checkOut={checkOut}
            unitAvailabilityMap={unitAvailabilityMap}
            fallbackAvailability={availability}
            onCalendar={onCalendar}
          />
        ) : !isVilla && totalInventory > 1 ? (
          <View style={styles.unitQuantityRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
              <BedDouble size={13} color={colors.gold} />
              <View>
                <Text style={styles.unitQuantityLabel}>Units Booked</Text>
                <Text style={styles.unitQuantitySub}>
                  {maxAvailableUnits} available for selected dates
                </Text>
              </View>
            </View>

            <View style={styles.unitQuantityStepper}>
              <Pressable
                accessibilityLabel="Decrease booked units"
                disabled={unitQuantity <= 1}
                onPress={() => onUnitQuantityChange?.(Math.max(1, unitQuantity - 1))}
                style={[styles.miniStepBtn, unitQuantity <= 1 && styles.miniStepBtnDisabled]}
              >
                <Minus size={10} color={unitQuantity <= 1 ? colors.textMuted : colors.text} />
              </Pressable>
              <Text style={styles.demoCount}>{unitQuantity}</Text>
              <Pressable
                accessibilityLabel="Increase booked units"
                disabled={unitQuantity >= maxAvailableUnits}
                onPress={() => onUnitQuantityChange?.(Math.min(maxAvailableUnits, unitQuantity + 1))}
                style={[styles.miniStepBtn, unitQuantity >= maxAvailableUnits && styles.miniStepBtnDisabled]}
              >
                <Plus size={10} color={unitQuantity >= maxAvailableUnits ? colors.textMuted : colors.text} />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Dedicated Guest Selector Section (Post Accommodation & Unit Quantity) */}
        <View style={styles.guestSelectionCard}>
          <View style={styles.guestSelectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Users size={13} color={colors.gold} />
              <Text style={styles.guestSelectionTitle}>Total Guests</Text>
            </View>
            <Text style={styles.guestSelectionCapacity}>
              {isMultiAccom
                ? `${guests} ${guests === 1 ? "guest" : "guests"} selected`
                : `Max ${maxGuests} ${maxGuests === 1 ? "guest" : "guests"} ${!isVilla && unitQuantity > 1 ? `(${unitQuantity} units)` : ""}`}
            </Text>
          </View>

          {isMultiAccom ? (
            <View style={styles.guestSelectionControls}>
              <Text style={styles.guestSelectionHint}>
                Assigned across {activeAccommodationItems.length} accommodation {activeAccommodationItems.length === 1 ? "type" : "types"} above
              </Text>
              <View style={{ backgroundColor: "rgba(224, 184, 74, 0.12)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: "rgba(224, 184, 74, 0.3)" }}>
                <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansBold, fontSize: 13 }}>
                  {guests} {guests === 1 ? "Guest" : "Guests"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.guestSelectionControls}>
              <Text style={styles.guestSelectionHint}>
                Guests staying for {nights} {nights === 1 ? "night" : "nights"}
              </Text>
              <View style={styles.guestStepperRow}>
                <Pressable
                  accessibilityLabel="Decrease guests"
                  disabled={guests <= 1}
                  onPress={() => onGuests(Math.max(1, guests - 1))}
                  style={[styles.stepBtn, guests <= 1 && styles.stepBtnDisabled]}
                >
                  <Minus size={11} color={guests <= 1 ? colors.textMuted : colors.text} />
                </Pressable>
                <Text style={styles.guestSelectionCount}>{guests}</Text>
                <Pressable
                  accessibilityLabel="Increase guests"
                  disabled={guests >= maxGuests}
                  onPress={() => onGuests(Math.min(maxGuests, guests + 1))}
                  style={[styles.stepBtn, guests >= maxGuests && styles.stepBtnDisabled]}
                >
                  <Plus size={11} color={guests >= maxGuests ? colors.textMuted : colors.text} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Guest Demographics & Meal Preferences Breakdown */}
        <View style={styles.demographicsCard}>
          {/* Group 1: Male & Female */}
          <View style={styles.demoGroup}>
            <View style={styles.demoHeader}>
              <View style={styles.demoTitleRow}>
                <Users size={11} color={colors.gold} />
                <Text style={styles.demoTitle}>Guest Breakdown</Text>
              </View>
              <Text style={styles.demoSubtitle}>
                {males}M + {females}F = {guests} {guests === 1 ? "Guest" : "Guests"}
              </Text>
            </View>

            <View style={styles.demoInputsRow}>
              {/* Male Counter */}
              <View style={styles.demoBox}>
                <View style={styles.demoBoxHead}>
                  <User size={12} color={colors.gold} />
                  <Text style={styles.demoBoxLabel}>Male</Text>
                </View>
                <View style={styles.demoStepper}>
                  <Pressable
                    accessibilityLabel="Decrease males"
                    disabled={males <= 0}
                    onPress={() => onMales(males - 1)}
                    style={[styles.miniStepBtn, males <= 0 && styles.miniStepBtnDisabled]}
                  >
                    <Minus size={10} color={males <= 0 ? colors.textMuted : colors.text} />
                  </Pressable>
                  <Text style={styles.demoCount}>{males}</Text>
                  <Pressable
                    accessibilityLabel="Increase males"
                    disabled={males >= guests}
                    onPress={() => onMales(males + 1)}
                    style={[styles.miniStepBtn, males >= guests && styles.miniStepBtnDisabled]}
                  >
                    <Plus size={10} color={males >= guests ? colors.textMuted : colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Female Counter */}
              <View style={styles.demoBox}>
                <View style={styles.demoBoxHead}>
                  <UserCheck size={12} color="#F472B6" />
                  <Text style={styles.demoBoxLabel}>Female</Text>
                </View>
                <View style={styles.demoStepper}>
                  <Pressable
                    accessibilityLabel="Decrease females"
                    disabled={females <= 0}
                    onPress={() => onFemales(females - 1)}
                    style={[styles.miniStepBtn, females <= 0 && styles.miniStepBtnDisabled]}
                  >
                    <Minus size={10} color={females <= 0 ? colors.textMuted : colors.text} />
                  </Pressable>
                  <Text style={styles.demoCount}>{females}</Text>
                  <Pressable
                    accessibilityLabel="Increase females"
                    disabled={females >= guests}
                    onPress={() => onFemales(females + 1)}
                    style={[styles.miniStepBtn, females >= guests && styles.miniStepBtnDisabled]}
                  >
                    <Plus size={10} color={females >= guests ? colors.textMuted : colors.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {hasFood ? (
            <>
              <View style={styles.demoDivider} />

              {/* Group 2: Veg & Non-Veg */}
              <View style={styles.demoGroup}>
                <View style={styles.demoHeader}>
                  <View style={styles.demoTitleRow}>
                    <Utensils size={11} color={colors.gold} />
                    <Text style={styles.demoTitle}>Meal Preference</Text>
                  </View>
                  <Text style={styles.demoSubtitle}>
                    {veg} Veg + {nonVeg} Non-Veg = {guests} {guests === 1 ? "Guest" : "Guests"}
                  </Text>
                </View>

                <View style={styles.demoInputsRow}>
                  {/* Veg Counter */}
                  <View style={styles.demoBox}>
                    <View style={styles.demoBoxHead}>
                      <View style={styles.vegIndicator} />
                      <Text style={styles.demoBoxLabel}>Veg</Text>
                    </View>
                    <View style={styles.demoStepper}>
                      <Pressable
                        accessibilityLabel="Decrease veg"
                        disabled={veg <= 0}
                        onPress={() => onVeg(veg - 1)}
                        style={[styles.miniStepBtn, veg <= 0 && styles.miniStepBtnDisabled]}
                      >
                        <Minus size={10} color={veg <= 0 ? colors.textMuted : colors.text} />
                      </Pressable>
                      <Text style={styles.demoCount}>{veg}</Text>
                      <Pressable
                        accessibilityLabel="Increase veg"
                        disabled={veg >= guests}
                        onPress={() => onVeg(veg + 1)}
                        style={[styles.miniStepBtn, veg >= guests && styles.miniStepBtnDisabled]}
                      >
                        <Plus size={10} color={veg >= guests ? colors.textMuted : colors.text} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Non-Veg Counter */}
                  <View style={styles.demoBox}>
                    <View style={styles.demoBoxHead}>
                      <View style={styles.nonVegIndicator} />
                      <Text style={styles.demoBoxLabel}>Non-Veg</Text>
                    </View>
                    <View style={styles.demoStepper}>
                      <Pressable
                        accessibilityLabel="Decrease non-veg"
                        disabled={nonVeg <= 0}
                        onPress={() => onNonVeg(nonVeg - 1)}
                        style={[styles.miniStepBtn, nonVeg <= 0 && styles.miniStepBtnDisabled]}
                      >
                        <Minus size={10} color={nonVeg <= 0 ? colors.textMuted : colors.text} />
                      </Pressable>
                      <Text style={styles.demoCount}>{nonVeg}</Text>
                      <Pressable
                        accessibilityLabel="Increase non-veg"
                        disabled={nonVeg >= guests}
                        onPress={() => onNonVeg(nonVeg + 1)}
                        style={[styles.miniStepBtn, nonVeg >= guests && styles.miniStepBtnDisabled]}
                      >
                        <Plus size={10} color={nonVeg >= guests ? colors.textMuted : colors.text} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Luxury Inclusions Strip */}
        <View style={styles.inclusionsRow}>
          <View style={styles.inclusionBadge}>
            <CheckCircle2 size={11} color={colors.gold} />
            <Text style={styles.inclusionText}>
              {isVilla ? "Entire Villa Access" : `${selectedUnitId ? "Reserved Accommodation" : "Full Stay"} Access`}
            </Text>
          </View>
          <View style={styles.inclusionBadge}>
            <CheckCircle2 size={11} color={colors.gold} />
            <Text style={styles.inclusionText}>Free Wi-Fi & Parking</Text>
          </View>
          <View style={styles.inclusionBadge}>
            <CheckCircle2 size={11} color={colors.gold} />
            <Text style={styles.inclusionText}>Host Assist</Text>
          </View>
        </View>

        {/* Total Price Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryBoxTitle}>Price Breakdown</Text>
            <Text style={styles.summaryGuarantee}>Taxes & Fees Included</Text>
          </View>
          {isMultiAccom && activeAccommodationItems.length > 0 ? (
            activeAccommodationItems.map((item) => (
              <View key={item.unitId} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {item.unitName} ({item.unitQuantity} {item.unitQuantity === 1 ? "unit" : "units"} for {item.persons}p × {nights}n)
                </Text>
                <Text style={styles.summaryVal}>₹{item.subtotal.toLocaleString("en-IN")}</Text>
              </View>
            ))
          ) : (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Base Fare (₹{property.priceAmount.toLocaleString("en-IN")} × {nights}n{!isVilla && unitQuantity > 1 ? ` × ${unitQuantity} units` : ""})
              </Text>
              <Text style={styles.summaryVal}>₹{total.toLocaleString("en-IN")}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sanitization & Host Service</Text>
            <Text style={styles.summaryValFree}>FREE</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Applicable GST & Stay Taxes</Text>
            <Text style={styles.summaryValFree}>Included</Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <View>
              <Text style={styles.summaryTotalLabel}>Total Payable</Text>
              <Text style={styles.summarySubNote}>Zero hidden charges</Text>
            </View>
            <Text style={styles.summaryTotalVal}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bookingCardBottom}>
        {/* Warning banner if dates overlap booked day */}
        {isDatesUnavailable ? (
          <Pressable
            onPress={() => onCalendar("checkIn")}
            style={styles.bookingCardWarningBanner}
          >
            <AlertTriangle size={13} color="#EF4444" />
            <Text style={styles.bookingCardWarningText}>
              Selected stay includes booked date(s) (
              {bookedDates && bookedDates.length ? bookedDates.join(", ") : "unavailable"}
              ). Tap to pick available dates.
            </Text>
          </Pressable>
        ) : isNoAccomSelected ? (
          <View style={styles.bookingCardInfoBanner}>
            <Sparkles size={13} color={colors.gold} />
            <Text style={styles.bookingCardInfoText}>
              Tap + on any accommodation type above to add guests and book.
            </Text>
          </View>
        ) : null}

        {/* Book CTA */}
        <Pressable
          accessibilityRole="button"
          disabled={isDatesUnavailable || isNoAccomSelected}
          onPress={
            isDatesUnavailable
              ? () => onCalendar("checkIn")
              : isNoAccomSelected
              ? undefined
              : onBook
          }
          style={({ pressed }) => [
            styles.bookButton,
            (isDatesUnavailable || isNoAccomSelected) && styles.bookButtonDisabled,
            pressed && !isDatesUnavailable && !isNoAccomSelected && styles.pressed,
            Platform.select({
              web: {
                cursor: (isDatesUnavailable || isNoAccomSelected) ? "not-allowed" : "pointer",
                outlineStyle: "none",
              } as any,
              default: {},
            }),
          ]}
        >
          <Text
            style={[
              styles.bookButtonText,
              (isDatesUnavailable || isNoAccomSelected) && styles.bookButtonTextDisabled,
            ]}
          >
            {isDatesUnavailable
              ? "Dates Unavailable (Change Dates)"
              : isNoAccomSelected
              ? "Add Guests Above to Continue"
              : "Continue Booking"}
          </Text>
          <ArrowRight
            size={16}
            color={(isDatesUnavailable || isNoAccomSelected) ? colors.textMuted : colors.actionInk}
          />
        </Pressable>

        <Text style={styles.noChargeNote}>
          🔒 You won't be charged yet • Instant confirmation
        </Text>

        {/* Trust Badges */}
        <View style={styles.trustGrid}>
          {trust.map(({ label, Icon }) => (
            <View key={label} style={styles.trustCell}>
              <Icon size={11} color={colors.gold} />
              <Text style={styles.trustLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function TabContent({
  tab,
  about,
  property,
  wide,
}: {
  tab: Tab;
  about: string;
  property: Property;
  wide: boolean;
}) {
  const propertyAmenities = property.amenities?.length
    ? property.amenities
    : amenities.map((item) => item.label);
  const propertyActivities = property.activities?.length
    ? property.activities
    : activities.map((item) => item.title);

  if (tab === "amenities")
    return (
      <View>
        <Text style={styles.tabSectionTitle}>Included Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {propertyAmenities.map((label, index) => {
            const Icon = amenities[index % amenities.length]!.Icon;
            return (
              <View key={label} style={[styles.amenityCard, wide && styles.amenityCardWide]}>
                <View style={styles.amenityIconCircle}>
                  <Icon size={18} color={colors.gold} />
                </View>
                <Text style={styles.amenityText}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );

  if (tab === "activities")
    return (
      <View>
        <Text style={styles.tabSectionTitle}>Experiences & Activities</Text>
        <View style={styles.activitiesGrid}>
          {propertyActivities.map((title, index) => (
            <View key={title} style={[styles.activityCard, wide && styles.activityCardWide]}>
              <Image
                source={activities[index % activities.length]!.image}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["transparent", "rgba(5,7,9,0.88)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.activityTitle}>{title}</Text>
            </View>
          ))}
        </View>
      </View>
    );

  if (tab === "schedule")
    return (
      <View>
        <Text style={styles.tabSectionTitle}>Property Schedule & Timings</Text>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleCard}>
            <CalendarDays size={18} color={colors.gold} />
            <Text style={styles.scheduleLabel}>Check-in Time</Text>
            <Text style={styles.scheduleValue}>
              {property.checkInTime || "2:00 PM onwards"}
            </Text>
          </View>
          <View style={styles.scheduleCard}>
            <Car size={18} color={colors.gold} />
            <Text style={styles.scheduleLabel}>Check-out Time</Text>
            <Text style={styles.scheduleValue}>
              {property.checkOutTime || "11:00 AM"}
            </Text>
          </View>
        </View>
        <Text style={styles.scheduleNote}>
          * Early check-in or late check-out is subject to availability and prior notice.
        </Text>
      </View>
    );

  return (
    <View>
      <Text style={styles.tabSectionTitle}>About this property</Text>
      <Text style={styles.aboutParagraph}>{about}</Text>
      <View style={styles.featuresRow}>
        {features.map(({ label, Icon }) => (
          <View key={label} style={styles.featurePill}>
            <Icon size={14} color={colors.gold} />
            <Text style={styles.featurePillText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CalendarSheet({
  visible,
  initialTarget = "checkIn",
  availability,
  checkIn,
  checkOut,
  nightlyPrice,
  units = [],
  selectedUnitId,
  onSelectUnit,
  isVilla = true,
  totalInventory = 1,
  stayTypeName = "Stay",
  unitQuantity = 1,
  onClose,
  onApply,
}: {
  visible: boolean;
  initialTarget?: "checkIn" | "checkOut";
  availability: CalendarDay[];
  checkIn: Date;
  checkOut: Date;
  nightlyPrice?: number;
  units?: Property["units"];
  selectedUnitId?: number;
  onSelectUnit?: (id: number) => void;
  isVilla?: boolean;
  totalInventory?: number;
  stayTypeName?: string;
  unitQuantity?: number;
  onClose: () => void;
  onApply: (checkIn: Date, checkOut: Date) => void;
}) {
  const [start, setStart] = useState(checkIn);
  const [end, setEnd] = useState(checkOut);
  const [activeTarget, setActiveTarget] = useState<"checkIn" | "checkOut">(initialTarget);
  const [viewDate, setViewDate] = useState(() => new Date(checkIn.getFullYear(), checkIn.getMonth(), 1));

  useEffect(() => {
    setStart(checkIn);
    setEnd(checkOut);
    setActiveTarget(initialTarget);
    setViewDate(new Date(checkIn.getFullYear(), checkIn.getMonth(), 1));
  }, [checkIn, checkOut, initialTarget, visible]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const canGoPrev = useMemo(() => {
    const prev = new Date(year, month - 1, 1);
    return (
      prev.getFullYear() > today.getFullYear() ||
      (prev.getFullYear() === today.getFullYear() && prev.getMonth() >= today.getMonth())
    );
  }, [year, month, today]);

  const monthGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [year, month]);

  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const estimatedTotal = (nightlyPrice || 12999) * nights * (isVilla ? 1 : unitQuantity);

  const currentUnit = units?.find((u) => u.id === selectedUnitId);
  const activeTotalInventory = isVilla ? 1 : Math.max(1, currentUnit?.totalInventory || totalInventory || 1);

  const rangeCheck = useMemo(
    () => checkUnavailableRange(start, end, availability, isVilla ? 1 : unitQuantity, isVilla, activeTotalInventory),
    [start, end, availability, isVilla, unitQuantity, activeTotalInventory]
  );
  const isInvalid = end <= start || rangeCheck.isInvalid;

  const handleDateClick = (d: Date) => {
    if (activeTarget === "checkIn") {
      setStart(d);
      if (end <= d || checkUnavailableRange(d, end, availability, isVilla ? 1 : unitQuantity, isVilla, activeTotalInventory).isInvalid) {
        setEnd(addDays(d, 1));
      }
      setActiveTarget("checkOut");
    } else {
      if (d <= start) {
        setStart(d);
        setEnd(addDays(d, 1));
        setActiveTarget("checkOut");
      } else {
        setEnd(d);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.squareCalendarCard}>
          {/* Header with Title & Close button */}
          <View style={styles.calModalHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <CalendarDays size={18} color={colors.gold} />
                <Text numberOfLines={1} style={styles.calModalTitle}>
                  {(currentUnit?.name || stayTypeName)} Availability
                </Text>
              </View>
              <Text style={styles.calModalSubtitle}>
                Total Inventory: <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansBold }}>{activeTotalInventory} {activeTotalInventory === 1 ? "unit" : "units"}</Text> • Real-time slot availability
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close calendar"
              onPress={onClose}
              style={({ pressed }) => [
                styles.calCloseBtn,
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

          {/* Stay Type Tabs inside Calendar Modal (if multiple units) */}
          {units && units.length > 1 ? (
            <View style={styles.calUnitTabsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calUnitTabsScroll}>
                {units.map((unit) => {
                  const active = unit.id === selectedUnitId;
                  const unitInv = unit.totalInventory || 1;
                  return (
                    <Pressable
                      key={unit.id}
                      onPress={() => onSelectUnit?.(unit.id)}
                      style={[styles.calUnitTab, active && styles.calUnitTabActive]}
                    >
                      <Text numberOfLines={1} style={[styles.calUnitTabText, active && styles.calUnitTabTextActive]}>
                        {unit.name}
                      </Text>
                      <View style={[styles.calUnitTabBadge, active && styles.calUnitTabBadgeActive]}>
                        <Text style={[styles.calUnitTabBadgeText, active && styles.calUnitTabBadgeTextActive]}>
                          {unitInv}u
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Two Separate Selector Buttons on Top of Pop-up */}
          <View style={styles.calTargetToggleRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTarget("checkIn")}
              style={[
                styles.calTargetCard,
                activeTarget === "checkIn" && styles.calTargetCardActive,
              ]}
            >
              <Text
                style={[
                  styles.calTargetLabel,
                  activeTarget === "checkIn" && styles.calTargetLabelActive,
                ]}
              >
                1. CHECK-IN DATE
              </Text>
              <Text style={styles.calTargetValue}>{dateLabel(start)}</Text>
              <Text style={styles.calTargetDay}>{dayName(start)}</Text>
            </Pressable>

            <View style={styles.calTargetArrow}>
              <ArrowRight size={14} color={colors.gold} />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTarget("checkOut")}
              style={[
                styles.calTargetCard,
                activeTarget === "checkOut" && styles.calTargetCardActive,
              ]}
            >
              <Text
                style={[
                  styles.calTargetLabel,
                  activeTarget === "checkOut" && styles.calTargetLabelActive,
                ]}
              >
                2. CHECK-OUT DATE
              </Text>
              <Text style={styles.calTargetValue}>{dateLabel(end)}</Text>
              <Text style={styles.calTargetDay}>{dayName(end)}</Text>
            </Pressable>
          </View>

          {/* Month Navigation Row */}
          <View style={styles.calMonthNav}>
            <Pressable
              disabled={!canGoPrev}
              onPress={prevMonth}
              style={[styles.calMonthNavBtn, !canGoPrev && styles.calMonthNavBtnDisabled]}
            >
              <ChevronLeft size={18} color={canGoPrev ? colors.text : colors.textMuted} />
            </Pressable>

            <Text style={styles.calMonthTitle}>
              {viewDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}
            </Text>

            <Pressable onPress={nextMonth} style={styles.calMonthNavBtn}>
              <ChevronRight size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Weekday Header (7 columns) */}
          <View style={styles.calWeekdaysRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View key={day} style={styles.calWeekdayCell}>
                <Text style={styles.calWeekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Square Month Days Grid (7 columns) */}
          <View style={styles.calDaysGrid}>
            {monthGrid.map((d, index) => {
              if (!d) {
                return <View key={`empty-${index}`} style={styles.calDayCell} />;
              }

              const dStart = new Date(d);
              dStart.setHours(0, 0, 0, 0);

              const isPast = dStart < today;
              const isStart = dStart.toDateString() === start.toDateString();
              const isEnd = dStart.toDateString() === end.toDateString();
              const isInRange = dStart > start && dStart < end;
              const isRangeInvalid = rangeCheck.isInvalid;
              const dayState = getDayAvailabilityState(dStart, availability, isVilla, activeTotalInventory);
              const cellTotal = isVilla ? 1 : Math.max(1, dayState.totalInventory || activeTotalInventory);
              const cellAvailable = Math.max(0, Math.min(cellTotal, dayState.availableQuantity));
              const isSoldOut = isVilla
                ? (dayState.isBooked || dayState.isPending)
                : cellAvailable <= 0;
              const disabled = isPast || (isSoldOut && activeTarget === "checkIn");

              return (
                <View key={d.toISOString()} style={styles.calDayCell}>
                  {/* In-range background styling */}
                  {isInRange ? (
                    <View
                      style={
                        isRangeInvalid ? styles.calRangeBandInvalid : styles.calRangeBand
                      }
                    />
                  ) : null}
                  {isStart && end > start ? (
                    <View
                      style={
                        isRangeInvalid
                          ? styles.calRangeBandRightInvalid
                          : styles.calRangeBandRight
                      }
                    />
                  ) : null}
                  {isEnd && end > start ? (
                    <View
                      style={
                        isRangeInvalid
                          ? styles.calRangeBandLeftInvalid
                          : styles.calRangeBandLeft
                      }
                    />
                  ) : null}

                  <Pressable
                    accessibilityLabel={`${dateLabel(d)} (${isVilla ? (dayState.isBooked ? "Sold Out" : "Available") : `${cellAvailable > 0 ? "Available" : "Booked"} ${cellAvailable}/${cellTotal}`})`}
                    disabled={disabled}
                    onPress={() => handleDateClick(d)}
                    style={({ pressed }) => [
                      styles.calDayBtn,
                      !isVilla && styles.calDayBtnInventory,
                      isStart && (isVilla ? styles.calDayBtnStart : styles.calDayBtnStartInventory),
                      isEnd && (isVilla ? styles.calDayBtnEnd : styles.calDayBtnEndInventory),
                      // In-range selected styling
                      isInRange && (
                        isRangeInvalid
                          ? styles.calDayBtnInRangeInvalid
                          : styles.calDayBtnInRange
                      ),
                      // Villa specific
                      isVilla && dayState.isBooked && styles.calDayBtnBooked,
                      isVilla && dayState.isPending && styles.calDayBtnPending,
                      // Non-villa 2-state: Green if available (>0), Red if sold out (<=0)
                      !isVilla && !isPast && !isStart && !isEnd && !isInRange && (
                        cellAvailable > 0
                          ? styles.calDayBtnAvailable
                          : styles.calDayBtnBooked
                      ),
                      isPast && styles.calDayBtnDisabled,
                      pressed && !disabled && styles.pressed,
                      Platform.select({
                        web: { cursor: disabled ? "not-allowed" : "pointer" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    {/* 1. Date */}
                    <Text
                      style={[
                        styles.calDayNumber,
                        (isStart || isEnd) && styles.calDayNumberSelected,
                        isInRange &&
                          (isRangeInvalid
                            ? styles.calDayNumberInvalidRange
                            : styles.calDayNumberInRange),
                        isVilla && dayState.isBooked && styles.calDayNumberBooked,
                        isVilla && dayState.isPending && styles.calDayNumberPending,
                        !isVilla && !isPast && !isStart && !isEnd && !isInRange && (
                          cellAvailable > 0
                            ? styles.calDayNumberAvailable
                            : styles.calDayNumberBooked
                        ),
                        isPast && styles.calDayNumberDisabled,
                      ]}
                    >
                      {d.getDate()}
                    </Text>

                    {/* Quantity badges under date number */}
                    {!isPast ? (
                      isVilla ? (
                        <>
                          {dayState.isBooked ? <View style={styles.calBookedDot} /> : null}
                          {dayState.isPending ? <View style={styles.calPendingDot} /> : null}
                        </>
                      ) : (
                        <>
                          {/* 2. Available / Booked */}
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.calCellStatus,
                              (isStart || isEnd)
                                ? styles.calCellStatusSelected
                                : isInRange
                                ? (isRangeInvalid ? styles.calCellStatusInvalid : styles.calCellStatusInRange)
                                : cellAvailable > 0
                                ? styles.calCellStatusAvailable
                                : styles.calCellStatusBooked,
                            ]}
                          >
                            {cellAvailable > 0 ? "Available" : "Booked"}
                          </Text>

                          {/* 3. Count */}
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.calCellCount,
                              (isStart || isEnd)
                                ? styles.calCellCountSelected
                                : isInRange
                                ? (isRangeInvalid ? styles.calCellCountInvalid : styles.calCellCountInRange)
                                : cellAvailable > 0
                                ? styles.calCellCountAvailable
                                : styles.calCellCountBooked,
                            ]}
                          >
                            {cellAvailable}/{cellTotal}
                          </Text>
                        </>
                      )
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Calendar Legend */}
          <View style={styles.calLegendRow}>
            {isVilla ? (
              <>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: colors.gold }]} />
                  <Text style={styles.calLegendText}>Selected</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: "rgba(255, 255, 255, 0.25)" }]} />
                  <Text style={styles.calLegendText}>Available</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: "#EAB308" }]} />
                  <Text style={styles.calLegendText}>Pending</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.calLegendText}>Booked</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: colors.gold }]} />
                  <Text style={styles.calLegendText}>Selected</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: "#22C55E" }]} />
                  <Text style={styles.calLegendText}>Available</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.calLegendText}>Sold Out</Text>
                </View>
              </>
            )}
          </View>

          {/* Bottom Confirmation Bar */}
          <View style={styles.calBottomBar}>
            <View>
              <Text style={styles.calSummaryNights}>
                {nights} {nights === 1 ? "Night" : "Nights"}{!isVilla && unitQuantity > 1 ? ` • ${unitQuantity} units` : ""}
              </Text>
              <Text
                style={[
                  styles.calSummaryTotal,
                  rangeCheck.isInvalid && { color: "#EF4444" },
                ]}
              >
                {rangeCheck.isInvalid
                  ? "Dates Unavailable"
                  : `₹${estimatedTotal.toLocaleString("en-IN")} Total`}
              </Text>
            </View>

            <View style={styles.calActionButtons}>
              <Pressable
                onPress={() => {
                  setStart(addDays(new Date(), 2));
                  setEnd(addDays(new Date(), 3));
                  setActiveTarget("checkIn");
                }}
                style={styles.calResetBtn}
              >
                <RotateCcw size={13} color={colors.textMuted} />
                <Text style={styles.calResetText}>Reset</Text>
              </Pressable>

              <Pressable
                disabled={isInvalid}
                onPress={() => onApply(start, end)}
                style={({ pressed }) => [
                  styles.calApplyBtn,
                  isInvalid && styles.calApplyBtnDisabled,
                  pressed && !isInvalid && styles.pressed,
                  Platform.select({
                    web: {
                      cursor: isInvalid ? "not-allowed" : "pointer",
                      outlineStyle: "none",
                    } as any,
                    default: {},
                  }),
                ]}
              >
                <Text
                  style={[
                    styles.calApplyText,
                    isInvalid && styles.calApplyTextDisabled,
                  ]}
                >
                  {isInvalid ? "Unavailable Range" : "Confirm Dates"}
                </Text>
                {!isInvalid ? <ArrowRight size={15} color={colors.actionInk} /> : null}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingBottom: 110,
    alignItems: "center",
    width: "100%",
  },
  scrollWide: {
    paddingTop: 16,
    paddingBottom: layout.desktopBottomReserve,
  },
  scrollDesktop: {
    paddingTop: 96,
  },
  container: {
    width: "100%",
    maxWidth: layout.sourceMaxWidth,
  },
  containerTablet: {
    maxWidth: 960,
    paddingHorizontal: 24,
  },
  containerDesktop: {
    maxWidth: layout.expandedContentMaxWidth,
    paddingHorizontal: 36,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
  },
  backLinkText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionCircle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(14, 18, 24, 0.85)",
  },
  actionLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  desktopHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  desktopTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 34,
    lineHeight: 40,
    marginTop: 6,
  },
  desktopLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  desktopLocationText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  desktopRatingBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
    backgroundColor: "rgba(12, 16, 22, 0.85)",
    alignItems: "center",
  },
  desktopImageWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  desktopImageCard: {
    width: "100%",
    height: 560,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    marginBottom: 14,
    position: "relative",
    backgroundColor: colors.surfaceRaised,
    ...Platform.select({
      web: {
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.48)",
      } as any,
      default: {},
    }),
  },
  desktopImageCardTablet: {
    height: 480,
  },
  desktopImageBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(5, 7, 9, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
  },
  desktopImageBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  thumbnailRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 2,
  },
  thumbCard: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: colors.surfaceRaised,
    position: "relative",
    ...Platform.select({
      web: { cursor: "pointer" } as any,
      default: {},
    }),
  },
  thumbCardActive: {
    borderColor: colors.gold,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: "0 0 12px rgba(224, 184, 74, 0.5)",
      } as any,
      default: {},
    }),
  },
  mobileHero: {
    width: "100%",
    height: 450,
    overflow: "hidden",
    position: "relative",
  },
  mobileHeroActions: {
    position: "absolute",
    top: Platform.OS === "web" ? 14 : 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  mobileActionRow: { flexDirection: "row", gap: 8 },
  mobileCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.15)",
    backgroundColor: "rgba(5,7,9,.6)",
  },
  mobileHeroCopy: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
  },
  mobileHeroTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  mobileHeroTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 26,
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(10, 28, 20, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(61, 255, 138, 0.4)",
  },
  badgeText: {
    color: "#4ADE80",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  tierPillText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  locationText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  ratingCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
    backgroundColor: "rgba(10, 14, 18, 0.85)",
    alignItems: "center",
  },
  ratingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingNumber: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  ratingCount: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  lovedTag: {
    marginTop: 3,
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  mainLayout: {
    marginTop: 18,
    width: "100%",
  },
  mainLayoutWide: {
    flexDirection: "row",
    gap: 28,
    marginTop: 6,
    alignItems: "flex-start",
  },
  leftColumn: {
    width: "100%",
  },
  leftColumnWide: {
    flex: 1.35,
  },
  rightColumn: {
    flex: 0.9,
    minWidth: 360,
    maxWidth: 480,
    alignSelf: "flex-start",
    ...Platform.select({
      web: {
        position: "sticky",
        top: 96,
        zIndex: 10,
      } as any,
      default: {
        position: "relative",
      },
    }),
  },
  specsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(12, 16, 22, 0.7)",
  },
  specChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  specChipHighlight: {
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  specText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  specTextHighlight: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
  },
  tabs: {
    marginTop: 20,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tab: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: colors.gold,
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  tabTextActive: {
    color: colors.gold,
  },
  tabContentPanel: {
    paddingVertical: 20,
  },
  tabSectionTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
    marginBottom: 12,
  },
  aboutParagraph: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 22,
  },
  featuresRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    backgroundColor: colors.surfaceRaised,
  },
  featurePillText: {
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityCard: {
    width: "48%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.surfaceRaised,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  amenityCardWide: {
    width: "31.5%",
  },
  amenityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  activitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  activityCard: {
    width: "48%",
    height: 130,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  activityCardWide: {
    width: "48.2%",
    height: 145,
  },
  activityTitle: {
    padding: 12,
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: 12,
  },
  scheduleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    backgroundColor: colors.surfaceRaised,
    gap: 6,
  },
  scheduleLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  scheduleValue: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  scheduleNote: {
    marginTop: 12,
    color: colors.gold,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  policiesContainer: {
    marginTop: 24,
    gap: 10,
  },
  sectionHeading: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
    marginBottom: 4,
  },
  policyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.surfaceRaised,
  },
  policyCardOpen: {
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "rgba(18, 22, 28, 0.95)",
  },
  policyHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  policyTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  policyCopy: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 20,
  },
  mobileBookingContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
    width: "100%",
  },
  specsContainerMobile: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  tabsMobile: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  tabContentPanelMobile: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  policiesContainerMobile: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  bookingCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.28)",
    backgroundColor: "rgba(12, 16, 23, 0.96)",
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: "0 16px 44px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(224, 184, 74, 0.08)",
      } as any,
      default: {},
    }),
  },
  bookingCardWide: {
    minHeight: 560,
    justifyContent: "space-between",
  },
  bookingCardTablet: {
    minHeight: 480,
    justifyContent: "space-between",
  },
  bookingCardTop: {
    gap: 10,
  },
  bookingCardBottom: {
    marginTop: "auto",
    paddingTop: 8,
  },
  accomContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    backgroundColor: "rgba(14, 20, 30, 0.85)",
    padding: 10,
    marginBottom: 10,
  },
  accomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  accomHeaderLeft: {
    flex: 1,
  },
  accomTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  accomSubtitle: {
    marginTop: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  accomToggleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  accomList: {
    marginTop: 8,
    gap: 8,
  },
  ribbonRow: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: "center",
  },
  ribbonRowMobileContainer: {
    minHeight: 104,
  },
  ribbonRowSelected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  ribbonRowUnselected: {
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(18, 24, 34, 0.65)",
  },
  ribbonRowSoldOut: {
    borderColor: "rgba(239, 68, 68, 0.25)",
    backgroundColor: "rgba(20, 15, 18, 0.5)",
    opacity: 0.65,
  },
  ribbonDesktopContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  ribbonColInfo: {
    flex: 1,
    minWidth: 125,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
  },
  ribbonIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonIconBoxSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  ribbonInfoText: {
    flex: 1,
    justifyContent: "center",
  },
  ribbonName: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  ribbonNameSelected: {
    color: colors.gold,
  },
  ribbonPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    marginTop: 1.5,
    marginBottom: 1.5,
  },
  ribbonPriceText: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
    color: colors.gold,
    letterSpacing: -0.2,
  },
  ribbonPriceTextSelected: {
    color: colors.gold,
  },
  ribbonPriceTextSoldOut: {
    color: colors.textMuted,
  },
  ribbonPriceSub: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    color: colors.textMuted,
  },
  ribbonMeta: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
  },
  ribbonColAvail: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  ribbonAvailCount: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  ribbonAvailCountAvail: {
    color: "#4ADE80",
  },
  ribbonAvailCountSoldOut: {
    color: "#EF4444",
  },
  ribbonStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  ribbonStatusPillAvail: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.25)",
  },
  ribbonStatusPillSoldOut: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  ribbonStatusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  ribbonStatusDotAvail: {
    backgroundColor: "#4ADE80",
  },
  ribbonStatusDotSoldOut: {
    backgroundColor: "#EF4444",
  },
  ribbonStatusPillText: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 8.5,
  },
  ribbonStatusTextAvail: {
    color: "#4ADE80",
  },
  ribbonStatusTextSoldOut: {
    color: "#EF4444",
  },
  ribbonColQty: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonQtyLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    marginBottom: 2,
  },
  ribbonQtyLabelSelected: {
    color: colors.gold,
  },
  ribbonStepperBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  ribbonStepperBoxActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  ribbonStepperBoxInactive: {
    opacity: 0.6,
  },
  ribbonStepBtn: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: "rgba(224, 184, 74, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
        outlineStyle: "none",
        userSelect: "none",
      } as any,
      default: {},
    }),
  },
  ribbonStepBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    ...Platform.select({
      web: {
        cursor: "not-allowed",
      } as any,
      default: {},
    }),
  },
  ribbonQtyNum: {
    minWidth: 16,
    textAlign: "center",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },
  ribbonQtyNumActive: {
    color: colors.gold,
  },
  ribbonQtyNumInactive: {
    color: colors.textSecondary,
  },
  ribbonQtyNote: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 8.5,
    textAlign: "center",
  },
  ribbonColCal: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonCalBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 4.5,
    borderRadius: 7,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    gap: 2,
  },
  ribbonCalBtnSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  ribbonCalText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 8.5,
  },
  ribbonCalTextSelected: {
    color: colors.actionInk,
  },
  ribbonMobileContent: {
    width: "100%",
    gap: 6,
  },
  ribbonMobileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ribbonMobileDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 2,
  },
  ribbonMobileBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ribbonColAvailMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ribbonColQtyMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unitQuantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(18, 24, 34, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
  },
  unitQuantityLabel: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  unitQuantitySub: {
    marginTop: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  unitQuantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  priceHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  bestPriceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  bestPriceText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  priceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  priceAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 24,
  },
  pricePerNight: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  freeCancelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(10, 28, 20, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(61, 255, 138, 0.4)",
  },
  freeCancelText: {
    color: "#4ADE80",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
  },
  configCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(18, 24, 34, 0.75)",
    overflow: "hidden",
  },
  configDatesRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  configDateHalf: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: "center",
  },
  configDividerVertical: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  configDividerHorizontal: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  configSubRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(12, 16, 23, 0.5)",
  },
  configColHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  configColLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  configDateValue: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  configDayName: {
    marginTop: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  nightsChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  nightsChipText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  nightsSubNote: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  guestSelectionCard: {
    borderRadius: 14,
    backgroundColor: "rgba(14, 18, 26, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  guestSelectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  guestSelectionTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  guestSelectionCapacity: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10.5,
  },
  guestSelectionControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(6, 9, 13, 0.7)",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  guestSelectionHint: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  guestStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guestSelectionCount: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
    minWidth: 16,
    textAlign: "center",
  },
  guestInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  guestInlineLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
  },
  guestCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  stepBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  guestCount: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    minWidth: 12,
    textAlign: "center",
  },
  maxGuestNote: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9,
  },
  demographicsCard: {
    borderRadius: 14,
    backgroundColor: "rgba(14, 18, 26, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 10,
    gap: 9,
  },
  demoGroup: {
    gap: 7,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  demoTitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  demoSubtitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  demoInputsRow: {
    flexDirection: "row",
    gap: 8,
  },
  demoBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(6, 9, 13, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  demoBoxHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  demoBoxLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10.5,
  },
  demoStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniStepBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  miniStepBtnDisabled: {
    opacity: 0.3,
  },
  demoCount: {
    minWidth: 14,
    textAlign: "center",
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },
  demoDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  vegIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  nonVegIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inclusionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  inclusionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  inclusionText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
  },
  summaryBox: {
    padding: 11,
    borderRadius: 14,
    backgroundColor: "rgba(6, 9, 13, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    gap: 5,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  summaryBoxTitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  summaryGuarantee: {
    color: "#4ADE80",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  summaryVal: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  summaryValFree: {
    color: "#4ADE80",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  summaryTotalRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTotalLabel: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  summarySubNote: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9,
    marginTop: 1,
  },
  summaryTotalVal: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  bookButton: {
    marginTop: 6,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.goldAction,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 20px rgba(224, 184, 74, 0.28)",
      } as any,
      default: {},
    }),
  },
  bookButtonText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
    letterSpacing: 0.2,
  },
  noChargeNote: {
    marginTop: 6,
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
  },
  trustGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "space-between",
  },
  trustCell: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trustLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
  },
  mobileStickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(11, 14, 18, 0.98)",
  },
  footerLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  footerPrice: {
    marginTop: 2,
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
  },
  footerMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  mobileContinueBtn: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.goldAction,
  },
  mobileContinueText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    padding: 16,
  },
  squareCalendarCard: {
    width: "100%",
    maxWidth: 450,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(11, 15, 22, 0.98)",
    paddingHorizontal: 10,
    paddingVertical: 18,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.75)",
      } as any,
      default: {},
    }),
  },
  calModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  calModalTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
  },
  calModalSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  calCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  calUnitTabsWrapper: {
    marginBottom: 12,
  },
  calUnitTabsScroll: {
    gap: 6,
  },
  calUnitTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  calUnitTabActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  calUnitTabText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  calUnitTabTextActive: {
    color: colors.gold,
  },
  calUnitTabBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  calUnitTabBadgeActive: {
    backgroundColor: "rgba(224, 184, 74, 0.25)",
  },
  calUnitTabBadgeText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 8.5,
  },
  calUnitTabBadgeTextActive: {
    color: colors.gold,
  },
  calTargetToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 6,
    borderRadius: 14,
    backgroundColor: "rgba(18, 24, 34, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  calTargetCard: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  calTargetCardActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    ...Platform.select({
      web: {
        boxShadow: "0 0 10px rgba(224, 184, 74, 0.25)",
      } as any,
      default: {},
    }),
  },
  calTargetLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  calTargetLabelActive: {
    color: colors.gold,
  },
  calTargetValue: {
    marginTop: 2,
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  calTargetDay: {
    marginTop: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  calTargetArrow: {
    paddingHorizontal: 2,
  },
  calMonthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  calMonthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  calMonthNavBtnDisabled: {
    opacity: 0.3,
  },
  calMonthTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14.5,
    letterSpacing: 0.3,
  },
  calWeekdaysRow: {
    flexDirection: "row",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 6,
  },
  calWeekdayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calWeekdayText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10.5,
  },
  calDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
  },
  calDayCell: {
    width: "14.2857%",
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  calRangeBand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2,
    bottom: 2,
    backgroundColor: "rgba(224, 184, 74, 0.35)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(224, 184, 74, 0.85)",
    borderBottomColor: "rgba(224, 184, 74, 0.85)",
  },
  calRangeBandRight: {
    position: "absolute",
    left: "50%",
    right: 0,
    top: 2,
    bottom: 2,
    backgroundColor: "rgba(224, 184, 74, 0.35)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(224, 184, 74, 0.85)",
    borderBottomColor: "rgba(224, 184, 74, 0.85)",
  },
  calRangeBandLeft: {
    position: "absolute",
    left: 0,
    right: "50%",
    top: 2,
    bottom: 2,
    backgroundColor: "rgba(224, 184, 74, 0.35)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(224, 184, 74, 0.85)",
    borderBottomColor: "rgba(224, 184, 74, 0.85)",
  },
  calRangeBandInvalid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2,
    bottom: 2,
    backgroundColor: "rgba(239, 68, 68, 0.28)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(239, 68, 68, 0.85)",
    borderBottomColor: "rgba(239, 68, 68, 0.85)",
  },
  calRangeBandRightInvalid: {
    position: "absolute",
    left: "50%",
    right: 0,
    top: 2,
    bottom: 2,
    backgroundColor: "rgba(239, 68, 68, 0.28)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(239, 68, 68, 0.85)",
    borderBottomColor: "rgba(239, 68, 68, 0.85)",
  },
  calRangeBandLeftInvalid: {
    position: "absolute",
    left: 0,
    right: "50%",
    top: 2,
    bottom: 2,
    backgroundColor: "rgba(239, 68, 68, 0.28)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(239, 68, 68, 0.85)",
    borderBottomColor: "rgba(239, 68, 68, 0.85)",
  },
  calDayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    position: "relative",
    zIndex: 2,
  },
  calDayBtnInventory: {
    width: "92%",
    maxWidth: 56,
    height: 50,
    borderRadius: 7,
    paddingHorizontal: 1,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayBtnStart: {
    backgroundColor: colors.gold,
    borderRadius: 17,
  },
  calDayBtnEnd: {
    backgroundColor: colors.gold,
    borderRadius: 17,
  },
  calDayBtnStartInventory: {
    backgroundColor: colors.gold,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  calDayBtnEndInventory: {
    backgroundColor: colors.gold,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  calDayBtnInRange: {
    backgroundColor: "rgba(224, 184, 74, 0.30)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopColor: "rgba(224, 184, 74, 0.85)",
    borderBottomColor: "rgba(224, 184, 74, 0.85)",
    borderRadius: 0,
  },
  calDayBtnInRangeInvalid: {
    backgroundColor: "rgba(239, 68, 68, 0.28)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopColor: "rgba(239, 68, 68, 0.85)",
    borderBottomColor: "rgba(239, 68, 68, 0.85)",
    borderRadius: 0,
  },
  calDayBtnAvailable: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.45)",
    borderRadius: 7,
  },
  calDayBtnBooked: {
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.45)",
    borderRadius: 7,
  },
  calDayBtnPending: {
    backgroundColor: "rgba(234, 179, 8, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.45)",
    borderRadius: 17,
  },
  calDayBtnDisabled: {
    opacity: 0.35,
  },
  calDayNumber: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
    lineHeight: 14,
  },
  calDayNumberAvailable: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
  },
  calDayNumberSelected: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
  },
  calDayNumberInRange: {
    color: "#FFFBEB",
    fontFamily: fontFamilies.sansBold,
  },
  calDayNumberInvalidRange: {
    color: "#EF4444",
    fontFamily: fontFamilies.sansBold,
  },
  calDayNumberBooked: {
    color: "#EF4444",
    fontFamily: fontFamilies.sansBold,
  },
  calDayNumberPending: {
    color: "#EAB308",
    fontFamily: fontFamilies.sansBold,
  },
  calDayNumberDisabled: {
    color: "rgba(255, 255, 255, 0.25)",
  },
  calCellStatus: {
    fontSize: 7.2,
    fontFamily: fontFamilies.sansBold,
    lineHeight: 9.5,
    marginTop: 1,
    textAlign: "center",
    letterSpacing: -0.1,
  },
  calCellStatusAvailable: {
    color: "#4ADE80",
  },
  calCellStatusBooked: {
    color: "#EF4444",
  },
  calCellStatusSelected: {
    color: colors.actionInk,
  },
  calCellStatusInRange: {
    color: "#FDE047",
  },
  calCellStatusInvalid: {
    color: "#EF4444",
  },
  calCellCount: {
    fontSize: 7.8,
    fontFamily: fontFamilies.sansBold,
    lineHeight: 10,
    marginTop: 0.5,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  calCellCountAvailable: {
    color: "#4ADE80",
  },
  calCellCountBooked: {
    color: "#EF4444",
  },
  calCellCountSelected: {
    color: colors.actionInk,
  },
  calCellCountInRange: {
    color: "#FACC15",
  },
  calCellCountInvalid: {
    color: "#EF4444",
  },
  calBookedDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EF4444",
  },
  calPendingDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EAB308",
  },
  calLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  calLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  calLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  calLegendText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  calErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  calErrorText: {
    flex: 1,
    color: "#EF4444",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 15,
  },
  calBottomBar: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  calSummaryNights: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  calSummaryTotal: {
    marginTop: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  calSummaryError: {
    color: "#EF4444",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
  },
  calSummaryErrorSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10.5,
  },
  calActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  calResetText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  calApplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.goldAction,
  },
  calApplyBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    opacity: 0.8,
  },
  calApplyText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  calApplyTextDisabled: {
    color: colors.textMuted,
  },
  bookingCardWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  bookingCardWarningText: {
    flex: 1,
    color: "#EF4444",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
    lineHeight: 16,
  },
  bookingCardInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  bookingCardInfoText: {
    flex: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
    lineHeight: 16,
  },
  bookButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  bookButtonTextDisabled: {
    color: colors.textMuted,
  },
  mobileContinueBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  mobileContinueTextDisabled: {
    color: colors.textMuted,
  },
});
