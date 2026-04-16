import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Progress, Subject } from './types'

const STORAGE_KEYS: Record<Subject, string> = {
  math: 'progress_math',
  vietnamese: 'progress_vietnamese'
}

function createDefaultProgress(subject: Subject): Progress {
  return {
    subject,
    completedNodes: {},
    totalStars: 0,
    dailyStars: {},
    streak: 0,
    lastPlayedDate: ''
  }
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterdayString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

function calculateStars(score: number, total: number): number {
  const normalized = total > 0 ? Math.round((score / total) * 10) : 0
  if (normalized >= 9) return 3
  if (normalized >= 7) return 2
  if (normalized >= 5) return 1
  return 0
}

export async function getProgress(subject: Subject): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS[subject])
    if (raw) {
      return JSON.parse(raw) as Progress
    }
  } catch (error) {
    console.warn(`Failed to load progress for ${subject}:`, error)
  }
  return createDefaultProgress(subject)
}

export async function saveProgress(progress: Progress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS[progress.subject], JSON.stringify(progress))
  } catch (error) {
    console.error(`Failed to save progress for ${progress.subject}:`, error)
  }
}

export async function updateNodeCompletion(
  subject: Subject,
  nodeId: string,
  score: number,
  total: number
): Promise<Progress> {
  console.log(`[Storage] updateNodeCompletion: subject=${subject}, nodeId=${nodeId}, score=${score}/${total}`)
  const progress = await getProgress(subject)
  const stars = calculateStars(score, total)
  const today = getTodayString()

  const existing = progress.completedNodes[nodeId]
  const previousStars = existing?.stars ?? 0

  const updatedNodes = {
    ...progress.completedNodes,
    [nodeId]: {
      stars: Math.max(stars, previousStars),
      bestScore: Math.max(score, existing?.bestScore ?? 0)
    }
  }

  const starDiff = Math.max(0, stars - previousStars)

  const updatedDailyStars = {
    ...progress.dailyStars,
    [today]: (progress.dailyStars[today] ?? 0) + starDiff
  }

  const isNewDay = progress.lastPlayedDate !== today
  const wasYesterday = progress.lastPlayedDate === getYesterdayString()
  const updatedStreak = isNewDay ? (wasYesterday ? progress.streak + 1 : 1) : progress.streak

  const updatedProgress: Progress = {
    ...progress,
    completedNodes: updatedNodes,
    totalStars: progress.totalStars + starDiff,
    dailyStars: updatedDailyStars,
    streak: updatedStreak,
    lastPlayedDate: today
  }

  console.log(`[Storage] Saved: completedNodes keys =`, Object.keys(updatedProgress.completedNodes))
  await saveProgress(updatedProgress)
  return updatedProgress
}

export async function getDailyStars(subject: Subject): Promise<number> {
  const progress = await getProgress(subject)
  const today = getTodayString()
  return progress.dailyStars[today] ?? 0
}

export async function getStreak(subject: Subject): Promise<number> {
  const progress = await getProgress(subject)
  const today = getTodayString()
  const yesterday = getYesterdayString()

  if (progress.lastPlayedDate === today || progress.lastPlayedDate === yesterday) {
    return progress.streak
  }
  return 0
}
