import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Network status hook for detecting online/offline state
 *
 * Requirements:
 * - 15.7: Detect network connectivity changes
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web platform - use navigator.onLine
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // React Native - would use @react-native-community/netinfo
      // For now, assume online on native platforms
      setIsOnline(true);
    }
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return navigator.onLine;
    }
    // For native, would use NetInfo.fetch()
    return true;
  }, []);

  return { isOnline, checkConnection };
}

export default useNetworkStatus;
