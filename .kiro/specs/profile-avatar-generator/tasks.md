# Implementation Plan: Profile Avatar Generator

## Overview

This implementation plan breaks down the Profile Avatar Generator feature into discrete, incremental coding tasks. The approach follows a bottom-up strategy: starting with backend services and API endpoints, then building frontend components, and finally integrating everything with comprehensive testing.

## Tasks

- [x] 1. Set up avatar configuration and constants
  - Create avatar configuration file with DiceBear settings
  - Define skin tones, background colours, and API parameters
  - Add configuration to backend environment
  - _Requirements: 2.1, 3.1_

- [ ] 2. Implement AvatarService (Backend)
  - [x] 2.1 Create AvatarService class with core methods
    - Implement `generateSeed(userId)` for unique seed generation
    - Implement `buildDiceBearUrl(seed, style, params)` for URL construction
    - Implement `validateAvatarUrl(url)` for URL validation
    - Implement `generateAvatarUrl(options)` as main entry point
    - _Requirements: 1.2, 2.1, 2.4, 3.1, 3.2, 4.2, 5.1, 5.2, 5.4, 5.5_

  - [x]* 2.2 Write property test for valid DiceBear URL format
    - **Property 13: Valid DiceBear URL Format**
    - **Validates: Requirements 5.1, 5.2**

  - [x]* 2.3 Write property test for diverse skin tone configuration
    - **Property 4: Diverse Skin Tone Configuration**
    - **Validates: Requirements 2.1**

  - [x]* 2.4 Write property test for brand colour consistency
    - **Property 6: Brand Colour Consistency**
    - **Validates: Requirements 3.1**

  - [x]* 2.5 Write property test for avatar variety through unique seeds
    - **Property 5: Avatar Variety Through Unique Seeds**
    - **Validates: Requirements 2.4**

  - [x]* 2.6 Write property test for URL length validation
    - **Property 10: URL Length Validation**
    - **Validates: Requirements 4.2**

  - [x]* 2.7 Write unit tests for AvatarService
    - Test seed generation produces unique values
    - Test URL construction with various parameters
    - Test URL validation with valid and invalid URLs
    - Test error handling for malformed inputs
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 3. Extend ProfileService for avatar updates
  - [x] 3.1 Add updateProfileImage method to ProfileService
    - Implement URL length validation (max 500 characters)
    - Update users.profile_image field
    - Handle database errors gracefully
    - Return updated user profile
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x]* 3.2 Write property test for avatar storage round-trip
    - **Property 9: Avatar Storage Round-Trip**
    - **Validates: Requirements 4.1, 4.4**

  - [ ]* 3.3 Write property test for avatar replacement on regeneration
    - **Property 11: Avatar Replacement on Regeneration**
    - **Validates: Requirements 4.3**

  - [ ]* 3.4 Write property test for storage failure data integrity
    - **Property 12: Storage Failure Data Integrity**
    - **Validates: Requirements 4.5**

  - [ ]* 3.5 Write unit tests for ProfileService.updateProfileImage
    - Test successful profile image update
    - Test validation error for URLs exceeding 500 characters
    - Test database error handling
    - Test transaction rollback on failure
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 4. Create avatar generation API endpoint
  - [x] 4.1 Implement POST /api/profile/avatar/generate route
    - Add authentication middleware
    - Add rate limiting middleware (5 requests per minute)
    - Call AvatarService.generateAvatarUrl
    - Call ProfileService.updateProfileImage
    - Return success response with avatar URL
    - Handle and format errors appropriately
    - _Requirements: 1.2, 5.3, 8.2, 9.1, 9.3, 10.1, 10.2, 10.4_

  - [ ]* 4.2 Write property test for authentication requirement
    - **Property 20: Authentication Requirement**
    - **Validates: Requirements 9.1, 9.3**

  - [ ]* 4.3 Write property test for rate limiting enforcement
    - **Property 19: Rate Limiting Enforcement**
    - **Validates: Requirements 8.2**

  - [ ]* 4.4 Write property test for request timeout enforcement
    - **Property 15: Request Timeout Enforcement**
    - **Validates: Requirements 5.5**

  - [ ]* 4.5 Write unit tests for avatar generation endpoint
    - Test successful avatar generation flow
    - Test authentication rejection for unauthenticated requests
    - Test rate limiting after 5 requests
    - Test error responses for service failures
    - Test timeout handling
    - _Requirements: 1.2, 5.3, 5.5, 8.2, 9.1, 10.1, 10.2_

