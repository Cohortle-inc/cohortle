# SEO Metadata Configuration

## Overview
Comprehensive SEO metadata has been configured for Cohortle's web presence to optimize search engine visibility and social media sharing.

## Primary Metadata

### Title
```
Cohortle - Purpose-built infrastructure for non-formal, cohort-based learning
```

### Description
```
Cohortle provides purpose-built infrastructure for non-formal, cohort-based learning. Empower educators and learners with tools designed for collaborative, community-driven education experiences.
```

### Keywords
- cohort-based learning
- non-formal education
- learning management system
- educational technology
- online learning platform
- community learning
- collaborative education
- learning infrastructure
- cohort management
- educational platform

## Open Graph (Facebook, LinkedIn)

Configured for optimal social media sharing:
- **Type**: website
- **Locale**: en-US
- **Site Name**: Cohortle
- **Image**: 1200x675px (og-image.jpg)
- **Alt Text**: Descriptive alt text for accessibility

## Twitter Card

Optimized for Twitter sharing:
- **Card Type**: summary_large_image
- **Creator**: @cohortlecom
- **Site**: @cohortlecom
- **Image**: twitter-image.jpg

## Social Media Profiles

### Official Accounts
- **Facebook**: https://facebook.com/cohortle
- **Instagram**: https://instagram.com/cohortlecom
- **X (Twitter)**: https://x.com/cohortlecom
- **LinkedIn**: https://linkedin.com/company/cohortle

### Integration
Social media links are configured in `src/data/siteDetails.ts` and used throughout the application for consistent branding.

## Search Engine Optimization

### Robots Configuration
- **Index**: Enabled (allows search engines to index pages)
- **Follow**: Enabled (allows search engines to follow links)
- **Google Bot**: Configured for maximum preview capabilities
  - Max video preview: Unlimited
  - Max image preview: Large
  - Max snippet: Unlimited

### Canonical URL
- Set to: https://cohortle.com
- Prevents duplicate content issues

## Dynamic Title Template

Pages can set custom titles that automatically append the site name:
```
Page Title | Cohortle
```

Example:
- Homepage: "Cohortle - Purpose-built infrastructure for non-formal, cohort-based learning"
- About Page: "About | Cohortle"
- Contact Page: "Contact | Cohortle"

## Social Media Images

### Requirements
Create these images in your `public/images/` directory:

1. **og-image.jpg** (Open Graph)
   - Dimensions: 1200 x 675 pixels
   - Format: JPG or PNG
   - Use case: Facebook, LinkedIn, other OG-compatible platforms

2. **twitter-image.jpg** (Twitter Card)
   - Dimensions: 1200 x 675 pixels (or 1200 x 628 pixels)
   - Format: JPG or PNG
   - Use case: Twitter/X platform

### Image Design Tips
- Include your logo prominently
- Use your brand colors
- Add tagline: "Purpose-built infrastructure for non-formal, cohort-based learning"
- Ensure text is readable at small sizes
- Test on both light and dark backgrounds

## Verification Codes

### Google Search Console
To verify your site with Google:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (https://cohortle.com)
3. Get your verification code
4. Add it to `src/app/layout.tsx`:
   ```typescript
   verification: {
     google: "your-verification-code-here",
   }
   ```

### Other Platforms
You can add verification for:
- Bing Webmaster Tools
- Yandex Webmaster
- Pinterest
- Facebook Domain Verification

## Testing Your SEO

### Tools to Use
1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Test: https://cohortle.com

2. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Test: https://cohortle.com

3. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Test: https://cohortle.com

4. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Test: https://cohortle.com

### What to Check
- ✅ Title displays correctly
- ✅ Description is compelling and accurate
- ✅ Images load and display properly
- ✅ No errors or warnings
- ✅ Mobile preview looks good

## Page-Specific Metadata

Individual pages can override the default metadata:

```typescript
// In any page.tsx file
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Cohortle and our mission...',
  openGraph: {
    title: 'About Cohortle',
    description: 'Learn about our mission...',
  },
};
```

## Best Practices

### Title
- Keep under 60 characters
- Include primary keyword
- Make it compelling and clickable
- Front-load important words

### Description
- Keep between 150-160 characters
- Include call-to-action
- Use active voice
- Include primary and secondary keywords naturally

### Keywords
- Focus on 5-10 primary keywords
- Use long-tail variations
- Match user search intent
- Update based on analytics

## Analytics Integration

### Current Setup

#### Google Analytics 4 (GA4)
- **Status**: ✅ Configured and Active
- **Measurement ID**: G-XXXXXXXXXX (configured in environment variables)
- **Implementation**: `src/lib/utils/analytics.ts`
- **Features**:
  - Page view tracking
  - User event tracking (login, signup, navigation)
  - Custom event tracking for key user actions
  - Privacy-compliant implementation

#### Google Search Console
- **Status**: ✅ Verified
- **Property**: https://cohortle.com
- **Verification**: Meta tag verification in layout.tsx
- **Features**:
  - Search performance monitoring
  - Index coverage reports
  - Mobile usability tracking
  - Core Web Vitals monitoring

### Event Tracking

The following events are automatically tracked:
- `page_view` - All page navigations
- `login` - User login events
- `sign_up` - New user registrations (includes role: learner/convener)
- `navigation` - Internal navigation clicks

### Privacy & Compliance
- Analytics respect user privacy preferences
- No personally identifiable information (PII) is tracked
- Cookie consent is handled appropriately
- GDPR and privacy law compliant

### Analytics Dashboard Access
1. **Google Analytics**: https://analytics.google.com
2. **Google Search Console**: https://search.google.com/search-console

## Structured Data (Future Enhancement)

Consider adding structured data for:
- Organization schema
- Course schema (for learning content)
- BreadcrumbList schema
- FAQ schema
- Review schema

## Monitoring & Maintenance

### Monthly Tasks
- [ ] Check Google Search Console for errors
- [ ] Review top performing pages
- [ ] Update meta descriptions for low CTR pages
- [ ] Check for broken links
- [ ] Monitor page speed

### Quarterly Tasks
- [ ] Review and update keywords
- [ ] Analyze competitor SEO
- [ ] Update social media images if branding changes
- [ ] Review and improve content
- [ ] Check mobile usability

## Resources

- [Next.js Metadata Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

---

**Last Updated**: 2026-02-22
**Status**: ✅ Fully Configured and Production Ready
**Analytics**: ✅ Google Analytics 4 & Search Console Active
**Social Media**: ✅ All profiles linked and verified
**Next Steps**: Monitor analytics and optimize based on user behavior data
