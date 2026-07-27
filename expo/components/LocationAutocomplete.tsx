import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLocationSearch, type LocationResult } from '@/lib/queries/places';

interface LocationAutocompleteProps {
  value: string;
  onChangeValue: (text: string) => void;
  onSelect: (result: LocationResult) => void;
  placeholder?: string;
  testID?: string;
}

// Free-text address search (OpenStreetMap-backed, see
// lib/queries/places.ts) that resolves a typed query down to a specific
// address + coordinates. Debounced so it doesn't fire a search on every
// keystroke.
export default function LocationAutocomplete({ value, onChangeValue, onSelect, placeholder, testID }: LocationAutocompleteProps) {
  const [results, setResults] = useState<LocationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const search = useLocationSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChangeText = useCallback((text: string) => {
    onChangeValue(text);
    setShowResults(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      search.mutate(text, {
        onSuccess: (data) => setResults(data),
        onError: () => setResults([]),
      });
    }, 400);
  }, [onChangeValue, search]);

  const handleSelect = useCallback((result: LocationResult) => {
    onSelect(result);
    setResults([]);
    setShowResults(false);
  }, [onSelect]);

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <MapPin size={16} color={Colors.gray[400]} />
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? 'Search for an address...'}
          placeholderTextColor={Colors.gray[400]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setShowResults(true)}
          testID={testID}
        />
        {search.isPending && <ActivityIndicator size="small" color={Colors.orange.primary} />}
      </View>
      {showResults && results.length > 0 && (
        <View style={styles.resultsBox}>
          {results.map((r, idx) => (
            <Pressable
              key={`${r.latitude}-${r.longitude}-${idx}`}
              style={styles.resultRow}
              onPress={() => handleSelect(r)}
              testID={`location-result-${idx}`}
            >
              <MapPin size={14} color={Colors.gray[400]} />
              <Text style={styles.resultText} numberOfLines={2}>{r.address}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' as const, zIndex: 10 },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[900],
  },
  resultsBox: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden' as const,
  },
  resultRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray[100],
  },
  resultText: { flex: 1, fontSize: 13, color: Colors.gray[800] },
});
