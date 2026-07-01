import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/** Tracks network connectivity so the engine can decide cloud vs on-device. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  return online;
}
