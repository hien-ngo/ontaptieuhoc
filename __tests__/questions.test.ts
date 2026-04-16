import {
  getChapters,
  getQuestionsByChapter,
  getExamQuestions,
  generateMapNodes,
  shuffleArray
} from '../lib/questions'
import type { Progress, Subject } from '../lib/types'

function emptyProgress(subject: Subject): Progress {
  return {
    subject,
    completedNodes: {},
    totalStars: 0,
    dailyStars: {},
    streak: 0,
    lastPlayedDate: ''
  }
}

describe('getChapters', () => {
  it('returns 7 math chapters in order', () => {
    const chapters = getChapters('math')
    expect(chapters).toHaveLength(7)
    expect(chapters[0].id).toBe('so_hoc_0_10')
    expect(chapters[6].id).toBe('on_thi_cuoi_ky')
    for (let i = 1; i < chapters.length; i++) {
      expect(chapters[i].order).toBeGreaterThan(chapters[i - 1].order)
    }
  })

  it('returns 7 vietnamese chapters in order', () => {
    const chapters = getChapters('vietnamese')
    expect(chapters).toHaveLength(7)
    expect(chapters[0].id).toBe('hoc_van_co_ban')
    expect(chapters[6].id).toBe('on_thi_cuoi_ky')
  })

  it('every chapter has icon, name, id', () => {
    for (const subject of ['math', 'vietnamese'] as Subject[]) {
      const chapters = getChapters(subject)
      for (const ch of chapters) {
        expect(ch.id).toBeTruthy()
        expect(ch.name).toBeTruthy()
        expect(ch.icon).toBeTruthy()
      }
    }
  })
})

describe('getQuestionsByChapter', () => {
  it('returns 10 questions by default', () => {
    const qs = getQuestionsByChapter('math', 'so_hoc_0_10')
    expect(qs.length).toBeLessThanOrEqual(10)
    expect(qs.length).toBeGreaterThan(0)
  })

  it('all returned questions belong to the correct chapter', () => {
    const qs = getQuestionsByChapter('math', 'phep_cong_trong_10')
    for (const q of qs) {
      expect(q.chapter).toBe('phep_cong_trong_10')
    }
  })

  it('returns questions from the pool (may be different subset each call)', () => {
    const qs = getQuestionsByChapter('math', 'cac_so_den_100', 20)
    expect(qs.length).toBeLessThanOrEqual(20)
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) {
      expect(q.chapter).toBe('cac_so_den_100')
    }
  })

  it('respects count parameter', () => {
    const qs = getQuestionsByChapter('math', 'so_hoc_0_10', 5)
    expect(qs.length).toBeLessThanOrEqual(5)
  })

  it('works for vietnamese chapters', () => {
    const qs = getQuestionsByChapter('vietnamese', 'chinh_ta')
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) {
      expect(q.chapter).toBe('chinh_ta')
    }
  })

  it('returns empty for non-existent chapter', () => {
    const qs = getQuestionsByChapter('math', 'non_existent_chapter')
    expect(qs).toHaveLength(0)
  })
})

describe('getExamQuestions', () => {
  it('returns questions tagged with exam_hk2', () => {
    const qs = getExamQuestions('math')
    expect(qs.length).toBeGreaterThan(0)
    expect(qs.length).toBeLessThanOrEqual(20)
    for (const q of qs) {
      expect(q.tags).toContain('exam_hk2')
    }
  })

  it('works for vietnamese', () => {
    const qs = getExamQuestions('vietnamese')
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) {
      expect(q.tags).toContain('exam_hk2')
    }
  })
})

