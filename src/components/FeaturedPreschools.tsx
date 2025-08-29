import { Star, MapPin, Users, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const preschools = [
  {
    id: 1,
    name: "Björngårdens Förskola",
    location: "Stockholm, Södermalm",
    rating: 4.9,
    reviews: 127,
    type: "Kommunal",
    age: "1-5 år",
    spots: 12,
    description: "En kreativ förskola med fokus på naturens pedagogik och barns fantasi.",
    features: ["Naturpedagogik", "Kreativ verksamhet", "Utomhuspedagogik"],
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=240&fit=crop&auto=format"
  },
  {
    id: 2,
    name: "Regnbågens Förskola",
    location: "Göteborg, Centrum",
    rating: 4.8,
    reviews: 89,
    type: "Fristående",
    age: "1-6 år",
    spots: 8,
    description: "Flerspråkig förskola med internationell miljö och moderna faciliteter.",
    features: ["Flerspråkig", "Internationell", "Moderna lokaler"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=240&fit=crop&auto=format"
  },
  {
    id: 3,
    name: "Äventyrets Förskola",
    location: "Malmö, Västra Hamnen",
    rating: 4.7,
    reviews: 156,
    type: "Kooperativ",
    age: "2-6 år",
    spots: 5,
    description: "Äventyrsbaserad pedagogik med stort fokus på fysisk aktivitet och utomhusvistelse.",
    features: ["Äventyrspedagogik", "Utomhusaktiviteter", "Fysisk aktivitet"],
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=240&fit=crop&auto=format"
  },
  {
    id: 4,
    name: "Teknikens Förskola",
    location: "Uppsala, Centrum",
    rating: 4.6,
    reviews: 94,
    type: "Fristående",
    age: "3-6 år",
    spots: 15,
    description: "Teknik och naturvetenskap i förgrunden med moderna digitala verktyg.",
    features: ["STEM-fokus", "Digital pedagogik", "Teknik & Science"],
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=240&fit=crop&auto=format"
  },
  {
    id: 5,
    name: "Naturens Förskola",
    location: "Västerås, Skogås",
    rating: 4.9,
    reviews: 78,
    type: "Kommunal",
    age: "1-5 år",
    spots: 7,
    description: "Ren naturpedagogik i skogens miljö med djur och växthus.",
    features: ["I skogen", "Djur på gården", "Växthus"],
    image: "https://images.unsplash.com/photo-1544776527-59c7d3d97878?w=400&h=240&fit=crop&auto=format"
  },
  {
    id: 6,
    name: "Musikens Förskola",
    location: "Lund, Centrum",
    rating: 4.8,
    reviews: 112,
    type: "Fristående",
    age: "2-6 år",
    spots: 3,
    description: "Musik och rytmik i centrum med professionella musiklärare.",
    features: ["Musikpedagogik", "Instrument", "Körsång"],
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=240&fit=crop&auto=format"
  }
];

export const FeaturedPreschools = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-nordic-light/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Utvalda <span className="text-primary">Förskolor</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Upptäck några av de mest populära förskolorna i Sverige med högsta betyg och bästa recensioner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {preschools.map((preschool) => (
            <Card 
              key={preschool.id} 
              className="group hover:shadow-nordic transition-all duration-300 hover:-translate-y-2 border-border/50 bg-card/80 backdrop-blur-sm animate-scale-in"
              style={{ animationDelay: `${preschool.id * 0.1}s` }}
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={preschool.image} 
                  alt={preschool.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white/90 text-primary">
                    {preschool.type}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-swedish-flag text-swedish-flag" />
                    <span className="text-sm font-semibold">{preschool.rating}</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {preschool.name}
                  </h3>
                </div>

                <div className="flex items-center text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{preschool.location}</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {preschool.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {preschool.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{preschool.age}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{preschool.spots} platser kvar</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {preschool.reviews} recensioner
                  </div>
                  <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground">
                    Läs mer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="default" size="lg" className="bg-gradient-primary hover:shadow-glow px-8">
            Visa alla förskolor
          </Button>
        </div>
      </div>
    </section>
  );
};