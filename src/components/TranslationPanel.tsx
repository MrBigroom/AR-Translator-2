import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { LanguageSelector, selectionLabel } from './LanguageSelector';
import { useSettingsStore } from '../store/settingsStore';
import { languageName } from '../config/languages';
import { AUTO, TranslationResult } from '../types';
import { colors, radius, spacing } from '../theme';

interface Props {
  result: TranslationResult | null;
  busy: boolean;
  paused: boolean;
  onTogglePause: () => void;
}

/**
 * Bottom ~25% panel: shows the recognized original and its translation, plus the
 * live controls (source/target pickers, swap, engine toggle, pause, copy).
 */
export function TranslationPanel({ result, busy, paused, onTogglePause }: Props) {
  const { source, target, engine, cloudAvailable, setSource, setTarget, setEngine, swapLanguages } =
    useSettingsStore();
  const [picker, setPicker] = useState<null | 'source' | 'target'>(null);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!result?.translatedText) return;
    await Clipboard.setStringAsync(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const detected =
    source === AUTO && result?.detectedSource ? ` (${languageName(result.detectedSource)})` : '';

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Pressable style={styles.chip} onPress={() => setPicker('source')}>
          <Text style={styles.chipText}>
            {selectionLabel(source)}
            {detected}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.iconBtn, source === AUTO && styles.iconBtnDisabled]}
          onPress={swapLanguages}
          disabled={source === AUTO}
        >
          <Text style={styles.iconText}>⇄</Text>
        </Pressable>

        <Pressable style={styles.chip} onPress={() => setPicker('target')}>
          <Text style={styles.chipText}>{languageName(target)}</Text>
        </Pressable>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.engineChip, engine === 'cloud' && styles.engineChipActive]}
          onPress={() => setEngine(engine === 'cloud' ? 'on-device' : 'cloud')}
          disabled={!cloudAvailable}
        >
          <Text style={styles.engineText}>{engine === 'cloud' ? 'Cloud' : 'On-device'}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {result ? (
          <>
            <Text style={styles.original} numberOfLines={2}>
              {result.originalText}
            </Text>
            <Text style={styles.translated}>{result.translatedText}</Text>
            {result.usedFallback && (
              <Text style={styles.note}>Cloud unavailable — translated on-device.</Text>
            )}
          </>
        ) : (
          <Text style={styles.placeholder}>
            Point the camera at text to translate it in real time.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {busy ? <ActivityIndicator color={colors.accent} /> : <View style={styles.footerDot} />}
        <View style={styles.spacer} />
        <Pressable style={styles.actionBtn} onPress={onTogglePause}>
          <Text style={styles.actionText}>{paused ? '▶ Resume' : '⏸ Freeze'}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, !result && styles.actionBtnDisabled]}
          onPress={onCopy}
          disabled={!result}
        >
          <Text style={styles.actionText}>{copied ? '✓ Copied' : '⧉ Copy'}</Text>
        </Pressable>
      </View>

      <LanguageSelector
        visible={picker === 'source'}
        title="Translate from"
        includeAuto
        selected={source}
        onSelect={setSource}
        onClose={() => setPicker(null)}
      />
      <LanguageSelector
        visible={picker === 'target'}
        title="Translate to"
        selected={target}
        onSelect={setTarget}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.panel,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.panelBorder,
    padding: spacing.md,
  },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chip: {
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  iconBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconBtnDisabled: { opacity: 0.3 },
  iconText: { color: colors.accent, fontSize: 18 },
  engineChip: {
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  engineChipActive: { backgroundColor: colors.accentDim },
  engineText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  spacer: { flex: 1 },
  body: { flex: 1, marginTop: spacing.sm },
  bodyContent: { paddingVertical: spacing.xs },
  original: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.xs },
  translated: { color: colors.text, fontSize: 22, fontWeight: '600', lineHeight: 28 },
  note: { color: colors.accent, fontSize: 11, marginTop: spacing.xs },
  placeholder: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  footerDot: { width: 18, height: 18 },
  actionBtn: {
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionText: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
