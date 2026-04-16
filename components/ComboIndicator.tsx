import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'

interface ComboIndicatorProps {
  combo: number
}

export function ComboIndicator({ combo }: ComboIndicatorProps) {
  const { s } = useResponsive()
  const slideAnim = useRef(new Animated.Value(-50)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  const visible = combo >= 2

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, slideAnim, opacityAnim, scaleAnim])

  const fireSize = Math.min(FontSize.xxl + combo * 2, 48)

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderRadius: s(Radius.full),
          paddingVertical: s(Spacing.sm),
          paddingHorizontal: s(Spacing.xl),
          opacity: opacityAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.fire, { fontSize: s(fireSize) }]}>
        🔥
      </Text>
      <Text style={[styles.text, { fontSize: s(FontSize.md) }]}>
        {combo} đúng liên tiếp!
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  fire: {
    textAlign: 'center',
  },
  text: {
    fontWeight: '800',
    color: Colors.white,
  },
})
