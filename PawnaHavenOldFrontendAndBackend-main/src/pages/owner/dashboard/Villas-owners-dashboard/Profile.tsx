import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const OwnerProfile = () => {
  const navigate = useNavigate();
  const { theme } = useOwnerTheme();
  const isLight = theme === "light";

  const [loading, setLoading] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(false);
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
          localStorage.setItem("linkedProperty", JSON.stringify(result.data));
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#F59E0B]">Profile</h2>

        <div className="flex items-center space-x-2">
          <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex items-center gap-2 bg-red-500 text-black border border-red-500 rounded-xl px-4 py-2 hover:bg-red-500/80 hover:border-red-500/80 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </DialogTrigger>

            <DialogContent
              className={cn(
                "max-w-[420px] border border-white/10 rounded-2xl p-6 transition-colors duration-300",
                isLight ? "bg-white" : "bg-[#0A0A0A]",
              )}
            >
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-[#F59E0B] text-lg font-semibold">
                  Confirm Logout?
                </DialogTitle>

                <DialogDescription
                  className={cn(
                    "text-sm leading-relaxed transition-colors duration-300",
                    isLight ? "text-gray-600" : "text-white/80",
                  )}
                >
                  Are you sure you want to logout from the owner dashboard?
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setLogoutOpen(false)}
                  className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-black font-medium rounded-xl border-none h-11"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-black font-medium rounded-xl h-11 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
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
          isLight
            ? "bg-white"
            : "bg-gradient-to-r from-[#1A1A1A] to-black",
        )}
      >
        <CardContent className="pt-6 flex items-center space-x-4">
          <div className="w-16 h-16 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)]">
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
                isLight ? "text-gray-600" : "text-gray-400",
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

      <div
        className={cn(
          "p-4 border border-[#F59E0B]/20 rounded-xl transition-colors duration-300",
          isLight ? "bg-gray-100" : "bg-[#1A1A1A]/50",
        )}
      >
        <p
          className={cn(
            "text-sm transition-colors duration-300",
            isLight ? "text-gray-600" : "text-gray-400",
          )}
        >
          Amenities, Activities, Highlights, Schedule, Policies, and Description
          are now managed at the unit level. Go to the{" "}
          <span
            onClick={() =>
              navigate(
                ((ownerData.property_type || "").toLowerCase() === "villa" ||
                  (ownerData.property_category || "").toLowerCase() === "villa")
                  ? "/owner/units/villa"
                  : "/owner/units",
              )
            }
            className="text-[#F59E0B] font-bold cursor-pointer hover:underline"
          >
            Units
          </span>{" "}
          tab to edit these details for each villa unit.
        </p>
      </div>
    </div>
  );
};

export default OwnerProfile;
