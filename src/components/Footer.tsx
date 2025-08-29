import { Heart, Mail, Phone, MapPin, Github, Facebook, Twitter } from "lucide-react";
import preschoolIcon from "@/assets/preschool-icon.jpg";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src={preschoolIcon} 
                alt="Sveriges Förskolor"
                className="w-12 h-12 rounded-lg"
              />
              <div>
                <h3 className="text-2xl font-bold">Sveriges Förskolor</h3>
                <p className="text-background/70">Hitta din perfekta förskola</p>
              </div>
            </div>
            <p className="text-background/80 leading-relaxed mb-6 max-w-md">
              Vi hjälper föräldrar i hela Sverige att hitta den bästa förskolan för sina barn 
              genom vår omfattande databas och jämförelsefunktioner.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Snabblänkar</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors">
                  Alla förskolor
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors">
                  Sök i din kommun
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors">
                  Jämför förskolor
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors">
                  Senaste recensioner
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors">
                  Vanliga frågor
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Kontakta oss</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-background/70" />
                <span className="text-background/80">info@sverigesforskolor.se</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-background/70" />
                <span className="text-background/80">08-123 456 78</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-background/70" />
                <span className="text-background/80">Stockholm, Sverige</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 text-background/70 mb-4 md:mb-0">
              <span>© {currentYear} Sveriges Förskolor. Skapad med</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span>för Sveriges barn.</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                Integritetspolicy
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                Användarvillkor
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};