import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'

interface ExamTimerProps {
  totalSeconds: number
  onTimeUp: () => void
  isRunning: boolean
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return `${mm}:${ss}`
}

export function ExamTimer({ totalSeconds, onTimeUp, isRunning }: ExamTimerProps) {
  const { s } = useResponsive()
  const [remaining, setRemaining] = useState(totalSeconds)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  const isWarning = remaining < 120 // < 2 minutes
  const isCritical = remaining < 300 // < 5 minutes

  // Countdown
  useEffect(() => {
    if (!isRunning || remaining <= 0) return

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(interval)
          onTimeUpRef.current()
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, remaining])

  // Reset when totalSeconds changes
  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  // Pulse animation when critical
  useEffect(() => {
    if (!isCritical || !isRunning) return

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [isCritical, isRunning, pulseAnim])

  const textColor = isWarning ? Colors.error : Colors.textDark

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: s(Radius.md),
          paddingVertical: s(Spacing.xs),
          paddingHorizontal: s(Spacing.md),
        },
      ]}
    >
      {isCritical && (
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: Colors.error,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.time,
          {
            fontSize: s(FontSize.lg),
            color: textColor,
          },
        ]}
      >
        {'⏰'} {formatTime(remaining)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.greyLight,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  time: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
})
