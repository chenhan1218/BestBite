/**
 * WelcomeSection Component Tests
 */

import { render, screen } from '@testing-library/react'
import { WelcomeSection } from '../WelcomeSection'

jest.mock('@/styles/themes', () => ({
  CARD_STYLES: {
    default: 'bg-white p-6 rounded-lg shadow',
  },
  CAMERA_BUTTON: {
    style: 'bg-blue-500 hover:bg-blue-600 text-white rounded-full',
    size: { width: '80px', height: '80px' },
  },
}))

describe('WelcomeSection Component', () => {
  it('should render welcome title', () => {
    render(<WelcomeSection />)

    expect(screen.getByText('歡迎使用 BestBite')).toBeInTheDocument()
  })

  it('should render description', () => {
    render(<WelcomeSection />)

    expect(screen.getByText('拍攝食品包裝，AI 自動辨識品名與有效期限')).toBeInTheDocument()
  })

  it('should render camera button', () => {
    render(<WelcomeSection />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should have camera button disabled', () => {
    render(<WelcomeSection />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should render camera emoji in button', () => {
    render(<WelcomeSection />)

    expect(screen.getByText('📷')).toBeInTheDocument()
  })

  it('should render development notice', () => {
    render(<WelcomeSection />)

    expect(screen.getByText('相機功能開發中...')).toBeInTheDocument()
  })

  it('should have correct button styling', () => {
    render(<WelcomeSection />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-500')
    expect(button).toHaveClass('text-white')
  })

  it('should render in a section element', () => {
    const { container } = render(<WelcomeSection />)

    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
  })

  it('should have card styling', () => {
    const { container } = render(<WelcomeSection />)

    const section = container.querySelector('section')
    expect(section).toHaveClass('bg-white')
    expect(section).toHaveClass('rounded-lg')
  })

  it('should have proper heading hierarchy', () => {
    render(<WelcomeSection />)

    const heading = screen.getByRole('heading')
    expect(heading.tagName).toBe('H2')
  })
})
