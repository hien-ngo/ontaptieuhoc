import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Circle } from 'react-native-svg'
import { SubjectSelector } from '../components/SubjectSelector'
import { Colors, Spacing, Radius, FontSize } from '../constants/theme'
import { Subject, Progress } from '../lib/types'
import { getProgress, getDailyStars, getStreak } from '../lib/storage'
import { getChapters } from '../lib/questions'

const DAILY_GOAL = 10
const CHAPTER_ICONS = ['🔢', '➕', '➖', '💯', '🧮', '⏰', '🏆']

export default function HomeScreen() {
  const router = useRouter()
  const [subject, setSubject] = useState<Subject>('math')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [dailyStars, setDailyStars] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalStars, setTotalStars] = useState(0)

  useEffect(() => {
    loadData()
  }, [subject])

  const loadData = useCallback(async () => {
    try {
      const [prog, stars, str] = await Promise.all([
        getProgress(subject),
        getDailyStars(subject),
        getStreak(subject)
      ])
      setProgress(prog)
      setDailyStars(stars)
      setStreak(str)

      const total = Object.values(prog?.completedNodes ?? {}).reduce((sum: number, n) => sum + (n.stars ?? 0), 0)
      setTotalStars(total)
    } catch (err) {
      console.warn('Failed to load progress:', err)
    }
  }, [subject])

  const chapters = getChapters(subject)
  const progressRatio = Math.min(dailyStars / DAILY_GOAL, 1)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header gradient */}
        <GradientHeader streak={streak} totalStars={totalStars} />

        {/* Subject selector */}
        <View style={styles.section}>
          <SubjectSelector selected={subject} onSelect={setSubject} />
        </View>

        {/* Mascot card */}
        <View style={styles.mascotCard}>
          <Text style={styles.mascotEmoji}>{'🍎'}</Text>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              Hôm nay mình học gì nhé! {'🎉'}
            </Text>
          </View>
        </View>

        {/* Daily goal ring */}
        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Mục tiêu hôm nay</Text>
          <View style={styles.goalRow}>
            <ProgressRing progress={progressRatio} stars={dailyStars} goal={DAILY_GOAL} />
            <View style={styles.goalText}>
              <Text style={styles.goalCount}>
                {dailyStars}/{DAILY_GOAL} {'⭐'}
              </Text>
              <Text style={styles.goalLabel}>sao hôm nay</Text>
              {dailyStars >= DAILY_GOAL && (
                <Text style={styles.goalComplete}>Hoàn thành! {'🎊'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => router.push(`/map?subject=${subject}`)}
        >
          <Text style={styles.startButtonText}>
            {'🚀'} Học ngay!
          </Text>
        </TouchableOpacity>

        {/* Quick chapter chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chương</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chapters.slice(0, 7).map((chapter, idx) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.chapterChip}
                onPress={() =>
                  router.push(
                    `/practice?subject=${subject}&chapter=${chapter.id}&nodeId=${chapter.id}_1`
                  )
                }
              >
                <Text style={styles.chapterIcon}>{CHAPTER_ICONS[idx] ?? '📖'}</Text>
                <Text style={styles.chapterLabel} numberOfLines={1}>
                  {chapter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

/* ---------- Sub-components ---------- */

function GradientHeader({
  streak,
  totalStars
}: {
  streak: number
  totalStars: number
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Xin chào {'👋'}</Text>
          <Text style={styles.name}>Bé Đức Duy!</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <StatChip icon={'🔥'} label={`${streak} ngày`} />
        <StatChip icon={'⭐'} label={`${totalStars} sao`} />
        <StatChip icon={'📚'} label="Lớp 1" />
      </View>
    </View>
  )
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ProgressRing({
  progress,
  stars,
  goal
}: {
  progress: number
  stars: number
  goal: number
}) {
  const size = 100
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8E8E8"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFB020"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.ringText}>
        {stars}/{goal}
      </Text>
    </View>
  )
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  scrollView: {
    flex: 1
  },
  content: {
    paddingBottom: 32
  },
  header: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)'
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  statIcon: {
    fontSize: 14
  },
  statLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600'
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12
  },
  mascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8
  },
  mascotEmoji: {
    fontSize: 56
  },
  speechBubble: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 4
  },
  speechText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22
  },
  goalSection: {
    paddingHorizontal: 20,
    marginTop: 20
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 16
  },
  goalText: {
    flex: 1
  },
  goalCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333'
  },
  goalLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 2
  },
  goalComplete: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4
  },
  ringText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFB020'
  },
  startButton: {
    backgroundColor: '#4A90D9',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  chapterChip: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4
  },
  chapterIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  chapterLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center'
  }
})
