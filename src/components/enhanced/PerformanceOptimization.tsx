import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';
import { Zap, Settings, Eye, EyeOff, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

interface PerformanceOptimizationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceOptimization: React.FC<PerformanceOptimizationProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { 
    performanceMode, 
    setPerformanceMode, 
    preschools,
    filteredPreschools 
  } = useMapStore();
  
  const [settings, setSettings] = useState({
    enableClustering: true,
    maxMarkersVisible: 1000,
    enableAnimations: true,
    enableLazyLoading: true,
    enableDataVirtualization: true,
    renderDistance: 50, // km
    updateThrottle: 100 // ms
  });

  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    visibleMarkers: 0,
    lastUpdate: Date.now()
  });

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    // Simulate render time calculation
    const measurePerformance = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100,
        visibleMarkers: filteredPreschools.length,
        lastUpdate: Date.now()
      }));
    };

    // Memory usage estimation
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memInfo.usedJSHeapSize / 1024 / 1024)
      }));
    }

    measurePerformance();
  }, [filteredPreschools]);

  const getPerformanceLevel = () => {
    if (metrics.renderTime < 50 && metrics.visibleMarkers < 500) return 'optimal';
    if (metrics.renderTime < 100 && metrics.visibleMarkers < 1000) return 'good';
    if (metrics.renderTime < 200 && metrics.visibleMarkers < 2000) return 'moderate';
    return 'poor';
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (metrics.visibleMarkers > 1000) {
      recommendations.push({
        type: 'clustering',
        message: 'Aktivera clustering för bättre prestanda med många markörer',
        action: () => setSettings(prev => ({ ...prev, enableClustering: true }))
      });
    }

    if (metrics.renderTime > 100) {
      recommendations.push({
        type: 'animations',
        message: 'Inaktivera animationer för snabbare rendering',
        action: () => setSettings(prev => ({ ...prev, enableAnimations: false }))
      });
    }

    if (metrics.memoryUsage > 100) {
      recommendations.push({
        type: 'virtualization',
        message: 'Aktivera datavirtuellisering för minnesoptimering',
        action: () => setSettings(prev => ({ ...prev, enableDataVirtualization: true }))
      });
    }

    return recommendations;
  };

  const applyPerformancePreset = (preset: 'high' | 'medium' | 'low') => {
    setPerformanceMode(preset);
    
    switch (preset) {
      case 'high':
        setSettings({
          enableClustering: true,
          maxMarkersVisible: 2000,
          enableAnimations: true,
          enableLazyLoading: true,
          enableDataVirtualization: true,
          renderDistance: 100,
          updateThrottle: 50
        });
        break;
      case 'medium':
        setSettings({
          enableClustering: true,
          maxMarkersVisible: 1000,
          enableAnimations: true,
          enableLazyLoading: true,
          enableDataVirtualization: true,
          renderDistance: 50,
          updateThrottle: 100
        });
        break;
      case 'low':
        setSettings({
          enableClustering: true,
          maxMarkersVisible: 500,
          enableAnimations: false,
          enableLazyLoading: true,
          enableDataVirtualization: true,
          renderDistance: 25,
          updateThrottle: 200
        });
        break;
    }
  };

  const getPerformanceBadgeColor = (level: string) => {
    switch (level) {
      case 'optimal': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'moderate': return 'bg-orange-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen) return null;

  const performanceLevel = getPerformanceLevel();
  const recommendations = getRecommendations();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-card border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Prestandaoptimering
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Renderingstid</p>
                  <p className="text-lg font-semibold">{metrics.renderTime}ms</p>
                </div>
                <Badge className={getPerformanceBadgeColor(performanceLevel)}>
                  {performanceLevel}
                </Badge>
              </div>
            </Card>

            <Card className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">Synliga markörer</p>
                <p className="text-lg font-semibold">{metrics.visibleMarkers.toLocaleString()}</p>
              </div>
            </Card>

            <Card className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">Minnesanvändning</p>
                <p className="text-lg font-semibold">{metrics.memoryUsage}MB</p>
              </div>
            </Card>
          </div>

          {/* Performance Presets */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Prestandainställningar</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((preset) => (
                <Button
                  key={preset}
                  onClick={() => applyPerformancePreset(preset)}
                  variant={performanceMode === preset ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3"
                >
                  <Gauge className="w-4 h-4 mb-1" />
                  <span className="capitalize">
                    {preset === 'high' ? 'Hög' : preset === 'medium' ? 'Medium' : 'Låg'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {preset === 'high' ? 'Alla funktioner' : 
                     preset === 'medium' ? 'Balanserad' : 'Batterisparande'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Detailed Settings */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium">Detaljerade inställningar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="clustering">Clustering</Label>
                <Switch
                  id="clustering"
                  checked={settings.enableClustering}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableClustering: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animations">Animationer</Label>
                <Switch
                  id="animations"
                  checked={settings.enableAnimations}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableAnimations: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="lazy-loading">Lazy Loading</Label>
                <Switch
                  id="lazy-loading"
                  checked={settings.enableLazyLoading}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableLazyLoading: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="virtualization">Datavirtuellisering</Label>
                <Switch
                  id="virtualization"
                  checked={settings.enableDataVirtualization}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableDataVirtualization: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max synliga markörer: {settings.maxMarkersVisible}</Label>
              <Slider
                value={[settings.maxMarkersVisible]}
                onValueChange={([value]) => 
                  setSettings(prev => ({ ...prev, maxMarkersVisible: value }))
                }
                max={5000}
                min={100}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Renderingsavstånd: {settings.renderDistance}km</Label>
              <Slider
                value={[settings.renderDistance]}
                onValueChange={([value]) => 
                  setSettings(prev => ({ ...prev, renderDistance: value }))
                }
                max={200}
                min={10}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-3">Rekommendationer</h3>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="p-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{rec.message}</p>
                      <Button onClick={rec.action} size="sm" variant="outline">
                        Tillämpa
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Stäng
            </Button>
            <Button onClick={() => {
              // Apply all settings
              console.log('Applying performance settings:', settings);
              onClose();
            }}>
              Spara inställningar
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};