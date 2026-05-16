'use client'

import { PitchInput } from '@/components/boardroom/pitch-input'
import { DEMO_PITCH_WORDS } from '@/lib/limits'

type Props = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

export function DemoPitchInput({ value, onChange, disabled }: Props) {
  return (
    <PitchInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      max={DEMO_PITCH_WORDS}
      placeholder="What are you trying to ship, and for whom? (≤ 100 words.)"
    />
  )
}
