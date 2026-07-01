import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

import { useFrameOcr, OcrScript } from '../hooks/useFrameOcr';
import { colors, radius, spacing } from '../theme';

interface Props {
  /** Called with raw recognized text on each throttled OCR pass. */
  onText: (text: string) => void;
  /** When false, OCR is skipped (e.g. panel frozen) but the preview stays live. */
  active: boolean;
  script?: OcrScript;
}

/**
 * The top ~75% AR scene: a live camera preview with an OCR frame processor and a
 * lightweight scan reticle. Owns camera-permission and no-device fallbacks.
 */
export function CameraView({ onText, active, script }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const frameProcessor = useFrameOcr(onText, active, script);

  if (!hasPermission) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Camera access needed</Text>
        <Text style={styles.fallbackText}>
          Gift for CY reads and translates text from the camera. Grant access to continue.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>No camera found</Text>
        <Text style={styles.fallbackText}>
          This device has no available back camera. A physical device is required.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
      {/* Scan reticle hints where recognized text is read from. */}
      <View pointerEvents="none" style={styles.reticleWrap}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
      </View>
    </View>
  );
}

const CORNER = 26;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  reticleWrap: {
    ...StyleSheet.absoluteFillObject,
    margin: spacing.xl,
    justifyContent: 'space-between',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.accent },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.sm },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.sm },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.sm },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: radius.sm,
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fallbackTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '700' },
});
