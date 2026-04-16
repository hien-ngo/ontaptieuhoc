import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'
import type { LessonNode } from '../lib/types'
import { MapNode } from './MapNode'

interface LearningMapProps {
  nodes: LessonNode[]
  onNodePress: (node: LessonNode) => void
}

/** Group nodes by chapter, preserving order */
function groupByChapter(
  nodes: LessonNode[]
): { chapterId: string; chapterName: string; chapterIcon: string; items: LessonNode[] }[] {
  const groups: {
    chapterId: string
    chapterName: string
    chapterIcon: string
    items: LessonNode[]
  }[] = []

  let current: (typeof groups)[number] | null = null

  for (const node of nodes) {
    if (!current || current.chapterId !== node.chapterId) {
      current = {
        chapterId: node.chapterId,
        chapterName: node.chapterName,
        chapterIcon: node.chapterIcon,
        items: [],
      }
      groups.push(current)
    }
    current.items.push(node)
  }

  return groups
}

/** Get zigzag position for a node at given index within its chapter */
function getPosition(
  globalIndex: number
): 'left' | 'right' | 'center' {
  const mod = globalIndex % 3
  if (mod === 0) return 'left'
  if (mod === 1) return 'center'
  return 'right'
}

export function LearningMap({ nodes, onNodePress }: LearningMapProps) {
  const { s } = useResponsive()
  const groups = groupByChapter(nodes)

  let globalIndex = 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {groups.map((group) => (
        <View key={group.chapterId} style={styles.chapterGroup}>
          {/* Chapter header */}
          <View
            style={[
              styles.chapterLabel,
              {
                borderRadius: s(Radius.full),
                paddingVertical: s(Spacing.xs),
                paddingHorizontal: s(Spacing.md),
              },
            ]}
          >
            <Text style={[styles.chapterIcon, { fontSize: s(FontSize.lg) }]}>
              {group.chapterIcon}
            </Text>
            <Text style={[styles.chapterName, { fontSize: s(FontSize.sm) }]}>
              {group.chapterName}
            </Text>
          </View>

          {/* Nodes in zigzag */}
          {group.items.map((node) => {
            const position = getPosition(globalIndex)
            globalIndex++

            return (
              <View key={node.id} style={styles.nodeRow}>
                {/* Connector line */}
                {globalIndex > 1 && (
                  <View style={styles.connector}>
                    <View style={styles.connectorLine} />
                  </View>
                )}
                <MapNode
                  node={node}
                  onPress={() => onNodePress(node)}
                  position={position}
                />
              </View>
            )
          })}
        </View>
      ))}

      {/* Bottom spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  chapterGroup: {
    marginBottom: Spacing.md,
  },
  chapterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    marginBottom: Spacing.md,
  },
  chapterIcon: {
    textAlign: 'center',
  },
  chapterName: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  nodeRow: {
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  connector: {
    alignItems: 'center',
    height: 20,
    marginBottom: -4,
  },
  connectorLine: {
    width: 3,
    height: 20,
    backgroundColor: Colors.grey,
    borderRadius: 2,
    opacity: 0.4,
  },
})
