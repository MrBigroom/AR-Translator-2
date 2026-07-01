import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
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

/** Scan box position/size as percentages of the camera view. */
interface Region {
  left: number;
  top: number;
  width: number;
  height: number;
}

type GestureMode = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const MIN_W = 14; // % — minimum box width
const MIN_H = 7; //  % — minimum box height
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Apply a drag (in % deltas) to the region for the given gesture mode. */
function applyGesture(mode: GestureMode, s: Region, dx: number, dy: number): Region {
  if (mode === 'move') {
    return {
      ...s,
      left: clamp(s.left + dx, 0, 100 - s.width),
      top: clamp(s.top + dy, 0, 100 - s.height),
    };
  }
  const right = s.left + s.width; // fixed edges depend on the corner
  const bottom = s.top + s.height;
  let { left, top, width, height } = s;
  if (mode === 'tl') {
    left = clamp(s.left + dx, 0, right - MIN_W);
    top = clamp(s.top + dy, 0, bottom - MIN_H);
    width = right - left;
    height = bottom - top;
  } else if (mode === 'tr') {
    top = clamp(s.top + dy, 0, bottom - MIN_H);
    width = clamp(s.width + dx, MIN_W, 100 - s.left);
    height = bottom - top;
  } else if (mode === 'bl') {
    left = clamp(s.left + dx, 0, right - MIN_W);
    width = right - left;
    height = clamp(s.height + dy, MIN_H, 100 - s.top);
  } else {
    // br
    width = clamp(s.width + dx, MIN_W, 100 - s.left);
    height = clamp(s.height + dy, MIN_H, 100 - s.top);
  }
  return { left, top, width, height };
}

/**
 * The top ~75% AR scene: a live camera preview with an OCR frame processor and a
 * scan box you can DRAG (body) and RESIZE (corner grips). OCR only reads text
 * inside the box. The corner grips are siblings of the box (rendered on top) so a
 * touch on a corner resizes, while a touch elsewhere on the box moves it.
 */
export function CameraView({ onText, active, script }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  // `region` is the live box; `committed` is what OCR reads — updated only when a
  // gesture ends, so the OCR plugin isn't rebuilt on every gesture frame.
  const [region, setRegion] = useState<Region>({ left: 10, top: 34, width: 80, height: 20 });
  const [committed, setCommitted] = useState<Region>(region);
  const regionRef = useRef(region);
  regionRef.current = region;
  const startRef = useRef(region);
  const layoutRef = useRef({ w: 1, h: 1 });

  const pans = useMemo(() => {
    const make = (mode: GestureMode) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
        onPanResponderGrant: () => {
          startRef.current = regionRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const { w, h } = layoutRef.current;
          setRegion(applyGesture(mode, startRef.current, (g.dx / w) * 100, (g.dy / h) * 100));
        },
        onPanResponderRelease: () => setCommitted(regionRef.current),
        onPanResponderTerminate: () => setCommitted(regionRef.current),
      });
    return {
      move: make('move'),
      tl: make('tl'),
      tr: make('tr'),
      bl: make('bl'),
      br: make('br'),
    };
  }, []);

  const scanRegion = useMemo(
    () => ({
      left: `${committed.left}%`,
      top: `${committed.top}%`,
      width: `${committed.width}%`,
      height: `${committed.height}%`,
    }),
    [committed],
  );

  const frameProcessor = useFrameOcr(onText, active, script, scanRegion);

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

  const cx = region.left + region.width; // right edge %
  const cy = region.top + region.height; // bottom edge %

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        layoutRef.current = { w: width || 1, h: height || 1 };
      }}
    >
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />

      {/* Box body — drag anywhere on it to move. */}
      <View
        {...pans.move.panHandlers}
        style={[
          styles.scanBox,
          {
            left: `${region.left}%`,
            top: `${region.top}%`,
            width: `${region.width}%`,
            height: `${region.height}%`,
          },
        ]}
      >
        <View style={styles.dragPillWrap} pointerEvents="none">
          <View style={styles.dragPill}>
            <Text style={styles.dragText}>⠿  drag box  ·  grips resize</Text>
          </View>
        </View>
      </View>

      {/* Corner grips (siblings, on top) — drag to resize. */}
      <View {...pans.tl.panHandlers} style={[styles.handle, { left: `${region.left}%`, top: `${region.top}%` }]}>
        <View style={styles.grip} />
      </View>
      <View {...pans.tr.panHandlers} style={[styles.handle, { left: `${cx}%`, top: `${region.top}%` }]}>
        <View style={styles.grip} />
      </View>
      <View {...pans.bl.panHandlers} style={[styles.handle, { left: `${region.left}%`, top: `${cy}%` }]}>
        <View style={styles.grip} />
      </View>
      <View {...pans.br.panHandlers} style={[styles.handle, { left: `${cx}%`, top: `${cy}%` }]}>
        <View style={styles.grip} />
      </View>
    </View>
  );
}

const HANDLE = 44; // touch target size
const GRIP = 20;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scanBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(110,231,183,0.7)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(110,231,183,0.06)',
  },
  // Centered on its corner point via negative margins.
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    marginLeft: -HANDLE / 2,
    marginTop: -HANDLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grip: {
    width: GRIP,
    height: GRIP,
    borderRadius: GRIP / 2,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: 'rgba(11,15,25,0.55)',
  },
  dragPillWrap: { position: 'absolute', top: -32, left: 0, right: 0, alignItems: 'center' },
  dragPill: {
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  dragText: { color: colors.text, fontSize: 12, fontWeight: '700' },
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
