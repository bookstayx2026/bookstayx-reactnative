import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  Loader2,
  Sparkles,
  X,
  Edit,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { campingAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import PaginationBar from "@/components/ui/PaginationBar";

const PAGE_SIZE = 10;

const OwnerUnits = () => {
  const navigate = useNavigate();
  const { theme } = useOwnerTheme();
  const isLight = theme === "light";
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [unitsPage, setUnitsPage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitForm, setUnitForm] = useState({
    name: "",
    available_persons: "0",
    total_persons: "0",
    price_per_person: "0",
    weekday_price: "0",
    weekend_price: "0",
    special_price: "0",
    amenities: [""],
    images: [] as string[],
    special_dates: [] as { date: string; price: string }[],
  });

  const fetchData = async () => {
    const ownerDataString = localStorage.getItem("ownerData");
    if (!ownerDataString) return;
    const ownerData = JSON.parse(ownerDataString);
    const id = ownerData.property_id || ownerData.propertyId;

    try {
      // Use camping-specific API routes
      const result = await campingAPI.getById(id);

      if (result.success && result.data) {
        setProperty(result.data);
        if (result.data.category === "campings_cottages") {
          const unitsRes = await campingAPI.getUnits(id);
          if (unitsRes.success) {
            setUnits(unitsRes.data);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && property?.category === "villa") {
      navigate("/owner/units/villa", { replace: true });
    }
  }, [loading, property, navigate]);

  const handleEdit = (unit: any) => {
    const amenities =
      typeof unit.amenities === "string"
        ? JSON.parse(unit.amenities)
        : Array.isArray(unit.amenities)
          ? unit.amenities
          : [];

    const images =
      typeof unit.images === "string"
        ? JSON.parse(unit.images)
        : Array.isArray(unit.images)
          ? unit.images
          : [];

    const specialDates =
      typeof unit.special_dates === "string"
        ? JSON.parse(unit.special_dates)
        : Array.isArray(unit.special_dates)
          ? unit.special_dates
          : [];

    setEditingUnit(unit);
    setUnitForm({
      name: unit.name || "",
      available_persons: (unit.available_persons || 0).toString(),
      total_persons: (unit.total_persons || 0).toString(),
      price_per_person: (unit.price_per_person || 0).toString(),
      weekday_price: (unit.weekday_price || 0).toString(),
      weekend_price: (unit.weekend_price || 0).toString(),
      special_price: (unit.special_price || 0).toString(),
      special_dates: specialDates,
      amenities: amenities.length ? amenities : [""],
      images: images,
    });
    setIsAdding(true);
  };

  const handleSaveUnit = async () => {
    try {
      const payload = {
        ...unitForm,
        price_per_person: parseFloat(unitForm.price_per_person),
        weekday_price: parseFloat(unitForm.weekday_price),
        weekend_price: parseFloat(unitForm.weekend_price),
        special_price: parseFloat(unitForm.special_price),
        available_persons: parseInt(unitForm.available_persons),
        total_persons: parseInt(unitForm.total_persons),
        amenities: unitForm.amenities.filter((a) => a.trim()),
        images: unitForm.images.filter((i) => i.trim()),
        special_dates: unitForm.special_dates,
      };

      const id = property.property_id || property.propertyId || property.id;
      let res;
      if (editingUnit) {
        res = await campingAPI.updateUnit(editingUnit.id, payload);
      } else {
        res = await campingAPI.createUnit(id, payload);
      }

      if (res.success) {
        toast.success(
          editingUnit
            ? "Unit updated successfully"
            : "Unit created successfully",
        );
        setIsAdding(false);
        setEditingUnit(null);
        fetchData();
      } else {
        toast.error(res.message || "Failed to save unit");
      }
    } catch (e) {
      toast.error("Error saving unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 20 - unitForm.images.length;
    if (remaining <= 0) {
      toast.error("Maximum 20 images allowed per unit");
      return;
    }
    const filesToUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(
        `Only uploading ${remaining} image(s) to stay within the 20 limit`,
      );
    }

    setIsUploading(true);
    const token =
      localStorage.getItem("ownerToken") || localStorage.getItem("adminToken");

    for (const file of filesToUpload) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
        toast.error(
          `"${file.name}" skipped — invalid format. Allowed: jpg, jpeg, png, webp`,
        );
        continue;
      }

      const formDataUpload = new FormData();
      formDataUpload.append("image", file);

      try {
        const response = await fetch("/api/properties/upload-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataUpload,
        });

        const result = await response.json();
        if (result.success) {
          setUnitForm((prev) => ({
            ...prev,
            images: [...prev.images, result.url],
          }));
          toast.success("Image uploaded");
        } else {
          toast.error(result.message || "Upload failed");
        }
      } catch (error) {
        toast.error("Upload error");
      }
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const parseJson = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch (e) {
        return [val];
      }
    }
    return [];
  };

  if (loading)
    return (
      <div className="p-8 text-center text-[#F59E0B]">Loading units...</div>
    );

  if (property?.category !== "campings_cottages") {
    return (
      <div className="p-8 text-center text-gray-400">
        This section is only available for camping and cottage properties.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full sm:max-w-4xl mx-auto px-4 sm:px-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#F59E0B] font-display tracking-tight">
          Manage Units
        </h1>
        <Button
          onClick={() => {
            setEditingUnit(null);
            setUnitForm({
              name: "",
              available_persons: "0",
              total_persons: "0",
              price_per_person: "0",
              weekday_price: "0",
              weekend_price: "0",
              special_price: "0",
              amenities: [""],
              images: [] as string[],
              special_dates: [] as { date: string; price: string }[],
            });
            setIsAdding(true);
          }}
          className="bg-gold hover:bg-gold/90 text-black font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Unit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {units
          .slice((unitsPage - 1) * PAGE_SIZE, unitsPage * PAGE_SIZE)
          .map((unit) => (
            <Card
              key={unit.id}
              className={cn(
                "border-[#F59E0B]/20 rounded-2xl overflow-hidden shadow-xl transition-colors duration-300",
                isLight ? "bg-white" : "glass bg-black/40",
              )}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0 transition-colors duration-300",
                        isLight
                          ? "bg-gray-100 border-gray-200"
                          : "bg-white/5 border-white/10",
                      )}
                    >
                      {parseJson(unit.images)?.[0] ? (
                        <img
                          src={parseJson(unit.images)[0]}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?auto=format&fit=crop&q=80&w=400";
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-full h-full p-4 text-white/20" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3
                        className={cn(
                          "text-lg sm:text-xl font-bold tracking-tight leading-tight transition-colors duration-300",
                          isLight ? "text-[#1A1A1A]" : "text-white",
                        )}
                      >
                        {unit.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 uppercase">
                          {unit.available_persons} Avl
                        </span>
                        <span className="text-[9px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20 uppercase">
                          {unit.total_persons} Total
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end p-3 sm:p-0 rounded-xl transition-colors duration-300",
                      isLight
                        ? "bg-gray-100 sm:bg-transparent"
                        : "bg-white/5 sm:bg-transparent",
                    )}
                  >
                    <div className="text-xl font-black text-[#F59E0B] leading-none">
                      ₹{unit.weekday_price || unit.price_per_person || "0"}
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-[0.1em] sm:mt-1 font-bold">
                      Per Person
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleEdit(unit)}
                  className="w-full bg-[#F59E0B] hover:bg-[#d97706] text-black h-11 rounded-xl font-bold transition-all"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Unit
                </Button>
              </CardContent>
            </Card>
          ))}

        <PaginationBar
          currentPage={unitsPage}
          totalPages={Math.ceil(units.length / PAGE_SIZE)}
          onPageChange={setUnitsPage}
        />

        {units.length === 0 && (
          <div
            className={cn(
              "text-center py-16 border border-white/5 rounded-2xl transition-colors duration-300",
              isLight ? "bg-gray-100" : "glass bg-black/20",
            )}
          >
            <LayoutGrid className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 font-medium italic">No units found.</p>
          </div>
        )}
      </div>

      <Dialog
        open={isAdding}
        onOpenChange={(open) => {
          if (!open) {
            setIsAdding(false);
            setEditingUnit(null);
          }
        }}
      >
        <DialogContent
          className={cn(
            "border-white/10 rounded-3xl max-h-[calc(100vh-72px-80px)] sm:max-h-[90vh] overflow-y-auto sm:max-w-[600px] w-[95vw] p-0 transition-colors duration-300 top-[72px] translate-y-0 sm:top-1/2 sm:-translate-y-1/2",
            isLight ? "bg-white" : "bg-[#1A1A1A]",
          )}
          aria-describedby="unit-form-desc"
        >
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6 text-center">
              <DialogTitle className="text-gold font-display text-xl sm:text-2xl">
                {editingUnit ? "Edit Unit" : "Add New Unit"}
              </DialogTitle>
              <DialogDescription
                id="unit-form-desc"
                className="text-xs text-muted-foreground"
              >
                Specify the details for this accommodation unit including name,
                capacity, and amenities.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs font-bold">
                    Unit Name
                  </Label>
                  <Input
                    value={unitForm.name}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, name: e.target.value })
                    }
                    placeholder="e.g. Deluxe Tent"
                    className={cn(
                      "h-11 transition-colors duration-300",
                      isLight
                        ? "bg-gray-100 border-gray-200 text-[#1A1A1A]"
                        : "bg-white/5 border-white/10 text-white",
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-xs capitalize font-bold">
                      Weekday Price (Base)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Enter weekday price!"
                      min="0"
                      value={
                        unitForm.weekday_price === "0"
                          ? ""
                          : unitForm.weekday_price
                      }
                      onFocus={() => {
                        if (unitForm.weekday_price === "0") {
                          setUnitForm({ ...unitForm, weekday_price: "" });
                        }
                      }}
                      onChange={(e) =>
                        setUnitForm({
                          ...unitForm,
                          weekday_price: e.target.value.replace(/^-/g, ""),
                        })
                      }
                      className={cn(
                        "h-11 transition-colors duration-300",
                        isLight
                          ? "bg-gray-100 border-gray-200 text-[#1A1A1A]"
                          : "bg-white/5 border-white/10 text-white",
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-xs capitalize font-bold">
                      Weekend Price
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Enter weekend price!"
                      value={
                        unitForm.weekend_price === "0"
                          ? ""
                          : unitForm.weekend_price
                      }
                      onFocus={() => {
                        if (unitForm.weekend_price === "0") {
                          setUnitForm({ ...unitForm, weekend_price: "" });
                        }
                      }}
                      onChange={(e) =>
                        setUnitForm({
                          ...unitForm,
                          weekend_price: e.target.value.replace(/^-/g, ""),
                        })
                      }
                      className={cn(
                        "h-11 transition-colors duration-300",
                        isLight
                          ? "bg-gray-100 border-gray-200 text-[#1A1A1A]"
                          : "bg-white/5 border-white/10 text-white",
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs capitalize font-bold">
                    <span className="text-[#00FF41]">Available</span> /{" "}
                    <span className="text-[#F59E0B]">
                      Total persons capacity
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Available"
                      value={
                        unitForm.available_persons === "0"
                          ? ""
                          : unitForm.available_persons
                      }
                      onFocus={() => {
                        if (unitForm.available_persons === "0") {
                          setUnitForm({ ...unitForm, available_persons: "" });
                        }
                      }}
                      onChange={(e) =>
                        setUnitForm({
                          ...unitForm,
                          available_persons: e.target.value.replace(/^-/g, ""),
                        })
                      }
                      className="bg-white/5 border-white/10 text-[#00FF41] font-bold h-11"
                    />

                    <Input
                      type="number"
                      min="0"
                      placeholder="Total"
                      value={
                        unitForm.total_persons === "0"
                          ? ""
                          : unitForm.total_persons
                      }
                      onFocus={() => {
                        if (unitForm.total_persons === "0") {
                          setUnitForm({ ...unitForm, total_persons: "" });
                        }
                      }}
                      onChange={(e) =>
                        setUnitForm({
                          ...unitForm,
                          total_persons: e.target.value.replace(/^-/g, ""),
                        })
                      }
                      className="bg-white/5 border-white/10 text-[#F59E0B] font-bold h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-gold text-xs capitalize font-bold">
                    Special Date Prices
                  </Label>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setUnitForm({
                        ...unitForm,
                        special_dates: [
                          ...unitForm.special_dates,
                          { date: "", price: "" },
                        ],
                      })
                    }
                    className="
                      border border-gold/30
                      text-gold
                      bg-transparent
                      hover:bg-gold
                      hover:text-black
                      hover:border-gold
                      transition-colors
                      h-8
                    "
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Date
                  </Button>
                </div>

                <div className="space-y-3">
                  {unitForm.special_dates.map((sd, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end bg-white/5 p-3 rounded-xl border border-white/5"
                    >
                      <div className="flex-1 space-y-2">
                        <Label className="text-[10px] text-gray-500 capitalize font-bold">
                          Date
                        </Label>
                        <Input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={sd.date}
                          onChange={(e) => {
                            const newDates = [...unitForm.special_dates];
                            newDates[idx].date = e.target.value;
                            setUnitForm({
                              ...unitForm,
                              special_dates: newDates,
                            });
                          }}
                          className="bg-charcoal border-white/10 h-10 text-white w-full"
                        />
                      </div>

                      <div className="flex-1 space-y-2">
                        <Label className="text-[10px] text-gray-500 capitalize font-bold">
                          Price
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Special price"
                          value={sd.price}
                          onChange={(e) => {
                            const newDates = [...unitForm.special_dates];
                            newDates[idx].price = e.target.value.replace(
                              /^-/g,
                              "",
                            );
                            setUnitForm({
                              ...unitForm,
                              special_dates: newDates,
                            });
                          }}
                          className="bg-charcoal border-white/10 h-10 text-white w-full"
                        />
                      </div>

                      <div className="flex justify-end sm:justify-start">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newDates = unitForm.special_dates.filter(
                              (_, i) => i !== idx,
                            );
                            setUnitForm({
                              ...unitForm,
                              special_dates: newDates,
                            });
                          }}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-10 w-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-400 text-xs capitalize font-bold">
                  Amenities
                </Label>

                <div className="space-y-2">
                  {unitForm.amenities.map((val, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={val}
                        onChange={(e) => {
                          const newArr = [...unitForm.amenities];
                          newArr[idx] = e.target.value;
                          setUnitForm({ ...unitForm, amenities: newArr });
                        }}
                        className="bg-white/5 border-white/10 h-10 text-white"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => {
                          const newArr = unitForm.amenities.filter(
                            (_, i) => i !== idx,
                          );
                          setUnitForm({
                            ...unitForm,
                            amenities: newArr.length ? newArr : [""],
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    size="sm"
                    className="
                      w-full
                      border border-dashed border-gold/30
                      text-gold
                      bg-transparent
                      hover:bg-gold
                      hover:text-black
                      hover:border-gold
                      transition-colors
                      h-10
                    "
                    onClick={() =>
                      setUnitForm({
                        ...unitForm,
                        amenities: [...unitForm.amenities, ""],
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Amenities
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400 text-xs capitalize font-bold">
                    Unit Image Gallery ({unitForm.images.length}/20)
                  </Label>
                  <input
                    type="file"
                    id="unit-img-owner"
                    className="hidden"
                    onChange={handleUnitImageUpload}
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("unit-img-owner")?.click()
                    }
                    disabled={isUploading || unitForm.images.length >= 20}
                    className="border-gold/30 text-gold h-9"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}{" "}
                    Upload
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {unitForm.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden relative group border border-white/10"
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        onClick={() =>
                          setUnitForm({
                            ...unitForm,
                            images: unitForm.images.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveUnit}
                disabled={isSubmitting}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold h-12 rounded-xl mt-4 shadow-lg shadow-gold/10 disabled:opacity-40 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {editingUnit ? "Update Unit" : "Create Unit"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerUnits;
