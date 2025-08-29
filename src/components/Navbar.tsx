import { useState } from "react";
import { Menu, X, MapPin, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import preschoolIcon from "@/assets/preschool-icon.jpg";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Hem", href: "#", icon: null },
    { name: "Karta", href: "#map", icon: MapPin },
    { name: "Statistik", href: "#stats", icon: BarChart3 },
    { name: "Om oss", href: "#about", icon: Users },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 hover-scale">
            <img 
              src={preschoolIcon} 
              alt="Sveriges Förskolor"
              className="w-10 h-10 rounded-lg shadow-sm hover-glow"
            />
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">Sveriges Förskolor</h1>
              <p className="text-xs text-muted-foreground hidden sm:block font-medium">Hitta din perfekta förskola</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-foreground/80 hover:text-primary transition-all duration-300 font-medium hover-scale group"
              >
                {item.icon && <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                <span className="font-heading font-medium">{item.name}</span>
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button variant="default" className="bg-gradient-primary hover:shadow-glow hover-scale font-heading font-semibold">
              Lägg till förskola
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-border/50 glass-nav">
            <div className="px-2 pt-3 pb-4 space-y-2">
              {navigation.map((item, index) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-3 text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-xl transition-all duration-300 hover-scale stagger-animation"
                  style={{ '--stagger-delay': index } as any}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span className="font-heading font-medium">{item.name}</span>
                </a>
              ))}
              <div className="px-3 py-2">
                <Button 
                  variant="default" 
                  className="w-full bg-gradient-primary hover:shadow-glow hover-scale font-heading font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Lägg till förskola
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};