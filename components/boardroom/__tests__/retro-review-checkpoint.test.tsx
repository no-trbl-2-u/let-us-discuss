import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RetroReviewCheckpoint } from '@/components/boardroom/retro-review-checkpoint'

const items = [
  { id: 'a', text: 'Surface MAX_PERSONAS_SEATED', seen_in_retros: 3 },
  { id: 'b', text: 'Document first-touch definition', seen_in_retros: 2 },
  { id: 'c', text: 'Clarify the success metric', seen_in_retros: 1 },
]

describe('RetroReviewCheckpoint', () => {
  it('renders each carry-forward item with its seen-in count', () => {
    render(<RetroReviewCheckpoint items={items} onSubmit={() => {}} />)
    expect(screen.getByText(/Surface MAX_PERSONAS_SEATED/)).toBeInTheDocument()
    expect(screen.getByText(/Document first-touch/)).toBeInTheDocument()
    expect(screen.getByText(/Clarify the success metric/)).toBeInTheDocument()
    expect(screen.getAllByText(/of last 3 sessions/i).length).toBe(3)
  })

  it('toggles checkboxes and the submit button reflects the count', () => {
    render(<RetroReviewCheckpoint items={items} onSubmit={() => {}} />)
    expect(
      screen.getByRole('button', { name: /skip — pick none/i }),
    ).toBeInTheDocument()

    const boxes = screen.getAllByRole('checkbox')
    fireEvent.click(boxes[0]!)
    expect(screen.getByRole('button', { name: /pick 1/i })).toBeInTheDocument()

    fireEvent.click(boxes[2]!)
    expect(screen.getByRole('button', { name: /pick 2/i })).toBeInTheDocument()

    fireEvent.click(boxes[0]!)
    expect(screen.getByRole('button', { name: /pick 1/i })).toBeInTheDocument()
  })

  it('submits the picked IDs in order picked', () => {
    const onSubmit = vi.fn()
    render(<RetroReviewCheckpoint items={items} onSubmit={onSubmit} />)
    const boxes = screen.getAllByRole('checkbox')
    fireEvent.click(boxes[1]!)
    fireEvent.click(boxes[2]!)
    fireEvent.click(screen.getByRole('button', { name: /pick 2/i }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const picked = onSubmit.mock.calls[0]![0] as string[]
    expect(picked.sort()).toEqual(['b', 'c'])
  })

  it('submits an empty array when the user picks none', () => {
    const onSubmit = vi.fn()
    render(<RetroReviewCheckpoint items={items} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /skip — pick none/i }))
    expect(onSubmit).toHaveBeenCalledWith([])
  })
})
