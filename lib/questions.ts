import type { Chapter, LessonNode, Progress, Question, QuestionBank, Subject } from './types'

const mathBank: QuestionBank = require('../assets/data/math-questions.json')
const vietnameseBank: QuestionBank = require('../assets/data/vietnamese-questions.json')

function getBank(subject: Subject): QuestionBank {
  return subject === 'math' ? mathBank : vietnameseBank
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }
  return shuffled
}

export function getChapters(subject: Subject): Chapter[] {
  const bank = getBank(subject)
  return [...bank.chapters].sort((a, b) => a.order - b.order)
}

export function getQuestionsByChapter(
  subject: Subject,
  chapterId: string,
  count: number = 10
): Question[] {
  const bank = getBank(subject)
  const chapterQuestions = bank.questions.filter((q) => q.chapter === chapterId)
  const shuffled = shuffleArray(chapterQuestions)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function getExamQuestions(subject: Subject, count: number = 20): Question[] {
  const bank = getBank(subject)
  const examQuestions = bank.questions.filter((q) => q.tags?.includes('exam_hk2'))
  const shuffled = shuffleArray(examQuestions)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function generateMapNodes(subject: Subject, progress: Progress): LessonNode[] {
  console.log(`[Map] generateMapNodes: completedNodes =`, Object.keys(progress.completedNodes))
  const chapters = getChapters(subject)
  const bank = getBank(subject)
  const nodes: LessonNode[] = []

  const nodesPerChapter = Math.max(2, Math.round(28 / Math.max(chapters.length, 1)))
  let foundCurrent = false

  for (const chapter of chapters) {
    const chapterQuestionCount = bank.questions.filter((q) => q.chapter === chapter.id).length
    const actualNodes = Math.min(nodesPerChapter, Math.max(1, Math.ceil(chapterQuestionCount / 10)))

    for (let i = 0; i < actualNodes; i++) {
      const nodeId = `${chapter.id}_${i}`
      const completionData = progress.completedNodes[nodeId]
      const isCompleted = completionData !== undefined

      let status: LessonNode['status']
      if (isCompleted) {
        status = 'completed'
      } else if (!foundCurrent) {
        status = 'current'
        foundCurrent = true
      } else {
        status = 'locked'
      }

      nodes.push({
        id: nodeId,
        chapterId: chapter.id,
        chapterName: chapter.name,
        chapterIcon: chapter.icon,
        nodeIndex: i,
        label: i === 0 ? chapter.name : `${chapter.name} (${i + 1})`,
        status,
        stars: completionData?.stars ?? 0
      })
    }
  }

  if (!foundCurrent && nodes.length > 0) {
    const firstLocked = nodes.find((n) => n.status === 'locked')
    if (firstLocked) {
      firstLocked.status = 'current'
    }
  }

  return nodes
}
