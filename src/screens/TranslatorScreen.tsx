import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraView } from '../components/CameraView';
import { TranslationPanel } from '../components/TranslationPanel';
import { SettingsScreen } from './SettingsScreen';
import { useTranslation } from '../hooks/useTranslation';
import { CAMERA_FLEX, PANEL_FLEX, colors, radius, spacing } from '../theme';

/**
 * Main screen. Splits the display into the camera "AR scene" on top (~75%) and
 * the live translation panel on the bottom (~25%), matching the product spec.
 */
export function TranslatorScreen() {
  const insets = useSafeAreaInsets();
  const { result, busy, paused, submit, togglePause } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <View style={styles.root}>
      <View style={[styles.camera, { flex: CAMERA_FLEX }]}>
        {/* OCR stays active unless the panel is frozen. */}
        <CameraView onText={submit} active={!paused} />

        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <Text style={styles.brand}>Gift for CY</Text>
          <Pressable
            style={styles.gear}
            onPress={() => setSettingsOpen(true)}
            hitSlop={12}
            accessibilityLabel="Settings"
          >
            <Text style={styles.gearIcon}>⚙︎</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.panel, { flex: PANEL_FLEX, paddingBottom: insets.bottom }]}>
        <TranslationPanel
          result={result}
          busy={busy}
          paused={paused}
          onTogglePause={togglePause}
        />
      </View>

      <SettingsScreen visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  camera: { overflow: 'hidden' },
  panel: { backgroundColor: colors.panel },
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  gear: {
    backgroundColor: colors.overlay,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: { color: colors.text, fontSize: 18 },
});
