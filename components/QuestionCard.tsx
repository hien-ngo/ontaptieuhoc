import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../constants/theme'
import { useResponsive } from '../hooks/useResponsive'
import type { Question } from '../lib/types'
import { AnswerButton } from './AnswerButton'

interface QuestionCardProps {
  question: Question
  onAnswer: (answer: string | string[]) => void
  showResult: boolean
  isCorrect: boolean
}

const COMPARE_OPTIONS = ['>', '<', '=']
const TRUE_FALSE_OPTIONS = [
  { label: 'Đúng', value: 'Đúng' },
  { label: 'Sai', value: 'Sai' },
]

function getCorrectAnswer(answer: string | string[]): string[] {
  if (Array.isArray(answer)) return answer.map((a) => a.toLowerCase().trim())
  return [answer.toLowerCase().trim()]
}

function isAnswerCorrect(
  selected: string,
  correctAnswer: string | string[]
): boolean {
  const correct = getCorrectAnswer(correctAnswer)
  return correct.includes(selected.toLowerCase().trim())
}

/** Extract reading passage and question from doc_hieu type */
function splitPassage(text: string): { passage: string; questionText: string } {
  const separator = '→'
  const idx = text.indexOf(separator)
  if (idx === -1) return { passage: '', questionText: text }
  return {
    passage: text.substring(0, idx).trim(),
    questionText: text.substring(idx + 1).trim(),
  }
}

