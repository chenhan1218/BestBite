/**
 * BackToHomeLink Component Tests
 */

import { render, screen } from '@testing-library/react'
import { BackToHomeLink } from '../BackToHomeLink'

jest.mock('@/styles/themes', () => ({
  BUTTON_STYLES: {
    link: 'text-blue-600 hover:text-blue-800 underline',
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

describe('BackToHomeLink Component', () => {
  it('should render link to home page', () => {
    render(<BackToHomeLink />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/')
  })

  it('should render correct link text', () => {
    render(<BackToHomeLink />)

    expect(screen.getByText('← 返回首頁')).toBeInTheDocument()
  })

  it('should have link styling classes', () => {
    render(<BackToHomeLink />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('text-blue-600')
    expect(link).toHaveClass('underline')
  })

  it('should have hover styling', () => {
    render(<BackToHomeLink />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('hover:text-blue-800')
  })

  it('should be a proper link element', () => {
    render(<BackToHomeLink />)

    const link = screen.getByRole('link')
    expect(link.tagName).toBe('A')
  })
})
