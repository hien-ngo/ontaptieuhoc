import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'

interface TopicScore {
  name: string
  score: number
  total: number
  color: string
}

interface TopicScoreChartProps {
  scores: TopicScore[]
}

function AnimatedBar({
  percentage,
  color,
  height,
}: {
  percentage: number
  color: string
  height: number
}) {
  const widthAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start()
  }, [percentage, widthAnim])

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={[styles.barTrack, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.barFill,
          {
            width,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  )
}

export function TopicScoreChart({ scores }: TopicScoreChartProps) {
  const { s } = useResponsive()

  if (scores.length === 0) return null

  return (
    <View style={[styles.container, { borderRadius: s(Radius.md), padding: s(Spacing.md) }]}>
      {scores.map((item) => {
        const percentage = item.total > 0 ? (item.score / item.total) * 100 : 0

        return (
          <View key={item.name} style={styles.row}>
            <Text
              style={[styles.name, { fontSize: s(FontSize.sm), width: s(80) }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.barWrapper}>
              <AnimatedBar
                percentage={percentage}
                color={item.color}
                height={s(14)}
              />
            </View>
            <Text
              style={[styles.scoreText, { fontSize: s(FontSize.xs), width: s(48) }]}
            >
              {item.score}/{item.total}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontWeight: '600',
    color: Colors.textDark,
  },
  barWrapper: {
    flex: 1,
  },
  barTrack: {
    backgroundColor: Colors.greyLight,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  scoreText: {
    fontWeight: '700',
    color: Colors.textMid,
    textAlign: 'right',
  },
})
