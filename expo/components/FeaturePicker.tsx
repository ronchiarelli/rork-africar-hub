import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface FeaturePickerProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  testID?: string;
}

// Preset feature chips plus a free-text "add your own" row, so an owner can
// list something the preset list doesn't cover (tow bar, dashcam, roof rack)
// instead of stuffing it into the description where nobody filters on it.
export default function FeaturePicker({ options, selected, onChange, testID }: FeaturePickerProps) {
  const [draft, setDraft] = useState('');

  const toggle = useCallback((feature: string) => {
    onChange(selected.includes(feature) ? selected.filter((f) => f !== feature) : [...selected, feature]);
  }, [selected, onChange]);

  const addCustom = useCallback(() => {
    const value = draft.trim();
    if (!value) return;
    // Case-insensitive dedupe against both presets and existing customs, so
    // "Tow Bar" and "tow bar" don't both end up on the listing.
    const exists = selected.some((f) => f.toLowerCase() === value.toLowerCase());
    if (!exists) onChange([...selected, value]);
    setDraft('');
  }, [draft, selected, onChange]);

  // Anything selected that isn't a preset was typed by the owner — those get
  // a remove affordance, since tapping a preset chip can't clear them.
  const custom = selected.filter((f) => !options.includes(f));

  return (
    <View>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, selected.includes(opt) && styles.chipActive]}
            onPress={() => toggle(opt)}
            testID={testID ? `${testID}-preset-${opt}` : undefined}
          >
            <Text style={[styles.chipText, selected.includes(opt) && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      {custom.length > 0 && (
        <View style={styles.chipRow}>
          {custom.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, styles.chipActive, styles.customChip]}
              onPress={() => toggle(f)}
              testID={testID ? `${testID}-custom-${f}` : undefined}
            >
              <Text style={[styles.chipText, styles.chipTextActive]}>{f}</Text>
              <X size={12} color={Colors.white} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addCustom}
          returnKeyType="done"
          placeholder="Add another feature..."
          placeholderTextColor={Colors.gray[400]}
          testID={testID ? `${testID}-input` : undefined}
        />
        <Pressable
          style={[styles.addBtn, !draft.trim() && styles.addBtnDisabled]}
          onPress={addCustom}
          disabled={!draft.trim()}
          testID={testID ? `${testID}-add-btn` : undefined}
        >
          <Plus size={16} color={Colors.white} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  chipActive: { backgroundColor: Colors.orange.primary },
  customChip: { paddingRight: 10 },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.gray[700] },
  chipTextActive: { color: Colors.white },
  addRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.gray[900],
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addBtnDisabled: { backgroundColor: Colors.gray[300] },
});
