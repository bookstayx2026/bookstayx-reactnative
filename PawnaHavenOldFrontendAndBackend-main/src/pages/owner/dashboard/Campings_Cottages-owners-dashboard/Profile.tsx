import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LogOut, User, Plus, X, Clock, Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PWAInstallButton from "@/components/owner/pwa/PWAInstallButton";
import { campingAPI } from "@/lib/api";
import { DialogClose } from "@/components/ui/dialog";

import { CalendarSync } from "@/components/CalendarSync";
import TimePicker from "@/components/TimePicker";
import { cn } from "@/lib/utils";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const OwnerProfile = () => {
  const navigate = useNavigate();
  const { theme } = useOwnerTheme();
  const isLight = theme === "light";

  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "",
    value: "",
    time: "02:00 PM",
  });
  const [details, setDetails] = useState({
    activities: [] as string[],
    highlights: [] as string[],
    policies: [] as string[],
    schedule: [] as { time: string; title: string }[],
    description: "",
  });

  const handleLogout = () => {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerData");
    localStorage.removeItem("ownerLoggedIn");
    localStorage.removeItem("ownerDeveloperMode");
    toast.success("Logged out successfully");
    navigate("/owner/login");
  };

  const ownerDataString = localStorage.getItem("ownerData");
  const ownerData = ownerDataString ? JSON.parse(ownerDataString) : null;

  useEffect(() => {
    const fetchProfile = async () => {
      const ownerDataString = localStorage.getItem("ownerData");
      if (!ownerDataString) return;
      const ownerDataObj = JSON.parse(ownerDataString);

      const propId =
        ownerDataObj.property_id || ownerDataObj.propertyId || ownerDataObj.id;
      if (!propId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/owners/my-property/${propId}`);
        const result = await response.json();

        if (result.success && result.data) {
          const prop = result.data;

          const parseData = (data: any) => {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            if (typeof data === "string") {
              let trimmed = data.trim();
              if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                trimmed = trimmed
                  .substring(1, trimmed.length - 1)
                  .replace(/""/g, '"')
                  .replace(/\\"/g, '"');
              }
              if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                return trimmed
                  .substring(1, trimmed.length - 1)
                  .split(",")
                  .map((s: string) => s.trim().replace(/^"(.*)"$/, "$1"))
                  .filter(Boolean);
              }
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
                return parsed ? [parsed] : [];
              } catch (e) {
                if (trimmed.includes(",")) {
                  return trimmed
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean);
                }
                return trimmed ? [trimmed] : [];
              }
            }
            return [];
          };

          setDetails({
            activities: parseData(prop.activities),
            highlights: parseData(prop.highlights),
            policies: parseData(prop.policies),
            schedule: parseData(prop.schedule).map((item: any) => {
              if (typeof item === "string") {
                const trimmedItem = item.trim();
                if (trimmedItem.startsWith("{") && trimmedItem.endsWith("}")) {
                  try {
                    const cleaned = trimmedItem.replace(/\\"/g, '"');
                    const parsed = JSON.parse(cleaned);
                    return {
                      time: parsed.time || "",
                      title: parsed.title || parsed.event || "",
                    };
                  } catch (e) {
                    return { time: "", title: trimmedItem };
                  }
                }
                try {
                  const parsedItem = JSON.parse(trimmedItem);
                  return typeof parsedItem === "object"
                    ? parsedItem
                    : { time: "", title: parsedItem };
                } catch (e) {
                  return { time: "", title: trimmedItem };
                }
              }
              if (item && typeof item === "object") {
                return {
                  time: item.time || "",
                  title: item.title || item.event || "",
                };
              }
              return { time: "", title: String(item) };
            }),
            description: prop.description || "",
          });

          localStorage.setItem("linkedProperty", JSON.stringify(prop));
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const propId = ownerData?.property_id || ownerData?.propertyId;
      if (propId) {
        const result = await campingAPI.update(propId, details);
        if (result.success) {
          toast.success("Profile updated successfully");
          localStorage.setItem("propertyUpdated", Date.now().toString());
        } else {
          toast.error(result.message || "Update failed");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const addItem = (type: string) => {
    if (type === "schedule") {
      if (!newItem.value.trim() || !newItem.time.trim()) {
        toast.error("Please enter both time and title");
        return;
      }
      setDetails({
        ...details,
        schedule: [
          ...(details.schedule || []),
          { time: newItem.time.trim(), title: newItem.value.trim() },
        ],
      });
    } else {
      const t = type as "activities" | "highlights" | "policies";
      if (!newItem.value.trim()) return;
      setDetails({
        ...details,
        [t]: [...(details[t] || []), newItem.value.trim()],
      });
    }
    setNewItem({ type: "", value: "", time: "02:00 PM" });
  };

  const removeItem = (type: string, index: number) => {
    if (type === "schedule") {
      const newList = [...(details.schedule || [])];
      newList.splice(index, 1);
      setDetails({ ...details, schedule: newList });
    } else {
      const t = type as "activities" | "highlights" | "policies";
      const newList = [...details[t]];
      newList.splice(index, 1);
      setDetails({ ...details, [t]: newList });
    }
  };

  const TagList = ({
    type,
    items,
  }: {
    type: "activities" | "highlights" | "policies";
    items: string[];
  }) => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center border border-[#F59E0B]/30 px-3 py-1.5 rounded-md group transition-colors duration-300",
              isLight ? "bg-gray-100" : "bg-black/40",
            )}
          >
            <span
              className={cn(
                "text-xs transition-colors duration-300",
                isLight ? "text-gray-700" : "text-gray-200",
              )}
            >
              {item}
            </span>
            <button
              onClick={() => removeItem(type, idx)}
              className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {newItem.type === type ? (
          <div className="flex items-center space-x-2">
            <Input
              autoFocus
              className={cn(
                "h-8 text-xs border-[#F59E0B] w-32 transition-colors duration-300",
                isLight
                  ? "bg-gray-100 text-[#1A1A1A]"
                  : "bg-black/60 text-white",
              )}
              value={newItem.value}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  value: e.target.value,
                  time: newItem.time,
                })
              }
              onKeyDown={(e) => e.key === "Enter" && addItem(type)}
              onBlur={() =>
                newItem.value
                  ? addItem(type)
                  : setNewItem({ type: "", value: "", time: "" })
              }
            />
          </div>
        ) : (
          <button
            onClick={() => setNewItem({ type, value: "", time: "" })}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-dashed border-[#F59E0B]/50 text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#F59E0B]">Profile</h2>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex-1 bg-red-600 !bg-red-600 text-black rounded-xl hover:!bg-red-600 hover:opacity-80 transition-all"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            </DialogTrigger>

            <DialogContent
              className={cn(
                "sm:max-w-[400px] border-[#F59E0B]/20 rounded-3xl transition-colors duration-300",
                isLight ? "bg-white" : "bg-black",
              )}
            >
              <DialogHeader>
                <DialogTitle className="text-[#F59E0B] font-display text-xl">
                  Confirm Logout
                </DialogTitle>

                <DialogDescription className="text-gray-400">
                  Are you sure you want to log out of your dashboard?
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-3 mt-4">
                <DialogClose asChild>
                  <Button className="flex-1 bg-[#F59E0B] text-black rounded-xl hover:opacity-80 transition-all">
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  className="flex-1 bg-red-600 !bg-red-600 text-black rounded-xl hover:!bg-red-600 hover:opacity-80 transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card
        className={cn(
          "border-[#F59E0B]/30 text-white shadow-2xl transition-colors duration-300",
          isLight ? "bg-white" : "bg-gradient-to-r from-[#1A1A1A] to-black",
        )}
      >
        <CardContent className="pt-6 flex items-center space-x-4">
          <div className="w-16 h-16 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <User className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-[#F59E0B]">
              {ownerData?.propertyName ||
                ownerData?.property_name ||
                "Property Name"}
            </h3>
            <p
              className={cn(
                "text-xs font-medium capitalize tracking-widest transition-colors duration-300",
                isLight ? "text-gray-600" : "text-white",
              )}
            >
              {ownerData?.ownerName || ownerData?.owner_name || "Owner"} •{" "}
              {ownerData?.ownerNumber ||
                ownerData?.owner_otp_number ||
                "Contact"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label
            className={cn(
              "text-sm font-bold capitalize tracking-widest transition-colors duration-300",
              isLight ? "text-gray-700" : "text-gray-300",
            )}
          >
            Activities
          </Label>
          <TagList type="activities" items={details.activities} />
        </div>

        <div className="space-y-3">
          <Label
            className={cn(
              "text-sm font-bold capitalize tracking-widest transition-colors duration-300",
              isLight ? "text-gray-700" : "text-gray-300",
            )}
          >
            Highlights (What You'll Love)
          </Label>
          <TagList type="highlights" items={details.highlights} />
        </div>

        <div className="space-y-3">
          <Label
            className={cn(
              "text-sm font-bold capitalize tracking-widest flex items-center gap-2 transition-colors duration-300",
              isLight ? "text-gray-700" : "text-gray-300",
            )}
          >
            <Clock className="w-4 h-4" />
            Property Schedule
          </Label>
          <div className="space-y-3">
            {(details.schedule || []).map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between border border-[#F59E0B]/20 p-3 rounded-xl group transition-colors duration-300",
                  isLight ? "bg-gray-100" : "bg-black/40",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <div>
                    <p className="text-[10px] font-bold text-[#F59E0B] capitalize">
                      {item.time}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        isLight ? "text-[#1A1A1A]" : "text-white",
                      )}
                    >
                      {item.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeItem("schedule", idx)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div
              className={cn(
                "p-4 border border-dashed border-[#F59E0B]/30 rounded-xl space-y-3 transition-colors duration-300",
                isLight ? "bg-gray-100" : "bg-[#1A1A1A]/50",
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-bold capitalize tracking-widest transition-colors duration-300",
                  isLight ? "text-gray-600" : "text-gray-400",
                )}
              >
                Add New Event
              </p>
              <div className="flex flex-col gap-2">
                <TimePicker
                  value={newItem.time}
                  onChange={(t) =>
                    setNewItem({
                      ...newItem,
                      type: "schedule",
                      time: t,
                    })
                  }
                />
                <Input
                  placeholder="Title (e.g. Snacks)"
                  className={cn(
                    "h-10 border-[#F59E0B]/20 text-xs transition-colors duration-300",
                    isLight
                      ? "bg-gray-50 text-[#1A1A1A]"
                      : "bg-black/60 text-white",
                  )}
                  value={newItem.type === "schedule" ? newItem.value : ""}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      type: "schedule",
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10 hover:text-[#F59E0B] bg-transparent transition-colors"
                onClick={() => addItem("schedule")}
              >
                <Plus className="w-3 h-3 mr-2" /> Add to Schedule
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label
            className={cn(
              "text-sm font-bold capitalize tracking-widest transition-colors duration-300",
              isLight ? "text-gray-700" : "text-gray-300",
            )}
          >
            Rules & Policies
          </Label>
          <TagList type="policies" items={details.policies} />
        </div>

        <div className="space-y-3">
          <Label
            className={cn(
              "text-sm font-bold capitalize tracking-widest transition-colors duration-300",
              isLight ? "text-gray-700" : "text-gray-300",
            )}
          >
            Description
          </Label>
          <Textarea
            className={cn(
              "border-[#F59E0B]/20 focus:border-[#F59E0B] min-h-[100px] transition-colors duration-300",
              isLight
                ? "bg-gray-100 text-gray-700"
                : "bg-[#1A1A1A] text-gray-200",
            )}
            value={details.description}
            onChange={(e) =>
              setDetails({ ...details, description: e.target.value })
            }
            placeholder="Property description..."
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold h-12 shadow-xl"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default OwnerProfile;
