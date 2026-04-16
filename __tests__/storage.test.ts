import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  getProgress,
  saveProgress,
  updateNodeCompletion,
  getDailyStars,
  getStreak
} from '../lib/storage'
import type { Progress } from '../lib/types'

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
})

describe('getProgress', () => {
  it('returns default progress for new subject', async () => {
    const progress = await getProgress('math')
    expect(progress.subject).toBe('math')
    expect(progress.completedNodes).toEqual({})
    expect(progress.totalStars).toBe(0)
    expect(progress.streak).toBe(0)
  })

  it('returns saved progress', async () => {
    const saved: Progress = {
      subject: 'math',
      completedNodes: { 'so_hoc_0_10_0': { stars: 3, bestScore: 10 } },
      totalStars: 3,
      dailyStars: { '2026-04-17': 3 },
      streak: 1,
      lastPlayedDate: '2026-04-17'
    }
    await AsyncStorage.setItem('progress_math', JSON.stringify(saved))
    const progress = await getProgress('math')
    expect(progress.completedNodes['so_hoc_0_10_0']).toBeDefined()
    expect(progress.totalStars).toBe(3)
  })
})

describe('updateNodeCompletion', () => {
  it('saves node completion with correct stars (score 9/10 = 3 stars)', async () => {
    const result = await updateNodeCompletion('math', 'so_hoc_0_10_0', 9, 10)
    expect(result.completedNodes['so_hoc_0_10_0']).toBeDefined()
    expect(result.completedNodes['so_hoc_0_10_0'].stars).toBe(3)
    expect(result.completedNodes['so_hoc_0_10_0'].bestScore).toBe(9)
    expect(result.totalStars).toBe(3)
  })

  it('saves node completion (score 7/10 = 2 stars)', async () => {
    const result = await updateNodeCompletion('math', 'so_hoc_0_10_0', 7, 10)
    expect(result.completedNodes['so_hoc_0_10_0'].stars).toBe(2)
  })

  it('saves node completion (score 5/10 = 1 star)', async () => {
    const result = await updateNodeCompletion('math', 'so_hoc_0_10_0', 5, 10)
    expect(result.completedNodes['so_hoc_0_10_0'].stars).toBe(1)
  })

  it('saves node completion (score 3/10 = 0 stars)', async () => {
    const result = await updateNodeCompletion('math', 'so_hoc_0_10_0', 3, 10)
    expect(result.completedNodes['so_hoc_0_10_0'].stars).toBe(0)
    expect(result.completedNodes['so_hoc_0_10_0'].bestScore).toBe(3)
  })

  it('node with 0 stars still counts as completed', async () => {
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 2, 10)
    const progress = await getProgress('math')
    expect(progress.completedNodes['so_hoc_0_10_0']).toBeDefined()
  })

  it('keeps best score on retry', async () => {
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 9, 10)
    const result = await updateNodeCompletion('math', 'so_hoc_0_10_0', 5, 10)
    expect(result.completedNodes['so_hoc_0_10_0'].bestScore).toBe(9)
    expect(result.completedNodes['so_hoc_0_10_0'].stars).toBe(3)
  })

  it('upgrades stars on better retry', async () => {
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 5, 10)
    const result = await updateNodeCompletion('math', 'so_hoc_0_10_0', 10, 10)
    expect(result.completedNodes['so_hoc_0_10_0'].stars).toBe(3)
    expect(result.totalStars).toBe(3)
  })

  it('tracks multiple nodes independently', async () => {
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 10, 10)
    const result = await updateNodeCompletion('math', 'so_hoc_0_10_1', 8, 10)
    expect(Object.keys(result.completedNodes)).toHaveLength(2)
    expect(result.completedNodes['so_hoc_0_10_0'].stars).toBe(3)
    expect(result.completedNodes['so_hoc_0_10_1'].stars).toBe(2)
    expect(result.totalStars).toBe(5)
  })

  it('updates daily stars', async () => {
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 9, 10)
    const stars = await getDailyStars('math')
    expect(stars).toBe(3)
  })

  it('updates streak', async () => {
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 9, 10)
    const streak = await getStreak('math')
    expect(streak).toBe(1)
  })

  it('math and vietnamese are separate', async () => {
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 10, 10)
    await updateNodeCompletion('vietnamese', 'hoc_van_co_ban_0', 8, 10)

    const mathProgress = await getProgress('math')
    const vietProgress = await getProgress('vietnamese')

    expect(Object.keys(mathProgress.completedNodes)).toHaveLength(1)
    expect(Object.keys(vietProgress.completedNodes)).toHaveLength(1)
    expect(mathProgress.completedNodes['hoc_van_co_ban_0']).toBeUndefined()
    expect(vietProgress.completedNodes['so_hoc_0_10_0']).toBeUndefined()
  })
})

describe('unlock flow integration', () => {
  it('completing node 0 unlocks node 1 on map', async () => {
    const { generateMapNodes } = require('../lib/questions')

    // Complete first node
    await updateNodeCompletion('math', 'so_hoc_0_10_0', 8, 10)
    const progress = await getProgress('math')
    const nodes = generateMapNodes('math', progress)

    const node0 = nodes.find((n: any) => n.id === 'so_hoc_0_10_0')
    const node1 = nodes.find((n: any) => n.id === 'so_hoc_0_10_1')

    expect(node0?.status).toBe('completed')
    expect(node1?.status).toBe('current')
  })

  it('completing nodes 0 and 1 unlocks node 2', async () => {
    const { generateMapNodes } = require('../lib/questions')

    await updateNodeCompletion('math', 'so_hoc_0_10_0', 8, 10)
    await updateNodeCompletion('math', 'so_hoc_0_10_1', 7, 10)
    const progress = await getProgress('math')
    const nodes = generateMapNodes('math', progress)

    expect(nodes.find((n: any) => n.id === 'so_hoc_0_10_0')?.status).toBe('completed')
    expect(nodes.find((n: any) => n.id === 'so_hoc_0_10_1')?.status).toBe('completed')
    expect(nodes.find((n: any) => n.id === 'so_hoc_0_10_2')?.status).toBe('current')
  })

  it('completing with low score (0 stars) still unlocks next', async () => {
    const { generateMapNodes } = require('../lib/questions')

    await updateNodeCompletion('math', 'so_hoc_0_10_0', 2, 10)
    const progress = await getProgress('math')
    const nodes = generateMapNodes('math', progress)

    expect(nodes.find((n: any) => n.id === 'so_hoc_0_10_0')?.status).toBe('completed')
    expect(nodes.find((n: any) => n.id === 'so_hoc_0_10_1')?.status).toBe('current')
  })
})
