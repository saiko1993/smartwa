import { useState, useEffect } from "react";
import { useStore } from "@/lib/zustand-store";

/**
 * Custom hook that tracks online/offline status
 * and updates the global store
 */
export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const setIsOfflineInStore = useStore(state => state.setIsOffline);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsOfflineInStore(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setIsOfflineInStore(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize the state in case the app loads in an offline state
    setIsOfflineInStore(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOfflineInStore]);
  
  return isOffline;
}
