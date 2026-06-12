import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { cars, LOCATIONS } from '@/mocks/cars';
import CarCard from '@/components/CarCard';

const CATEGORIES = ['All', 'SUV', 'Sedan', 'Hatchback', 'Van'];
const TRANSMISSIONS = ['All', 'Automatic', 'Manual'];
const PRICE_RANGES = [
  { label: 'Any', min: 0, max: 99999 },
  { label: 'Under GH₵500', min: 0, max: 500 },
  { label: 'GH₵500–800', min: 500, max: 800 },
  { label: 'GH₵800–1200', min: 800, max: 1200 },
  { label: 'GH₵1200+', min: 1200, max: 99999 },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesQuery = query === '' ||
        car.brand.toLowerCase().includes(query.toLowerCase()) ||
        car.model.toLowerCase().includes(query.toLowerCase()) ||
        car.location.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || car.category === selectedCategory;
      const matchesTransmission = selectedTransmission === 'All' || car.transmission === selectedTransmission;
      const matchesLocation = selectedLocation === '' || car.location === selectedLocation;
      const priceRange = PRICE_RANGES[selectedPriceRange];
      const matchesPrice = car.pricePerDay >= priceRange.min && car.pricePerDay <= priceRange.max;
      return matchesQuery && matchesCategory && matchesTransmission && matchesLocation && matchesPrice;
    });
  }, [query, selectedCategory, selectedTransmission, selectedLocation, selectedPriceRange]);

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setSelectedTransmission('All');
    setSelectedLocation('');
    setSelectedPriceRange(0);
    setQuery('');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedTransmission !== 'All') count++;
    if (selectedLocation !== '') count++;
    if (selectedPriceRange !== 0) count++;
    return count;
  }, [selectedCategory, selectedTransmission, selectedLocation, selectedPriceRange]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cars, brands..."
              placeholderTextColor={Colors.gray[400]}
              value={query}
              onChangeText={setQuery}
              testID="search-input"
            />
            {query !== '' && (
              <Pressable onPress={() => setQuery('')}>
                <X size={16} color={Colors.gray[500]} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters(!showFilters)}
            testID="filter-btn"
          >
            <SlidersHorizontal size={18} color={showFilters ? Colors.white : Colors.orange.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Transmission</Text>
            <View style={styles.chipRow}>
              {TRANSMISSIONS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, selectedTransmission === t && styles.chipActive]}
                  onPress={() => setSelectedTransmission(t)}
                >
                  <Text style={[styles.chipText, selectedTransmission === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {PRICE_RANGES.map((range, idx) => (
                  <Pressable
                    key={range.label}
                    style={[styles.chip, selectedPriceRange === idx && styles.chipActive]}
                    onPress={() => setSelectedPriceRange(idx)}
                  >
                    <Text style={[styles.chipText, selectedPriceRange === idx && styles.chipTextActive]}>{range.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                <Pressable
                  style={[styles.chip, selectedLocation === '' && styles.chipActive]}
                  onPress={() => setSelectedLocation('')}
                >
                  <Text style={[styles.chipText, selectedLocation === '' && styles.chipTextActive]}>All</Text>
                </Pressable>
                {LOCATIONS.map((loc) => (
                  <Pressable
                    key={loc}
                    style={[styles.chip, selectedLocation === loc && styles.chipActive]}
                    onPress={() => setSelectedLocation(loc)}
                  >
                    <MapPin size={12} color={selectedLocation === loc ? Colors.white : Colors.gray[500]} />
                    <Text style={[styles.chipText, selectedLocation === loc && styles.chipTextActive]}>{loc}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {activeFilterCount > 0 && (
            <Pressable style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear All Filters</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''} found</Text>
      </View>

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <CarCard car={item} variant="horizontal" />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Search size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No cars found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.gray[100],
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[900],
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.orange.faint,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  filterBtnActive: {
    backgroundColor: Colors.orange.primary,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  filtersContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  filterSection: {
    marginBottom: 14,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gray[700],
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  chipActive: {
    backgroundColor: Colors.orange.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.gray[700],
  },
  chipTextActive: {
    color: Colors.white,
  },
  clearBtn: {
    alignSelf: 'center' as const,
    paddingVertical: 8,
  },
  clearBtnText: {
    color: Colors.orange.primary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[600],
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listItem: {
    marginBottom: 2,
  },
  emptyWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[700],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
});
