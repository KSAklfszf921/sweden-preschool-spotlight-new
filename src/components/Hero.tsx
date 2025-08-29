import { useState } from "react";
import { Search, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-preschool.jpg";

export const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Swedish preschool with children playing"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight">
            Hitta din <span className="text-gradient">perfekta</span> förskola
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed font-medium">
            Upptäck och jämför förskolor i hela Sverige med vår interaktiva plattform
          </p>

          {/* Search Bar */}
          <div className="glass-search border border-white/30 max-w-2xl mx-auto mb-8 hover-glow">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                <Input
                  placeholder="Sök förskola eller område..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus-glow h-14 text-lg font-medium"
                />
              </div>
              <Button variant="secondary" size="lg" className="h-14 px-8 bg-white text-primary hover:bg-white/90 hover-scale font-heading font-semibold">
                <MapPin className="w-5 h-5 mr-2" />
                Sök
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass-card border border-white/20 animate-slide-in-right hover-lift stagger-animation" style={{'--stagger-delay': 0} as any}>
              <div className="text-3xl font-heading font-bold mb-2">2,500+</div>
              <div className="text-white/90 font-medium">Förskolor</div>
            </div>
            <div className="glass-card border border-white/20 animate-slide-in-right hover-lift stagger-animation" style={{'--stagger-delay': 1} as any}>
              <div className="text-3xl font-heading font-bold mb-2 flex items-center justify-center gap-2">
                4.8 <Star className="w-6 h-6 fill-swedish-flag text-swedish-flag hover-scale" />
              </div>
              <div className="text-white/90 font-medium">Medelbetyg</div>
            </div>
            <div className="glass-card border border-white/20 animate-slide-in-right hover-lift stagger-animation" style={{'--stagger-delay': 2} as any}>
              <div className="text-3xl font-heading font-bold mb-2">290</div>
              <div className="text-white/90 font-medium">Kommuner</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/70 animate-bounce">
        <div className="text-sm font-heading font-medium">Upptäck mer</div>
        <div className="w-px h-8 bg-white/30 mx-auto mt-2"></div>
      </div>
    </section>
  );
};