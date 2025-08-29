import React, { useEffect } from 'react';
import { useMapStore } from '@/stores/mapStore';

export const AccessibilityEnhancements: React.FC = () => {
  const { selectedPreschool } = useMapStore();

  useEffect(() => {
    // Announce when a preschool is selected
    if (selectedPreschool) {
      const announcement = `Förskola vald: ${selectedPreschool.namn} i ${selectedPreschool.kommun}`;
      announceToScreenReader(announcement);
    }
  }, [selectedPreschool]);

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Skip links for keyboard navigation
  useEffect(() => {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Hoppa till huvudinnehåll</a>
      <a href="#search-filters" class="skip-link">Hoppa till sökfilter</a>
      <a href="#map" class="skip-link">Hoppa till karta</a>
    `;
    
    const skipLinkStyles = document.createElement('style');
    skipLinkStyles.textContent = `
      .skip-links {
        position: fixed;
        top: -100px;
        left: 0;
        z-index: 9999;
      }
      
      .skip-link {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: var(--primary);
        color: var(--primary-foreground);
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 500;
      }
      
      .skip-link:focus {
        position: static;
        left: auto;
        width: auto;
        height: auto;
        overflow: visible;
        margin: 8px;
        outline: 2px solid var(--ring);
        outline-offset: 2px;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    
    document.head.appendChild(skipLinkStyles);
    document.body.prepend(skipLinks);
    
    return () => {
      if (document.body.contains(skipLinks)) {
        document.body.removeChild(skipLinks);
      }
      if (document.head.contains(skipLinkStyles)) {
        document.head.removeChild(skipLinkStyles);
      }
    };
  }, []);

  // Keyboard navigation improvements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close modals/panels
      if (e.key === 'Escape') {
        // This would trigger closing of open panels
        const escapeEvent = new CustomEvent('closeAllPanels');
        document.dispatchEvent(escapeEvent);
      }
      
      // F key to focus search
      if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="kommun"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null; // This component only adds accessibility features
};