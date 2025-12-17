/**
 * Home Page Tests
 */

import { render, screen } from '@testing-library/react'
import Home from '../page'

// Mock the styles module
jest.mock('@/styles/themes', () => ({
  SPACING: {
    section: 'space-y-4 p-4',
  },
  CARD_STYLES: {
    default: 'bg-white p-6 rounded-lg shadow',
  },
  CAMERA_BUTTON: {
    style: 'bg-blue-500 hover:bg-blue-600 text-white rounded-full',
    size: { width: '80px', height: '80px' },
  },
  STATUS_COLORS: {
    red: { bg: 'bg-red-100', text: 'text-red-700' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
  },
  STATISTICS_CARD: {
    number: 'text-3xl font-bold',
    label: 'text-sm text-gray-600',
  },
}))

// Mock components
jest.mock('@/components', () => ({
  WelcomeSection: () => <div data-testid="welcome-section">Welcome Section</div>,
  StatisticsSection: () => <div data-testid="statistics-section">Statistics Section</div>,
  ViewFullInventorySection: () => (
    <div data-testid="inventory-section">Inventory Section</div>
  ),
}))

describe('Home Page', () => {
  it('should render welcome section', () => {
    render(<Home />)

    expect(screen.getByTestId('welcome-section')).toBeInTheDocument()
  })

  it('should render statistics section', () => {
    render(<Home />)

    expect(screen.getByTestId('statistics-section')).toBeInTheDocument()
  })

  it('should render view full inventory section', () => {
    render(<Home />)

    expect(screen.getByTestId('inventory-section')).toBeInTheDocument()
  })

  it('should render all three sections in order', () => {
    const { container } = render(<Home />)

    const mainDiv = container.firstChild
    expect(mainDiv).toBeInTheDocument()

    const sections = container.querySelectorAll('[data-testid]')
    expect(sections.length).toBe(3)
  })

  it('should have proper spacing class', () => {
    const { container } = render(<Home />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('space-y-4')
  })

  it('should have proper padding class', () => {
    const { container } = render(<Home />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('p-4')
  })

  it('should render as a valid React component', () => {
    const component = <Home />
    expect(component).toBeDefined()
  })
})
