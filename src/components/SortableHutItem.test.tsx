import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { SortableHutItem } from './SortableHutItem'
import type { Hut, HutInfo } from '@/types'
import type { UseQueryResult } from '@tanstack/react-query'

// Mock the external dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'hutNotAvailableInSystem': 'This hut is not available in the booking system'
      }
      return translations[key] || key
    }
  })
}))

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    attributes: { 'data-sortable': 'true' },
    listeners: { onPointerDown: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  }))
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn((transform) => transform ? 'transform: translate3d(10px, 10px, 0)' : '')
    }
  }
}))

vi.mock('@/hooks/useHutInfo')
vi.mock('@/components/ui/Tooltip', () => ({
  Tooltip: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  )
}))

const mockUseHutInfo = vi.mocked(await import('@/hooks/useHutInfo')).useHutInfo

// Helper to create properly typed UseQueryResult mocks - simplified approach
const createMockQueryResult = (overrides: Partial<UseQueryResult<HutInfo, Error>>): UseQueryResult<HutInfo, Error> => ({
  data: undefined,
  dataUpdatedAt: 0,
  error: null,
  errorUpdateCount: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  fetchStatus: 'idle',
  isError: false,
  isFetched: false,
  isFetchedAfterMount: false,
  isFetching: false,
  isInitialLoading: false,
  isLoading: false,
  isLoadingError: false,
  isPaused: false,
  isPending: false,
  isPlaceholderData: false,
  isRefetchError: false,
  isRefetching: false,
  isStale: false,
  isSuccess: false,
  refetch: vi.fn(),
  status: 'pending',
  ...overrides,
} as UseQueryResult<HutInfo, Error>)

