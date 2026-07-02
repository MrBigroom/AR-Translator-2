import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TranslatorScreen } from './screens/TranslatorScreen';

/** Root component for Gift for CY. */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <TranslatorScreen />
    </SafeAreaProvider>
  );
}
