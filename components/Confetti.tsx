import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, StyleSheet, View } from 'react-native'

const CONFETTI_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96E6A1',
  '#FFD93D',
  '#FF9FF3',
  '#54A0FF',
  '#5F27CD',
  '#E91E63',
  '#FF9800',
]

const PARTICLE_COUNT = 30

interface ConfettiProps {
  active: boolean
}

interface Particle {
  x: number
  y: Animated.Value
  opacity: Animated.Value
  rotate: Animated.Value
  color: string
  size: number
  isCircle: boolean
}

function createParticles(screenWidth: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * screenWidth,
      y: new Animated.Value(-20 - Math.random() * 100),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 8 + Math.random() * 10,
      isCircle: Math.random() > 0.5,
    })
  }
  return particles
}

export function Confetti({ active }: ConfettiProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
  const particlesRef = useRef<Particle[]>(createParticles(screenWidth))

  useEffect(() => {
    if (!active) return

    const particles = particlesRef.current

    // Reset positions
    particles.forEach((p) => {
      p.y.setValue(-20 - Math.random() * 100)
      p.opacity.setValue(1)
      p.rotate.setValue(0)
    })

    // Animate each particle
    const animations = particles.map((p) => {
      const duration = 2000 + Math.random() * 1500
      const delay = Math.random() * 600

      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: screenHeight + 40,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration,
          delay: delay + duration * 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: 2 + Math.random() * 4,
          duration,
          delay,
          useNativeDriver: true,
        }),
      ])
    })

    Animated.parallel(animations).start()
  }, [active, screenHeight])

  if (!active) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particlesRef.current.map((p, i) => {
        const spin = p.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        })

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: p.x,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                opacity: p.opacity,
                transform: [
                  { translateY: p.y },
                  { rotate: spin },
                ],
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
  },
})