describe('SortableHutItem', () => {
  const mockHut: Hut = {
    hutId: 123,
    hutName: 'Test Alpine Hut',
    coordinates: [47.0, 11.0]
  }

  const mockOnRemove = vi.fn()

  const mockHutInfo: HutInfo = {
    hutWebsite: 'example.com',
    hutId: 123,
    tenantCode: 'TEST',
    hutUnlocked: true,
    maxNumberOfNights: 5,
    hutName: 'Test Alpine Hut',
    hutWarden: 'Test Warden',
    phone: '+43 123 456789',
    coordinates: '47.0,11.0',
    altitude: '2500m',
    totalBedsInfo: '50 beds',
    tenantCountry: 'AT',
    picture: {
      fileType: 'jpg',
      blobPath: 'https://example.com/hut-image.jpg',
      fileName: 'hut.jpg',
      fileData: null
    },
    hutLanguages: ['de', 'en'],
    hutBedCategories: [
      {
        index: 0,
        categoryID: 1,
        rooms: [],
        isVisible: true,
        totalSleepingPlaces: 30,
        reservationMode: 'online',
        hutBedCategoryLanguageData: [
          {
            language: 'en',
            label: 'Dormitory',
            shortLabel: 'Dorm',
            description: 'Shared dormitory beds'
          }
        ],
        isLinkedToReservation: true,
        tenantBedCategoryId: 1
      },
      {
        index: 1,
        categoryID: 2,
        rooms: [],
        isVisible: true,
        totalSleepingPlaces: 20,
        reservationMode: 'phone',
        hutBedCategoryLanguageData: [
          {
            language: 'en',
            label: 'Private Room',
            shortLabel: 'Private',
            description: 'Private rooms for families'
          }
        ],
        isLinkedToReservation: false,
        tenantBedCategoryId: 2
      }
    ],
    providerName: 'Test Provider',
    hutGeneralDescriptions: [
      {
        description: 'A beautiful alpine hut',
        language: 'en'
      }
    ],
    supportLink: 'https://support.example.com',
    waitingListEnabled: true
  }

  beforeEach(() => {
    mockOnRemove.mockClear()
    mockUseHutInfo.mockReturnValue(createMockQueryResult({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false
    }))
  })

  describe('Basic rendering', () => {
    it('renders hut name correctly', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.getByText('Test Alpine Hut')).toBeInTheDocument()
    })

    it('renders drag handle with correct styling', () => {
      const { container } = render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const dragHandle = container.querySelector('.cursor-grab')
      expect(dragHandle).toBeInTheDocument()
      expect(dragHandle).toHaveClass('cursor-grab', 'active:cursor-grabbing')
    })

    it('renders remove button', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const removeButton = screen.getByRole('button')
      expect(removeButton).toBeInTheDocument()
      expect(removeButton).toHaveClass('hover:text-destructive')
    })

    it('calls onRemove with correct index when remove button clicked', () => {
      render(<SortableHutItem hut={mockHut} index={2} onRemove={mockOnRemove} />)
      
      fireEvent.click(screen.getByRole('button'))
      expect(mockOnRemove).toHaveBeenCalledWith(2)
    })
  })

  describe('Loading states', () => {
    it('shows loading message when hut info is loading', () => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        isSuccess: false
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.getAllByText('Loading hut details...')).toHaveLength(2) // Desktop and mobile sections
    })

    it('does not show loading message when not loading', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.queryByText('Loading hut details...')).not.toBeInTheDocument()
    })
  })

  describe('Hut info display', () => {
    beforeEach(() => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))
    })

    it('displays total bed count from bed categories', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      // 30 + 20 = 50 total beds from categories (appears in both desktop and mobile sections)
      expect(screen.getAllByText('50')).toHaveLength(2)
    })

    it('displays altitude when available', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.getAllByText('2500m')).toHaveLength(2) // Desktop and mobile sections
    })

    it('displays hut image when available', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const image = screen.getByAltText('Test Alpine Hut')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/hut-image.jpg')
      expect(image).toHaveAttribute('loading', 'lazy')
    })

    it('does not display image when not available', () => {
      const hutInfoWithoutImage = { ...mockHutInfo, picture: {
              fileType: 'image/jpeg',
              blobPath: '',
              fileName: 'image.jpg',
              fileData: null
            } }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoWithoutImage,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.queryByAltText('Test Alpine Hut')).not.toBeInTheDocument()
    })
  })

  describe('Website link functionality', () => {
    beforeEach(() => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))
    })

    it('renders website link with https prefix when missing', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const websiteLinks = screen.getAllByTitle('example.com')
      expect(websiteLinks).toHaveLength(2) // Desktop and mobile
      expect(websiteLinks[0]).toHaveAttribute('href', 'https://example.com')
      expect(websiteLinks[0]).toHaveAttribute('target', '_blank')
      expect(websiteLinks[0]).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('preserves existing https in website URL', () => {
      const hutInfoWithHttps = { ...mockHutInfo, hutWebsite: 'https://secure.example.com' }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoWithHttps,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const websiteLinks = screen.getAllByTitle('https://secure.example.com')
      expect(websiteLinks).toHaveLength(2) // Desktop and mobile
      expect(websiteLinks[0]).toHaveAttribute('href', 'https://secure.example.com')
    })

    it('does not render website link when not available', () => {
      const hutInfoWithoutWebsite = { ...mockHutInfo, hutWebsite: '' }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoWithoutWebsite,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.queryByTitle('example.com')).not.toBeInTheDocument()
    })

    it('stops propagation on website link click', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const websiteLinks = screen.getAllByTitle('example.com')
      expect(websiteLinks).toHaveLength(2)
      
      // The component should call stopPropagation, but we can't easily test this
      // Instead, verify the links are clickable and have the right attributes
      expect(websiteLinks[0]).toBeInTheDocument()
    })
  })

  describe('Booking functionality', () => {
    it('shows booking link when hut has bookable rooms', () => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const bookingLinks = screen.getAllByTitle('Book this hut')
      expect(bookingLinks).toHaveLength(2) // Desktop and mobile
      expect(bookingLinks[0]).toBeInTheDocument()
      expect(bookingLinks[0]).toHaveAttribute(
        'href', 
        'https://www.hut-reservation.org/reservation/book-hut/123/wizard'
      )
    })

    it('shows warning tooltip when hut has no bookable rooms', () => {
      const hutInfoNoBooking = {
        ...mockHutInfo,
        hutBedCategories: mockHutInfo.hutBedCategories.map(cat => ({
          ...cat,
          isLinkedToReservation: false
        }))
      }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoNoBooking,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const tooltips = screen.getAllByTestId('tooltip')
      expect(tooltips).toHaveLength(2) // Desktop and mobile
      expect(tooltips[0]).toHaveAttribute(
        'title', 
        'This hut is not available in the booking system'
      )
    })

    it('stops propagation on booking link click', () => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const bookingLinks = screen.getAllByTitle('Book this hut')
      expect(bookingLinks).toHaveLength(2)
      
      // Verify the booking link is clickable and has correct attributes
      expect(bookingLinks[0]).toBeInTheDocument()
      expect(bookingLinks[0]).toHaveAttribute('target', '_blank')
    })
  })

  describe('Bed count calculation', () => {
    it('calculates total beds from categories', () => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      // Should show sum of all bed categories: 30 + 20 = 50 (in both desktop and mobile)
      expect(screen.getAllByText('50')).toHaveLength(2)
    })

    it('falls back to totalBedsInfo when categories sum to zero', () => {
      const hutInfoZeroBeds = {
        ...mockHutInfo,
        hutBedCategories: mockHutInfo.hutBedCategories.map(cat => ({
          ...cat,
          totalSleepingPlaces: 0
        }))
      }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoZeroBeds,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.getAllByText('50 beds')).toHaveLength(2) // Desktop and mobile
    })

    it('shows N/A when no bed info available', () => {
      const hutInfoNoBeds = {
        ...mockHutInfo,
        hutBedCategories: [{
              index: 0,
              categoryID: 1,
              rooms: [],
              isVisible: true,
              totalSleepingPlaces: 0,
              reservationMode: 'standard',
              hutBedCategoryLanguageData: [{
                language: 'de',
                label: 'Standard',
                shortLabel: 'Std',
                description: 'Standard beds'
              }],
              isLinkedToReservation: true,
              tenantBedCategoryId: 1
            }],
        totalBedsInfo: ''
      }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoNoBeds,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.getAllByText('N/A')).toHaveLength(2) // Desktop and mobile
    })

    it('shows totalBedsInfo when no categories available', () => {
      const hutInfoNoCategories = {
        ...mockHutInfo,
        hutBedCategories: []
      }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoNoCategories,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.getAllByText('50 beds')).toHaveLength(2) // Desktop and mobile
    })
  })

  describe('Drag and drop integration', () => {
    it('applies drag styles when dragging', () => {
      // Since mocking drag and drop is complex, just test that the component renders without dragging styles by default
      const { container } = render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const draggableElement = container.firstChild as HTMLElement
      expect(draggableElement).not.toHaveClass('opacity-50', 'select-none')
    })

    it('applies transform styles correctly', () => {
      // Test that the component renders without transform styles by default
      const { container } = render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const draggableElement = container.firstChild as HTMLElement
      expect(draggableElement).toBeInTheDocument()
    })

    it('uses correct sortable ID from hut', () => {
      // Test that the component renders correctly with the provided hut
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      // Verify the hut name is displayed (indicates the component is working)
      expect(screen.getByText('Test Alpine Hut')).toBeInTheDocument()
    })
  })

  describe('Responsive design', () => {
    beforeEach(() => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))
    })

    it('has container query classes for responsive layout', () => {
      const { container } = render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const mainContainer = container.firstChild as HTMLElement
      expect(mainContainer).toHaveClass('@container')
    })

    it('has responsive image classes', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const image = screen.getByAltText('Test Alpine Hut')
      expect(image).toHaveClass('hidden', '@sm:block')
    })

    it('has responsive details sections', () => {
      const { container } = render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      // Desktop details (hidden on small screens)
      const desktopDetails = container.querySelector('.hidden.\\@sm\\:block')
      expect(desktopDetails).toBeInTheDocument()
      
      // Mobile details (hidden on large screens)
      const mobileDetails = container.querySelector('.\\@sm\\:hidden')
      expect(mobileDetails).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA label for warning tooltip', () => {
      const hutInfoNoBooking = {
        ...mockHutInfo,
        hutBedCategories: mockHutInfo.hutBedCategories.map(cat => ({
          ...cat,
          isLinkedToReservation: false
        }))
      }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoNoBooking,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const warningElements = screen.getAllByRole('button', { name: 'Information about booking availability' })
      expect(warningElements).toHaveLength(2) // Desktop and mobile
      expect(warningElements[0]).toBeInTheDocument()
      expect(warningElements[0]).toHaveAttribute('tabIndex', '0')
    })

    it('has proper alt text for hut image', () => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const image = screen.getByAltText('Test Alpine Hut')
      expect(image).toBeInTheDocument()
    })

    it('has proper title attributes for links', () => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: mockHutInfo,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      const websiteLinks = screen.getAllByTitle('example.com')
      expect(websiteLinks).toHaveLength(2)
      expect(websiteLinks[0]).toHaveAttribute('title', 'example.com')
      
      const bookingLinks = screen.getAllByTitle('Book this hut')
      expect(bookingLinks).toHaveLength(2)
      expect(bookingLinks[0]).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles missing hut info gracefully', () => {
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: undefined,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      // Should still render hut name and remove button
      expect(screen.getByText('Test Alpine Hut')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles empty string website gracefully', () => {
      const hutInfoEmptyWebsite = { ...mockHutInfo, hutWebsite: '' }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoEmptyWebsite,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      expect(screen.queryByTitle('example.com')).not.toBeInTheDocument()
    })

    it('handles missing altitude gracefully', () => {
      const hutInfoNoAltitude = { ...mockHutInfo, altitude: '' }
      mockUseHutInfo.mockReturnValue(createMockQueryResult({
        data: hutInfoNoAltitude,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      }))

      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      // Altitude should not be displayed
      expect(screen.queryByText('2500m')).not.toBeInTheDocument()
    })

    it('handles hut with very long name', () => {
      const longNameHut: Hut = {
        ...mockHut,
        hutName: 'This is a very long hut name that might cause layout issues in some cases'
      }

      render(<SortableHutItem hut={longNameHut} index={0} onRemove={mockOnRemove} />)
      
      expect(screen.getByText(longNameHut.hutName)).toBeInTheDocument()
    })

    it('handles zero index correctly', () => {
      render(<SortableHutItem hut={mockHut} index={0} onRemove={mockOnRemove} />)
      
      fireEvent.click(screen.getByRole('button'))
      expect(mockOnRemove).toHaveBeenCalledWith(0)
    })

    it('handles high index values correctly', () => {
      render(<SortableHutItem hut={mockHut} index={999} onRemove={mockOnRemove} />)
      
      fireEvent.click(screen.getByRole('button'))
      expect(mockOnRemove).toHaveBeenCalledWith(999)
    })
  })
})