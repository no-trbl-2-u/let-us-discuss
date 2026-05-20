import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModelPicker } from '@/components/boardroom/model-picker'
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  MODEL_LABELS,
} from '@/lib/anthropic/models'

describe('ModelPicker', () => {
  it('renders every allowlist option with its label', () => {
    render(<ModelPicker value={DEFAULT_MODEL} onChange={() => {}} />)
    for (const model of AVAILABLE_MODELS) {
      const label = MODEL_LABELS[model] ?? model
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
    }
  })

  it('selects the current value', () => {
    render(<ModelPicker value="claude-sonnet-4-6" onChange={() => {}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('claude-sonnet-4-6')
  })

  it('renders the blurb for the selected value', () => {
    render(<ModelPicker value="claude-haiku-4-5-20251001" onChange={() => {}} />)
    expect(screen.getByText(/cheapest/i)).toBeInTheDocument()
  })

  it('fires onChange when the user picks a different model', () => {
    const onChange = vi.fn()
    render(<ModelPicker value={DEFAULT_MODEL} onChange={onChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'claude-sonnet-4-6' } })
    expect(onChange).toHaveBeenCalledWith('claude-sonnet-4-6')
  })

  it('respects the disabled prop', () => {
    render(<ModelPicker value={DEFAULT_MODEL} onChange={() => {}} disabled />)
    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true)
  })
})
