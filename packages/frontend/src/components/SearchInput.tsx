import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * SearchInput - Debounced search input component
 * Memoized for performance optimization.
 *
 * Requirements:
 * - 19.1: Add search input to board header
 * - 19.2: Implement debounced search (500ms)
 * - 13.2: Optimize re-renders with React.memo
 */
function SearchInputComponent({
  value,
  onChangeText,
  placeholder = 'Search tasks...',
  debounceMs = 500,
}: SearchInputProps): React.JSX.Element {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      setLocalValue(text);

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new timeout for debounced callback
      debounceRef.current = setTimeout(() => {
        onChangeText(text);
      }, debounceMs);
    },
    [onChangeText, debounceMs]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [onChangeText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search tasks"
        accessibilityHint="Type to search tasks by title or description"
      />
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export const SearchInput = memo(SearchInputComponent);

export default SearchInput;
