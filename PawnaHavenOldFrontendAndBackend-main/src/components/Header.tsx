import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Phone,
  IndianRupee,
  Home,
  MapPin,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { PWAInstallButton } from "./PWAInstallButton";
import { CLOUDINARY_IMAGES } from "@/config/cloudinaryImages";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Referral Earning", href: "/referral", isExternal: true },
    { name: "Properties", href: "#properties" },
    { name: "Destinations", href: "#destinations" },
  ];

  const scrollToSection = (href: string, isExternal?: boolean) => {
    setIsMenuOpen(false);
    if (isExternal) {
      navigate(href);
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-black/90 backdrop-blur-lg border-b border-[#F59E0B]/20 shadow-lg shadow-[#F59E0B]/5"
          : "bg-black"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Premium Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            {/* Logo */}
            <div className="relative group perspective-1000">
              <img
                src={CLOUDINARY_IMAGES.WEBSITE_LOGO}
                alt="Pawna Haven Camp"
                className="w-[67px] h-[67px] object-contain transition-all duration-500 group-hover:rotate-y-12 group-hover:scale-110 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
                style={{ transformStyle: "preserve-3d" }}
              />
              {/* Glow effect */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#F59E0B]/30 via-[#F59E0B]/20 to-[#F59E0B]/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse"></div>
            </div>

            {/* 3D Premium Text */}
            <div className="flex flex-col">
              <span
                className="font-display text-2xl md:text-3xl font-bold tracking-wider"
                style={{
                  background:
                    "linear-gradient(180deg, #F59E0B 0%, #F59E0B 25%, #D97706 50%, #F59E0B 75%, #F59E0B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "0 0 30px rgba(245, 158, 11, 0.3)",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.8))",
                }}
              >
                PAWNA
              </span>
              <span
                className="text-xs md:text-sm uppercase tracking-[0.35em] -mt-1 font-medium"
                style={{
                  background:
                    "linear-gradient(180deg, #fbbf24 0%, #F59E0B 50%, #b45309 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "0 0 12px rgba(245, 158, 11, 0.25)",
                }}
              >
                Haven Camp
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link: any) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href, link.isExternal)}
                className="flex items-center gap-2 text-sm font-medium text-white hover:text-primary elegant-underline transition-colors duration-300"
              >
                {link.name === "Referral Earning" && (
                  <IndianRupee className="w-4 h-4 text-green-500" />
                )}
                {link.name === "Properties" && (
                  <Home className="w-4 h-4 text-[#F59E0B]" />
                )}
                {link.name === "Destinations" && (
                  <MapPin className="w-4 h-4 text-[#F59E0B]" />
                )}
                {link.name}
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:+918806092609">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-white hover:text-primary hover:bg-transparent gap-2 elegant-underline transition-colors duration-300"
              >
                <Phone className="w-5 h-5 text-primary" />
                <span>Call Support</span>
              </Button>
            </a>
            <Button
              onClick={() => scrollToSection("#properties")}
              className="bg-gradient-to-r from-[#F59E0B] to-[#F59E0B] text-black hover:opacity-70 font-semibold px-6 shadow-[0_6px_20px_rgba(245,158,11,0.4)]"
            >
              <CalendarCheck className="w-5 h-5 mr-2" />
              Book Now
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-x-0 top-20 bg-[hsl(20,14%,4%)] border-b border-[#F59E0B]/20 shadow-lg transition-all duration-500 ${
          isMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-6 py-8">
          <nav className="flex flex-col gap-6">
            {navLinks.map((link: any) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href, link.isExternal)}
                className="text-lg font-semibold text-white hover:text-primary text-left transition-colors flex items-center gap-2"
              >
                {link.name === "Referral Earning" && (
                  <IndianRupee className="w-5 h-5 text-green-500" />
                )}
                {link.name === "Properties" && (
                  <Home className="w-5 h-5 text-[#F59E0B]" />
                )}
                {link.name === "Destinations" && (
                  <MapPin className="w-5 h-5 text-[#F59E0B]" />
                )}
                {link.name}
              </button>
            ))}
            <div className="section-divider my-2" />
            <a
              href="tel:+918806092609"
              className="flex items-center gap-3 text-white"
            >
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-medium">Call Support</span>
            </a>
            <PWAInstallButton variant="menu" />
            <div className="lg:hidden h-1" /> {/* Spacer */}
            <Button
              onClick={() => scrollToSection("#properties")}
              className="bg-[#F59E0B] text-black font-semibold w-full mt-2 hover:bg-[#d97706] shadow-[0_6px_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-5 h-5" />
              Book Now
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
