import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { ProgressBar } from '../components/ProgressBar'
import { ComboIndicator } from '../components/ComboIndicator'
import { QuestionCard } from '../components/QuestionCard'
import { Colors, Spacing, Radius, FontSize } from '../constants/theme'
import { Subject, Question } from '../lib/types'
import { getQuestionsByChapter } from '../lib/questions'

interface AnswerRecord {
  questionId: string
  correct: boolean
  answer: string
}

export default function PracticeScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    subject?: string
    chapter?: string
    nodeId?: string
  }>()

  const subject: Subject = (params.subject as Subject) ?? 'math'
  const chapter = params.chapter ?? ''
  const nodeId = params.nodeId ?? ''

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const startTimeRef = useRef(Date.now())
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Reset all state when subject/chapter/nodeId changes
    setQuestions([])
    setCurrentIndex(0)
    setAnswers([])
    setCombo(0)
    setMaxCombo(0)
    setShowResult(false)
    setIsCorrect(false)
    setLoading(true)
    startTimeRef.current = Date.now()

    loadQuestions()

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current)
      }
    }
  }, [subject, chapter, nodeId])

  const loadQuestions = useCallback(async () => {
    try {
      const qs = await getQuestionsByChapter(subject, chapter)
      setQuestions(qs.slice(0, 10))
    } catch (err) {
      console.warn('Failed to load questions:', err)
    } finally {
      setLoading(false)
    }
  }, [subject, chapter])

  const normalizeAnswer = (val: string): string => {
    return val.trim().toLowerCase()
  }

  const checkAnswer = useCallback(
    (userAnswer: string | string[]) => {
      const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.join(',') : userAnswer
      if (showResult || questions.length === 0) return

      const question = questions[currentIndex]
      if (!question) return

      const correctAnswer = question.answer
      let correct = false

      if (Array.isArray(correctAnswer)) {
        // For sort_numbers or fill_blank with multiple blanks
        const userParts = userAnswerStr.split(',').map((s) => normalizeAnswer(s))
        const correctParts = correctAnswer.map((s) => normalizeAnswer(String(s)))
        correct =
          userParts.length === correctParts.length &&
          userParts.every((val, idx) => val === correctParts[idx])
      } else {
        // Simple string comparison (handles compare type: ">", "<", "=")
        correct = normalizeAnswer(userAnswerStr) === normalizeAnswer(String(correctAnswer))
      }

      setIsCorrect(correct)
      setShowResult(true)

      const newCombo = correct ? combo + 1 : 0
      setCombo(newCombo)
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo)
      }

      const newAnswers = [
        ...answers,
        { questionId: question.id, correct, answer: userAnswerStr }
      ]
      setAnswers(newAnswers)

      // Auto-advance after 1.5 seconds
      advanceTimerRef.current = setTimeout(() => {
        const nextIndex = currentIndex + 1
        if (nextIndex >= questions.length) {
          // Navigate to results
          const score = newAnswers.filter((a) => a.correct).length
          const timeSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
          router.replace(
            `/result?score=${score}&total=${questions.length}&maxCombo=${Math.max(maxCombo, newCombo)}&timeSeconds=${timeSeconds}&subject=${subject}&nodeId=${nodeId}&chapter=${chapter}`
          )
        } else {
          setCurrentIndex(nextIndex)
          setShowResult(false)
          setIsCorrect(false)
        }
      }, 1500)
    },
    [showResult, questions, currentIndex, combo, maxCombo, answers, subject, nodeId, router]
  )

  const handleBack = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
    }
    router.back()
  }, [router])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyEmoji}>{'📝'}</Text>
          <Text style={styles.loadingText}>Không có câu hỏi</Text>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.topBackBtn}>
          <Text style={styles.topBackText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          Câu {currentIndex + 1}/{questions.length}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </View>

      {/* Combo indicator */}
      {combo > 0 && (
        <View style={styles.comboSection}>
          <ComboIndicator combo={combo} />
        </View>
      )}

      {/* Question - scrollable */}
      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionContent}
        showsVerticalScrollIndicator={false}
      >
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            onAnswer={checkAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        )}

        {/* Result feedback inline */}
        {showResult && (
          <View style={[styles.feedbackBanner, isCorrect ? styles.correctBanner : styles.wrongBanner]}>
            <Text style={styles.feedbackText}>
              {isCorrect ? 'Chính xác! ✅' : `Sai rồi! ❌ Đáp án: ${Array.isArray(currentQuestion?.answer) ? currentQuestion.answer.join(', ') : currentQuestion?.answer}`}
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 18,
    color: '#888',
    marginTop: 12
  },
  emptyEmoji: {
    fontSize: 64
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  topBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  topBackText: {
    fontSize: 24,
    color: '#4A90D9'
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 12
  },
  comboSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center'
  },
  questionScroll: {
    flex: 1
  },
  questionContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32
  },
  feedbackBanner: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  correctBanner: {
    backgroundColor: '#E8F5E9'
  },
  wrongBanner: {
    backgroundColor: '#FFEBEE'
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  }
})
