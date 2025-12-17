/**
 * ViewFullInventorySection Component Tests
 */

import { render, screen } from '@testing-library/react'
import { ViewFullInventorySection } from '../ViewFullInventorySection'

jest.mock('@/styles/themes', () => ({
  BUTTON_STYLES: {
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 rounded',
  },
}))

jest.mock('next/link', () => {
  return ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
})

describe('ViewFullInventorySection Component', () => {
  it('should render link to inventory page', () => {
    render(<ViewFullInventorySection />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/inventory')
  })

  it('should render correct link text', () => {
    render(<ViewFullInventorySection />)

    expect(screen.getByText('查看完整庫存 →')).toBeInTheDocument()
  })

  it('should have button styling classes', () => {
    render(<ViewFullInventorySection />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('bg-gray-200')
    expect(link).toHaveClass('rounded')
  })

  it('should have padding classes', () => {
    render(<ViewFullInventorySection />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('py-3')
    expect(link).toHaveClass('px-6')
  })

  it('should have text size class', () => {
    render(<ViewFullInventorySection />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('text-lg')
  })

  it('should render in a section element', () => {
    const { container } = render(<ViewFullInventorySection />)

    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
  })

  it('should have centered text', () => {
    const { container } = render(<ViewFullInventorySection />)

    const section = container.querySelector('section')
    expect(section).toHaveClass('text-center')
  })

  it('should render as inline-block', () => {
    render(<ViewFullInventorySection />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('inline-block')
  })
})
