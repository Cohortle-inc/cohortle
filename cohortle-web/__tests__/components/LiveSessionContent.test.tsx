import { render, screen, fireEvent } from '@testing-library/react';
import { LiveSessionContent } from '@/components/lessons/LiveSessionContent';
import { LiveSessionData } from '@/types/lesson';

describe('LiveSessionContent', () => {
  const mockTitle = 'Introduction to React Hooks';

  const createSessionData = (overrides?: Partial<LiveSessionData>): LiveSessionData => ({
    scheduled_date: '2024-06-15T14:30:00Z',
    duration: 90,
    join_url: 'https://zoom.us/j/123456789',
    meeting_id: '123 456 789',
    passcode: 'abc123',
    description: 'Learn about React Hooks in this interactive session',
    ...overrides
  });

  beforeEach(() => {
    // Mock window.open
    global.open = jest.fn();
    
    // Mock URL.createObjectURL and revokeObjectURL for ICS download tests
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the lesson title', () => {
      const sessionData = createSessionData();
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText(mockTitle)).toBeInTheDocument();
    });

    it('should display session details', () => {
      const sessionData = createSessionData();
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Session Details')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });

    it('should display meeting ID when provided', () => {
      const sessionData = createSessionData({ meeting_id: '123 456 789' });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Meeting ID')).toBeInTheDocument();
      expect(screen.getByText('123 456 789')).toBeInTheDocument();
    });

    it('should display passcode when provided', () => {
      const sessionData = createSessionData({ passcode: 'abc123' });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Passcode')).toBeInTheDocument();
      expect(screen.getByText('abc123')).toBeInTheDocument();
    });

    it('should display description when provided', () => {
      const sessionData = createSessionData({ 
        description: 'Learn about React Hooks in this interactive session' 
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Learn about React Hooks in this interactive session')).toBeInTheDocument();
    });

    it('should not display meeting ID when not provided', () => {
      const sessionData = createSessionData({ meeting_id: undefined });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('Meeting ID')).not.toBeInTheDocument();
    });

    it('should not display passcode when not provided', () => {
      const sessionData = createSessionData({ passcode: undefined });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('Passcode')).not.toBeInTheDocument();
    });

    it('should not display description when not provided', () => {
      const sessionData = createSessionData({ description: undefined });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });

  describe('Session Status Display', () => {
    it('should display "Upcoming Session" for future sessions', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: 'upcoming'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Upcoming Session')).toBeInTheDocument();
    });

    it('should display "Live Now" for ongoing sessions', () => {
      const sessionData = createSessionData({ status: 'live' });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Live Now')).toBeInTheDocument();
    });

    it('should display "Session Completed" for past sessions', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: pastDate.toISOString(),
        status: 'completed'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Session Completed')).toBeInTheDocument();
    });

    it('should calculate status as upcoming when no explicit status provided and date is in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: undefined
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Upcoming Session')).toBeInTheDocument();
    });

    it('should calculate status as completed when no explicit status provided and date is in past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: pastDate.toISOString(),
        duration: 60,
        status: undefined
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Session Completed')).toBeInTheDocument();
    });
  });

  describe('Join Button', () => {
    it('should display join button for upcoming sessions with join URL', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: 'upcoming',
        join_url: 'https://zoom.us/j/123456789'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      const joinButton = screen.getByText('Join Session');
      expect(joinButton).toBeInTheDocument();
      expect(joinButton).toHaveAttribute('href', 'https://zoom.us/j/123456789');
      expect(joinButton).toHaveAttribute('target', '_blank');
      expect(joinButton).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display "Join Live Session Now" for live sessions', () => {
      const sessionData = createSessionData({ 
        status: 'live',
        join_url: 'https://zoom.us/j/123456789'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText(/Join Live Session Now/)).toBeInTheDocument();
    });

    it('should not display join button for completed sessions', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: pastDate.toISOString(),
        status: 'completed',
        join_url: 'https://zoom.us/j/123456789'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('Join Session')).not.toBeInTheDocument();
      expect(screen.queryByText(/Join Live Session Now/)).not.toBeInTheDocument();
    });

    it('should not display join button when join URL is not provided', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: 'upcoming',
        join_url: undefined
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('Join Session')).not.toBeInTheDocument();
    });
  });

  describe('Calendar Integration', () => {
    it('should display calendar integration options for upcoming sessions', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: 'upcoming'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('Add to Calendar')).toBeInTheDocument();
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('Download .ics')).toBeInTheDocument();
    });

    it('should not display calendar integration for live sessions', () => {
      const sessionData = createSessionData({ status: 'live' });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('Add to Calendar')).not.toBeInTheDocument();
    });

    it('should not display calendar integration for completed sessions', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: pastDate.toISOString(),
        status: 'completed'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('Add to Calendar')).not.toBeInTheDocument();
    });

    it('should open Google Calendar when clicking Google Calendar button', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: 'upcoming'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      const googleCalendarButton = screen.getByText('Google Calendar');
      fireEvent.click(googleCalendarButton);
      
      expect(global.open).toHaveBeenCalledWith(
        expect.stringContaining('https://calendar.google.com/calendar/render'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should trigger ICS download when clicking Download .ics button', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: 'upcoming'
      });
      
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      // Mock document.createElement and related methods after render
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn()
      };
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      
      const downloadButton = screen.getByText('Download .ics');
      fireEvent.click(downloadButton);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Completed Session Message', () => {
    it('should display completed session message for past sessions', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: pastDate.toISOString(),
        status: 'completed'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('This session has ended')).toBeInTheDocument();
      expect(screen.getByText(/Check with your instructor for any recordings/)).toBeInTheDocument();
    });

    it('should not display completed message for upcoming sessions', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const sessionData = createSessionData({ 
        scheduled_date: futureDate.toISOString(),
        status: 'upcoming'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.queryByText('This session has ended')).not.toBeInTheDocument();
    });
  });

  describe('Duration Formatting', () => {
    it('should format duration with hours and minutes', () => {
      const sessionData = createSessionData({ duration: 90 });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    it('should format duration with only hours', () => {
      const sessionData = createSessionData({ duration: 120 });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('2h')).toBeInTheDocument();
    });

    it('should format duration with only minutes', () => {
      const sessionData = createSessionData({ duration: 45 });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(screen.getByText('45m')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper data-testid attribute', () => {
      const sessionData = createSessionData();
      const { container } = render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      expect(container.querySelector('[data-testid="live-session-lesson"]')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const sessionData = createSessionData();
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent(mockTitle);
    });

    it('should have proper link attributes for external join URL', () => {
      const sessionData = createSessionData({ 
        status: 'upcoming',
        join_url: 'https://zoom.us/j/123456789'
      });
      render(<LiveSessionContent title={mockTitle} sessionData={sessionData} />);
      
      const joinLink = screen.getByText('Join Session');
      expect(joinLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(joinLink).toHaveAttribute('target', '_blank');
    });
  });
});
