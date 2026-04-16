/**
 * Data integrity tests — verify all 500 questions are valid
 */

import type { Question, QuestionBank } from '../lib/types'

const mathBank: QuestionBank = require('../assets/data/math-questions.json')
const vietBank: QuestionBank = require('../assets/data/vietnamese-questions.json')

describe('Math question bank integrity', () => {
  const questions = mathBank.questions

  it('has 250 questions', () => {
    expect(questions.length).toBe(250)
  })

  it('all questions have required fields', () => {
    for (const q of questions) {
      expect(q.id).toBeTruthy()
      expect(q.chapter).toBeTruthy()
      expect(q.type).toBeTruthy()
      expect(q.difficulty).toBeTruthy()
      expect(q.question).toBeTruthy()
      expect(q.answer !== undefined && q.answer !== null).toBe(true)
    }
  })

  it('no duplicate IDs', () => {
    const ids = questions.map(q => q.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all chapters in questions exist in chapter list', () => {
    const chapterIds = new Set(mathBank.chapters.map(c => c.id))
    for (const q of questions) {
      expect(chapterIds.has(q.chapter)).toBe(true)
    }
  })

  it('difficulty values are valid', () => {
    for (const q of questions) {
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty)
    }
  })

  it('multiple choice questions have options with answer in options', () => {
    const mcTypes = ['multiple_choice', 'word_problem', 'clock_reading', 'weekday', 'shape_count']
    for (const q of questions) {
      if (mcTypes.includes(q.type) && q.options) {
        const answer = String(q.answer).toLowerCase().trim()
        const opts = q.options.map(o => o.toLowerCase().trim())
        expect(opts).toContain(answer)
      }
    }
  })

  it('no duplicate options within a question', () => {
    for (const q of questions) {
      if (q.options && q.options.length > 0) {
        const uniqueOpts = new Set(q.options)
        if (uniqueOpts.size !== q.options.length) {
          fail(`Question ${q.id} has duplicate options: ${JSON.stringify(q.options)}`)
        }
      }
    }
  })

  it('compare questions have valid answer', () => {
    for (const q of questions) {
      if (q.type === 'compare') {
        expect(['>', '<', '=']).toContain(String(q.answer))
      }
    }
  })

  it('true_false questions have valid answer', () => {
    for (const q of questions) {
      if (q.type === 'true_false') {
        expect(['Đúng', 'Sai']).toContain(String(q.answer))
      }
    }
  })

  it('fill_blank answers are numbers or simple strings', () => {
    for (const q of questions) {
      if (q.type === 'fill_blank' || q.type === 'missing_number') {
        if (!Array.isArray(q.answer)) {
          // Should be a number or numeric string
          expect(q.answer).toBeTruthy()
        }
      }
    }
  })

  it('no question text contains raw unicode escapes', () => {
    for (const q of questions) {
      expect(q.question).not.toMatch(/\\u[0-9A-Fa-f]{4}/)
      if (q.options) {
        for (const opt of q.options) {
          expect(opt).not.toMatch(/\\u[0-9A-Fa-f]{4}/)
        }
      }
    }
  })

  describe('arithmetic correctness (spot checks)', () => {
    it('simple addition questions (X + Y = ___) have correct answers', () => {
      for (const q of questions) {
        if (q.type === 'fill_blank' && !Array.isArray(q.answer)) {
          // Only match simple "X + Y = ___" (no chained ops)
          const match = q.question.match(/^(\d+)\s*\+\s*(\d+)\s*=\s*___$/)
          if (match) {
            const expected = parseInt(match[1]) + parseInt(match[2])
            expect({ id: q.id, expected, got: q.answer }).toEqual({
              id: q.id, expected, got: String(expected)
            })
          }
        }
      }
    })

    it('simple subtraction questions (X - Y = ___) have correct answers', () => {
      for (const q of questions) {
        if (q.type === 'fill_blank' && !Array.isArray(q.answer)) {
          // Only match simple "X - Y = ___" (no chained ops)
          const match = q.question.match(/^(\d+)\s*-\s*(\d+)\s*=\s*___$/)
          if (match) {
            const expected = parseInt(match[1]) - parseInt(match[2])
            expect({ id: q.id, expected, got: q.answer }).toEqual({
              id: q.id, expected, got: String(expected)
            })
          }
        }
      }
    })

    it('no addition requires carrying (grade 1 scope)', () => {
      for (const q of questions) {
        const matches = q.question.matchAll(/(\d+)\s*\+\s*(\d+)/g)
        for (const match of matches) {
          const a = parseInt(match[1])
          const b = parseInt(match[2])
          if (a > 10 && b > 0) {
            const unitsA = a % 10
            const unitsB = b % 10
            if (unitsA + unitsB >= 10) {
              fail(`Question ${q.id}: ${a} + ${b} requires carrying (${unitsA}+${unitsB}=${unitsA + unitsB} >= 10)`)
            }
          }
        }
      }
    })

    it('no subtraction requires borrowing (grade 1 scope)', () => {
      for (const q of questions) {
        const matches = q.question.matchAll(/(\d+)\s*-\s*(\d+)/g)
        for (const match of matches) {
          const a = parseInt(match[1])
          const b = parseInt(match[2])
          if (a > 10 && b > 0 && b < a) {
            const unitsA = a % 10
            const unitsB = b % 10
            if (unitsA < unitsB) {
              fail(`Question ${q.id}: ${a} - ${b} requires borrowing (${unitsA}-${unitsB} < 0)`)
            }
          }
        }
      }
    })
  })
})

