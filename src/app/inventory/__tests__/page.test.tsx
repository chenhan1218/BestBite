/**
 * Inventory Page Tests
 */

import { render, screen } from '@testing-library/react'
import InventoryPage from '../page'

jest.mock('@/components', () => ({
  EmptyInventoryPlaceholder: () => (
    <div data-testid="empty-placeholder">Empty Inventory</div>
  ),
  BackToHomeLink: () => (
    <a href="/" data-testid="back-link">
      ← 返回首頁
    </a>
  ),
}))

describe('Inventory Page', () => {
  it('should render page title', () => {
    render(<InventoryPage />)

    expect(screen.getByText('食品庫存')).toBeInTheDocument()
  })

  it('should render back to home link', () => {
    render(<InventoryPage />)

    expect(screen.getByTestId('back-link')).toBeInTheDocument()
  })

  it('should render empty inventory placeholder', () => {
    render(<InventoryPage />)

    expect(screen.getByTestId('empty-placeholder')).toBeInTheDocument()
  })

  it('should have title with correct styling', () => {
    render(<InventoryPage />)

    const title = screen.getByText('食品庫存')
    expect(title).toHaveClass('text-2xl')
    expect(title).toHaveClass('font-bold')
  })

  it('should render header with flex layout', () => {
    const { container } = render(<InventoryPage />)

    const header = container.querySelector('div[class*="flex"]')
    expect(header).toHaveClass('flex')
    expect(header).toHaveClass('justify-between')
    expect(header).toHaveClass('items-center')
  })

  it('should render container with spacing', () => {
    const { container } = render(<InventoryPage />)

    const mainDiv = container.firstChild
    expect(mainDiv).toHaveClass('space-y-4')
  })

  it('should render header and content sections', () => {
    const { container } = render(<InventoryPage />)

    const divs = container.querySelectorAll('div')
    expect(divs.length).toBeGreaterThanOrEqual(2)
  })
})
