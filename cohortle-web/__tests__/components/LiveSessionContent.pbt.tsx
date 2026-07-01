/**
 * Property-Based Tests: LiveSessionContent Component
 * Feature: mvp-completion-gaps
 * 
 * Tests for live session status display calculation
 */

import fc from 'fast-check';
import { render } from '@testing-library/react';
import { LiveSessionContent } from '@/components/lessons/LiveSessionContent';
import { LiveSessionData, LiveSessionStatus } from '@/types/lesson';

describe('Feature: mvp-completion-gaps - LiveSessionContent', () => {
  /**
   * Property 11: Live Session Status Display
   * **Validates: Requirements 1.24**
   * 
   * For any live session lesson, the system should display the correct status
   * indicator (upcoming, live, completed) based on the current time and session
   * schedule.
   * 
   * This property verifies that:
   * 1. Sessions scheduled in the future show "Upcoming Session" status
   * 2. Sessions currently in progress show "Live Now" status
   * 3. Sessions that have ended show "Session Completed" status
   * 4. Status calculation respects session duration
   * 5. Explicit status values override calculated status
   * 6. Status indicators are visually distinct and correctly labeled
   */
  describe('Property 11: Live Session Status Display', () => {
    // Generator for safe text (no HTML-like characters)
    const safeTextArbitrary = fc.string({
      minLength: 5,
      maxLength: 100
    }).filter(s => !s.includes('<') && !s.includes('>') && s.trim().length > 0);

    // Generator for session duration (5 minutes to 4 hours)
    const durationArbitrary = fc.integer({ min: 5, max: 240 });

    // Generator for future dates (1 hour to 30 days from now)
    const futureDateArbitrary = fc.integer({ min: 1, max: 30 * 24 }).map(hours => {
      const date = new Date();
      date.setTime(date.getTime() + hours * 60 * 60 * 1000); // Add hours in milliseconds
      return date.toISOString();
    });

    // Generator for past dates (1 hour to 30 days ago, ensuring session has ended)
    const pastDateArbitrary = fc.integer({ min: 5, max: 30 * 24 }).map(hours => {
      const date = new Date();
      // Go back in time by the specified hours PLUS an additional 5 hours to ensure it's truly past
      date.setTime(date.getTime() - (hours + 5) * 60 * 60 * 1000);
      return date.toISOString();
    });

    // Generator for dates currently in progress (started 0-60 minutes ago, duration longer than elapsed time)
    const liveDateArbitrary = fc.record({
      minutesAgo: fc.integer({ min: 0, max: 60 }),
      duration: fc.integer({ min: 61, max: 240 })
    }).map(({ minutesAgo, duration }) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - minutesAgo);
      return {
        scheduled_date: date.toISOString(),
        duration
      };
    });

    // Generator for optional fields
    const optionalFieldsArbitrary = fc.record({
      join_url: fc.option(fc.webUrl(), { nil: undefined }),
      meeting_id: fc.option(fc.string({ minLength: 9, maxLength: 11 }), { nil: undefined }),
      passcode: fc.option(fc.string({ minLength: 6, maxLength: 10 }), { nil: undefined }),
      description: fc.option(safeTextArbitrary, { nil: undefined })
    });

    it('should display "Upcoming Session" for future sessions without explicit status', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          futureDateArbitrary,
          durationArbitrary,
          optionalFieldsArbitrary,
          (title, scheduled_date, duration, optionalFields) => {
            const sessionData: LiveSessionData = {
              scheduled_date,
              duration,
              ...optionalFields
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Verify "Upcoming Session" status is displayed
            expect(container.textContent).toContain('Upcoming Session');
            
            // Verify "Live Now" and "Session Completed" are NOT displayed
            expect(container.textContent).not.toContain('Live Now');
            expect(container.textContent).not.toContain('Session Completed');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display "Session Completed" for past sessions without explicit status', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          pastDateArbitrary,
          fc.integer({ min: 5, max: 120 }), // duration shorter than how far back we go
          optionalFieldsArbitrary,
          (title, scheduled_date, duration, optionalFields) => {
            const sessionData: LiveSessionData = {
              scheduled_date,
              duration,
              ...optionalFields
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Verify "Session Completed" status is displayed
            expect(container.textContent).toContain('Session Completed');
            
            // Verify "Upcoming Session" and "Live Now" are NOT displayed
            expect(container.textContent).not.toContain('Upcoming Session');
            expect(container.textContent).not.toContain('Live Now');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display "Live Now" for sessions currently in progress without explicit status', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          liveDateArbitrary,
          optionalFieldsArbitrary,
          (title, { scheduled_date, duration }, optionalFields) => {
            const sessionData: LiveSessionData = {
              scheduled_date,
              duration,
              ...optionalFields
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Verify "Live Now" status is displayed
            expect(container.textContent).toContain('Live Now');
            
            // Verify "Upcoming Session" and "Session Completed" are NOT displayed
            expect(container.textContent).not.toContain('Upcoming Session');
            expect(container.textContent).not.toContain('Session Completed');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should respect explicit status value when provided', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
          durationArbitrary,
          fc.constantFrom('upcoming' as LiveSessionStatus, 'live' as LiveSessionStatus, 'completed' as LiveSessionStatus),
          optionalFieldsArbitrary,
          (title, date, duration, explicitStatus, optionalFields) => {
            const sessionData: LiveSessionData = {
              scheduled_date: date.toISOString(),
              duration,
              status: explicitStatus,
              ...optionalFields
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Verify the explicit status is displayed regardless of date
            if (explicitStatus === 'upcoming') {
              expect(container.textContent).toContain('Upcoming Session');
            } else if (explicitStatus === 'live') {
              expect(container.textContent).toContain('Live Now');
            } else if (explicitStatus === 'completed') {
              expect(container.textContent).toContain('Session Completed');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should calculate status correctly based on session duration', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.integer({ min: 10, max: 120 }), // minutesAgo
          fc.integer({ min: 5, max: 240 }),   // duration
          optionalFieldsArbitrary,
          (title, minutesAgo, duration, optionalFields) => {
            const scheduledDate = new Date();
            scheduledDate.setMinutes(scheduledDate.getMinutes() - minutesAgo);

            const sessionData: LiveSessionData = {
              scheduled_date: scheduledDate.toISOString(),
              duration,
              ...optionalFields
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Calculate expected status with a small tolerance for timing
            const now = new Date();
            const sessionEnd = new Date(scheduledDate.getTime() + duration * 60000);
            
            // Add 1 minute tolerance for test execution time
            const nowWithTolerance = new Date(now.getTime() + 60000);
            
            if (nowWithTolerance < scheduledDate) {
              // Future session
              expect(container.textContent).toContain('Upcoming Session');
            } else if (now >= scheduledDate && now <= sessionEnd) {
              // Live session
              expect(container.textContent).toContain('Live Now');
            } else {
              // Completed session
              expect(container.textContent).toContain('Session Completed');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display join button only for upcoming and live sessions with join URL', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.constantFrom('upcoming' as LiveSessionStatus, 'live' as LiveSessionStatus, 'completed' as LiveSessionStatus),
          fc.webUrl(),
          durationArbitrary,
          (title, status, join_url, duration) => {
            const sessionData: LiveSessionData = {
              scheduled_date: new Date().toISOString(),
              duration,
              status,
              join_url
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            if (status === 'upcoming' || status === 'live') {
              // Join button should be present
              expect(container.textContent).toContain('Join');
            } else {
              // Join button should NOT be present for completed sessions
              expect(container.textContent).not.toContain('Join Live Session Now');
              expect(container.textContent).not.toContain('Join Session');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display calendar integration only for upcoming sessions', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.constantFrom('upcoming' as LiveSessionStatus, 'live' as LiveSessionStatus, 'completed' as LiveSessionStatus),
          futureDateArbitrary,
          durationArbitrary,
          (title, status, scheduled_date, duration) => {
            const sessionData: LiveSessionData = {
              scheduled_date,
              duration,
              status
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            if (status === 'upcoming') {
              // Calendar integration should be present
              expect(container.textContent).toContain('Add to Calendar');
              expect(container.textContent).toContain('Google Calendar');
              expect(container.textContent).toContain('Download .ics');
            } else {
              // Calendar integration should NOT be present
              expect(container.textContent).not.toContain('Add to Calendar');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display completed message only for completed sessions', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.constantFrom('upcoming' as LiveSessionStatus, 'live' as LiveSessionStatus, 'completed' as LiveSessionStatus),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
          durationArbitrary,
          (title, status, date, duration) => {
            const sessionData: LiveSessionData = {
              scheduled_date: date.toISOString(),
              duration,
              status
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            if (status === 'completed') {
              // Completed message should be present
              expect(container.textContent).toContain('This session has ended');
            } else {
              // Completed message should NOT be present
              expect(container.textContent).not.toContain('This session has ended');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display correct status indicator styling for each status', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.constantFrom('upcoming' as LiveSessionStatus, 'live' as LiveSessionStatus, 'completed' as LiveSessionStatus),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
          durationArbitrary,
          (title, status, date, duration) => {
            const sessionData: LiveSessionData = {
              scheduled_date: date.toISOString(),
              duration,
              status
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Verify status-specific styling classes are present
            if (status === 'upcoming') {
              const statusElement = container.querySelector('.bg-blue-50');
              expect(statusElement).toBeTruthy();
            } else if (status === 'live') {
              const statusElement = container.querySelector('.bg-red-50');
              expect(statusElement).toBeTruthy();
            } else if (status === 'completed') {
              const statusElement = container.querySelector('.bg-gray-50');
              expect(statusElement).toBeTruthy();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should always display session details regardless of status', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.constantFrom('upcoming' as LiveSessionStatus, 'live' as LiveSessionStatus, 'completed' as LiveSessionStatus),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
          durationArbitrary,
          (title, status, date, duration) => {
            const sessionData: LiveSessionData = {
              scheduled_date: date.toISOString(),
              duration,
              status
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Verify session details are always present
            expect(container.textContent).toContain('Session Details');
            expect(container.textContent).toContain('Date');
            expect(container.textContent).toContain('Time');
            expect(container.textContent).toContain('Duration');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle edge case: session ending exactly now', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.integer({ min: 30, max: 120 }), // duration
          (title, duration) => {
            // Create a session that started exactly 'duration' minutes ago
            const scheduledDate = new Date();
            scheduledDate.setMinutes(scheduledDate.getMinutes() - duration);

            const sessionData: LiveSessionData = {
              scheduled_date: scheduledDate.toISOString(),
              duration
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Should display either "Live Now" or "Session Completed"
            // (depending on exact timing, but should not crash)
            const hasLiveOrCompleted = 
              container.textContent?.includes('Live Now') || 
              container.textContent?.includes('Session Completed');
            
            expect(hasLiveOrCompleted).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle edge case: session starting exactly now', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.integer({ min: 30, max: 120 }), // duration
          (title, duration) => {
            // Create a session starting right now
            const scheduledDate = new Date();

            const sessionData: LiveSessionData = {
              scheduled_date: scheduledDate.toISOString(),
              duration
            };

            const { container } = render(
              <LiveSessionContent title={title} sessionData={sessionData} />
            );

            // Should display either "Upcoming Session" or "Live Now"
            // (depending on exact timing, but should not crash)
            const hasUpcomingOrLive = 
              container.textContent?.includes('Upcoming Session') || 
              container.textContent?.includes('Live Now');
            
            expect(hasUpcomingOrLive).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
