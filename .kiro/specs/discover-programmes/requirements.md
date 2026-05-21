# Discover Programmes Feature Requirements

## Overview

Build a dedicated discovery layer (/discover) that serves as the top of the funnel for Cohortle, allowing users to find and explore learning opportunities without needing invite codes. This addresses the fundamental business question: "Why would someone visit Cohortle before they've been invited?"

## Strategic Context

This feature transforms Cohortle from an invite-only platform to one with organic discovery capabilities, enabling:
- SEO-driven traffic acquisition
- Organic growth through search engines
- Public programme visibility for recruiting organisations
- A clear funnel: Discover → Organisation → Apply

## User Stories

### Discovery Users (Potential Learners)

**US-1: Programme Discovery**
As a potential learner, I want to discover learning opportunities without needing an invite code, so that I can explore programmes that match my interests and career goals.

**US-2: Programme Filtering**
As a potential learner, I want to filter opportunities by format, deadline, keywords, and category, so that I can quickly find programmes relevant to my needs.

**US-3: Programme Bookmarking**
As a potential learner, I want to save interesting programmes to review later, so that I can compare options and return when I'm ready to apply.

**US-4: Email Notifications**
As a potential learner, I want to get notified about new opportunities matching my interests, so that I don't miss relevant programmes.

**US-5: Organisation Trust Building**
As a potential learner, I want to learn about the organisation behind a programme, so that I can evaluate their credibility before applying.

**US-6: Seamless Application**
As a potential learner, I want to apply to programmes directly from the discovery interface, so that the process is smooth and intuitive.

### Organisation Users (Programme Operators)

**US-7: Programme Visibility**
As an organisation, I want my recruiting programmes to be discoverable by the right audience, so that I can attract qualified applicants without manual outreach.

**US-8: Attribution Tracking**
As an organisation, I want proper attribution when users apply through the discovery layer, so that I can measure the effectiveness of public visibility.

**US-9: SEO Benefits**
As an organisation, I want my programmes to appear in search engine results, so that I can reach learners who are actively searching for opportunities.

## Acceptance Criteria

### AC-1: Discovery Page Implementation
- [ ] 1.1 Create `/discover` route that displays discoverable programmes
- [ ] 1.2 Show only programmes with lifecycle_status of "recruiting", "application", or "hybrid"
- [ ] 1.3 Display programme cards with essential information (title, organisation, format, deadline, description)
- [ ] 1.4 Implement server-side rendering for SEO optimization
- [ ] 1.5 Ensure mobile-responsive design

### AC-2: Programme Filtering System
- [ ] 2.1 Implement format filter (online, in-person, hybrid)
- [ ] 2.2 Implement deadline filter (closing soon, open applications)
- [ ] 2.3 Implement keyword search functionality
- [ ] 2.4 Add category filter (future enhancement placeholder)
- [ ] 2.5 Support multiple filter combinations
- [ ] 2.6 Display filter results count

### AC-3: Featured Content Strategy
- [ ] 3.1 Display featured opportunities prominently
- [ ] 3.2 Show programmes closing soon with urgency indicators
- [ ] 3.3 Highlight remote opportunities
- [ ] 3.4 Showcase free programmes
- [ ] 3.5 Display newest listings
- [ ] 3.6 Implement content rotation logic

### AC-4: Programme Bookmarking
- [ ] 4.1 Add "Save Programme" functionality for unauthenticated users
- [ ] 4.2 Store bookmarks in local storage for anonymous users
- [ ] 4.3 Migrate bookmarks to user account upon registration
- [ ] 4.4 Display saved programmes in a dedicated section
- [ ] 4.5 Allow bookmark removal
- [ ] 4.6 Show bookmark status on programme cards

