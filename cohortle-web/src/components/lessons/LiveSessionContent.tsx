'use client';

import { useMemo } from 'react';
import { LiveSessionData, LiveSessionStatus } from '@/types/lesson';

interface LiveSessionContentProps {
  title: string;
  sessionData: LiveSessionData;
}

export function LiveSessionContent({ title, sessionData }: LiveSessionContentProps) {
  // Calculate session status based on current time and scheduled date
  const sessionStatus: LiveSessionStatus = useMemo(() => {
    if (sessionData.status) {
      return sessionData.status;
    }

    if (!sessionData.scheduled_date) {
      return 'upcoming';
    }

    const now = new Date();
    const scheduledDate = new Date(sessionData.scheduled_date);

    if (isNaN(scheduledDate.getTime())) {
      return 'upcoming';
    }

    const sessionEndTime = new Date(scheduledDate.getTime() + sessionData.duration * 60000);

    if (now < scheduledDate) {
      return 'upcoming';
    } else if (now >= scheduledDate && now <= sessionEndTime) {
      return 'live';
    } else {
      return 'completed';
    }
  }, [sessionData.scheduled_date, sessionData.duration, sessionData.status]);

  // Format date and time with timezone
  const formattedDateTime = useMemo(() => {
    if (!sessionData.scheduled_date) {
      return { dateString: 'Date not set', timeString: 'Time not set', fullDate: null };
    }
    const date = new Date(sessionData.scheduled_date);
    if (isNaN(date.getTime())) {
      return { dateString: 'Date not set', timeString: 'Time not set', fullDate: null };
    }
    
    // Format date: "Monday, January 15, 2024"
    const dateString = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format time: "2:30 PM EST"
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return { dateString, timeString, fullDate: date };
  }, [sessionData.scheduled_date]);

  // Format duration
  const formattedDuration = useMemo(() => {
    const hours = Math.floor(sessionData.duration / 60);
    const minutes = sessionData.duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }, [sessionData.duration]);

  // Generate calendar event data
  const handleAddToCalendar = () => {
    if (!sessionData.scheduled_date) return;
    const startDate = new Date(sessionData.scheduled_date);
    if (isNaN(startDate.getTime())) return;
    const endDate = new Date(startDate.getTime() + sessionData.duration * 60000);
    
    // Format dates for calendar (YYYYMMDDTHHMMSSZ)
    const formatCalendarDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const calendarData = {
      title: title,
      start: formatCalendarDate(startDate),
      end: formatCalendarDate(endDate),
      description: sessionData.description || '',
      location: sessionData.join_url || ''
    };

    // Create Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.title)}&dates=${calendarData.start}/${calendarData.end}&details=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}`;
    
    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
  };

  // Download ICS file for other calendar apps
  const handleDownloadICS = () => {
    const startDate = new Date(sessionData.scheduled_date);
    const endDate = new Date(startDate.getTime() + sessionData.duration * 60000);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cohortle//Live Session//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${sessionData.description || ''}`,
      `LOCATION:${sessionData.join_url || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Status indicator configuration
  const statusConfig = {
    upcoming: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      label: 'Upcoming Session',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    live: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      label: 'Live Now',
      icon: (
        <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
    },
    completed: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-500',
      textColor: 'text-gray-800',
      iconColor: 'text-gray-600',
      label: 'Session Completed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const currentStatus = statusConfig[sessionStatus];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" data-testid="live-session-lesson">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
        {title}
      </h1>

      {/* Status Indicator */}
      <div className={`mb-8 p-6 rounded-lg border-2 ${currentStatus.bgColor} ${currentStatus.borderColor}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className={currentStatus.iconColor}>
            {currentStatus.icon}
          </div>
          <h2 className={`text-xl font-semibold ${currentStatus.textColor}`}>
            {currentStatus.label}
          </h2>
        </div>
      </div>

      {/* Session Details Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Session Details</h3>
          
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-base font-medium text-gray-900">{formattedDateTime.dateString}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-base font-medium text-gray-900">{formattedDateTime.timeString}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-base font-medium text-gray-900">{formattedDuration}</p>
              </div>
            </div>

            {/* Meeting ID */}
            {sessionData.meeting_id && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Meeting ID</p>
                  <p className="text-base font-medium text-gray-900 font-mono">{sessionData.meeting_id}</p>
                </div>
              </div>
            )}

            {/* Passcode */}
            {sessionData.passcode && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Passcode</p>
                  <p className="text-base font-medium text-gray-900 font-mono">{sessionData.passcode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {sessionData.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-base text-gray-700 leading-relaxed">{sessionData.description}</p>
            </div>
          )}
        </div>

        {/* Join Button (for upcoming and live sessions) */}
        {sessionData.join_url && sessionStatus !== 'completed' && (
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <a
              href={sessionData.join_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-center px-6 py-4 rounded-lg font-semibold text-white transition-colors ${
                sessionStatus === 'live'
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {sessionStatus === 'live' ? '🔴 Join Live Session Now' : 'Join Session'}
            </a>
          </div>
        )}
      </div>

      {/* Calendar Integration */}
      {sessionStatus === 'upcoming' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Calendar</h3>
          <p className="text-sm text-gray-600 mb-4">
            Don't miss this session! Add it to your calendar to receive reminders.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCalendar}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
              </svg>
              Google Calendar
            </button>
            <button
              onClick={handleDownloadICS}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download .ics
            </button>
          </div>
        </div>
      )}

      {/* Completed Session Message */}
      {sessionStatus === 'completed' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-700 font-medium">This session has ended</p>
          <p className="text-sm text-gray-500 mt-1">
            Check with your instructor for any recordings or follow-up materials.
          </p>
        </div>
      )}
    </div>
  );
}