- [x] 5. Checkpoint - Backend services complete
  - Ensure all backend tests pass
  - Verify API endpoint works with manual testing (Postman/curl)
  - Ask the user if questions arise

- [ ] 6. Create frontend API client methods
  - [x] 6.1 Add generateAvatar method to lib/api/profile.ts
    - Implement POST request to /api/profile/avatar/generate
    - Handle authentication token
    - Handle response and errors
    - Add TypeScript types for request/response
    - _Requirements: 1.2, 10.1, 10.2_

  - [ ]* 6.2 Write unit tests for profile API client
    - Test successful avatar generation request
    - Test error handling for failed requests
    - Test authentication token inclusion
    - _Requirements: 1.2, 10.1_

- [ ] 7. Implement AvatarPreview component (Frontend)
  - [x] 7.1 Create AvatarPreview component
    - Display avatar image with proper sizing
    - Show loading skeleton during generation
    - Provide fallback to user initials if no avatar
    - Include descriptive alt text for accessibility
    - Support responsive sizing (small, medium, large)
    - _Requirements: 1.3, 1.4, 3.2, 3.4, 6.4_

  - [ ]* 7.2 Write property test for alt text presence
    - **Property 16: Alt Text Presence**
    - **Validates: Requirements 6.4**

  - [ ]* 7.3 Write property test for consistent avatar dimensions
    - **Property 7: Consistent Avatar Dimensions**
    - **Validates: Requirements 3.2**

  - [ ]* 7.4 Write property test for avatar URL consistency across contexts
    - **Property 8: Avatar URL Consistency Across Contexts**
    - **Validates: Requirements 3.4**

  - [ ]* 7.5 Write unit tests for AvatarPreview component
    - Test avatar image renders with correct src
    - Test loading skeleton displays during loading state
    - Test fallback to initials when no avatar
    - Test alt text is present and descriptive
    - Test responsive sizing classes
    - _Requirements: 1.3, 1.4, 3.2, 6.4_

- [ ] 8. Implement GenerateAvatarButton component (Frontend)
  - [x] 8.1 Create GenerateAvatarButton component
    - Display "Generate Avatar" button
    - Handle click event to call API
    - Show loading state during generation
    - Disable button during generation
    - Display error messages on failure
    - Emit event with new avatar URL on success
    - Implement keyboard accessibility (Enter/Space)
    - Add ARIA labels and live regions
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2, 6.3, 6.5_

  - [ ]* 8.2 Write property test for button disabled during generation
    - **Property 17: Button Disabled During Generation**
    - **Validates: Requirements 6.5**

  - [ ]* 8.3 Write property test for successful generation UI update
    - **Property 2: Successful Generation UI Update**
    - **Validates: Requirements 1.4**

  - [ ]* 8.4 Write property test for error handling preserves previous avatar
    - **Property 3: Error Handling Preserves Previous Avatar**
    - **Validates: Requirements 1.5, 10.5**

  - [ ]* 8.5 Write unit tests for GenerateAvatarButton component
    - Test button renders with correct text
    - Test button calls API on click
    - Test loading state displays during generation
    - Test button is disabled during generation
    - Test error message displays on failure
    - Test success callback is called with new avatar URL
    - Test keyboard accessibility (Enter/Space keys)
    - Test ARIA labels and live regions
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2, 6.3, 6.5_

