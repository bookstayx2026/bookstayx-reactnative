import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

const OwnerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    ownerNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.ownerNumber.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/owners/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          ownerMobile: formData.ownerNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Registration successful!");
        localStorage.setItem("ownerMobile", formData.ownerNumber);
        navigate("/owner/login");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Glow Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#F59E0B]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F59E0B]/5 rounded-full blur-3xl" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-md relative z-10 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#F59E0B] mb-6 shadow-[0_0_25px_rgba(245,158,11,0.35)] mx-auto">
            <Shield className="w-10 h-10 text-black" />
          </div>

          <h1 className="text-4xl font-semibold text-white mb-2">
            PawnaHavenCamp
          </h1>

          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            Owner Registration
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">
              Register Your Property
            </h2>
            <p className="text-sm text-gray-400">
              Enter Property ID (Provided by Admin) and your Mobile Number
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property ID */}
            <div className="space-y-2">
              <Label className="text-white">Property ID</Label>
              <Input
                required
                value={formData.propertyId}
                onChange={(e) =>
                  setFormData({ ...formData, propertyId: e.target.value })
                }
                placeholder="Enter Property ID"
                className="
                  h-12 bg-white/5 border-white/10 rounded-xl text-white
                  placeholder:text-gray-500
                  focus:border-[#F59E0B]
                  focus:ring-2 focus:ring-[#F59E0B]/20
                "
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label className="text-white">Mobile Number</Label>
              <Input
                required
                type="tel"
                maxLength={10}
                value={formData.ownerNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, ownerNumber: v.slice(0, 10) });
                }}
                placeholder="Enter 10-digit mobile"
                className="
                  h-12 bg-white/5 border-white/10 rounded-xl text-white
                  placeholder:text-gray-500
                  focus:border-[#F59E0B]
                  focus:ring-2 focus:ring-[#F59E0B]/20
                "
              />
            </div>

            {/* Button */}
            <Button
              type="submit"
              disabled={loading}
              className="
                w-full h-12 rounded-xl font-semibold
                bg-[#F59E0B] text-black
                hover:bg-[#D97706]
                active:bg-[#B45309]
                shadow-[0_0_15px_rgba(245,158,11,0.35)]
                hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]
                transition-all
              "
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-black" />
              ) : (
                "Register"
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/owner/login")}
                className="text-gray-400 hover:text-[#F59E0B]"
              >
                Already registered? Login
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] tracking-[0.2em] font-bold text-gray-500 uppercase">
            Powered by PawnaHavenCamp Luxury Stay
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegister;
