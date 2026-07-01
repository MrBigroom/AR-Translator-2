import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AUTO, LanguageCode, SourceSelection } from '../types';
import { SUPPORTED_LANGUAGES, languageName } from '../config/languages';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  /** Show the "Auto-detect" entry (source picker only). */
  includeAuto?: boolean;
  selected: SourceSelection;
  onSelect: (code: SourceSelection) => void;
  onClose: () => void;
}

interface Row {
  code: SourceSelection;
  name: string;
}

/** Full-screen searchable language picker, reused for both source and target. */
export function LanguageSelector({
  visible,
  title,
  includeAuto,
  selected,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(() => {
    const base: Row[] = SUPPORTED_LANGUAGES.map((l) => ({ code: l.code, name: l.name }));
    const withAuto: Row[] = includeAuto
      ? [{ code: AUTO, name: 'Auto-detect' }, ...base]
      : base;
    const q = query.trim().toLowerCase();
    if (!q) return withAuto;
    return withAuto.filter(
      (r) => r.name.toLowerCase().includes(q) || String(r.code).includes(q),
    );
  }, [includeAuto, query]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.search}
            placeholder="Search languages"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <FlatList
            data={rows}
            keyExtractor={(r) => String(r.code)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const active = item.code === selected;
              return (
                <Pressable
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                >
                  <Text style={styles.rowText}>{item.name}</Text>
                  {item.code !== AUTO && (
                    <Text style={styles.rowCode}>{String(item.code).toUpperCase()}</Text>
                  )}
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

export function selectionLabel(sel: SourceSelection): string {
  return sel === AUTO ? 'Auto' : languageName(sel as LanguageCode);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  close: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  search: {
    backgroundColor: colors.chip,
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowActive: { backgroundColor: colors.chipActive },
  rowText: { color: colors.text, fontSize: 16, flex: 1 },
  rowCode: { color: colors.textMuted, fontSize: 13 },
  check: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