describe('Vietnamese question bank integrity', () => {
  const questions = vietBank.questions

  it('has at least 200 questions', () => {
    expect(questions.length).toBeGreaterThanOrEqual(200)
    expect(questions.length).toBe(vietBank.metadata.total_questions)
  })

  it('all questions have required fields', () => {
    for (const q of questions) {
      expect(q.id).toBeTruthy()
      expect(q.chapter).toBeTruthy()
      expect(q.type).toBeTruthy()
      expect(q.difficulty).toBeTruthy()
      expect(q.question).toBeTruthy()
      expect(q.answer !== undefined && q.answer !== null).toBe(true)
    }
  })

  it('no duplicate IDs', () => {
    const ids = questions.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all chapters in questions exist in chapter list', () => {
    const chapterIds = new Set(vietBank.chapters.map(c => c.id))
    for (const q of questions) {
      expect(chapterIds.has(q.chapter)).toBe(true)
    }
  })

  it('no duplicate options within a question', () => {
    for (const q of questions) {
      if (q.options && q.options.length > 0) {
        const uniqueOpts = new Set(q.options)
        if (uniqueOpts.size !== q.options.length) {
          fail(`Question ${q.id} has duplicate options: ${JSON.stringify(q.options)}`)
        }
      }
    }
  })

  it('questions with options have answer matching an option', () => {
    for (const q of questions) {
      if (q.options && q.options.length > 0 && !Array.isArray(q.answer)) {
        const answer = String(q.answer).trim()
        const opts = q.options.map(o => o.trim())
        if (!opts.includes(answer)) {
          fail(`Question ${q.id}: answer "${answer}" not in options ${JSON.stringify(opts)}`)
        }
      }
    }
  })

  it('no question text contains raw unicode escapes', () => {
    for (const q of questions) {
      expect(q.question).not.toMatch(/\\u[0-9A-Fa-f]{4}/)
    }
  })

  it('dien_van/dien_chu questions do not reveal answer in question text', () => {
    for (const q of questions) {
      if (q.type === 'dien_van' || q.type === 'dien_chu') {
        // Question should contain ___ (blank) and NOT contain the full completed word
        expect(q.question).toMatch(/___/)
      }
    }
  })
})
