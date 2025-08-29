import { create } from 'zustand';
import { Preschool } from './mapStore';

interface ComparisonState {
  selectedPreschools: Preschool[];
  isOpen: boolean;
  
  // Actions
  addToComparison: (preschool: Preschool) => void;
  removeFromComparison: (preschoolId: string) => void;
  clearComparison: () => void;
  isInComparison: (preschoolId: string) => boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  selectedPreschools: [],
  isOpen: false,

  addToComparison: (preschool) => {
    const current = get().selectedPreschools;
    if (current.length >= 5) return; // Max 5 preschools for comparison
    if (!current.find(p => p.id === preschool.id)) {
      set({ selectedPreschools: [...current, preschool] });
    }
  },

  removeFromComparison: (preschoolId) => {
    const current = get().selectedPreschools;
    set({ selectedPreschools: current.filter(p => p.id !== preschoolId) });
  },

  clearComparison: () => {
    set({ selectedPreschools: [] });
  },

  isInComparison: (preschoolId) => {
    return get().selectedPreschools.some(p => p.id === preschoolId);
  },

  setIsOpen: (isOpen) => {
    set({ isOpen });
  },
}));