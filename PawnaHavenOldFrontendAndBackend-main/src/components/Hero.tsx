import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Star, Play } from "lucide-react";
import { propertyAPI } from "@/lib/api";
import { CLOUDINARY_IMAGES } from "@/config/cloudinaryImages";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PWAInstallButton } from "./PWAInstallButton";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToProperties = () => {
    document
      .querySelector("#properties")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const { data: properties } = useQuery({
    queryKey: ["/api/properties/public-list"],
    queryFn: async () => {
      const response = await propertyAPI.getPublicList();
      return response.data;
    },
  });

  const propertyCount = properties?.length || 0;

  return (
    <section className="relative min-h-screen flex items-start overflow-hidden pt-[70px] sm:pt-[80px] lg:pt-[90px]">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={CLOUDINARY_IMAGES.HERO_RESORT}
          alt="Luxury camping experience"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 pt-4 sm:pt-6">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="flex flex-col items-start gap-3 mb-8 opacity-0 animate-fade-up">
            <PWAInstallButton variant="hero" />

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
              <span className="text-xs font-medium text-[#F59E0B]">
                Premium Luxury Stays
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.9] mb-8 opacity-0 animate-fade-up delay-100">
            <span className="text-foreground">Experience</span>
            <br />
            <span className="italic bg-gradient-to-r from-[#F59E0B] to-[#F59E0B] bg-clip-text text-transparent">
              Extraordinary
            </span>
            <br />
            <span className="text-foreground">Escapes</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 opacity-0 animate-fade-up delay-200 font-light leading-relaxed">
            Discover handpicked luxury glamping domes, hillside villas, and
            lakeside cottages near Pawna Lake and Lonavala. Your perfect escape
            awaits.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 mb-16 opacity-0 animate-fade-up delay-300">
            <Button
              onClick={scrollToProperties}
              size="lg"
              className="bg-gradient-to-r from-[#F59E0B] to-[#F59E0B] text-black hover:opacity-90 font-semibold px-8 h-14 text-lg gap-2 group shadow-[0_8px_20px_rgba(245,158,11,0.4)]"
            >
              Explore Properties
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-foreground/20 text-foreground hover:bg-[#F59E0B]/10 hover:border-[#F59E0B] hover:text-[#F59E0B] font-medium px-8 h-14 text-lg gap-2"
              onClick={() => navigate("/videos")}
            >
              <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
              </div>
              Watch Video
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 md:gap-12 opacity-0 animate-fade-up delay-400">
            <div className="flex flex-col">
              <span className="font-sans tabular-nums text-3xl md:text-4xl font-semibold text-[#F59E0B] tracking-tight">
                {propertyCount || "50"}+
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Luxury Properties
              </span>
            </div>

            <div className="w-px bg-border/50 hidden md:block" />

            <div className="flex flex-col">
              <span className="font-sans tabular-nums text-3xl md:text-4xl font-semibold text-[#F59E0B] tracking-tight">
                4.6
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Guest Rating
              </span>
            </div>

            <div className="w-px bg-border/50 hidden md:block" />

            <div className="flex flex-col">
              <span className="font-sans tabular-nums text-3xl md:text-4xl font-semibold text-[#F59E0B] tracking-tight">
                10K+
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Happy Guests
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="absolute bottom-8 right-8 hidden lg:flex items-center gap-3 px-5 py-3 rounded-full glass border border-border/30">
        <MapPin className="w-5 h-5 text-[#F59E0B]" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            Featured Location
          </span>
          <span className="text-sm font-medium text-foreground">
            Pawna Lake, Maharashtra
          </span>
        </div>
      </div>

      {/* Scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-[#F59E0B] to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
