import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Layers, Map, MapPin, Square } from 'lucide-react';
import { useMapStore, HeatmapType } from '@/stores/mapStore';
interface LayerControlProps {
  className?: string;
}
const LayerControl: React.FC<LayerControlProps> = ({
  className
}) => {
  const {
    layerVisibility,
    heatmapType,
    heatmapIntensity,
    showHeatmap,
    setLayerVisibility,
    setHeatmapType,
    setHeatmapIntensity,
    setShowHeatmap
  } = useMapStore();
  const heatmapTypes = [{
    value: 'density',
    label: 'Täthet',
    icon: MapPin,
    description: 'Antal förskolor per område'
  }, {
    value: 'staff',
    label: 'Personal',
    icon: Map,
    description: 'Vuxen-barn ratio'
  }, {
    value: 'quality',
    label: 'Kvalitet',
    icon: Square,
    description: 'Andel med lärarexamen'
  }, {
    value: 'rating',
    label: 'Betyg',
    icon: Square,
    description: 'Google betyg'
  }] as const;
  return <motion.div initial={{
    opacity: 0,
    x: 20
  }} animate={{
    opacity: 1,
    x: 0
  }} className={`absolute top-4 right-4 z-10 ${className}`}>
      
    </motion.div>;
};
export default LayerControl;