- [ ] 9. Integrate avatar generation into profile settings page
  - [x] 9.1 Add avatar generation UI to profile settings page
    - Import GenerateAvatarButton and AvatarPreview components
    - Wire up avatar generation flow
    - Update profile state when new avatar is generated
    - Display current avatar in preview
    - Handle loading and error states
    - _Requirements: 1.1, 1.4, 1.5, 4.4_

  - [ ]* 9.2 Write integration test for profile settings avatar flow
    - Test complete flow from button click to avatar display
    - Test error handling in profile settings context
    - Test avatar persists after page reload
    - _Requirements: 1.1, 1.2, 1.4, 4.4_

- [x] 10. Checkpoint - Frontend integration complete
  - Ensure all frontend tests pass
  - Manually test avatar generation in browser
  - Test keyboard navigation and screen reader compatibility
  - Ask the user if questions arise

- [ ] 11. Implement optional customisation features
  - [ ] 11.1 Add customisation options UI (optional enhancement)
    - Create UI controls for style preferences
    - Add options for accessories, colours, etc.
    - Wire up customisation to API request
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 11.2 Write property test for customisation parameters propagation
    - **Property 18: Customisation Parameters Propagation**
    - **Validates: Requirements 7.2**

  - [ ]* 11.3 Write unit tests for customisation UI
    - Test customisation options render correctly
    - Test selected options are passed to API
    - Test default values when no options selected
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 12. Implement performance optimisations
  - [x] 12.1 Add HTTP caching headers for avatar images
    - Configure Cache-Control headers in API responses
    - Set appropriate cache duration
    - _Requirements: 8.1, 8.3_

  - [ ]* 12.2 Write unit tests for caching configuration
    - Test Cache-Control headers are present
    - Test cache duration is appropriate
    - _Requirements: 8.1, 8.3_

- [x] 13. Add comprehensive error logging
  - [x] 13.1 Implement error logging in AvatarService and API endpoint
    - Log all errors with context (user ID, timestamp, error details)
    - Use structured logging format
    - Ensure no sensitive information is logged
    - _Requirements: 10.4_

  - [ ]* 13.2 Write unit tests for error logging
    - Test errors are logged with correct format
    - Test sensitive information is not logged
    - Test log context includes necessary details
    - _Requirements: 10.4_

- [ ] 14. Final integration and end-to-end testing
  - [ ]* 14.1 Write property test for avatar generation performance
    - **Property 1: Avatar Generation Performance**
    - **Validates: Requirements 1.2**

  - [ ]* 14.2 Write property test for URL accessibility validation
    - **Property 14: URL Accessibility Validation**
    - **Validates: Requirements 5.4, 10.3**

  - [ ]* 14.3 Write end-to-end integration tests
    - Test complete avatar generation flow from frontend to backend
    - Test avatar persists across page reloads
    - Test avatar displays in multiple contexts (profile, comments, dashboard)
    - Test error recovery and retry scenarios
    - _Requirements: 1.1, 1.2, 1.4, 3.4, 4.4_

- [ ] 15. Accessibility audit and testing
  - [ ]* 15.1 Run accessibility tests with jest-axe
    - Test GenerateAvatarButton for WCAG compliance
    - Test AvatarPreview for WCAG compliance
    - Test profile settings page for WCAG compliance
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 15.2 Manual accessibility testing
    - Test with keyboard navigation only
    - Test with screen reader (NVDA/JAWS/VoiceOver)
    - Verify focus indicators are visible
    - Verify ARIA announcements work correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 16. Final checkpoint - Feature complete
  - Ensure all tests pass (unit, property, integration, accessibility)
  - Verify feature works in development environment
  - Review code for British English spelling
  - Update documentation
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples, edge cases, and error conditions
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows a bottom-up approach: backend services → API → frontend components → integration
- All avatar URLs use DiceBear's CDN, so no local image storage is required
- Rate limiting prevents abuse while allowing reasonable usage (5 generations per minute)
- The feature integrates seamlessly with existing authentication and profile systems
