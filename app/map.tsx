import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { LearningMap } from '../components/LearningMap'
import { Colors, Spacing, Radius, FontSize } from '../constants/theme'
import { Subject, LessonNode } from '../lib/types'
import { getProgress } from '../lib/storage'
import { generateMapNodes, getChapters } from '../lib/questions'
import { useSubject } from '../lib/SubjectContext'

export default function MapScreen() {
  const router = useRouter()
  const { subject } = useSubject()

  const [nodes, setNodes] = useState<LessonNode[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadMap = useCallback(async () => {
    try {
      const progress = await getProgress(subject)
      const mapNodes = generateMapNodes(subject, progress)
      setNodes(mapNodes)
    } catch (err) {
      console.warn('Failed to load map:', err)
    } finally {
      setLoading(false)
    }
  }, [subject])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadMap()
    }, [loadMap])
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadMap()
    setRefreshing(false)
  }, [loadMap])

  const handleNodePress = useCallback(
    (node: LessonNode) => {
      if (node.status === 'current' || node.status === 'completed') {
        router.push(
          `/practice?subject=${subject}&chapter=${node.chapterId}&nodeId=${node.id}`
        )
      }
    },
    [router, subject]
  )

  const subjectIcon = subject === 'math' ? '🧮' : '📖'
  const subjectTitle =
    subject === 'math' ? 'Bản đồ Toán' : 'Bản đồ Tiếng Việt'

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarIcon}>{subjectIcon}</Text>
        <Text style={styles.topBarTitle}>{subjectTitle}</Text>
      </View>

      {/* Map content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : nodes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>{'📚'}</Text>
            <Text style={styles.emptyText}>Chưa có bài học nào</Text>
          </View>
        ) : (
          <LearningMap nodes={nodes} onNodePress={handleNodePress} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8
  },
  topBarIcon: {
    fontSize: 24
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
  },
  scrollView: {
    flex: 1
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexGrow: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  loadingText: {
    fontSize: 16,
    color: '#888'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    color: '#888'
  }
})
