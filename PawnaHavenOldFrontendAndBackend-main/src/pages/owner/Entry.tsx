import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, LogIn } from "lucide-react";

const OwnerEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-6 space-y-6">
      <Button
        onClick={() => navigate("/owner/register")}
        variant="ghost"
        className="
          absolute top-10 right-10 
          text-[10px] font-bold uppercase tracking-[0.2em] 
          text-[#F59E0B] 
          hover:text-[#F59E0B]/80 
          hover:bg-[#F59E0B]/10 
          bg-transparent
        "
      >
        Register Property
      </Button>

      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-[#F59E0B] tracking-tight">
          PawnaHavenCamp
        </h1>
        <p className="text-xs capitalize tracking-[0.3em] text-gray-500 font-medium">
          Owner Elite Portal
        </p>
      </div>

      <Button
        onClick={() => navigate("/owner/login")}
        variant="outline"
        className="
          w-full max-w-xs h-24 
          text-lg flex flex-col items-center justify-center space-y-2 
          border-2 border-[#F59E0B] 
          text-[#F59E0B] 
          bg-transparent 
          font-bold

          hover:bg-[#F59E0B]/10 
          hover:border-[#F59E0B]/80 
          hover:text-[#F59E0B]

          transition-all duration-200
        "
      >
        <LogIn className="w-8 h-8" />
        <span className="capitalize font-bold tracking-widest">
          Login to Dashboard
        </span>
      </Button>

      <p className="text-[10px] text-gray-600 uppercase tracking-widest pt-8">
        Powered by PawnaHavenCamp Luxury Stay
      </p>
    </div>
  );
};

export default OwnerEntry;
