import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'
import type { LessonNode } from '../lib/types'

interface MapNodeProps {
  node: LessonNode
  onPress: () => void
  position: 'left' | 'right' | 'center'
}

const STATUS_CONFIG = {
  completed: {
    bg: Colors.success,
    border: Colors.successDark,
    icon: '⭐',
    opacity: 1,
  },
  current: {
    bg: Colors.primary,
    border: Colors.primaryDark,
    icon: '▶️',
    opacity: 1,
  },
  locked: {
    bg: Colors.grey,
    border: Colors.grey,
    icon: '🔒',
    opacity: 0.5,
  },
}

export function MapNode({ node, onPress, position }: MapNodeProps) {
  const { s } = useResponsive()
  const pulseAnim = useRef(new Animated.Value(1)).current
  const shakeAnim = useRef(new Animated.Value(0)).current

  const isCurrent = node.status === 'current'
  const isLocked = node.status === 'locked'
  const config = STATUS_CONFIG[node.status]

  // Pulse animation for current node
  useEffect(() => {
    if (!isCurrent) return

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [isCurrent, pulseAnim])

  const handlePress = () => {
    if (isLocked) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start()
      return
    }
    onPress()
  }

  const nodeSize = s(60)

  const alignSelf =
    position === 'left'
      ? 'flex-start'
      : position === 'right'
        ? 'flex-end'
        : 'center'

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          alignSelf: alignSelf as any,
          opacity: config.opacity,
          transform: [
            { scale: isCurrent ? pulseAnim : 1 },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={isLocked ? 1 : 0.7}
      >
        <View
          style={[
            styles.circle,
            {
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              backgroundColor: config.bg,
              borderColor: config.border,
            },
          ]}
        >
          <Text style={[styles.icon, { fontSize: s(FontSize.xl) }]}>
            {config.icon}
          </Text>
        </View>
        {isCurrent && (
          <View
            style={[
              styles.glow,
              {
                width: nodeSize + 12,
                height: nodeSize + 12,
                borderRadius: (nodeSize + 12) / 2,
                borderColor: Colors.primary,
              },
            ]}
          />
        )}
      </TouchableOpacity>
      <Text
        style={[
          styles.label,
          { fontSize: s(FontSize.xs), marginTop: s(Spacing.xs) },
        ]}
        numberOfLines={1}
      >
        {node.label}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
  },
  glow: {
    position: 'absolute',
    top: -6,
    left: -6,
    borderWidth: 2,
    opacity: 0.4,
  },
})
