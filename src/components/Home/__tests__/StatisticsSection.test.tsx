/**
 * StatisticsSection Component Tests
 */

import { render, screen } from '@testing-library/react'
import { StatisticsSection } from '../StatisticsSection'

// Mock the themes module
jest.mock('@/styles/themes', () => ({
  CARD_STYLES: {
    default: 'bg-white p-6 rounded-lg shadow',
  },
  SPACING: {
    grid3: 'grid grid-cols-3 gap-4',
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

// Mock StatisticsCard component
jest.mock('../StatisticsCard', () => ({
  StatisticsCard: ({ count, label, status }: { count: number; label: string; status: string }) => (
    <div data-testid={`card-${status}`} className={`card card-${status}`}>
      <div>{count}</div>
      <div>{label}</div>
    </div>
  ),
}))

describe('StatisticsSection Component', () => {
  it('should render with default values (0)', () => {
    render(<StatisticsSection />)

    expect(screen.getByText('快速統計')).toBeInTheDocument()
  })

  it('should render three statistics cards', () => {
    render(<StatisticsSection redCount={2} yellowCount={5} greenCount={10} />)

    expect(screen.getByTestId('card-red')).toBeInTheDocument()
    expect(screen.getByTestId('card-yellow')).toBeInTheDocument()
    expect(screen.getByTestId('card-green')).toBeInTheDocument()
  })

  it('should pass correct counts to cards', () => {
    render(<StatisticsSection redCount={3} yellowCount={7} greenCount={15} />)

    const redCard = screen.getByTestId('card-red')
    const yellowCard = screen.getByTestId('card-yellow')
    const greenCard = screen.getByTestId('card-green')

    expect(redCard).toHaveTextContent('3')
    expect(yellowCard).toHaveTextContent('7')
    expect(greenCard).toHaveTextContent('15')
  })

  it('should pass correct labels to cards', () => {
    render(<StatisticsSection />)

    expect(screen.getByText('緊急')).toBeInTheDocument()
    expect(screen.getByText('注意')).toBeInTheDocument()
    expect(screen.getByText('安全')).toBeInTheDocument()
  })

  it('should render title with correct styling', () => {
    render(<StatisticsSection />)

    const title = screen.getByText('快速統計')
    expect(title).toHaveClass('text-xl')
    expect(title).toHaveClass('font-semibold')
  })

  it('should have grid layout for cards', () => {
    const { container } = render(<StatisticsSection />)

    const gridContainer = container.querySelector('div[class*="grid"]')
    expect(gridContainer).toBeInTheDocument()
  })

  it('should handle undefined count props gracefully', () => {
    render(<StatisticsSection />)

    expect(screen.getByTestId('card-red')).toBeInTheDocument()
    expect(screen.getByTestId('card-yellow')).toBeInTheDocument()
    expect(screen.getByTestId('card-green')).toBeInTheDocument()
  })

  it('should render zero counts correctly', () => {
    render(<StatisticsSection redCount={0} yellowCount={0} greenCount={0} />)

    const redCard = screen.getByTestId('card-red')
    expect(redCard).toHaveTextContent('0')
  })

  it('should render large numbers', () => {
    render(<StatisticsSection redCount={100} yellowCount={200} greenCount={300} />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })
})
