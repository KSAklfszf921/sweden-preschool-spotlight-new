import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  Search, 
  Map, 
  Settings, 
  Heart,
  BarChart3,
  Info
} from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { useComparisonStore } from '@/stores/comparisonStore';

export const MobileNavigation: React.FC = () => {
  const { 
    filteredPreschools
  } = useMapStore();
  const { selectedPreschools, setIsOpen } = useComparisonStore();

  const navigationItems = [
    {
      icon: Search,
      label: 'Sök',
      action: () => {
        const searchElement = document.querySelector('[data-search-trigger]');
        if (searchElement) {
          (searchElement as HTMLElement).click();
        }
      }
    },
    {
      icon: Map,
      label: 'Karta',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      icon: BarChart3,
      label: 'Statistik',
      action: () => {
        // Find and click the statistics button
        const statsButton = document.querySelector('[data-testid="statistics-button"]') as HTMLElement;
        if (statsButton) {
          statsButton.click();
        }
      },
      badge: filteredPreschools.length
    },
    {
      icon: Heart,
      label: 'Jämför',
      action: () => {
        if (selectedPreschools.length > 0) {
          setIsOpen(true);
        }
      },
      badge: selectedPreschools.length
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigationItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              onClick={item.action}
              className="flex flex-col items-center gap-1 h-auto p-2 relative"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-b border-border md:hidden">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold">Sveriges Förskolor</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="space-y-4 mt-8">
                <div className="space-y-2">
                  <h3 className="font-semibold">Navigation</h3>
                  {navigationItems.map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      onClick={item.action}
                      className="w-full justify-start"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Information</h3>
                  <Button variant="ghost" className="w-full justify-start">
                    <Info className="h-4 w-4 mr-2" />
                    Om tjänsten
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Inställningar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};