describe('generateMapNodes', () => {
  it('generates nodes for fresh progress (first node is current)', () => {
    const nodes = generateMapNodes('math', emptyProgress('math'))
    expect(nodes.length).toBeGreaterThan(0)
    expect(nodes[0].status).toBe('current')
    for (let i = 1; i < nodes.length; i++) {
      expect(nodes[i].status).toBe('locked')
    }
  })

  it('marks completed nodes and sets next as current', () => {
    const progress = emptyProgress('math')
    progress.completedNodes['so_hoc_0_10_0'] = { stars: 2, bestScore: 8 }

    const nodes = generateMapNodes('math', progress)
    const node0 = nodes.find(n => n.id === 'so_hoc_0_10_0')
    expect(node0?.status).toBe('completed')
    expect(node0?.stars).toBe(2)

    // Next node should be current
    const node1 = nodes.find(n => n.id === 'so_hoc_0_10_1')
    expect(node1?.status).toBe('current')
  })

  it('unlocks node even with 0 stars (score < 5)', () => {
    const progress = emptyProgress('math')
    progress.completedNodes['so_hoc_0_10_0'] = { stars: 0, bestScore: 3 }

    const nodes = generateMapNodes('math', progress)
    const node0 = nodes.find(n => n.id === 'so_hoc_0_10_0')
    expect(node0?.status).toBe('completed')

    const node1 = nodes.find(n => n.id === 'so_hoc_0_10_1')
    expect(node1?.status).toBe('current')
  })

  it('unlocks through multiple completed nodes', () => {
    const progress = emptyProgress('math')
    progress.completedNodes['so_hoc_0_10_0'] = { stars: 3, bestScore: 10 }
    progress.completedNodes['so_hoc_0_10_1'] = { stars: 2, bestScore: 8 }

    const nodes = generateMapNodes('math', progress)

    expect(nodes.find(n => n.id === 'so_hoc_0_10_0')?.status).toBe('completed')
    expect(nodes.find(n => n.id === 'so_hoc_0_10_1')?.status).toBe('completed')

    // Third node should be current
    const node2 = nodes.find(n => n.id === 'so_hoc_0_10_2')
    expect(node2?.status).toBe('current')
  })

  it('unlocks across chapters', () => {
    const progress = emptyProgress('math')
    // Complete all nodes in first chapter
    const nodes0 = generateMapNodes('math', emptyProgress('math'))
    const ch1Nodes = nodes0.filter(n => n.chapterId === 'so_hoc_0_10')
    for (const n of ch1Nodes) {
      progress.completedNodes[n.id] = { stars: 3, bestScore: 10 }
    }

    const nodes = generateMapNodes('math', progress)
    const firstCh2Node = nodes.find(n => n.chapterId === 'phep_cong_trong_10')
    expect(firstCh2Node?.status).toBe('current')
  })

  it('all nodes have valid properties', () => {
    const nodes = generateMapNodes('math', emptyProgress('math'))
    for (const node of nodes) {
      expect(node.id).toBeTruthy()
      expect(node.chapterId).toBeTruthy()
      expect(node.chapterName).toBeTruthy()
      expect(node.chapterIcon).toBeTruthy()
      expect(node.label).toBeTruthy()
      expect(['completed', 'current', 'locked']).toContain(node.status)
      expect(node.nodeIndex).toBeGreaterThanOrEqual(0)
    }
  })

  it('has exactly one current node for fresh progress', () => {
    const nodes = generateMapNodes('math', emptyProgress('math'))
    const currentNodes = nodes.filter(n => n.status === 'current')
    expect(currentNodes).toHaveLength(1)
  })

  it('works for vietnamese', () => {
    const nodes = generateMapNodes('vietnamese', emptyProgress('vietnamese'))
    expect(nodes.length).toBeGreaterThan(0)
    expect(nodes[0].chapterId).toBe('hoc_van_co_ban')
  })
})

describe('shuffleArray', () => {
  it('returns same elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(arr)
    expect(shuffled.sort()).toEqual(arr.sort())
  })

  it('does not mutate original', () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = [...arr]
    shuffleArray(arr)
    expect(arr).toEqual(copy)
  })
})
