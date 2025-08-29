import { TrendingUp, Users, MapPin, Award, Building, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    icon: Building,
    title: "Totalt antal förskolor",
    value: "2,547",
    change: "+127 sedan 2023",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Barn i förskolan",
    value: "485,230",
    change: "+3.2% sedan föregående år",
    color: "text-nordic-blue"
  },
  {
    icon: Award,
    title: "Medelbetyg",
    value: "4.6/5",
    change: "+0.2 sedan 2023",
    color: "text-swedish-flag"
  },
  {
    icon: MapPin,
    title: "Täckta kommuner",
    value: "290/290",
    change: "100% täckning",
    color: "text-emerald-600"
  }
];

const typeDistribution = [
  { type: "Kommunala", percentage: 68, count: "1,732" },
  { type: "Fristående", percentage: 28, count: "713" },
  { type: "Kooperativa", percentage: 4, count: "102" }
];

const topCities = [
  { city: "Stockholm", count: 387, percentage: 15.2 },
  { city: "Göteborg", count: 198, percentage: 7.8 },
  { city: "Malmö", count: 145, percentage: 5.7 },
  { city: "Uppsala", count: 89, percentage: 3.5 },
  { city: "Västerås", count: 67, percentage: 2.6 }
];

export const Statistics = () => {
  return (
    <section id="stats" className="py-20 bg-gradient-to-br from-nordic-light/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Förskolor i <span className="text-primary">Sverige</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Utforska statistik och data om förskolor i hela landet
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="text-center hover:shadow-nordic transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className={`inline-flex p-3 rounded-full bg-gradient-primary/10 ${stat.color} mx-auto mb-3`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-sm text-muted-foreground font-medium">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Type Distribution */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm animate-slide-in-right">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Fördelning per typ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {typeDistribution.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{type.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {type.count} ({type.percentage}%)
                    </span>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Cities */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Största städerna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCities.map((city, index) => (
                <div key={city.city} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-foreground">{city.city}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{city.count}</div>
                    <div className="text-sm text-muted-foreground">{city.percentage}%</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto border-border/50 bg-gradient-primary/5 backdrop-blur-sm">
            <CardContent className="p-8">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Hjälp oss förbättra databasen
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Har du information om en förskola som saknas i vår databas? 
                Hjälp andra föräldrar genom att bidra med information.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow transition-all duration-300 font-medium">
                  Lägg till förskola
                </button>
                <button className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-all duration-300 font-medium">
                  Rapportera fel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};