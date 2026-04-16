import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SubjectSelector } from '../components/SubjectSelector'
import { ExamTimer } from '../components/ExamTimer'
import { ProgressBar } from '../components/ProgressBar'
import { QuestionCard } from '../components/QuestionCard'
import { TopicScoreChart } from '../components/TopicScoreChart'
import { Colors, Spacing, Radius, FontSize } from '../constants/theme'
import { Subject, Question } from '../lib/types'
import { getExamQuestions } from '../lib/questions'

type ExamPhase = 'intro' | 'inprogress' | 'finished'

interface ExamAnswer {
  questionId: string
  answer: string
  chapter: string
}

const EXAM_QUESTIONS = 20
const EXAM_DURATION_SECONDS = 40 * 60 // 40 minutes

export default function ExamScreen() {
  const [subject, setSubject] = useState<Subject>('math')
  const [phase, setPhase] = useState<ExamPhase>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<number, ExamAnswer>>(new Map())
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startExam = useCallback(async () => {
    setLoading(true)
    try {
      const qs = await getExamQuestions(subject, EXAM_QUESTIONS)
      setQuestions(qs)
      setCurrentIndex(0)
      setAnswers(new Map())
      setTimeLeft(EXAM_DURATION_SECONDS)
      startTimeRef.current = Date.now()
      setPhase('inprogress')

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setPhase('finished')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      console.warn('Failed to load exam questions:', err)
    } finally {
      setLoading(false)
    }
  }, [subject])

  const handleAnswer = useCallback(
    (userAnswer: string | string[]) => {
      const question = questions[currentIndex]
      if (!question) return

      const newAnswers = new Map(answers)
      newAnswers.set(currentIndex, {
        questionId: question.id,
        answer: Array.isArray(userAnswer) ? userAnswer.join(',') : userAnswer,
        chapter: question.chapter ?? ''
      })
      setAnswers(newAnswers)
    },
    [questions, currentIndex, answers]
  )

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('finished')
  }, [])

  const handleRetry = useCallback(() => {
    setPhase('intro')
    setQuestions([])
    setAnswers(new Map())
    setCurrentIndex(0)
  }, [])

  const goToQuestion = useCallback(
    (direction: 'prev' | 'next') => {
      if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (direction === 'next' && currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    },
    [currentIndex, questions.length]
  )

  // Calculate exam results
  const getResults = useCallback(() => {
    let correct = 0
    const chapterScores: Record<string, { correct: number; total: number }> = {}

    questions.forEach((q, idx) => {
      const chapterId = q.chapter ?? 'unknown'
      if (!chapterScores[chapterId]) {
        chapterScores[chapterId] = { correct: 0, total: 0 }
      }
      chapterScores[chapterId].total += 1

      const userAnswer = answers.get(idx)
      if (userAnswer) {
        const normalizedUser = userAnswer.answer.trim().toLowerCase()
        const correctAnswer = Array.isArray(q.answer)
          ? q.answer.map((a) => String(a).trim().toLowerCase()).join(',')
          : String(q.answer).trim().toLowerCase()

        if (normalizedUser === correctAnswer) {
          correct += 1
          chapterScores[chapterId].correct += 1
        }
      }
    })


    return { correct, total: questions.length, chapterScores }
  }, [questions, answers])

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.introContent}>
          {/* Subject selector */}
          <View style={styles.selectorSection}>
            <SubjectSelector selected={subject} onSelect={setSubject} />
          </View>

          {/* Title */}
          <Text style={styles.examTitle}>
            {'📝'} Đề thi thử cuối kỳ 2
          </Text>

          {/* Info card */}
          <View style={styles.infoCard}>
            <InfoRow icon={'📋'} label="Số câu" value="20 câu" />
            <InfoRow icon={'⏰'} label="Thời gian" value="40 phút" />
            <InfoRow icon={'📚'} label="Nội dung" value="Mix tất cả chủ đề" />
          </View>

          <Text style={styles.infoNote}>
            Bạn có thể quay lại câu trước để sửa đáp án
          </Text>

          {/* Start button */}
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.8}
            onPress={startExam}
            disabled={loading}
          >
            <Text style={styles.startButtonText}>
              {loading ? 'Đang tải...' : 'Bắt đầu!'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ============ IN PROGRESS ============
  if (phase === 'inprogress') {
    const currentQuestion = questions[currentIndex]
    const hasAnswered = answers.has(currentIndex)
    const answeredCount = answers.size

    return (
      <SafeAreaView style={styles.container}>
        {/* Timer */}
        <View style={styles.timerSection}>
          <ExamTimer totalSeconds={EXAM_DURATION_SECONDS} onTimeUp={handleSubmit} isRunning={phase === 'inprogress'} />
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <ProgressBar current={answeredCount} total={questions.length} />
          <Text style={styles.progressLabel}>
            Câu {currentIndex + 1}/{questions.length} ({answeredCount} đã trả lời)
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              showResult={false}
              isCorrect={false}
            />
          )}
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={() => goToQuestion('prev')}
            disabled={currentIndex === 0}
          >
            <Text
              style={[
                styles.navButtonText,
                currentIndex === 0 && styles.navButtonTextDisabled
              ]}
            >
              {'←'} Trước
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.8}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Nộp bài</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === questions.length - 1 && styles.navButtonDisabled
            ]}
            onPress={() => goToQuestion('next')}
            disabled={currentIndex === questions.length - 1}
          >
            <Text
              style={[
                styles.navButtonText,
                currentIndex === questions.length - 1 && styles.navButtonTextDisabled
              ]}
            >
              Sau {'→'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ============ FINISHED ============
  const results = getResults()
  const timeTaken = EXAM_DURATION_SECONDS - timeLeft
  const timeMins = Math.floor(timeTaken / 60)
  const timeSecs = timeTaken % 60

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.resultContent}>
        <Text style={styles.resultTitle}>Kết quả thi thử</Text>

        {/* Score */}
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{results.correct}</Text>
          <Text style={styles.scoreSlash}>/{results.total}</Text>
        </View>

        <Text style={styles.scoreLabel}>
          {results.correct / results.total >= 0.7
            ? 'Đạt! 🎉'
            : 'Chưa đạt - Cố gắng lần sau nhé! 💪'}
        </Text>

        {/* Time */}
        <Text style={styles.timeText}>
          {'⏱️'} Thời gian: {timeMins} phút {timeSecs} giây
        </Text>

        {/* Chapter breakdown */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Điểm theo chủ đề</Text>
          <TopicScoreChart scores={Object.entries(results.chapterScores).map(([name, data], i) => ({
            name,
            score: data.correct,
            total: data.total,
            color: ['#4A90D9', '#FF7043', '#4CAF50', '#FFB020', '#9C27B0'][i % 5]
          }))} />
        </View>

        {/* Retry */}
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.8}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Làm lại</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  // Intro
  introContent: {
    padding: 20,
    paddingTop: 16,
    alignItems: 'center'
  },
  selectorSection: {
    width: '100%',
    marginBottom: 20
  },
  examTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 12,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  infoIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center'
  },
  infoLabel: {
    fontSize: 16,
    color: '#555',
    flex: 1
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  infoNote: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24
  },
  startButton: {
    backgroundColor: '#4A90D9',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff'
  },
  // In Progress
  timerSection: {
    paddingHorizontal: 20,
    paddingTop: 8
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 8
  },
  progressLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 4
  },
  questionSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: 'center'
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E8E8E8'
  },
  navButtonDisabled: {
    opacity: 0.4
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333'
  },
  navButtonTextDisabled: {
    color: '#999'
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FF7043'
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  // Finished
  resultContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 48
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#4A90D9'
  },
  scoreSlash: {
    fontSize: 32,
    fontWeight: '600',
    color: '#999'
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8
  },
  timeText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24
  },
  chartSection: {
    width: '100%',
    marginBottom: 24
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12
  },
  retryButton: {
    backgroundColor: '#4A90D9',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  }
})
