import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const { s } = useResponsive()
  const fillAnim = useRef(new Animated.Value(0)).current

  const progress = total > 0 ? current / total : 0

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start()
  }, [progress, fillAnim])

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: s(FontSize.sm) }]}>
        Câu {current}/{total}
      </Text>
      <View style={[styles.track, { height: s(12), borderRadius: s(Radius.full) }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: fillWidth,
              borderRadius: s(Radius.full),
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  text: {
    fontWeight: '600',
    color: Colors.textMid,
  },
  track: {
    backgroundColor: Colors.greyLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
})
