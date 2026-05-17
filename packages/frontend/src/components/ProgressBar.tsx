import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  /** Accessible label for screen readers */
  accessibilityLabel?: string;
}

/**
 * ProgressBar - Displays completion progress
 * Includes accessibility features for screen readers.
 *
 * Requirements:
 * - 14.2: Calculate and display board completion percentage
 * - 13.6: Implement accessibility features
 */
function ProgressBarComponent({
  percentage,
  showLabel = true,
  height = 8,
  color = '#22c55e',
  backgroundColor = '#e5e7eb',
  accessibilityLabel,
}: ProgressBarProps): React.JSX.Element {
  const clampedPercentage = useMemo(
    () => Math.min(100, Math.max(0, percentage)),
    [percentage]
  );

  const roundedPercentage = Math.round(clampedPercentage);

  const defaultAccessibilityLabel = useMemo(
    () => `Progress: ${roundedPercentage} percent complete`,
    [roundedPercentage]
  );

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: roundedPercentage,
        text: `${roundedPercentage}%`,
      }}
    >
      <View style={[styles.track, { height, backgroundColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedPercentage}%`,
              height,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label} aria-hidden={true}>
          {roundedPercentage}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  label: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 36,
    textAlign: 'right',
  },
});

export const ProgressBar = memo(ProgressBarComponent);

export default ProgressBar;
