/**
 * StatisticsCard Component Tests
 */

import { render, screen } from '@testing-library/react'
import { StatisticsCard } from '../StatisticsCard'

// Mock the themes module
jest.mock('@/styles/themes', () => ({
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

describe('StatisticsCard Component', () => {
  it('should render with correct count', () => {
    render(<StatisticsCard count={5} label="緊急" status="red" />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render with correct label', () => {
    render(<StatisticsCard count={3} label="注意" status="yellow" />)

    expect(screen.getByText('注意')).toBeInTheDocument()
  })

  it('should render with red status styling', () => {
    const { container } = render(<StatisticsCard count={2} label="緊急" status="red" />)

    const card = container.querySelector('div')
    expect(card).toHaveClass('bg-red-100')
  })

  it('should render with yellow status styling', () => {
    const { container } = render(<StatisticsCard count={7} label="注意" status="yellow" />)

    const card = container.querySelector('div')
    expect(card).toHaveClass('bg-yellow-100')
  })

  it('should render with green status styling', () => {
    const { container } = render(<StatisticsCard count={15} label="安全" status="green" />)

    const card = container.querySelector('div')
    expect(card).toHaveClass('bg-green-100')
  })

  it('should handle zero count', () => {
    render(<StatisticsCard count={0} label="測試" status="red" />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should handle large numbers', () => {
    render(<StatisticsCard count={999} label="測試" status="green" />)

    expect(screen.getByText('999')).toBeInTheDocument()
  })

  it('should have rounded corners', () => {
    const { container } = render(<StatisticsCard count={5} label="測試" status="red" />)

    const card = container.querySelector('div')
    expect(card).toHaveClass('rounded-lg')
  })

  it('should have proper padding', () => {
    const { container } = render(<StatisticsCard count={5} label="測試" status="red" />)

    const card = container.querySelector('div')
    expect(card).toHaveClass('p-4')
  })
})
