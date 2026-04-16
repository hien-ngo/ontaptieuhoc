import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Confetti } from '../components/Confetti'
import { Colors, Spacing, Radius, FontSize } from '../constants/theme'
import { Subject } from '../lib/types'
import { updateNodeCompletion } from '../lib/storage'

interface ResultParams {
  score?: string
  total?: string
  maxCombo?: string
  timeSeconds?: string
  subject?: string
  nodeId?: string
}

function getPerformance(score: number, total: number) {
  const ratio = score / total
  if (ratio >= 0.9) {
    return { label: 'Xuất sắc! 🌟', color: '#FFB020', stars: 3 }
  }
  if (ratio >= 0.7) {
    return { label: 'Giỏi lắm! 🎉', color: '#4CAF50', stars: 2 }
  }
  if (ratio >= 0.5) {
    return { label: 'Khá tốt! 👍', color: '#4A90D9', stars: 1 }
  }
  return { label: 'Cố gắng lên nhé! 💪', color: '#FF7043', stars: 0 }
}

function getMascotEmotion(score: number, total: number): string {
  const ratio = score / total
  if (ratio >= 0.9) return '😍'
  if (ratio >= 0.7) return '😊'
  if (ratio >= 0.5) return '🤔'
  return '😢'
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`
}

export default function ResultScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<Record<string, string>>()

  const score = parseInt(params.score ?? '0', 10)
  const total = parseInt(params.total ?? '10', 10)
  const maxCombo = parseInt(params.maxCombo ?? '0', 10)
  const timeSeconds = parseInt(params.timeSeconds ?? '0', 10)
  const subject: Subject = (params.subject as Subject) ?? 'math'
  const nodeId = params.nodeId ?? ''

  const perf = getPerformance(score, total)
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  const showConfetti = score / total >= 0.7
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    saveResult()
  }, [])

  const saveResult = async () => {
    if (saved || !nodeId) return
    try {
      await updateNodeCompletion(subject, nodeId, score, total)
      setSaved(true)
    } catch (err) {
      console.warn('Failed to save result:', err)
    }
  }

  const handleRetry = () => {
    router.replace(
      `/practice?subject=${subject}&chapter=${nodeId.split('_')[0] ?? ''}&nodeId=${nodeId}`
    )
  }

  const handleContinue = () => {
    router.replace(`/map?subject=${subject}`)
  }

  // Build dot trail from score
  const dots: boolean[] = []
  for (let i = 0; i < total; i++) {
    dots.push(i < score)
  }

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && <Confetti active={showConfetti} />}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot */}
        <Text style={styles.mascot}>{getMascotEmotion(score, total)}</Text>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {score}/{total} {'⭐'}
          </Text>
          <Text style={[styles.perfLabel, { color: perf.color }]}>{perf.label}</Text>
        </View>

        {/* Stars earned */}
        <View style={styles.starsRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Text key={i} style={styles.starIcon}>
              {i < perf.stars ? '⭐' : '☆'}
            </Text>
          ))}
        </View>

        {/* Dot trail */}
        <View style={styles.dotTrail}>
          {dots.map((correct, idx) => (
            <Text key={idx} style={styles.dot}>
              {correct ? '🟢' : '🔴'}
            </Text>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <StatRow
            icon={'🔥'}
            label="Combo dài nhất"
            value={`${maxCombo} câu`}
          />
          <StatRow
            icon={'⏱️'}
            label="Thời gian"
            value={formatTime(timeSeconds)}
          />
          <StatRow
            icon={'🎯'}
            label="Độ chính xác"
            value={`${accuracy}%`}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            activeOpacity={0.8}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Làm lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.continueButton]}
            activeOpacity={0.8}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatRow({
  icon,
  label,
  value
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  scrollView: {
    flex: 1
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    paddingBottom: 48
  },
  mascot: {
    fontSize: 72,
    marginBottom: 8
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 8
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#333'
  },
  perfLabel: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  starIcon: {
    fontSize: 36
  },
  dotTrail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 20
  },
  dot: {
    fontSize: 18
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 12
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  statIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center'
  },
  statLabel: {
    fontSize: 16,
    color: '#555',
    flex: 1
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  retryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4A90D9'
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A90D9'
  },
  continueButton: {
    backgroundColor: '#4A90D9',
    elevation: 4,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  }
})
