export type DemoStateTag = 'empty' | 'ready' | 'running' | 'done'

export type DemoState =
  | { tag: 'empty'; pitch: string }
  | { tag: 'ready'; pitch: string }
  | { tag: 'running'; pitch: string; revealIndex: number }
  | { tag: 'done'; pitch: string }

export type DemoAction =
  | { type: 'SET_PITCH'; pitch: string }
  | { type: 'START' }
  | { type: 'ADVANCE' }
  | { type: 'SKIP' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: DemoState }
