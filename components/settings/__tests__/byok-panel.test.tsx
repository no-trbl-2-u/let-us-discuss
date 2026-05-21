import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

import { ByokPanel } from '@/components/settings/byok-panel'
import {
  DISABLED_COPY,
  DISABLED_HINT,
  FIRST_RUN_COPY,
  ROTATE_COPY,
} from '@/components/settings/byok-panel'

const SAMPLE_KEY = 'sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

describe('ByokPanel', () => {
  const originalFetch = global.fetch
  const originalConfirm = window.confirm

  beforeEach(() => {
    refresh.mockReset()
  })

  afterEach(() => {
    global.fetch = originalFetch
    window.confirm = originalConfirm
    vi.useRealTimers()
  })

  it('renders the disabled message when disabled=true', () => {
    render(<ByokPanel initialMeta={null} audit={[]} disabled={true} />)
    expect(screen.getByText(DISABLED_COPY)).toBeInTheDocument()
    expect(screen.getByText(DISABLED_HINT)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the paste form in unset mode and locks the first-run copy', () => {
    render(<ByokPanel initialMeta={null} audit={[]} disabled={false} />)
    expect(screen.getByText(FIRST_RUN_COPY)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /save key/i }),
    ).toBeInTheDocument()
    // The form's submit button starts disabled until the input is long
    // enough.
    expect(screen.getByRole('button', { name: /save key/i })).toBeDisabled()
  })

  it('renders the masked summary + rotate/revoke when initialMeta is set', () => {
    render(
      <ByokPanel
        initialMeta={{
          mask: 'sk-ant…XYZW',
          keyVersion: 1,
          updatedAt: '2026-05-20T14:33:00Z',
        }}
        audit={[]}
        disabled={false}
      />,
    )
    expect(screen.getByText('sk-ant…XYZW')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rotate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /revoke/i })).toBeInTheDocument()
    // The paste form is hidden until Rotate is clicked.
    expect(screen.queryByText(FIRST_RUN_COPY)).not.toBeInTheDocument()
  })

  it('toggles to the rotate form when Rotate is clicked', () => {
    render(
      <ByokPanel
        initialMeta={{
          mask: 'sk-ant…XYZW',
          keyVersion: 1,
          updatedAt: '2026-05-20T14:33:00Z',
        }}
        audit={[]}
        disabled={false}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /rotate/i }))
    expect(screen.getByText(ROTATE_COPY)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /save new key/i }),
    ).toBeInTheDocument()
  })

  it('POSTs to /api/byok on save and refreshes the route', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, mask: 'sk-ant…XYZW', keyVersion: 1 }),
    }) as never
    render(<ByokPanel initialMeta={null} audit={[]} disabled={false} />)
    const input = screen.getByLabelText(/anthropic api key/i)
    fireEvent.change(input, { target: { value: SAMPLE_KEY } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/byok',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('surfaces a server-side error on save', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ code: 'internal' }),
    }) as never
    render(<ByokPanel initialMeta={null} audit={[]} disabled={false} />)
    const input = screen.getByLabelText(/anthropic api key/i)
    fireEvent.change(input, { target: { value: SAMPLE_KEY } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    await waitFor(() =>
      expect(screen.getByText('internal')).toBeInTheDocument(),
    )
    expect(refresh).not.toHaveBeenCalled()
  })

  it('confirms before DELETE on revoke; aborts when the confirm is declined', async () => {
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy as never
    window.confirm = vi.fn().mockReturnValue(false) as never
    render(
      <ByokPanel
        initialMeta={{
          mask: 'sk-ant…XYZW',
          keyVersion: 1,
          updatedAt: '2026-05-20T14:33:00Z',
        }}
        audit={[]}
        disabled={false}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /revoke/i }))
    await Promise.resolve()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('DELETEs and resets to unset mode when the confirm is accepted', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    }) as never
    window.confirm = vi.fn().mockReturnValue(true) as never
    render(
      <ByokPanel
        initialMeta={{
          mask: 'sk-ant…XYZW',
          keyVersion: 1,
          updatedAt: '2026-05-20T14:33:00Z',
        }}
        audit={[]}
        disabled={false}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /revoke/i }))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/byok',
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(screen.queryByText('sk-ant…XYZW')).not.toBeInTheDocument()
  })

  it('renders an empty-state for the audit log when there are no events', () => {
    render(<ByokPanel initialMeta={null} audit={[]} disabled={false} />)
    expect(screen.getByText('no events yet')).toBeInTheDocument()
  })

  it('renders the audit log when events exist', () => {
    render(
      <ByokPanel
        initialMeta={{
          mask: 'sk-ant…XYZW',
          keyVersion: 1,
          updatedAt: '2026-05-20T14:33:00Z',
        }}
        audit={[
          {
            id: 1,
            event: 'add',
            keyVersion: 1,
            createdAt: '2026-05-19T12:00:00Z',
          },
          {
            id: 2,
            event: 'rotate',
            keyVersion: 1,
            createdAt: '2026-05-20T01:00:00Z',
          },
        ]}
        disabled={false}
      />,
    )
    expect(screen.getByText(/add\s+2026-05-19/)).toBeInTheDocument()
    expect(screen.getByText(/rotate\s+2026-05-20/)).toBeInTheDocument()
  })
})
