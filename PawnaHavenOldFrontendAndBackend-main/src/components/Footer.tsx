import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { CLOUDINARY_IMAGES } from "@/config/cloudinaryImages";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="contact" className="bg-secondary/50 border-t border-border/30">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-start">
          {/* Brand */}
          <div className="flex flex-col">
            <Link to="/" className="flex flex-col items-start gap-2 mb-6 group">
              <img
                src={CLOUDINARY_IMAGES.WEBSITE_LOGO}
                alt="Pawna Haven Camp"
                className="w-[58px] h-[58px] object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
              />
              <span className="font-display text-2xl font-bold text-foreground">
                PawnaHavenCamp
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              Curating extraordinary stays for discerning travelers. Experience
              luxury in nature's embrace.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-white hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-white hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-white hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h4 className="font-display text-lg font-bold text-foreground mb-6">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-3">
              <button
                onClick={() => scrollToSection("#properties")}
                className="text-white hover:text-primary text-left text-sm transition-colors"
              >
                Properties
              </button>
              <button
                onClick={() => scrollToSection("#destinations")}
                className="text-white hover:text-primary text-left text-sm transition-colors"
              >
                Destinations
              </button>
              <Link
                to="/info/about"
                className="text-white hover:text-primary text-sm transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/info/services"
                className="text-white hover:text-primary text-sm transition-colors"
              >
                Our Services
              </Link>
              <Link
                to="/info/contact"
                className="text-white hover:text-primary text-sm transition-colors"
              >
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col">
            <h4 className="font-display text-lg font-bold text-foreground mb-6">
              Contact
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-white text-sm">
                  Pawna Lake, Lonavala,
                  <br />
                  Maharashtra, India
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a
                  href="tel:+918806092609"
                  className="text-white text-sm hover:text-primary transition-colors"
                >
                  +91 88060 92609
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a
                  href="mailto:hrushikeshmore2609@gmail.com"
                  className="text-white text-sm hover:text-primary transition-colors"
                >
                  hrushikeshmore2609@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          {/* <div>
            <h4 className="font-display text-lg font-bold text-foreground mb-6">
              Newsletter
            </h4>
            <p className="text-white text-sm mb-4">
              Subscribe for exclusive offers and travel inspiration.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-border/50 text-foreground text-sm focus:outline-none focus:border-primary transition-colors min-w-0"
              />
              <Button className="bg-[#F59E0B] hover:bg-[#d97706] text-black px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all">
                Subscribe
              </Button>
            </div>
          </div> */}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white text-sm">
            © 2026 PAWNAHAVENCAMP (Udyam Registered Enterprise). All rights
            reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              to="/info/privacy-policy"
              className="text-white text-sm hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/info/terms"
              className="text-white text-sm hover:text-primary transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              to="/info/refund-policy"
              className="text-white text-sm hover:text-primary transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
