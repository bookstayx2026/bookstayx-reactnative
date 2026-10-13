import SEO, { toOgImage, SITE_URL } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Star,
  MapPin,
  Users,
  Wifi,
  Wind,
  Coffee,
  ChevronLeft,
  Calendar as CalendarIcon,
  Phone,
  Share2,
  MessageCircle,
  Waves,
  Utensils,
  Tv,
  Flame,
  Camera,
  Waves as Water,
  Sun,
  ShieldCheck,
  Clock,
  Car,
  CalendarCheck,
  House,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageSlider from "@/components/ImageSlider";
import { BookingForm } from "@/components/BookingForm";
import { propertyAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { demoProperties } from "@/data/demoProperties";

const formatPrice = (price: string | number) => {
  const num =
    typeof price === "string"
      ? parseInt(price.replace(/[^\d]/g, "")) || 0
      : price;

  return new Intl.NumberFormat("en-IN").format(num);
};

// Helper for mapping icons
const getIcon = (amenity: string) => {
  const a = amenity.toLowerCase();
  if (a.includes("pool") || a.includes("swim"))
    return <Waves className="w-5 h-5" />;
  if (a.includes("ac") || a.includes("air"))
    return <Wind className="w-5 h-5" />;
  if (
    a.includes("food") ||
    a.includes("meal") ||
    a.includes("breakfast") ||
    a.includes("dining")
  )
    return <Utensils className="w-5 h-5" />;
  if (a.includes("theatre") || a.includes("tv") || a.includes("projector"))
    return <Tv className="w-5 h-5" />;
  if (a.includes("bbq") || a.includes("bonfire") || a.includes("fire"))
    return <Flame className="w-5 h-5" />;
  if (a.includes("photo")) return <Camera className="w-5 h-5" />;
  if (a.includes("hike") || a.includes("walk") || a.includes("trail"))
    return <MapPin className="w-5 h-5" />;
  if (a.includes("boat")) return <Water className="w-5 h-5" />;
  if (a.includes("yoga") || a.includes("meditation") || a.includes("wellness"))
    return <Sun className="w-5 h-5" />;
  if (a.includes("parking")) return <Car className="w-5 h-5" />;
  if (a.includes("washroom") || a.includes("toilet"))
    return <ShieldCheck className="w-5 h-5" />;
  if (a.includes("fridge")) return <Coffee className="w-5 h-5" />;
  return <ShieldCheck className="w-5 h-5 opacity-50" />;
};

// Extended property interface with full details
interface PropertyUnit {
  id: number;
  name: string;
  title?: string;
  description?: string;
  location?: string;
  google_maps_link?: string;
  price_per_person: string;
  weekday_price?: string;
  weekend_price?: string;
  special_dates?: Array<{ date: string; price: string }>;
  available_persons: number;
  total_persons: number;
  capacity?: number;
  total_quantity?: number;
  check_in_time?: string;
  check_out_time?: string;
  rating?: number;
  amenities?: string[];
  activities?: string[];
  highlights?: string[];
  policies?: string[];
  cancellation_policy?: {
    full_refund_days: number;
    half_refund_days: number;
    no_refund_days: number;
  };
  schedule?: { time: string; title: string; icon?: string }[];
  images?: string[];
  calendar?: {
    date: string;
    price: string;
    is_booked: boolean;
    available_quantity: number;
    is_weekend: boolean;
    is_special: boolean;
  }[];
}

interface PropertyDetail {
  id: string;
  slug: string;
  image: string;
  images: string[];
  title: string;
  price: string;
  pricePerNight?: string;
  priceNote: string;
  amenities: string[];
  is_top_selling: boolean;
  location: string;
  rating: number;
  category: "villa" | "campings_cottages";
  description: string;
  capacity: number;
  max_capacity?: number;
  maxCapacity?: number;
  check_in_time?: string;
  check_out_time?: string;
  highlights: string[];
  activities: string[];
  policies?: string[];
  cancellation_policy?: {
    full_refund_days: number;
    half_refund_days: number;
    no_refund_days: number;
  };
  schedule?: { time: string; title: string; icon?: string }[];
  weekday_price?: string;
  weekend_price?: string;
  special_dates?: Array<{ date: string; price: string }>;
  contact?: string;
  owner_whatsapp_number?: string;
  owner_name?: string;
  map_link?: string;
  is_available: boolean;
  property_id: string;
  units?: PropertyUnit[];
  is_demo?: boolean;
}

import { CalendarSync } from "@/components/CalendarSync";

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const [propertyData, setPropertyData] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<
    Date | undefined
  >(undefined);

  const handleCalendarDateSelect = (date: Date) => {
    setCalendarSelectedDate(date);
    setBookingDialogOpen(true);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    const fetchProperty = async () => {
      try {
        if (!propertyId) return;

        const demoProperty = demoProperties.find(
          (property) => property.slug === propertyId,
        );
        if (demoProperty) {
          setPropertyData({
            ...demoProperty,
            priceNote: demoProperty.price_note,
            highlights: [
              "Curated developer-preview stay",
              "Scenic location near Pawna Lake",
              "Suitable for weekend groups and families",
            ],
            activities: ["Sightseeing", "Outdoor games", "Evening gathering"],
            policies: [
              "Government-issued ID is required at check-in.",
              "This is a demo listing; contact the host to confirm availability.",
              "Please respect the property and local quiet hours.",
            ],
            check_in_time: "2:00 PM",
            check_out_time: "11:00 AM",
            contact: "+918806092609",
            owner_whatsapp_number: "+918806092609",
            owner_name: "PawnaHavenCamp Preview Host",
            units: [],
          });
          return;
        }

        const response = await propertyAPI.getPublicBySlug(propertyId);
        if (response.success) {
          const p = response.data;
          console.log("Property Raw Data:", JSON.stringify(p, null, 2));
          let mappedImages: string[] = [];

          if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            mappedImages = p.images
              .map((img: any) => {
                if (typeof img === "string") return img;
                let url = img.image_url || img.url || "";
                if (url && url.startsWith("attached_assets/")) {
                  // Ensure correct relative path for images in both dev and prod
                  url = "/" + url;
                }
                return url;
              })
              .filter(Boolean);
          }

          // Ensure arrays are actually arrays
          const ensureArray = (val: any) => {
            if (Array.isArray(val)) return val;
            if (
              typeof val === "string" &&
              val.trim().startsWith("[") &&
              val.trim().endsWith("]")
            ) {
              try {
                return JSON.parse(val);
              } catch (e) {
                return val
                  .split(",")
                  .map((s) => s.trim().replace(/^["']|["']$/g, ""));
              }
            }
            if (typeof val === "string")
              return val.split(",").map((s) => s.trim());
            return [];
          };

          const parseCancellationPolicy = (val: any) => {
            if (!val) return undefined;
            if (typeof val === "string") {
              try {
                return JSON.parse(val);
              } catch {
                return undefined;
              }
            }
            return val;
          };

          const mappedUnits = (p.units || []).map((unit: any) => ({
            ...unit,
            images: ensureArray(unit.images),
            amenities: ensureArray(unit.amenities),
            activities: ensureArray(unit.activities),
            highlights: ensureArray(unit.highlights),
            policies: ensureArray(unit.policies),
            cancellation_policy: parseCancellationPolicy(
              unit.cancellation_policy,
            ),
            schedule: ensureArray(unit.schedule),
          }));

          const mappedProperty = {
            ...p,
            units: mappedUnits,
            images: mappedImages,
            priceNote: p.price_note,
            is_available: p.is_available,
            map_link: p.map_link,
            image: mappedImages[0],
            amenities: ensureArray(p.amenities),
            activities: ensureArray(p.activities),
            highlights: ensureArray(p.highlights),
            policies: ensureArray(p.policies),
            cancellation_policy: parseCancellationPolicy(p.cancellation_policy),
          };

          setPropertyData(mappedProperty);

          if (mappedProperty.units?.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const unitIdParam = params.get("unit_id");
            if (unitIdParam) {
              const targetUnit = mappedProperty.units.find(
                (u: any) => u.id === parseInt(unitIdParam),
              );
              setSelectedUnit(targetUnit || mappedProperty.units[0]);
              setTimeout(() => {
                const el =
                  document.getElementById("stay-options") ||
                  document.getElementById("stay-options-desktop");
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 500);
            } else {
              setSelectedUnit(mappedProperty.units[0]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch property details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 space-y-8">
        <Skeleton className="h-[400px] w-full rounded-3xl" />
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-display font-bold mb-4">
          Property Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          The property you're looking for might have been moved or is no longer
          active.
        </p>
        <Link to="/">
          <Button size="lg">Return Home</Button>
        </Link>
      </div>
    );
  }

  const isVilla = propertyData.category === "villa";
  const hasUnits = propertyData.units && propertyData.units.length > 0;

  const bookingWeekendPrice = (() => {
    const raw = selectedUnit?.weekend_price || propertyData.weekend_price || "";
    const n = parseInt(String(raw).replace(/[^\d]/g, ""));
    return n > 0 ? n : undefined;
  })();

  const bookingSpecialDates: Array<{ date: string; price: string }> = (() => {
    const raw = selectedUnit?.special_dates || propertyData.special_dates;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  })();

  const displayPrice = selectedUnit
    ? isVilla
      ? selectedUnit.weekday_price ||
        selectedUnit.price_per_person ||
        propertyData.price ||
        "Price on Selection"
      : selectedUnit.weekday_price ||
        selectedUnit.price_per_person ||
        propertyData.price ||
        "Price on Selection"
    : propertyData.price || "N/A";
  const displayPriceNote = selectedUnit
    ? isVilla
      ? "villa"
      : "per person"
    : propertyData.priceNote || "per night";
  const displayCapacityValue = selectedUnit
    ? selectedUnit.total_persons || 0
    : propertyData.capacity || 0;

  const displayCapacity = selectedUnit ? (
    isVilla ? (
      <span className="flex items-center gap-2">
        <span className="text-blue-400 font-bold">
          Max Capacity: {selectedUnit.total_persons || 0}
        </span>
        <span className="ml-1 text-xs text-gray-400">persons</span>
      </span>
    ) : (
      <span className="flex items-center gap-2">
        <span className="text-[#00FF41] font-bold">
          {selectedUnit.available_persons || 0}
        </span>
        <span className="text-gray-500">/</span>
        <span className="text-[#F59E0B] font-bold">
          {selectedUnit.total_persons || 0}
        </span>
        <span className="ml-1 text-xs text-gray-400">persons</span>
      </span>
    )
  ) : (
    propertyData.capacity
  );
  const displayAvailability = selectedUnit
    ? isVilla
      ? selectedUnit.calendar?.[0]?.is_booked
        ? "Booked"
        : "Available"
      : selectedUnit.available_persons > 0
        ? "Available"
        : "Booked"
    : propertyData.is_available
      ? "Available"
      : "Booked";

  const BookingSection = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className={cn("space-y-4", isDesktop ? "hidden lg:block" : "")}>
      {/* Unit Selector */}
      {propertyData.units && propertyData.units.length > 0 && (
        <div id="stay-options" className="mb-6 lg:hidden">
          <span className="text-[10px] capatalize tracking-[0.2em] font-bold text-white-400 mb-3 block">
            Select Stay Option
          </span>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {propertyData.units.map((unit) => (
              <Button
                key={unit.id}
                variant={selectedUnit?.id === unit.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedUnit(unit)}
                className={cn(
                  "rounded-xl px-4 py-2 h-auto text-[11px] font-bold tracking-tight whitespace-nowrap transition-all",
                  selectedUnit?.id === unit.id
                    ? "bg-[#F59E0B] text-black border-none"
                    : "bg-[#1A1A1A] border-[#F59E0B]/30 text-gray-400 hover:text-white",
                )}
              >
                {unit.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-only view */}
      {!isDesktop && (
        <div className="md:hidden space-y-4">
          <div className="bg-[#1A1A1A] rounded-[2.5rem] p-6 border border-[#F59E0B]/20 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-col mb-6">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">
                  Total Starting At
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-sans tabular-nums text-2xl font-semibold text-[#F59E0B] tracking-tight">
                      {typeof displayPrice === "string" &&
                      displayPrice.startsWith("₹")
                        ? ""
                        : "₹"}
                      {formatPrice(displayPrice)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      /{displayPriceNote}
                    </span>
                  </div>
                  {(selectedUnit?.price_note || propertyData.priceNote) && (
                    <Badge
                      variant="secondary"
                      className="bg-[#F59E0B]/10 text-[#F59E0B] border-none text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    >
                      <div className="w-2 h-2 bg-[#F59E0B] rotate-45" />
                      {selectedUnit?.price_note || propertyData.priceNote}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mobile Availability Section - Moved below price */}
              <div className="bg-black/40 rounded-3xl p-4 border border-[#F59E0B]/10 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center border border-[#F59E0B]/20">
                      <CalendarIcon className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-widest font-bold text-[#F59E0B]">
                        Availability
                      </p>
                      <p className="text-sm font-bold text-white">
                        Check Dates
                      </p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl bg-transparent border-2 border-[#F59E0B] text-[#F59E0B] text-[9px] uppercase font-bold tracking-widest px-4 hover:bg-[#F59E0B]/10 transition-all active:translate-y-0.5 active:shadow-inner shadow-[0_3px_0_rgb(146,120,33)] group relative overflow-hidden"
                      >
                        <div
                          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-center bg-no-repeat bg-cover pointer-events-none"
                          style={{
                            backgroundImage:
                              'url("/attached_assets/Screenshot_2026-01-22_162339_1769079675263.jpg")',
                          }}
                        />
                        <span className="group-active:scale-95 transition-transform relative z-10">
                          View Calendar
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] rounded-[2rem] bg-[#0A0A0A] border-[#F59E0B]/20">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-display text-[#F59E0B] px-4 pt-4">
                          Availability Calendar
                        </DialogTitle>
                        <DialogDescription className="px-4 text-xs text-gray-400">
                          Check available dates and seasonal pricing for{" "}
                          {propertyData.title}
                          {selectedUnit ? ` (${selectedUnit.name})` : ""}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="p-4">
                        <CalendarSync
                          propertyId={
                            propertyData.property_id || propertyData.id
                          }
                          unitId={selectedUnit?.id}
                          isVilla={propertyData.category === "villa"}
                          isPublic={true}
                          propertyName={propertyData.title}
                          onDateSelect={handleCalendarDateSelect}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Capacity Info - Added into availability section */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500">
                    Capacity:
                  </span>
                  <div className="text-xs font-bold">{displayCapacity}</div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <Dialog
                    open={bookingDialogOpen}
                    onOpenChange={(open) => {
                      setBookingDialogOpen(open);
                      if (!open) setCalendarSelectedDate(undefined);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex flex-col gap-1 h-[65px] rounded-2xl 
                        bg-gradient-to-b from-[#F59E0B] to-[#d97706]
                        border-none
                        transition-all
                        group overflow-hidden relative
                        active:translate-y-1 active:shadow-inner
                        shadow-[0_6px_0_rgb(180,83,9),0_12px_20px_rgba(0,0,0,0.3)]
                        hover:shadow-[0_8px_0_rgb(146,64,14),0_16px_25px_rgba(0,0,0,0.4)]"
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CalendarIcon className="w-5 h-5 text-black group-hover:scale-110 transition-transform relative z-10" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-black relative z-10">
                          Book Stay
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] bg-[#0A0A0A] border-[#F59E0B]/20">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-display text-[#F59E0B]">
                          Book Your Stay
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-xs">
                          Fill in the details below to initiate your booking at{" "}
                          {propertyData.title}
                          {selectedUnit ? ` (${selectedUnit.name})` : ""}.
                        </DialogDescription>
                      </DialogHeader>
                      <BookingForm
                        key={calendarSelectedDate?.getTime() || "no-date"}
                        propertyName={propertyData.title}
                        propertyId={propertyData.id}
                        pricePerPerson={
                          typeof displayPrice === "string"
                            ? parseInt(displayPrice.replace(/[^\d]/g, "")) || 0
                            : Number(displayPrice) || 0
                        }
                        weekendPrice={bookingWeekendPrice}
                        specialDates={bookingSpecialDates}
                        propertyCategory={propertyData.category}
                        maxCapacity={displayCapacityValue}
                        selectedUnitId={selectedUnit?.id}
                        ownerPhone={propertyData.owner_whatsapp_number}
                        ownerName={propertyData.owner_name}
                        initialCheckIn={calendarSelectedDate}
                        checkInTime={
                          selectedUnit?.check_in_time ||
                          propertyData.check_in_time
                        }
                        checkOutTime={
                          selectedUnit?.check_out_time ||
                          propertyData.check_out_time
                        }
                        onClose={() => setBookingDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex flex-col gap-0 h-[65px] rounded-2xl bg-gradient-to-b from-[#00E676] to-[#00C853] border-none shadow-[0_6px_0_rgb(0,150,60),0_12px_20px_rgba(0,0,0,0.3)] group overflow-hidden relative active:translate-y-1 active:shadow-inner transition-all px-1">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-1.5 relative z-10">
                          <MessageCircle className="w-5 h-5 text-white" />
                          <Phone className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-white relative z-10">
                          WhatsApp & Call
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] bg-[#0A0A0A] border-[#F59E0B]/20 p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-display text-[#F59E0B] mb-6 text-center">
                          Contact Host
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-400 text-sm">
                          Choose your preferred method to contact the property
                          host.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-4">
                        <Button
                          className="h-16 rounded-2xl bg-[#F59E0B] hover:bg-[#d97706] text-black font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                          onClick={() =>
                            window.open("tel:+918806092609", "_self")
                          }
                        >
                          <Phone className="w-6 h-6" />
                          Call Host
                        </Button>
                        <Button
                          className="h-16 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                          onClick={() => {
                            const phone = "918806092609";

                            const message = `Hello PawnaHavenCamp,\n\nI would like to enquire about booking:\n🏡 Property: ${propertyData.title}\n🏠 Unit: ${selectedUnit?.name || "Default Stay"}\n📍 Location: ${propertyData.location}\n💰 Price: ₹${formatPrice(displayPrice)}\n\n🔗 ${window.location.href}\n\nPlease share availability and booking details.`;

                            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

                            window.open(url, "_blank");
                          }}
                        >
                          <MessageCircle className="w-6 h-6" />
                          WhatsApp
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Button
                  variant="outline"
                  className="flex flex-col gap-1 h-14 rounded-2xl bg-[#1A1A1A] border-2 border-[#F59E0B] shadow-[0_4px_0_rgb(146,120,33),0_8px_15px_rgba(0,0,0,0.5)] hover:bg-[#2A2A2A] text-white transition-all active:translate-y-1 active:shadow-inner px-1 w-full group relative overflow-hidden"
                  onClick={() =>
                    window.open(
                      propertyData.map_link || "https://www.google.com/maps",
                      "_blank",
                    )
                  }
                >
                  <div
                    className="absolute inset-0 bg-center bg-cover opacity-35 group-hover:opacity-60 transition-all duration-500 scale-100 group-hover:scale-110"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("/attached_assets/Screenshot_2026-01-22_161205_1769078572047.jpg")',
                    }}
                  />
                  <div className="flex items-center gap-2 relative z-10">
                    <MapPin className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white">
                      Open in Maps
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden">
            <div className="bg-[#1A1A1A] rounded-[2.5rem] p-5 border border-[#F59E0B]/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center border border-[#F59E0B]/20">
                  <CalendarIcon className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold text-[#F59E0B]">
                    Availability
                  </p>
                  <p className="text-lg font-bold text-white">Check Dates</p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl bg-transparent border-2 border-[#F59E0B] text-[#F59E0B] text-[10px] uppercase font-bold tracking-widest px-4 hover:bg-[#F59E0B]/10 transition-all active:translate-y-0.5 active:shadow-inner shadow-[0_3px_0_rgb(146,120,33)] group relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-center bg-no-repeat bg-cover pointer-events-none"
                      style={{
                        backgroundImage:
                          'url("/attached_assets/Screenshot_2026-01-22_162339_1769079675263.jpg")',
                      }}
                    />
                    <span className="group-active:scale-95 transition-transform relative z-10">
                      View Calendar
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] rounded-[2rem] bg-[#0A0A0A] border-[#F59E0B]/20">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display text-[#F59E0B] px-4 pt-4">
                      Availability Calendar
                    </DialogTitle>
                    <DialogDescription className="px-4 text-xs text-gray-400">
                      Check available dates and seasonal pricing for{" "}
                      {propertyData.title}
                      {selectedUnit ? ` (${selectedUnit.name})` : ""}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4">
                    <CalendarSync
                      propertyId={propertyData.property_id || propertyData.id}
                      unitId={selectedUnit?.id}
                      isVilla={propertyData.category === "villa"}
                      isPublic={true}
                      propertyName={propertyData.title}
                      onDateSelect={handleCalendarDateSelect}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}

      {/* Desktop view - restored previous layout */}
      <Card
        className={cn(
          "rounded-[2.5rem] p-8 md:p-10 bg-card shadow-2xl-soft border border-border/50 overflow-hidden relative",
          !isDesktop ? "hidden md:block" : "block",
        )}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Desktop Unit Selector */}
          {propertyData.units && propertyData.units.length > 0 && (
            <div id="stay-options-desktop" className="mb-8">
              <span className="text-[10px] capatalize tracking-[0.2em] font-bold text-white-foreground mb-4 block">
                Select Stay Option
              </span>
              <div className="flex flex-wrap gap-2">
                {propertyData.units.map((unit) => (
                  <Button
                    key={unit.id}
                    variant={
                      selectedUnit?.id === unit.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedUnit(unit)}
                    className={cn(
                      "rounded-xl px-5 py-2.5 h-auto text-xs font-bold tracking-tight transition-all duration-300",
                      selectedUnit?.id === unit.id
                        ? "bg-[#F59E0B] text-black shadow-[0_4px_0_rgb(146,120,33),0_8px_15px_rgba(0,0,0,0.3)]"
                        : "bg-[#1A1A1A] text-white border border-[#F59E0B]/30 hover:bg-[#2A2A2A] hover:border-[#F59E0B] hover:text-white",
                    )}
                  >
                    {unit.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <span className="text-[10px] capataliz tracking-[0.3em] font-bold text-white-foreground block mb-2">
              Total Starting At
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-sans tabular-nums text-4xl md:text-5xl font-semibold text-[#F59E0B] tracking-tight">
                {displayPrice.startsWith(" ��") ? "" : "₹"}
                {formatPrice(displayPrice)}
              </span>
              <span className="text-white-foreground font-medium text-lg">
                / {isVilla ? "villa" : "person"}
              </span>
            </div>

            {selectedUnit && isVilla && (
              <div className="mt-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                <span className="text-[10px] capatalize tracking-widest font-bold text-white-foreground block mb-2">
                  Villa Capacity
                </span>
                <div className="text-2xl font-bold flex items-center gap-3">
                  {displayCapacity}
                </div>
              </div>
            )}

            {(selectedUnit?.price_note || propertyData.priceNote) && (
              <p className="text-sm text-white-foreground mt-3 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                {selectedUnit?.price_note || propertyData.priceNote}
              </p>
            )}
          </div>

          <div className="space-y-6 mb-8">
            <Dialog
              open={bookingDialogOpen}
              onOpenChange={(open) => {
                setBookingDialogOpen(open);
                if (!open) setCalendarSelectedDate(undefined);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="w-full h-[52px] rounded-2xl text-lg font-bold 
                  bg-gradient-to-b from-[#F59E0B] to-[#d97706]
                  text-black
                  transition-all duration-300
                  active:translate-y-1 active:shadow-inner
                  shadow-[0_6px_0_rgb(180,83,9),0_12px_25px_rgba(0,0,0,0.4)]
                  hover:shadow-[0_8px_0_rgb(146,64,14),0_16px_30px_rgba(0,0,0,0.5)]
                  flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CalendarCheck className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Book Your Stay</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                <DialogHeader className="items-center text-center space-y-2">
                  <DialogTitle className="flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight text-[#F59E0B]">
                    <House className="w-7 h-7 text-[#F59E0B]" />
                    Book Your Stay!
                  </DialogTitle>

                  <DialogDescription className="max-w-md text-sm leading-relaxed text-muted-foreground">
                    Complete the form below to book your stay at{" "}
                    <span className="font-semibold text-foreground">
                      {propertyData.title}
                      {selectedUnit ? ` (${selectedUnit.name})` : ""}
                    </span>
                    .
                  </DialogDescription>
                </DialogHeader>
                <BookingForm
                  key={calendarSelectedDate?.getTime() || "no-date"}
                  propertyName={propertyData.title}
                  propertyId={propertyData.id}
                  pricePerPerson={
                    typeof displayPrice === "string"
                      ? parseInt(displayPrice.replace(/[^\d]/g, "")) || 0
                      : Number(displayPrice) || 0
                  }
                  weekendPrice={bookingWeekendPrice}
                  specialDates={bookingSpecialDates}
                  propertyCategory={propertyData.category}
                  maxCapacity={displayCapacityValue}
                  selectedUnitId={selectedUnit?.id}
                  ownerPhone={propertyData.owner_whatsapp_number}
                  ownerName={propertyData.owner_name}
                  initialCheckIn={calendarSelectedDate}
                  checkInTime={
                    selectedUnit?.check_in_time || propertyData.check_in_time
                  }
                  checkOutTime={
                    selectedUnit?.check_out_time || propertyData.check_out_time
                  }
                  onClose={() => setBookingDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            {/* Desktop Calendar Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-[52px] rounded-2xl border-2 border-[#F59E0B]/40 
                  text-white font-bold flex items-center justify-center gap-3
                  transition-all duration-300
                  shadow-[0_4px_0_rgb(146,120,33),0_10px_20px_rgba(0,0,0,0.4)]
                  hover:shadow-[0_6px_0_rgb(180,83,9)],0_15px_25px_rgba(0,0,0,0.5)]
                  active:translate-y-1 active:shadow-inner
                  group relative overflow-hidden bg-black/40 backdrop-blur-md"
                >
                  {/* Image Layer */}
                  <div
                    className="absolute inset-0 bg-center bg-cover opacity-40 group-hover:opacity-60 transition-all duration-500 scale-100 group-hover:scale-110"
                    style={{
                      backgroundImage:
                        'url("/attached_assets/Screenshot_2026-01-22_162339_1769079675263.jpg")',
                    }}
                  />

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-all duration-300" />

                  {/* Gold glow */}
                  <div className="absolute inset-0 bg-[#F59E0B]/10 opacity-0 group-hover:opacity-20 transition-all duration-300" />

                  {/* Content */}
                  <CalendarIcon className="w-5 h-5 text-[#F59E0B] group-hover:text-white transition-colors relative z-10" />

                  <span className="relative z-10 tracking-wide">
                    View Availability Calendar
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] bg-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display text-primary">
                    Availability Calendar
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Check dates for {propertyData.title}
                    {selectedUnit ? ` (${selectedUnit.name})` : ""}.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-2">
                  <CalendarSync
                    propertyId={propertyData.property_id || propertyData.id}
                    unitId={selectedUnit?.id}
                    isVilla={propertyData.category === "villa"}
                    isPublic={true}
                    propertyName={propertyData.title}
                    onDateSelect={handleCalendarDateSelect}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-[52px] rounded-2xl text-base font-bold 
                bg-[#1A1A1A] border-2 border-[#F59E0B] text-white
                hover:bg-[#D97706] hover:text-black
                transition-all duration-300
                shadow-[0_4px_0_rgb(146,120,33),0_10px_20px_rgba(0,0,0,0.3)]
                hover:shadow-[0_6px_0_rgb(180,83,9)],0_15px_25px_rgba(0,0,0,0.4)]
                active:translate-y-1 active:shadow-inner
                flex items-center justify-center gap-2 group relative overflow-hidden"
                onClick={() => window.open(`tel:+918806092609`, "_self")}
              >
                <div className="absolute inset-0 bg-[#F59E0B]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Phone className="w-4 h-4 text-[#F59E0B] group-hover:text-black transition-colors" />
                <span className="relative z-10">Call Host</span>
              </Button>
              <Button
                variant="outline"
                className="h-[52px] rounded-2xl text-base font-bold 
                bg-[#1A1A1A] border-2 border-[#00C853] text-white
                hover:bg-[#00C853] hover:text-black
                transition-all duration-300
                shadow-[0_4px_0_rgb(0,150,60),0_10px_20px_rgba(0,0,0,0.3)]
                hover:shadow-[0_6px_0_rgb(0,150,60),0_15px_25px_rgba(0,0,0,0.4)]
                active:translate-y-1 active:shadow-inner
                flex items-center justify-center gap-2 group relative overflow-hidden"
                onClick={() => {
                  const phone = "918806092609";

                  const message = `Hello PawnaHavenCamp,\n\nI would like to enquire about booking:\n🏡 Property: ${propertyData.title}\n🏠 Unit: ${selectedUnit?.name || "Default Stay"}\n📍 Location: ${propertyData.location}\n💰 Price: ₹${formatPrice(displayPrice)}\n\n🔗 ${window.location.href}\n\nPlease share availability and booking details.`;

                  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

                  window.open(url, "_blank");
                }}
              >
                <div className="absolute inset-0 bg-[#00C853]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <MessageCircle className="w-4 h-4 text-[#00C853] group-hover:text-black transition-colors" />
                <span className="relative z-10">WhatsApp</span>
              </Button>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                className="w-full h-16 rounded-2xl text-lg font-bold
                flex items-center justify-center gap-3
                transition-all duration-300
                shadow-[0_4px_0_rgb(146,120,33),0_10px_20px_rgba(0,0,0,0.4)]
                hover:shadow-[0_6px_0_rgb(180,83,9)],0_15px_25px_rgba(0,0,0,0.5)]
                active:translate-y-1 active:shadow-inner
                group relative overflow-hidden bg-black/40 backdrop-blur-md border-2 border-[#F59E0B]/40"
                onClick={() =>
                  window.open(
                    propertyData.map_link || "https://www.google.com/maps",
                    "_blank",
                  )
                }
              >
                {/* Image Layer */}
                <div
                  className="absolute inset-0 bg-center bg-cover transition-all duration-500 scale-100 group-hover:scale-110"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url("/attached_assets/Screenshot_2026-01-22_161205_1769078572047.jpg")',
                  }}
                />

                {/* Content */}
                <MapPin className="w-5 h-5 text-[#F59E0B] group-hover:text-white transition-colors relative z-10" />

                <span className="relative z-10 tracking-wide">
                  Find us on Map
                </span>
              </Button>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50">
            <style>
              {`
                @keyframes ring {
                  0%,100% { transform: rotate(0deg); }
                  10% { transform: rotate(18deg); }
                  20% { transform: rotate(-18deg); }
                  30% { transform: rotate(14deg); }
                  40% { transform: rotate(-14deg); }
                  50% { transform: rotate(8deg); }
                  60% { transform: rotate(0deg); }
                }
              `}
            </style>

            <a href="tel:+918806092609" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center border border-green-600">
                <Phone
                  className="w-5 h-5 text-white"
                  style={{
                    animation: "ring 1.5s ease-in-out infinite",
                    transformOrigin: "50% 50%",
                  }}
                />
              </div>

              <div>
                <p className="text-[10px] capitalize tracking-widest font-bold text-white-foreground">
                  Inquiry Support
                </p>
                <p className="font-bold text-foreground">+91 8806092609</p>
              </div>
            </a>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <SEO
        title={`${propertyData.title} - Luxury ${propertyData.category === "campings_cottages" ? "Pawna Camping & Cottage" : "Lonavala Villa"} | PawnaHavenCamp`}
        description={`Book ${propertyData.title} at ${propertyData.location}. Luxury ${propertyData.category === "campings_cottages" ? "glamping & cottage" : "villa"} with ${propertyData.amenities.slice(0, 5).join(", ")}. ${propertyData.description.substring(0, 120)}...`}
        keywords={`${propertyData.title}, ${propertyData.location}, Pawna Lake ${propertyData.category === "campings_cottages" ? "camping" : "villa"}, Lonavala booking, luxury stay near Mumbai, weekend getaway Pune`}
        canonical={`${SITE_URL}/property/${propertyData.slug}`}
        ogType="vacation_rental"
        ogImage={propertyData.image}
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: propertyData.category === "campings_cottages" ? "Camping & Cottages" : "Villas",
                item: SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: propertyData.title,
                item: `${SITE_URL}/property/${propertyData.slug}`,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: propertyData.title,
            description: propertyData.description,
            image: toOgImage(propertyData.image),
            url: `${SITE_URL}/property/${propertyData.slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: propertyData.location || "Lonavala",
              addressRegion: "Maharashtra",
              addressCountry: "IN",
            },
            geo: { "@type": "GeoCoordinates", latitude: 18.8848, longitude: 73.4596 },
            ...(propertyData.rating > 0
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: propertyData.rating, bestRating: 5, ratingCount: 10 } }
              : {}),
            ...(propertyData.check_in_time ? { checkinTime: propertyData.check_in_time } : {}),
            ...(propertyData.check_out_time ? { checkoutTime: propertyData.check_out_time } : {}),
            amenityFeature: propertyData.amenities.map((a) => ({
              "@type": "LocationFeatureSpecification",
              name: a,
              value: true,
            })),
            priceRange: "₹₹₹",
            currenciesAccepted: "INR",
            paymentAccepted: "Cash, Credit Card, UPI",
          },
        ]}
      />

      <div className="min-h-screen bg-[#0A0A0A] text-white pb-12">
        {/* Gallery Container */}
        <div className="relative">
          <div className="md:hidden">
            <div className="relative aspect-square w-full">
              <ImageSlider
                images={
                  selectedUnit?.images?.length
                    ? selectedUnit.images
                    : propertyData.images
                }
                title={propertyData.title}
                className="h-full w-full rounded-none"
                aspectRatio="1:1"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent pointer-events-none z-20" />

              {/* Floating Badges for Mobile */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 pointer-events-none w-max max-w-[60%] justify-center">
                <Badge
                  variant="outline"
                  className="bg-black/70 backdrop-blur-md border-white/20 text-white px-2 py-0.5 rounded-full text-[8px] uppercase font-bold tracking-widest pointer-events-auto opacity-70 whitespace-nowrap"
                >
                  {propertyData.category === "campings_cottages"
                    ? "Camping"
                    : propertyData.category}
                </Badge>
                <Badge
                  className={cn(
                    "border-none px-2 py-0.5 rounded-full text-[8px] uppercase font-bold tracking-widest pointer-events-auto opacity-70 whitespace-nowrap",
                    propertyData.category === "campings_cottages" &&
                      selectedUnit
                      ? (selectedUnit.calendar?.[0]?.available_quantity ?? 0) >
                        0
                        ? "bg-[#00FF41] text-black"
                        : "bg-[#FF4500] text-white"
                      : propertyData.is_available
                        ? "bg-[#00FF41] text-black"
                        : "bg-[#FF4500] text-white",
                  )}
                >
                  {displayAvailability}
                </Badge>
                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 pointer-events-auto opacity-70 whitespace-nowrap">
                  <Star className="w-2.5 h-2.5 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="text-[10px] font-bold text-white">
                    {propertyData.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="h-auto w-full relative container mx-auto px-6 py-8">
              <ImageSlider
                images={
                  selectedUnit?.images?.length
                    ? selectedUnit.images
                    : propertyData.images
                }
                title={propertyData.title}
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>

          {/* Back & Share Buttons */}
          <div className="absolute top-8 left-6 right-6 flex items-center justify-between z-20">
            <button
              onClick={() => {
                const ownerLock = localStorage.getItem("owner_referral_lock");
                if (ownerLock) {
                  window.history.length > 1
                    ? window.history.back()
                    : window.close();
                } else {
                  window.location.href = "/";
                }
              }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"
              onClick={() => {
                const shareUrl = window.location.href;

                const location =
                  propertyData.location || selectedUnit?.location;
                const price =
                  selectedUnit?.weekday_price ||
                  selectedUnit?.price_per_person ||
                  propertyData.price ||
                  displayPrice;

                const text = `🏡 *${propertyData.title}*\n📍 ${location}\n💰 *${price}* ${propertyData.priceNote}\n\nCheck out this beautiful property on PawnaHavenCamp:\n${shareUrl}`;
                window.open(
                  `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
                  "_blank",
                );
              }}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Booking Card (Overlapping Hero) */}
          <div className="md:hidden container mx-auto px-6 -mt-24 relative z-30">
            <div className="max-w-xl mx-auto">
              <BookingSection />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column - Property Info */}
            <div className="lg:col-span-8 space-y-12">
              {/* Title Section */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display text-white">
                  {propertyData.category === "villa" && selectedUnit?.name
                    ? selectedUnit.name
                    : propertyData.title}
                </h1>
                <p className="text-gray-400 leading-relaxed font-light text-lg">
                  {propertyData.category === "villa" &&
                  selectedUnit?.description
                    ? selectedUnit.description
                    : propertyData.description}
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
                {[
                  {
                    label: "Check-in",
                    value:
                      propertyData.category === "villa" &&
                      selectedUnit?.check_in_time
                        ? selectedUnit.check_in_time
                        : propertyData.check_in_time || "2:00 PM",
                    icon: Clock,
                  },
                  {
                    label: "Check-out",
                    value:
                      propertyData.category === "villa" &&
                      selectedUnit?.check_out_time
                        ? selectedUnit.check_out_time
                        : propertyData.check_out_time || "11:00 AM",
                    icon: Clock,
                  },

                  // Only show for villas
                  ...(propertyData.category === "villa"
                    ? [
                        {
                          label: "Capacity",
                          value: selectedUnit
                            ? `${selectedUnit.total_persons || 0} Guests`
                            : `${propertyData.capacity} Guests`,
                          icon: Users,
                        },
                      ]
                    : []),

                  {
                    label: "Status",
                    value: "Verified",
                    icon: ShieldCheck,
                    accent: "text-[#00FF41]",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-[#1A1A1A] rounded-xl md:rounded-3xl p-3 md:p-4 border border-gray-800/50 flex flex-col items-center text-center gap-1 md:gap-2 group hover:border-[#F59E0B]/30 transition-all overflow-hidden"
                  >
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-[#F59E0B] shrink-0" />
                    <span className="text-[8px] md:text-[10px] uppercase font-bold text-gray-500 tracking-widest leading-tight">
                      {stat.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs md:text-sm font-bold truncate w-full px-1",
                        stat.accent || "text-white",
                      )}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Amenities */}
              <section className="overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Wifi className="w-6 h-6 text-[#F59E0B]" />
                    {propertyData.category === "campings_cottages"
                      ? "Unit Amenities"
                      : "Amenities"}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(propertyData.category === "campings_cottages" ||
                  propertyData.category === "villa"
                    ? selectedUnit?.amenities?.length
                      ? selectedUnit.amenities
                      : propertyData.amenities || []
                    : propertyData.amenities || []
                  ).map((amenity, index) => (
                    <div
                      key={index}
                      className="bg-[#1A1A1A] rounded-2xl p-3 md:p-6 border border-gray-800/50 flex flex-col items-center text-center gap-2 md:gap-4 group hover:border-[#F59E0B]/30 transition-all"
                    >
                      <div className="text-[#F59E0B] scale-90 md:scale-100">
                        {getIcon(amenity)}
                      </div>
                      <span className="text-[10px] md:text-sm font-bold text-white tracking-tight break-words w-full">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Activities */}
              <section className="overflow-hidden">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Star className="w-6 h-6 text-[#F59E0B]" />
                  Activities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(() => {
                    const acts =
                      propertyData.category === "villa" &&
                      selectedUnit?.activities?.length
                        ? selectedUnit.activities
                        : propertyData.activities;
                    return Array.isArray(acts) && acts;
                  })()?.map((activity, index) => (
                    <div
                      key={index}
                      className="bg-[#1A1A1A] rounded-2xl p-3 md:p-6 border border-gray-800/50 flex flex-col items-center text-center gap-2 md:gap-4 group hover:border-[#F59E0B]/30 transition-all"
                    >
                      <div className="text-[#F59E0B] opacity-80 scale-90 md:scale-100">
                        {getIcon(activity)}
                      </div>
                      <span className="text-[10px] md:text-sm font-bold text-gray-300 capatalize tracking-widest break-words w-full">
                        {activity}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Schedule Section */}
              {(() => {
                const sched =
                  propertyData.category === "villa" &&
                  selectedUnit?.schedule?.length
                    ? selectedUnit.schedule
                    : propertyData.schedule;
                return sched && sched.length > 0 ? sched : null;
              })() && (
                <section className="relative">
                  <h3 className="text-2xl font-bold mb-10 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-[#F59E0B]" />
                    Property Schedule
                  </h3>

                  <div className="relative space-y-0 pb-8">
                    {/* Vertical Line */}
                    <div className="absolute left-[21px] top-2 bottom-0 w-0.5 bg-gradient-to-b from-[#F59E0B] via-[#F59E0B]/50 to-transparent" />

                    {(propertyData.category === "villa" &&
                    selectedUnit?.schedule?.length
                      ? selectedUnit.schedule
                      : propertyData.schedule || []
                    ).map((item, idx) => (
                      <div
                        key={idx}
                        className="relative flex items-start gap-6 pb-10 group last:pb-0"
                      >
                        {/* Dot on line */}
                        <div className="absolute left-[18px] top-2 w-2 h-2 rounded-full bg-[#F59E0B] border-4 border-[#0A0A0A] z-10 shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:scale-150 transition-transform" />

                        {/* Icon Box */}
                        <div className="w-11 h-11 rounded-xl bg-[#1A1A1A] border border-[#F59E0B]/20 flex items-center justify-center shrink-0 shadow-lg group-hover:border-[#F59E0B]/50 transition-all">
                          <div className="text-[#F59E0B]">
                            {getIcon(item.title || item.icon || "")}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="pt-0.5 flex flex-col gap-1">
                          <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
                            {item.time}
                          </span>
                          <h4 className="text-lg font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                            {item.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Accordions */}
              <div className="space-y-4 max-w-full overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="highlights"
                    className="mb-4 border-none bg-[#1A1A1A] rounded-2xl md:rounded-[2rem] px-4 md:px-8 border border-gray-800/50 overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 md:py-6 text-sm md:text-lg font-bold text-left">
                      <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                        <Star className="w-4 h-4 md:w-5 md:h-5 text-[#F59E0B] shrink-0" />
                        <span className="truncate">What You'll Love</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <ul className="space-y-4">
                        {(() => {
                          const hl =
                            propertyData.category === "villa" &&
                            selectedUnit?.highlights?.length
                              ? selectedUnit.highlights
                              : propertyData.highlights;
                          return (
                            Array.isArray(hl) &&
                            hl.map((h, i) => (
                              <li
                                key={i}
                                className="text-gray-400 text-sm md:text-base flex items-start gap-3"
                              >
                                <div className="w-2 h-2 rounded-full bg-[#F59E0B] mt-2 shrink-0" />
                                {h}
                              </li>
                            ))
                          );
                        })()}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="policies"
                    className="mb-4 border-none bg-[#1A1A1A] rounded-2xl md:rounded-[2rem] px-4 md:px-8 border border-gray-800/50 overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 md:py-6 text-sm md:text-lg font-bold text-left">
                      <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-[#F59E0B] shrink-0" />
                        <span className="truncate">Rules & Policies</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <ul className="space-y-4">
                        {(() => {
                          const pol =
                            propertyData.category === "villa" &&
                            selectedUnit?.policies?.length
                              ? selectedUnit.policies
                              : propertyData.policies;
                          return (
                            Array.isArray(pol) &&
                            pol.map((p, i) => (
                              <li
                                key={i}
                                className="text-gray-400 text-sm md:text-base flex items-start gap-3"
                              >
                                <div className="w-2 h-2 rounded-full bg-[#F59E0B] mt-2 shrink-0" />
                                {p}
                              </li>
                            ))
                          );
                        })()}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {(() => {
                    const cp =
                      propertyData.category === "villa" &&
                      selectedUnit?.cancellation_policy
                        ? selectedUnit.cancellation_policy
                        : propertyData.cancellation_policy;
                    if (!cp) return null;
                    return (
                      <AccordionItem
                        value="cancellation"
                        className="mb-4 border-none bg-[#1A1A1A] rounded-2xl md:rounded-[2rem] px-4 md:px-8 border border-gray-800/50 overflow-hidden"
                      >
                        <AccordionTrigger className="hover:no-underline py-4 md:py-6 text-sm md:text-lg font-bold text-left">
                          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-[#F59E0B] shrink-0" />
                            <span className="truncate">
                              Cancellation Policy
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <ul className="space-y-4">
                            <li className="text-gray-400 text-sm md:text-base flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                              100% Refund — Upto {cp.full_refund_days} days
                              before check-in
                            </li>
                            <li className="text-gray-400 text-sm md:text-base flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#F59E0B] mt-2 shrink-0" />
                              50% Refund — Upto {cp.half_refund_days} days
                              before check-in
                            </li>
                            <li className="text-gray-400 text-sm md:text-base flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                              No Refund — Less than {cp.no_refund_days} day
                              {cp.no_refund_days !== 1 ? "s" : ""} before
                              check-in
                            </li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })()}
                </Accordion>
              </div>
            </div>

            {/* Right Column - Sticky Booking Card */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24">
                <BookingSection isDesktop />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyDetails;
