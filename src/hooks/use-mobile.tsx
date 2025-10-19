
'use client';
import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is mobile based on a breakpoint.
 * Returns `undefined` during server-side rendering and initial client hydration,
 * then returns `true` or `false` once the client screen size is detected.
 */
export const useIsMobile = (breakpoint = 768): boolean | undefined => {
  // Initialize state to `undefined`
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // This effect only runs on the client, after hydration.
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Run check once on mount
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('resize', checkScreen-size);
    };
  }, [breakpoint]); // Re-run if breakpoint changes

  return isMobile;
};
