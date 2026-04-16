import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'
import type { Subject } from '../lib/types'

interface SubjectSelectorProps {
  selected: Subject
  onSelect: (s: Subject) => void
}

const TABS: { key: Subject; label: string; emoji: string }[] = [
  { key: 'math', label: 'Toán', emoji: '🧮' },
  { key: 'vietnamese', label: 'Tiếng Việt', emoji: '📖' },
]

export function SubjectSelector({ selected, onSelect }: SubjectSelectorProps) {
  const { s } = useResponsive()

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = selected === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                height: s(56),
                borderRadius: s(Radius.lg),
                paddingHorizontal: s(Spacing.xl),
              },
              isActive ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, { fontSize: s(FontSize.xl) }]}>
              {tab.emoji}
            </Text>
            <Text
              style={[
                styles.label,
                { fontSize: s(FontSize.lg) },
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    minHeight: 48,
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tabInactive: {
    backgroundColor: Colors.greyLight,
    borderColor: Colors.grey,
  },
  emoji: {
    textAlign: 'center',
  },
  label: {
    fontWeight: '700',
  },
  labelActive: {
    color: Colors.primaryDark,
  },
  labelInactive: {
    color: Colors.textMid,
  },
})
