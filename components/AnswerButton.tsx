import React, { useEffect, useRef } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'

type AnswerState = 'default' | 'correct' | 'wrong' | 'disabled'

interface AnswerButtonProps {
  label: string
  onPress: () => void
  state: AnswerState
  style?: ViewStyle
}

const STATE_STYLES: Record<
  AnswerState,
  { bg: string; border: string; text: string; icon: string }
> = {
  default: {
    bg: Colors.white,
    border: Colors.primary,
    text: Colors.textDark,
    icon: '',
  },
  correct: {
    bg: '#E8F5E9',
    border: Colors.success,
    text: Colors.success,
    icon: '✅',
  },
  wrong: {
    bg: '#FFEBEE',
    border: Colors.error,
    text: Colors.error,
    icon: '❌',
  },
  disabled: {
    bg: Colors.greyLight,
    border: Colors.grey,
    text: Colors.grey,
    icon: '',
  },
}

export function AnswerButton({ label, onPress, state, style }: AnswerButtonProps) {
  const { s } = useResponsive()
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (state === 'correct' || state === 'wrong') {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [state, scaleAnim])

  const handlePressIn = () => {
    if (state === 'disabled') return
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }

  const stateStyle = STATE_STYLES[state]

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: stateStyle.bg,
            borderColor: stateStyle.border,
            borderRadius: s(Radius.lg),
            paddingVertical: s(Spacing.md),
            paddingHorizontal: s(Spacing.md),
            minHeight: s(52),
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={state === 'disabled'}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.label,
            {
              fontSize: s(label.length > 20 ? FontSize.md : FontSize.lg),
              color: stateStyle.text,
            },
          ]}
          numberOfLines={0}
        >
          {stateStyle.icon ? `${stateStyle.icon} ` : ''}
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
})
