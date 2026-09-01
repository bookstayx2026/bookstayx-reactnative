import {
  Phone,
  MessageCircle,
  MessageCircle as WhatsAppIcon,
} from "lucide-react";

const FloatingContact = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* WhatsApp */}
      <div
        onClick={() =>
          window.open(
            "https://api.whatsapp.com/send?phone=918806092609&text=Hello! I'm interested in booking a stay.",
            "_blank",
          )
        }
        className="group relative cursor-pointer"
      >
        <div
          className="w-14 h-14 rounded-full 
        bg-gradient-to-b from-[#25D366] to-[#128C7E]
        flex items-center justify-center
        transition-all duration-300
        active:translate-y-1 active:shadow-inner
        shadow-[0_6px_0_rgb(18,140,126),0_12px_20px_rgba(0,0,0,0.3)]
        hover:shadow-[0_8px_0_rgb(10,100,90),0_16px_25px_rgba(0,0,0,0.4)]
        group overflow-hidden"
        >
          <div className="flex items-center justify-center w-full h-full relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="w-5 h-5 fill-white"
            >
              <path d="M16 .396C7.164.396 0 7.56 0 16c0 2.822.736 5.48 2.02 7.8L0 32l8.4-2.16A15.89 15.89 0 0016 31.604c8.836 0 16-7.164 16-16s-7.164-15.208-16-15.208zm0 28.21c-2.54 0-5.02-.66-7.2-1.9l-.52-.3-4.98 1.28 1.32-4.84-.34-.56A12.64 12.64 0 013.36 16c0-6.96 5.68-12.64 12.64-12.64S28.64 9.04 28.64 16 22.96 28.606 16 28.606zm6.96-9.48c-.38-.2-2.24-1.1-2.58-1.22-.34-.12-.6-.2-.86.2-.26.38-1 1.22-1.22 1.48-.22.26-.44.3-.82.1-.38-.2-1.6-.58-3.06-1.84-1.14-1.02-1.9-2.28-2.12-2.66-.22-.38-.02-.58.16-.78.16-.16.38-.42.56-.64.18-.22.24-.38.36-.64.12-.26.06-.48-.02-.68-.08-.2-.86-2.08-1.18-2.86-.32-.76-.64-.66-.86-.68-.22-.02-.48-.02-.74-.02-.26 0-.68.1-1.04.48-.36.38-1.36 1.32-1.36 3.22s1.4 3.74 1.6 4 .2.38 2.74 4.2c2.54 3.82 6.28 5.22 7.42 5.66 1.14.44 2.18.38 3 .24.82-.14 2.24-.92 2.56-1.8.32-.88.32-1.64.22-1.8-.1-.16-.36-.26-.74-.46z" />
            </svg>
          </div>
        </div>

        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-card text-foreground text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-border/30">
          Chat on WhatsApp
        </span>
      </div>

      {/* Phone */}
      <div
        onClick={() => (window.location.href = "tel:+918806092609")}
        className="group relative cursor-pointer"
      >
        <div
          className="w-14 h-14 rounded-full 
        bg-gradient-to-b from-[#F59E0B] to-[#d97706]
        flex items-center justify-center
        transition-all duration-300
        active:translate-y-1 active:shadow-inner
        shadow-[0_6px_0_rgb(180,83,9),0_12px_20px_rgba(0,0,0,0.3)]
        hover:shadow-[0_8px_0_rgb(146,64,14),0_16px_25px_rgba(0,0,0,0.4)]
        group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Phone className="w-5 h-5 text-black relative z-10" />
        </div>

        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-card text-foreground text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-border/30">
          Call Us Now
        </span>
      </div>
    </div>
  );
};

export default FloatingContact;
