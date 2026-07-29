import React, { useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface SuggestInputProps {
  value: string;
  onChangeText: (text: string) => void;
  suggestions: string[];
  placeholder?: string;
  testID?: string;
}

// Free-text input with tappable suggestions underneath. Deliberately not a
// dropdown/picker: brand and model must stay open-ended (grey imports,
// trims that never shipped locally), so the suggestions only ever fill the
// field — they never constrain what can be typed.
export default function SuggestInput({ value, onChangeText, suggestions, placeholder, testID }: SuggestInputProps) {
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    // An exact match means the user has already picked/typed it — showing
    // that one chip back to them is just noise.
    if (q && suggestions.some((s) => s.toLowerCase() === q)) return [];
    if (!q) return suggestions;
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [value, suggestions]);

  return (
    <View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray[400]}
        testID={testID}
      />
      {filtered.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chipRow}
        >
          {filtered.map((s) => (
            <Pressable
              key={s}
              style={styles.chip}
              onPress={() => onChangeText(s)}
              testID={testID ? `${testID}-suggestion-${s}` : undefined}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.gray[900],
  },
  chipRow: {
    gap: 8,
    paddingTop: 8,
    paddingRight: 4,
  },
  chip: {
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.gray[700],
  },
});