export function QuestionCard({
  question,
  onAnswer,
  showResult,
  isCorrect,
}: QuestionCardProps) {
  const { s } = useResponsive()
  const [textValue, setTextValue] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  // Reset state when question changes
  useEffect(() => {
    setTextValue('')
    setSelectedAnswer(null)
  }, [question.id])

  const hasOptions = question.options && question.options.length > 0

  const multipleChoiceTypes = [
    'multiple_choice',
    'chon_tu_dung',
    'noi_tu_hinh',
    'word_problem',
    'clock_reading',
    'weekday',
    'shape_count',
    'doc_hieu',
    'dien_dau',
    'dung_sai',
    'sap_xep_cau',
    'hoan_thanh_cau',
    'sort_numbers',
    'tim_tu',
    'dem_tieng',
  ]

  const fillTypes = ['fill_blank', 'dien_van', 'dien_chu', 'missing_number']

  const handleOptionPress = (option: string) => {
    if (showResult) return
    setSelectedAnswer(option)
    onAnswer(option)
  }

  const handleTextSubmit = () => {
    if (!textValue.trim()) return
    setSelectedAnswer(textValue.trim())
    onAnswer(textValue.trim())
  }

  const getButtonState = (
    option: string
  ): 'default' | 'correct' | 'wrong' | 'disabled' => {
    if (!showResult) {
      return selectedAnswer === option ? 'disabled' : 'default'
    }
    const correct = isAnswerCorrect(option, question.answer)
    if (correct) return 'correct'
    if (selectedAnswer === option && !correct) return 'wrong'
    return 'disabled'
  }

  const renderOptions = (options: string[]) => {
    const count = options.length

    if (count <= 2) {
      return (
        <View style={styles.row}>
          {options.map((opt, idx) => (
            <AnswerButton
              key={`opt_${idx}`}
              label={opt}
              onPress={() => handleOptionPress(opt)}
              state={getButtonState(opt)}
              style={styles.flexOne}
            />
          ))}
        </View>
      )
    }

    if (count === 3) {
      return (
        <View style={styles.col}>
          {options.map((opt, idx) => (
            <AnswerButton
              key={`opt_${idx}`}
              label={opt}
              onPress={() => handleOptionPress(opt)}
              state={getButtonState(opt)}
            />
          ))}
        </View>
      )
    }

    // 4 options: 2x2 grid
    return (
      <View style={styles.col}>
        <View style={styles.row}>
          {options.slice(0, 2).map((opt, idx) => (
            <AnswerButton
              key={`opt_${idx}`}
              label={opt}
              onPress={() => handleOptionPress(opt)}
              state={getButtonState(opt)}
              style={styles.flexOne}
            />
          ))}
        </View>
        <View style={styles.row}>
          {options.slice(2, 4).map((opt, idx) => (
            <AnswerButton
              key={`opt_${idx + 2}`}
              label={opt}
              onPress={() => handleOptionPress(opt)}
              state={getButtonState(opt)}
              style={styles.flexOne}
            />
          ))}
        </View>
      </View>
    )
  }

  const renderCompare = () => (
    <View style={styles.row}>
      {COMPARE_OPTIONS.map((opt) => (
        <AnswerButton
          key={`cmp_${opt}`}
          label={opt}
          onPress={() => handleOptionPress(opt)}
          state={getButtonState(opt)}
          style={styles.flexOne}
        />
      ))}
    </View>
  )

  const renderTrueFalse = () => (
    <View style={styles.row}>
      {TRUE_FALSE_OPTIONS.map((opt) => (
        <AnswerButton
          key={opt.value}
          label={opt.label}
          onPress={() => handleOptionPress(opt.value)}
          state={getButtonState(opt.value)}
          style={styles.flexOne}
        />
      ))}
    </View>
  )

  const renderTextInput = () => (
    <View style={styles.col}>
      <TextInput
        style={[
          styles.input,
          {
            fontSize: s(FontSize.lg),
            borderRadius: s(Radius.md),
            padding: s(Spacing.md),
            minHeight: s(56),
          },
        ]}
        value={textValue}
        onChangeText={setTextValue}
        placeholder="Nhập câu trả lời..."
        placeholderTextColor={Colors.grey}
        editable={!showResult}
        autoCapitalize="none"
      />
      {!showResult && (
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              borderRadius: s(Radius.md),
              paddingVertical: s(Spacing.md),
              minHeight: s(52),
            },
          ]}
          onPress={handleTextSubmit}
          activeOpacity={0.7}
        >
          <Text style={[styles.submitText, { fontSize: s(FontSize.lg) }]}>
            Trả lời
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Dạng toán nhập số: chỉ fill_blank và missing_number KHÔNG có options
  const mathInputTypes = ['fill_blank', 'missing_number']

  const renderBody = () => {
    // Compare type: 3 buttons >, <, =
    if (question.type === 'compare') {
      return renderCompare()
    }

    // True/false type: 2 buttons Đúng/Sai
    if (question.type === 'true_false' || question.type === 'dung_sai') {
      return renderTrueFalse()
    }

    // Nếu có options → luôn hiện buttons (bé lớp 1 chọn dễ hơn gõ)
    if (hasOptions) {
      return renderOptions(question.options!)
    }

    // Dạng toán nhập số (không có options): TextInput
    if (mathInputTypes.includes(question.type)) {
      return renderTextInput()
    }

    // Fallback: text input
    return renderTextInput()
  }

  const isDocHieu = question.type === 'doc_hieu'
  const { passage, questionText } = isDocHieu
    ? splitPassage(question.question)
    : { passage: '', questionText: question.question }

  return (
    <View style={[styles.card, { borderRadius: s(Radius.lg), padding: s(Spacing.lg) }]}>
      {isDocHieu && passage ? (
        <>
          <ScrollView
            style={[
              styles.passageContainer,
              {
                borderRadius: s(Radius.sm),
                maxHeight: s(180),
                padding: s(Spacing.md),
              },
            ]}
            nestedScrollEnabled
          >
            <Text style={[styles.passageText, { fontSize: s(FontSize.md) }]}>
              {passage}
            </Text>
          </ScrollView>
          <Text style={[styles.questionText, { fontSize: s(FontSize.xl) }]}>
            {questionText}
          </Text>
        </>
      ) : (
        <Text style={[styles.questionText, { fontSize: s(FontSize.xl) }]}>
          {question.question}
        </Text>
      )}

      <View style={styles.answerArea}>{renderBody()}</View>

      {showResult && question.explanation && (
        <View
          style={[
            styles.explanation,
            {
              borderRadius: s(Radius.sm),
              padding: s(Spacing.md),
            },
            isCorrect ? styles.explanationCorrect : styles.explanationWrong,
          ]}
        >
          <Text style={[styles.explanationTitle, { fontSize: s(FontSize.md) }]}>
            {isCorrect ? '✅ Đúng rồi!' : '❌ Chưa đúng!'}
          </Text>
          <Text style={[styles.explanationText, { fontSize: s(FontSize.sm) }]}>
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontWeight: '700',
    color: Colors.textDark,
    lineHeight: 32,
    marginBottom: Spacing.md,
  },
  passageContainer: {
    backgroundColor: Colors.greyLight,
    marginBottom: Spacing.md,
  },
  passageText: {
    color: Colors.textDark,
    lineHeight: 24,
  },
  answerArea: {
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  col: {
    gap: Spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    color: Colors.textDark,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: Colors.white,
    fontWeight: '700',
  },
  explanation: {
    marginTop: Spacing.md,
  },
  explanationCorrect: {
    backgroundColor: '#E8F5E9',
  },
  explanationWrong: {
    backgroundColor: '#FFEBEE',
  },
  explanationTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  explanationText: {
    color: Colors.textMid,
    lineHeight: 20,
  },
})
