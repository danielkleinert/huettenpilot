import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { CalendarLegend } from './CalendarLegend'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'calendar.legend.available': 'Good availability',
        'calendar.legend.limited': 'Limited availability',
        'calendar.legend.noAvailability': 'No availability'
      }
      return translations[key] || key
    }
  })
}))

describe('CalendarLegend', () => {
  describe('Basic rendering', () => {
    it('renders all legend items', () => {
      render(<CalendarLegend />)
      
      expect(screen.getByText('Good availability')).toBeInTheDocument()
      expect(screen.getByText('Limited availability')).toBeInTheDocument()
      expect(screen.getByText('No availability')).toBeInTheDocument()
    })

    it('renders colored indicators for each status', () => {
      render(<CalendarLegend />)
      
      const indicators = screen.getAllByText('●')
      expect(indicators).toHaveLength(3)
    })

    it('has correct layout classes', () => {
      const { container } = render(<CalendarLegend />)
      
      const legendContainer = container.firstChild
      expect(legendContainer).toHaveClass(
        'flex',
        'flex-col',
        'lg:flex-row',
        'lg:items-center',
        'gap-4',
        'text-sm'
      )
    })
  })

  describe('Color indicators', () => {
    it('displays good availability indicator with correct color', () => {
      render(<CalendarLegend />)
      
      const goodAvailabilityItem = screen.getByText('Good availability').closest('div')
      const indicator = goodAvailabilityItem?.querySelector('span')
      
      expect(indicator).toHaveClass('text-green-700', 'dark:text-green-400')
    })

    it('displays limited availability indicator with correct color', () => {
      render(<CalendarLegend />)
      
      const limitedAvailabilityItem = screen.getByText('Limited availability').closest('div')
      const indicator = limitedAvailabilityItem?.querySelector('span')
      
      expect(indicator).toHaveClass('text-orange-600', 'dark:text-orange-400')
    })

    it('displays no availability indicator with correct color', () => {
      render(<CalendarLegend />)
      
      const noAvailabilityItem = screen.getByText('No availability').closest('div')
      const indicator = noAvailabilityItem?.querySelector('span')
      
      expect(indicator).toHaveClass('text-card-foreground')
    })
  })

  describe('Item structure', () => {
    it('renders each legend item with correct structure', () => {
      render(<CalendarLegend />)
      
      const goodAvailabilityItem = screen.getByText('Good availability').closest('div')
      expect(goodAvailabilityItem).toHaveClass('flex', 'items-center', 'gap-2')
      
      const limitedAvailabilityItem = screen.getByText('Limited availability').closest('div')
      expect(limitedAvailabilityItem).toHaveClass('flex', 'items-center', 'gap-2')
      
      const noAvailabilityItem = screen.getByText('No availability').closest('div')
      expect(noAvailabilityItem).toHaveClass('flex', 'items-center', 'gap-2')
    })

    it('renders indicators before text labels', () => {
      render(<CalendarLegend />)
      
      const goodAvailabilityItem = screen.getByText('Good availability').closest('div')
      const children = Array.from(goodAvailabilityItem?.children || [])
      
      expect(children[0]).toHaveTextContent('●')
      expect(children[1]).toHaveTextContent('Good availability')
    })
  })

  describe('Responsive design', () => {
    it('has responsive flex direction classes', () => {
      const { container } = render(<CalendarLegend />)
      
      const legendContainer = container.firstChild
      expect(legendContainer).toHaveClass('flex-col', 'lg:flex-row')
    })

    it('has responsive alignment classes', () => {
      const { container } = render(<CalendarLegend />)
      
      const legendContainer = container.firstChild
      expect(legendContainer).toHaveClass('lg:items-center')
    })
  })

  describe('Accessibility', () => {
    it('provides meaningful text for screen readers', () => {
      render(<CalendarLegend />)
      
      expect(screen.getByText('Good availability')).toBeInTheDocument()
      expect(screen.getByText('Limited availability')).toBeInTheDocument()
      expect(screen.getByText('No availability')).toBeInTheDocument()
    })

    it('uses semantic HTML structure', () => {
      const { container } = render(<CalendarLegend />)
      
      const items = container.querySelectorAll('.flex.items-center.gap-2')
      expect(items).toHaveLength(3)
      
      items.forEach(item => {
        expect(item).toHaveClass('flex', 'items-center', 'gap-2')
      })
    })
  })

  describe('Integration with availability system', () => {
    it('uses consistent colors with availability utility functions', () => {
      render(<CalendarLegend />)
      
      // The component should use the same color classes as defined in the availability utility
      const goodIndicator = screen.getByText('Good availability').previousElementSibling
      const limitedIndicator = screen.getByText('Limited availability').previousElementSibling
      const noneIndicator = screen.getByText('No availability').previousElementSibling
      
      expect(goodIndicator).toHaveClass('text-green-700')
      expect(limitedIndicator).toHaveClass('text-orange-600')
      expect(noneIndicator).toHaveClass('text-card-foreground')
    })
  })
})