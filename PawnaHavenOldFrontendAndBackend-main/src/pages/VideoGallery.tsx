import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const VideoGallery = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Video Gallery - PawnaHavenCamp</title>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-6 pt-32 pb-20">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-8 gap-2 text-[#F59E0B] hover:text-[#D97706] hover:bg-[#F59E0B]/10 transition-all duration-200 hover:-translate-x-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="max-w-4xl mx-auto text-center space-y-12">
            {/* Heading */}
            <div className="space-y-4">
              <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground">
                Experience the <span className="text-[#F59E0B]">Luxury</span>
              </h1>

              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Take a visual journey through our handpicked properties and
                breathtaking locations.
              </p>
            </div>

            {/* Coming Soon Card */}
            <div className="relative py-16 md:aspect-video rounded-[2rem] overflow-visible bg-secondary/30 border border-[#F59E0B]/20 flex flex-col items-center justify-center p-8 space-y-6 group transition-all duration-300 hover:border-[#F59E0B]/40">
              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-[#F59E0B]/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#F59E0B]/20 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Clock className="w-10 h-10 text-[#F59E0B]" />
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Coming Soon!
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Our team is currently capturing the magic moments of Pawna Haven Camp.
                  Breathtaking drone shots and walkthrough videos will be
                  available here soon.
                </p>
              </div>

              {/* Glow Background */}
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(245,158,11,0.4)_0%,transparent_70%)]" />
              </div>
            </div>

            {/* Placeholder Videos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-video rounded-2xl bg-secondary/20 border border-border/20 animate-pulse hover:border-[#F59E0B]/30 transition-all"
                />
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default VideoGallery;
