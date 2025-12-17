/**
 * EmptyInventoryPlaceholder Component Tests
 */

import { render, screen } from '@testing-library/react'
import { EmptyInventoryPlaceholder } from '../EmptyInventoryPlaceholder'

jest.mock('@/styles/themes', () => ({
  CARD_STYLES: {
    default: 'bg-white p-6 rounded-lg shadow',
  },
}))

describe('EmptyInventoryPlaceholder Component', () => {
  it('should render empty state message', () => {
    render(<EmptyInventoryPlaceholder />)

    expect(screen.getByText('目前沒有任何庫存項目')).toBeInTheDocument()
  })

  it('should render help text', () => {
    render(<EmptyInventoryPlaceholder />)

    expect(
      screen.getByText('請回到首頁使用相機功能新增食品')
    ).toBeInTheDocument()
  })

  it('should have card styling', () => {
    const { container } = render(<EmptyInventoryPlaceholder />)

    const card = container.firstChild
    expect(card).toHaveClass('bg-white')
    expect(card).toHaveClass('p-6')
    expect(card).toHaveClass('rounded-lg')
  })

  it('should have proper text styling', () => {
    const { container } = render(<EmptyInventoryPlaceholder />)

    const mainText = container.querySelector('p:first-of-type')
    expect(mainText).toHaveClass('text-gray-600')
    expect(mainText).toHaveClass('text-center')
  })

  it('should have smaller text for help message', () => {
    const { container } = render(<EmptyInventoryPlaceholder />)

    const helpText = container.querySelector('p:last-of-type')
    expect(helpText).toHaveClass('text-sm')
    expect(helpText).toHaveClass('text-gray-500')
  })

  it('should render as a div element', () => {
    const { container } = render(<EmptyInventoryPlaceholder />)

    const div = container.querySelector('div')
    expect(div).toBeInTheDocument()
  })

  it('should have proper spacing between messages', () => {
    const { container } = render(<EmptyInventoryPlaceholder />)

    const helpText = container.querySelector('p:last-of-type')
    expect(helpText).toHaveClass('mt-2')
  })
})
