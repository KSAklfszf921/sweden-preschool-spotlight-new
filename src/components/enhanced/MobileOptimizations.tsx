import React, { useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';

export const MobileOptimizations: React.FC = () => {
  const { performanceMode, setPerformanceMode } = useMapStore();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window;
    const isSmallScreen = window.innerWidth < 768;

    if (isMobile || isTouch || isSmallScreen) {
      // Automatically set to mobile-optimized performance mode
      if (performanceMode === 'high') {
        setPerformanceMode('medium');
      }

      // Add mobile-specific meta tags if not present
      addMobileMetaTags();
      
      // Optimize touch interactions
      optimizeTouchInteractions();
      
      // Prevent zoom on double tap
      preventDoubleZoom();
    }
  }, []);

  const addMobileMetaTags = () => {
    // Viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    // Theme color for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      themeColorMeta.setAttribute('content', '#1f2937');
      document.head.appendChild(themeColorMeta);
    }

    // Mobile web app capable
    let webAppMeta = document.querySelector('meta[name="mobile-web-app-capable"]');
    if (!webAppMeta) {
      webAppMeta = document.createElement('meta');
      webAppMeta.setAttribute('name', 'mobile-web-app-capable');
      webAppMeta.setAttribute('content', 'yes');
      document.head.appendChild(webAppMeta);
    }
  };

  const optimizeTouchInteractions = () => {
    // Add CSS for better touch targets
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .mapboxgl-ctrl button {
          min-width: 44px !important;
          min-height: 44px !important;
        }
        
        .mapboxgl-popup-close-button {
          width: 30px !important;
          height: 30px !important;
          font-size: 16px !important;
        }
        
        /* Larger touch targets for UI elements */
        button, .clickable {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Improved scrolling on mobile */
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          overflow-scrolling: touch;
        }
        
        /* Prevent text selection on mobile */
        .map-container, .mapboxgl-map {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Better mobile panels */
        .mobile-panel {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: auto !important;
          transform: none !important;
          border-radius: 16px 16px 0 0 !important;
          max-height: 70vh !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const preventDoubleZoom = () => {
    let lastTouchEnd = 0;
    
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
    };
  };

  // Gesture handling for better mobile UX
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent rubber band scrolling on iOS
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartRef.current && e.changedTouches.length === 1) {
        const touchEnd = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
          time: Date.now()
        };

        const deltaX = touchEnd.x - touchStartRef.current.x;
        const deltaY = touchEnd.y - touchStartRef.current.y;
        const deltaTime = touchEnd.time - touchStartRef.current.time;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Detect swipe gestures
        if (distance > 50 && deltaTime < 300) {
          const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
          
          // Emit custom swipe events
          if (Math.abs(angle) < 45) {
            // Right swipe
            document.dispatchEvent(new CustomEvent('swipeRight'));
          } else if (Math.abs(angle) > 135) {
            // Left swipe
            document.dispatchEvent(new CustomEvent('swipeLeft'));
          } else if (angle > 45 && angle < 135) {
            // Down swipe
            document.dispatchEvent(new CustomEvent('swipeDown'));
          } else if (angle < -45 && angle > -135) {
            // Up swipe
            document.dispatchEvent(new CustomEvent('swipeUp'));
          }
        }
      }
      touchStartRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null; // This component only adds mobile optimizations
};