### AC-5: Email Notification System
- [ ] 5.1 Create email subscription form for opportunity alerts
- [ ] 5.2 Allow users to specify notification preferences (keywords, categories, format)
- [ ] 5.3 Implement email sending for new matching programmes
- [ ] 5.4 Provide unsubscribe functionality
- [ ] 5.5 Track email engagement metrics
- [ ] 5.6 Respect email frequency preferences

### AC-6: SEO Optimization
- [ ] 6.1 Implement proper meta tags for discovery pages
- [ ] 6.2 Generate structured data markup for programmes
- [ ] 6.3 Create SEO-friendly URLs for programme pages
- [ ] 6.4 Implement Open Graph tags for social sharing
- [ ] 6.5 Generate XML sitemap for discoverable content
- [ ] 6.6 Optimize page loading performance

### AC-7: Organisation Attribution
- [ ] 7.1 Track discovery source in application flow
- [ ] 7.2 Attribute applications to discovery channel
- [ ] 7.3 Provide analytics on discovery-driven applications
- [ ] 7.4 Link to organisation pages from programme cards
- [ ] 7.5 Maintain referral context through application process

### AC-8: API Implementation
- [ ] 8.1 Create `/api/discover/programmes` endpoint
- [ ] 8.2 Implement filtering query parameters
- [ ] 8.3 Add pagination support
- [ ] 8.4 Include programme metadata in responses
- [ ] 8.5 Optimize query performance
- [ ] 8.6 Add caching layer for frequently accessed data

### AC-9: Integration with Existing Systems
- [ ] 9.1 Reuse existing OrgProgrammeCard component
- [ ] 9.2 Integrate with current application flow
- [ ] 9.3 Maintain consistency with organisation pages
- [ ] 9.4 Ensure proper routing to `/apply/[slug]`
- [ ] 9.5 Fix lifecycle_status data inconsistencies
- [ ] 9.6 Update navigation to include discovery link

### AC-10: Analytics and Tracking
- [ ] 10.1 Track discovery page visits
- [ ] 10.2 Monitor filter usage patterns
- [ ] 10.3 Measure bookmark conversion rates
- [ ] 10.4 Track email subscription rates
- [ ] 10.5 Monitor application conversion from discovery
- [ ] 10.6 Generate discovery performance reports

## Technical Requirements

### Performance
- Discovery page must load within 2 seconds
- Support concurrent users without degradation
- Implement efficient database queries with proper indexing
- Use caching for frequently accessed programme data

### Security
- Validate all user inputs for filtering and search
- Implement rate limiting for API endpoints
- Secure email subscription data
- Protect against spam and abuse

### Accessibility
- Ensure WCAG 2.1 AA compliance
- Support keyboard navigation
- Provide proper ARIA labels
- Implement screen reader compatibility

### Browser Support
- Support modern browsers (Chrome, Firefox, Safari, Edge)
- Ensure mobile responsiveness across devices
- Progressive enhancement for older browsers

## Future Monetization Considerations

While not part of the initial implementation, the discovery system should be architected to support:
- Featured programme placements
- Sponsored programme listings
- Premium organisation profiles
- Enhanced programme visibility options
- Application software upselling

## Success Metrics

### Primary Metrics
- Number of programmes discovered per session
- Discovery-to-application conversion rate
- Email subscription rate
- Bookmark-to-application conversion rate

### Secondary Metrics
- Organic search traffic growth
- Time spent on discovery pages
- Filter usage patterns
- Return visitor rate

## Dependencies

- Existing programme and organisation data models
- Current application flow infrastructure
- Email service integration (Resend)
- Analytics tracking system
- SEO infrastructure

## Constraints

- Must not disrupt existing authenticated user flows
- Should maintain clean separation between public and private surfaces
- Cannot expose private or draft programme information
- Must respect organisation privacy preferences

## Definition of Done

- All acceptance criteria completed and tested
- SEO optimization verified with search console
- Performance benchmarks met
- Accessibility audit passed
- Analytics tracking implemented and verified
- Documentation updated
- Stakeholder approval obtained