/**
 * Google Analytics Event Tracking Utilities
 * Provides type-safe event tracking for GA4
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

/**
 * Track user signup event
 */
export function trackSignup(role: 'student' | 'convener') {
  trackEvent('sign_up', {
    method: 'email',
    role: role,
  });
}

/**
 * Track user login event
 */
export function trackLogin() {
  trackEvent('login', {
    method: 'email',
  });
}

/**
 * Track role selection
 */
export function trackRoleSelection(role: 'student' | 'convener') {
  trackEvent('select_role', {
    role: role,
  });
}

/**
 * Track programme view
 */
export function trackProgrammeView(programmeId: string, programmeName: string) {
  trackEvent('view_programme', {
    programme_id: programmeId,
    programme_name: programmeName,
  });
}

/**
 * Track module start
 */
export function trackModuleStart(moduleId: string, moduleName: string) {
  trackEvent('start_module', {
    module_id: moduleId,
    module_name: moduleName,
  });
}

/**
 * Track lesson completion
 */
export function trackLessonComplete(lessonId: string, lessonName: string) {
  trackEvent('complete_lesson', {
    lesson_id: lessonId,
    lesson_name: lessonName,
  });
}

/**
 * Track CTA button clicks on marketing pages
 */
export function trackCtaClick(ctaName: string, location: string) {
  trackEvent('cta_click', {
    cta_name: ctaName,
    location: location,
  });
}

/**
 * Track funnel form submission
 */
export function trackFunnelSubmit(programmeType: string) {
  trackEvent('funnel_form_submitted', {
    programme_type: programmeType,
  });
}

/**
 * Track programme join / enrolment
 */
export function trackProgrammeJoin(programmeId: string) {
  trackEvent('programme_joined', {
    programme_id: programmeId,
  });
}
