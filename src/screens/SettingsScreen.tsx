import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { LanguageSelector, selectionLabel } from '../components/LanguageSelector';
import { useSettingsStore } from '../store/settingsStore';
import { languageName } from '../config/languages';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Settings: default languages, engine preference, and how models/keys work. */
export function SettingsScreen({ visible, onClose }: Props) {
  const { source, target, engine, cloudAvailable, setSource, setTarget, setEngine } =
    useSettingsStore();
  const [picker, setPicker] = useState<null | 'source' | 'target'>(null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>Languages</Text>
          <Row label="Translate from" value={selectionLabel(source)} onPress={() => setPicker('source')} />
          <Row label="Translate to" value={languageName(target)} onPress={() => setPicker('target')} />

          <Text style={styles.section}>Engine</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Use cloud translation</Text>
              <Text style={styles.rowHint}>
                {cloudAvailable
                  ? 'Higher quality when online. Falls back to on-device automatically.'
                  : 'Not configured. Add an API key (see README) to enable.'}
              </Text>
            </View>
            <Switch
              value={engine === 'cloud'}
              onValueChange={(v) => setEngine(v ? 'cloud' : 'on-device')}
              disabled={!cloudAvailable}
              trackColor={{ true: colors.accentDim, false: colors.chip }}
            />
          </View>

          <Text style={styles.section}>About offline models</Text>
          <Text style={styles.paragraph}>
            On-device translation uses Google ML Kit. The first time you translate a new language,
            a ~30MB model downloads automatically (needs a connection once). After that, that
            language works fully offline.
          </Text>

          <Text style={styles.section}>Cloud API key & privacy</Text>
          <Text style={styles.paragraph}>
            On-device mode keeps everything on your phone. Cloud mode sends recognized text to the
            configured provider. Embedding an API key in the app is insecure — for anything beyond
            personal use, route requests through a serverless proxy (see README).
          </Text>

          <Text style={styles.appName}>Translator App for CY</Text>
        </ScrollView>

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
    </Modal>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value} ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  close: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  content: { padding: spacing.lg, gap: spacing.xs },
  section: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  rowLabel: { color: colors.text, fontSize: 16 },
  rowValue: { color: colors.textMuted, fontSize: 16 },
  rowHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  paragraph: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  appName: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
