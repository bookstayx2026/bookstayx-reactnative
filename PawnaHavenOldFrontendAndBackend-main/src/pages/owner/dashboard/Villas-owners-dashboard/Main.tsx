import React, { useState, useEffect } from "react";
import { CalendarSync } from "@/components/CalendarSync";
import { villaAPI } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";

const OwnerCalendar = () => {
  const { theme } = useOwnerTheme();
  const isLight = theme === "light";

  const ownerDataString = localStorage.getItem("ownerData");
  const ownerData = ownerDataString ? JSON.parse(ownerDataString) : null;
  const propertyId = ownerData?.id || ownerData?.property_id;
  const [property, setProperty] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [rates, setRates] = useState({ weekday: "", weekend: "" });
  const [specialDates, setSpecialDates] = useState<
    { date: string; price: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const propId = ownerData?.property_id || propertyId;
      const numericId = ownerData?.id;

      const unitsRes = await villaAPI.getUnits(propId);
      if (unitsRes.success) {
        setUnits(unitsRes.data);
        if (unitsRes.data.length > 0 && !selectedUnitId) {
          setSelectedUnitId(unitsRes.data[0].id.toString());
        }
      } else if (numericId && numericId.toString() !== propId.toString()) {
        const unitsResFallback = await villaAPI.getUnits(numericId.toString());
        if (unitsResFallback.success) {
          setUnits(unitsResFallback.data);
          if (unitsResFallback.data.length > 0 && !selectedUnitId) {
            setSelectedUnitId(unitsResFallback.data[0].id.toString());
          }
        }
      }

      const data = await villaAPI.getById(propId);
      if (data.success) {
        setProperty(data.data);
        if (units.length === 0 && !selectedUnitId) {
          applyPropertyRates(data.data);
        }
      } else if (numericId && numericId.toString() !== propId.toString()) {
        const dataFallback = await villaAPI.getById(numericId.toString());
        if (dataFallback.success) {
          setProperty(dataFallback.data);
          if (units.length === 0 && !selectedUnitId) {
            applyPropertyRates(dataFallback.data);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyPropertyRates = (prop: any) => {
    const weekdayVal =
      prop.weekday_price !== null && prop.weekday_price !== undefined
        ? prop.weekday_price
        : prop.price || "";
    const weekendVal =
      prop.weekend_price !== null && prop.weekend_price !== undefined
        ? prop.weekend_price
        : "";
    setRates({
      weekday: weekdayVal !== "" ? String(weekdayVal) : "",
      weekend: weekendVal !== "" ? String(weekendVal) : "",
    });
    if (prop.special_dates) {
      try {
        const sd = Array.isArray(prop.special_dates)
          ? prop.special_dates
          : JSON.parse(prop.special_dates);
        setSpecialDates(sd);
      } catch (e) {
        setSpecialDates([]);
      }
    } else {
      setSpecialDates([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  useEffect(() => {
    if (selectedUnitId && units.length > 0) {
      const unit = units.find((u: any) => u.id.toString() === selectedUnitId);
      if (unit) {
        setRates({
          weekday:
            unit.weekday_price !== null &&
            unit.weekday_price !== undefined &&
            unit.weekday_price !== ""
              ? String(unit.weekday_price)
              : property?.weekday_price || "",
          weekend:
            unit.weekend_price !== null &&
            unit.weekend_price !== undefined &&
            unit.weekend_price !== ""
              ? String(unit.weekend_price)
              : property?.weekend_price || "",
        });
        const sd =
          typeof unit.special_dates === "string"
            ? JSON.parse(unit.special_dates)
            : Array.isArray(unit.special_dates)
              ? unit.special_dates
              : property?.special_dates || [];
        setSpecialDates(sd);
      }
    } else if (property && units.length === 0) {
      applyPropertyRates(property);
    }
  }, [selectedUnitId, units, property]);

  const handleAddSpecialDate = () => {
    setSpecialDates([
      ...specialDates,
      { date: format(new Date(), "yyyy-MM-dd"), price: "" },
    ]);
  };

  const handleRemoveSpecialDate = (index: number) => {
    setSpecialDates(specialDates.filter((_, i) => i !== index));
  };

  const handleSpecialDateChange = (
    index: number,
    field: "date" | "price",
    value: string,
  ) => {
    const newSpecialDates = [...specialDates];
    newSpecialDates[index][field] = value;
    setSpecialDates(newSpecialDates);
  };

  const handleSave = async () => {
    if (!property) return;

    try {
      if (selectedUnitId && units.length > 0) {
        const unitId = parseInt(selectedUnitId);
        const payload = {
          weekday_price: rates.weekday,
          weekend_price: rates.weekend,
          special_dates: specialDates,
        };
        const res = await villaAPI.updateUnit(unitId, payload);
        if (res.success) {
          toast.success("Villa unit rates updated successfully.");
        } else {
          throw new Error("Failed to update unit rates");
        }
      } else {
        const payload = {
          weekday_price: rates.weekday,
          weekend_price: rates.weekend,
          price: rates.weekday,
          special_dates: specialDates,
        };
        const res = await villaAPI.update(propertyId, payload);
        if (!res.success) throw new Error("Failed to update rates");
        toast.success("Rates updated successfully.");
      }
      await fetchData();
    } catch (error) {
      console.error("Error saving rates:", error);
      toast.error("Error updating rates.");
    }
  };

  const hasUnits = units.length > 0;

  if (loading)
    return <div className="p-8 text-center text-[#F59E0B]">Loading...</div>;

  return (
    <div className="space-y-6 max-w-full sm:max-w-2xl mx-auto px-0 sm:px-4 pb-10">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-[#F59E0B] font-display">
          Manage Availability & Prices
        </h1>
      </div>

      <div className="space-y-8">
        {hasUnits && (
          <div
            className={cn(
              "border border-[#F59E0B]/30 rounded-2xl p-6 sm:p-8 transition-colors duration-300",
              isLight ? "bg-white" : "bg-black/40",
            )}
          >
            <h2
              className={cn(
                "text-lg font-bold capitalize tracking-wider mb-4 transition-colors duration-300",
                isLight ? "text-[#1A1A1A]" : "text-white",
              )}
            >
              Select Villa Unit
            </h2>
            <div className="w-full max-w-sm">
              <Select
                value={selectedUnitId || ""}
                onValueChange={setSelectedUnitId}
              >
                <SelectTrigger
                  className={cn(
                    "border-[#F59E0B]/30 h-11 transition-colors duration-300",
                    isLight
                      ? "bg-gray-100 text-[#1A1A1A]"
                      : "bg-black/60 text-white",
                  )}
                >
                  <SelectValue placeholder="Select Villa" />
                </SelectTrigger>
                <SelectContent
                  className={cn(
                    "transition-colors duration-300",
                    isLight
                      ? "bg-white text-[#1A1A1A]"
                      : "bg-[#1A1A1A] text-white border-white/10",
                  )}
                >
                  {units.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div
          className={cn(
            "border border-[#F59E0B]/30 rounded-2xl p-6 sm:p-8 transition-colors duration-300",
            isLight ? "bg-white" : "bg-black/40",
          )}
        >
          <h2
            className={cn(
              "text-lg font-bold flex items-center gap-2 mb-6 transition-colors duration-300",
              isLight ? "text-[#1A1A1A]" : "text-white",
            )}
          >
            <span className="w-1.5 h-6 bg-[#F59E0B] rounded-full" />
            Availability Calendar
          </h2>
          <div
            className={cn(
              "rounded-2xl p-4 sm:p-6 border transition-colors duration-300",
              isLight
                ? "bg-gray-50 border-gray-200"
                : "bg-white/5 border-white/10",
            )}
          >
            {hasUnits && selectedUnitId && (
              <div className="mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#F59E0B] rounded-full" />
                <span className="text-[#F59E0B] font-bold text-sm capitalize tracking-wider">
                  {
                    units.find((u: any) => u.id.toString() === selectedUnitId)
                      ?.name
                  }
                </span>
              </div>
            )}
            {property && (
              <div className="w-full overflow-hidden">
                <CalendarSync
                  propertyId={ownerData?.property_id || propertyId}
                  unitId={
                    hasUnits && selectedUnitId
                      ? parseInt(selectedUnitId)
                      : undefined
                  }
                  unitName={
                    hasUnits
                      ? units.find((u) => u.id.toString() === selectedUnitId)
                          ?.name
                      : undefined
                  }
                  isAdmin={false}
                  propertyName={property?.title}
                  isVilla={true}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "border border-[#F59E0B]/30 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors duration-300",
            isLight ? "bg-white" : "bg-black/40",
          )}
        >
          <h2
            className={cn(
              "text-lg font-bold flex items-center gap-2 transition-colors duration-300",
              isLight ? "text-[#1A1A1A]" : "text-white",
            )}
          >
            <span className="w-1.5 h-6 bg-[#F59E0B] rounded-full" />
            Standard Rates
          </h2>

          {hasUnits && selectedUnitId && (
            <div className="mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#F59E0B] rounded-full" />
              <span className="text-[#F59E0B] font-bold text-sm capitalize tracking-wider">
                {
                  units.find((u: any) => u.id.toString() === selectedUnitId)
                    ?.name
                }
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              {
                label: "Weekdays",
                color: "text-blue-400",
                val: rates.weekday,
              },
              {
                label: "Weekends",
                color: "text-green-400",
                val: rates.weekend,
              },
              {
                label: "Special",
                color: "text-purple-400",
                val: specialDates.length > 0 ? specialDates[0].price : null,
              },
            ].map(({ label, color, val }) => (
              <div
                key={label}
                className={cn(
                  "border rounded-lg p-2 text-center transition-colors duration-300",
                  isLight
                    ? "bg-gray-100 border-gray-200"
                    : "bg-black/40 border-[#F59E0B]/20",
                )}
              >
                <p
                  className={cn(
                    "text-[8px] font-bold capitalize tracking-widest mb-1",
                    color,
                  )}
                >
                  {label}
                </p>
                <p
                  className={cn(
                    "text-xs font-bold transition-colors duration-300",
                    isLight ? "text-[#1A1A1A]" : "text-white",
                  )}
                >
                  {val ? (
                    `₹${val}`
                  ) : (
                    <span className="text-gray-500 text-[10px] font-normal italic">
                      {label === "Special" ? "None" : "Not set"}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#F59E0B] text-xs font-bold capitalize tracking-widest">
                Weekday Price (Base)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <Input
                  type="text"
                  className={cn(
                    "pl-7 border-[#F59E0B]/20 transition-colors duration-300",
                    isLight
                      ? "bg-gray-100 text-[#1A1A1A]"
                      : "bg-black/60 text-white",
                  )}
                  value={rates.weekday}
                  onChange={(e) =>
                    setRates({ ...rates, weekday: e.target.value })
                  }
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#F59E0B] text-xs font-bold capitalize tracking-widest">
                Weekend Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <Input
                  type="text"
                  className={cn(
                    "pl-7 border-[#F59E0B]/20 transition-colors duration-300",
                    isLight
                      ? "bg-gray-100 text-[#1A1A1A]"
                      : "bg-black/60 text-white",
                  )}
                  value={rates.weekend}
                  onChange={(e) =>
                    setRates({ ...rates, weekend: e.target.value })
                  }
                  placeholder="e.g. 7000"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F59E0B]/10">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[#F59E0B] text-xs font-bold capitalize tracking-widest">
                Special Date Prices
              </Label>
              <Button
                onClick={handleAddSpecialDate}
                variant="outline"
                size="sm"
                className="border border-gold/30 text-gold bg-transparent hover:bg-gold hover:text-black hover:border-gold transition-colors h-8"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Date
              </Button>
            </div>

            <div className="space-y-3">
              {specialDates.map((sd, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-lg border border-[#F59E0B]/10 transition-colors duration-300",
                    isLight ? "bg-gray-100" : "bg-black/20",
                  )}
                >
                  <div className="flex-1">
                    <Input
                      type="date"
                      className={cn(
                        "border-[#F59E0B]/20 text-xs h-10 w-full transition-colors duration-300",
                        isLight
                          ? "bg-gray-50 text-[#1A1A1A]"
                          : "bg-black/40 text-white",
                      )}
                      value={sd.date}
                      onChange={(e) =>
                        handleSpecialDateChange(index, "date", e.target.value)
                      }
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-3 text-gray-400 text-xs">
                      ₹
                    </span>
                    <Input
                      type="text"
                      className={cn(
                        "pl-7 border-[#F59E0B]/20 text-xs h-10 w-full transition-colors duration-300",
                        isLight
                          ? "bg-gray-50 text-[#1A1A1A]"
                          : "bg-black/40 text-white",
                      )}
                      value={sd.price}
                      onChange={(e) =>
                        handleSpecialDateChange(index, "price", e.target.value)
                      }
                      placeholder="Price"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-400 h-10 w-10 self-end sm:self-auto"
                    onClick={() => handleRemoveSpecialDate(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {specialDates.length === 0 && (
                <p className="text-center text-[10px] text-gray-500 italic py-2">
                  No special dates added.
                </p>
              )}
            </div>
          </div>
          <Button
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold mt-4 h-12 rounded-xl"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Update Rates & Sync Calendars
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OwnerCalendar;
