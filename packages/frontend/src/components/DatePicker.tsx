import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * DatePicker - Calendar-based date selection component
 */
export function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps): React.JSX.Element {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  
  // Parse current value or use today
  const selectedDate = useMemo(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return null;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => {
    return selectedDate || new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Get days in month
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Get first day of month (0 = Sunday)
  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    
    // Add empty cells for days before first of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const handlePrevMonth = useCallback(() => {
    setViewDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    setViewDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const handleSelectDay = useCallback((day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setVisible(false);
  }, [year, month, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setVisible(false);
  }, [onChange]);

  const isSelected = useCallback((day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  }, [selectedDate, year, month]);

  const isToday = useCallback((day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  }, [year, month]);

  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    const date = new Date(value + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [value, placeholder]);

  return (
    <>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        onPress={() => setVisible(true)}
        accessibilityLabel="Select date"
        accessibilityRole="button"
      >
        <Text style={[styles.inputText, { color: value ? colors.text : colors.textMuted }]}>
          📅 {displayValue}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View 
            style={[styles.calendar, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                <Text style={[styles.navText, { color: colors.primary }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.monthYear, { color: colors.text }]}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                <Text style={[styles.navText, { color: colors.primary }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day names */}
            <View style={styles.dayNames}>
              {DAYS.map((day) => (
                <Text key={day} style={[styles.dayName, { color: colors.textMuted }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
              {calendarDays.map((day, index) => (
                <View key={index} style={styles.dayCell}>
                  {day !== null ? (
                    <TouchableOpacity
                      style={[
                        styles.day,
                        isToday(day) && [styles.today, { borderColor: colors.primary }],
                        isSelected(day) && [styles.selected, { backgroundColor: colors.primary }],
                      ]}
                      onPress={() => handleSelectDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: colors.text },
                          isSelected(day) && styles.selectedText,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.day} />
                  )}
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity onPress={handleClear} style={styles.actionButton}>
                <Text style={[styles.actionText, { color: colors.error }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.actionButton}>
                <Text style={[styles.actionText, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  inputText: {
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendar: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  navText: {
    fontSize: 24,
    fontWeight: '300',
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayNames: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  day: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
  },
  today: {
    borderWidth: 1,
  },
  selected: {
    borderWidth: 0,
  },
  selectedText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DatePicker;
