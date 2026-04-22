# Organisation Page Design Review & Improvement Plan

## Current State Analysis

The organisation page (`/org/[slug]`) is functionally complete but lacks professional design and key features that would make it effective for attracting learners.

## Critical Issues Identified

### 1. Visual Design Problems

#### Minimal Branding
- No logo/profile picture for the organisation
- No hero section or visual appeal
- Plain white background with minimal styling
- Looks like a placeholder rather than a professional landing page

#### Poor Information Hierarchy
- Organisation name and description are basic text
- No visual separation between sections
- Programme cards are functional but uninspiring
- Missing call-to-action prominence

#### Mobile Experience
- Basic responsive grid but no mobile-specific optimizations
- No consideration for touch targets
- Text sizing not optimized for mobile viewing

### 2. Missing Essential Features

#### No Contact Information
- No way to contact the organisation
- No email, phone, or social media links
- No "About Us" or "Contact" section

#### No Social Proof
- No testimonials from past learners
- No success stories or outcomes
- No statistics (e.g., "500+ learners trained")
- No partner logos or accreditations

#### No Rich Media
- No images or videos
- No organisation logo
- No programme preview images
- No convener photo/bio

#### Limited Programme Information
- Only shows name, description, and deadline
- No duration, format (online/in-person), or commitment level
- No curriculum preview or learning outcomes
- No pricing information (if applicable)

#### No Trust Signals
- No security badges
- No privacy policy link
- No terms of service
- No "verified organisation" indicator

### 3. User Experience Issues

#### Poor Navigation
- No header/navigation bar
- No way to return to main site
- No breadcrumbs
- No footer with additional links

#### Limited Interactivity
- Static page with no engagement features
- No newsletter signup
- No "Save for later" functionality
- No share buttons

#### Accessibility Concerns
- Missing semantic HTML structure
- No skip links
- Limited ARIA labels
- Poor keyboard navigation

#### SEO Problems
- No meta tags or Open Graph data
- No structured data (Schema.org)
- No canonical URLs
- Missing alt text for images (when added)

### 4. Functional Gaps

#### No Analytics
- Can't track page views
- Can't measure conversion rates
- No heatmaps or user behavior tracking
- No A/B testing capability

#### No Personalization
- Same experience for all visitors
- No location-based content
- No returning visitor recognition
- No recommended programmes

#### Limited Application Flow
- Direct jump to application form
- No "Learn More" intermediate step
- No programme comparison feature
- No FAQ section

## Improvement Recommendations

### Phase 1: Essential Improvements (High Priority)

#### 1. Enhanced Visual Design
```typescript
// Add hero section with background
<section className="bg-gradient-to-br from-[#391D65] to-[#5B3A8F] text-white py-16 px-4">
  <div className="max-w-4xl mx-auto">
    <div className="flex items-center gap-6 mb-6">
      {orgData.convener.profile_picture && (
        <img 
          src={orgData.convener.profile_picture} 
          alt={orgData.convener.organisation_name}
          className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
        />
      )}
      <div>
        <h1 className="text-4xl font-bold">
          {orgData.convener.organisation_name || orgData.convener.name}
        </h1>
        <p className="text-xl text-purple-100 mt-2">
          {orgData.convener.tagline || 'Empowering learners through education'}
        </p>
      </div>
    </div>
    {orgData.convener.organisation_description && (
      <p className="text-lg text-purple-50 max-w-2xl">
        {orgData.convener.organisation_description}
      </p>
    )}
  </div>
</section>
```

#### 2. Add Contact & Social Links
```typescript
// New database fields needed:
// - contact_email
// - contact_phone
// - website_url
// - linkedin_url
// - twitter_url
// - facebook_url

<section className="bg-white border-t border-gray-200 py-8">
  <div className="max-w-4xl mx-auto px-4">
    <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
    <div className="flex flex-wrap gap-4">
      {contactEmail && (
        <a href={`mailto:${contactEmail}`} className="flex items-center gap-2">
          <EmailIcon /> {contactEmail}
        </a>
      )}
      {/* Social links */}
    </div>
  </div>
</section>
```

#### 3. Improve Programme Cards
```typescript
<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all">
  {/* Programme image/thumbnail */}
  {programme.thumbnail_url && (
    <img 
      src={programme.thumbnail_url} 
      alt={programme.name}
      className="w-full h-48 object-cover rounded-lg mb-4"
    />
  )}
  
  {/* Programme details */}
  <div className="flex items-center gap-2 mb-3">
    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
      {programme.format || 'Online'}
    </span>
    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
      {programme.duration || '12 weeks'}
    </span>
  </div>
  
  <h2 className="text-xl font-semibold text-gray-900 mb-2">
    {programme.name}
  </h2>
  
  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
    {programme.description}
  </p>
  
  {/* Key highlights */}
  {programme.highlights && (
    <ul className="mb-4 space-y-1">
      {programme.highlights.slice(0, 3).map((highlight, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <CheckIcon className="w-4 h-4 text-green-500 mt-0.5" />
          {highlight}
        </li>
      ))}
    </ul>
  )}
  
  {/* Deadline & CTA */}
  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
    {deadlineText && (
      <span className="text-sm text-amber-600 font-medium">
        Deadline: {deadlineText}
      </span>
    )}
    <Link href={applyUrl} className="btn-primary">
      Apply Now →
    </Link>
  </div>
</div>
```

#### 4. Add Navigation & Footer
```typescript
// Header
<header className="bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <Link href="/" className="text-xl font-bold text-[#391D65]">
      Cohortle
    </Link>
    <nav className="flex items-center gap-6">
      <Link href="#programmes">Programmes</Link>
      <Link href="#about">About</Link>
      <Link href="#contact">Contact</Link>
      <Link href="/login" className="btn-secondary">Sign In</Link>
    </nav>
  </div>
</header>

// Footer
<footer className="bg-gray-900 text-gray-300 py-12">
  <div className="max-w-6xl mx-auto px-4">
    <div className="grid md:grid-cols-4 gap-8">
      <div>
        <h4 className="font-semibold text-white mb-4">
          {orgData.convener.organisation_name}
        </h4>
        <p className="text-sm">{orgData.convener.organisation_description}</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li><Link href="#programmes">Programmes</Link></li>
          <li><Link href="#about">About Us</Link></li>
          <li><Link href="#faq">FAQ</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-4">Legal</h4>
        <ul className="space-y-2 text-sm">
          <li><Link href="/privacy">Privacy Policy</Link></li>
          <li><Link href="/terms">Terms of Service</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-4">Connect</h4>
        {/* Social links */}
      </div>
    </div>
  </div>
</footer>
```

### Phase 2: Enhanced Features (Medium Priority)

#### 1. Statistics Section
```typescript
<section className="bg-gray-50 py-12">
  <div className="max-w-4xl mx-auto px-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-[#391D65]">
          {orgData.stats.total_learners}+
        </div>
        <div className="text-sm text-gray-600 mt-1">Learners Trained</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-[#391D65]">
          {orgData.stats.programmes_completed}
        </div>
        <div className="text-sm text-gray-600 mt-1">Programmes Completed</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-[#391D65]">
          {orgData.stats.success_rate}%
        </div>
        <div className="text-sm text-gray-600 mt-1">Success Rate</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-[#391D65]">
          {orgData.stats.years_experience}+
        </div>
        <div className="text-sm text-gray-600 mt-1">Years Experience</div>
      </div>
    </div>
  </div>
</section>
```

#### 2. Testimonials Section
```typescript
<section className="py-12">
  <div className="max-w-4xl mx-auto px-4">
    <h2 className="text-2xl font-bold text-center mb-8">
      What Our Learners Say
    </h2>
    <div className="grid md:grid-cols-3 gap-6">
      {orgData.testimonials.map((testimonial) => (
        <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
            ))}
          </div>
          <p className="text-gray-700 text-sm mb-4">
            "{testimonial.quote}"
          </p>
          <div className="flex items-center gap-3">
            <img 
              src={testimonial.learner_avatar} 
              alt={testimonial.learner_name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="font-medium text-sm">{testimonial.learner_name}</div>
              <div className="text-xs text-gray-500">{testimonial.programme_name}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

#### 3. FAQ Section
```typescript
<section className="bg-gray-50 py-12">
  <div className="max-w-3xl mx-auto px-4">
    <h2 className="text-2xl font-bold text-center mb-8">
      Frequently Asked Questions
    </h2>
    <div className="space-y-4">
      {orgData.faqs.map((faq) => (
        <details key={faq.id} className="bg-white p-6 rounded-lg shadow-sm">
          <summary className="font-semibold cursor-pointer">
            {faq.question}
          </summary>
          <p className="mt-3 text-gray-600 text-sm">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  </div>
</section>
```

#### 4. Newsletter Signup
```typescript
<section className="bg-[#391D65] text-white py-12">
  <div className="max-w-2xl mx-auto px-4 text-center">
    <h2 className="text-2xl font-bold mb-3">
      Stay Updated
    </h2>
    <p className="text-purple-100 mb-6">
      Get notified when new programmes open for applications
    </p>
    <form className="flex gap-3 max-w-md mx-auto">
      <input 
        type="email" 
        placeholder="Enter your email"
        className="flex-1 px-4 py-3 rounded-lg text-gray-900"
      />
      <button className="px-6 py-3 bg-white text-[#391D65] font-semibold rounded-lg hover:bg-gray-100">
        Subscribe
      </button>
    </form>
  </div>
</section>
```

### Phase 3: Advanced Features (Low Priority)

#### 1. Programme Comparison
- Side-by-side comparison table
- Filter by duration, format, price
- Save comparisons for later

#### 2. Live Chat Support
- Chatbot for common questions
- Live agent during business hours
- WhatsApp integration

#### 3. Video Introduction
- Convener welcome video
- Programme preview videos
- Virtual tour of facilities

#### 4. Application Preview
- "See what you'll be asked" feature
- Estimated time to complete
- Required documents checklist

## Database Schema Changes Required

### New fields for `users` table:
```sql
ALTER TABLE users ADD COLUMN organisation_tagline VARCHAR(255);
ALTER TABLE users ADD COLUMN contact_email VARCHAR(255);
ALTER TABLE users ADD COLUMN contact_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN website_url VARCHAR(500);
ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(500);
ALTER TABLE users ADD COLUMN twitter_url VARCHAR(500);
ALTER TABLE users ADD COLUMN facebook_url VARCHAR(500);
ALTER TABLE users ADD COLUMN instagram_url VARCHAR(500);
ALTER TABLE users ADD COLUMN organisation_logo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN hero_image_url VARCHAR(500);
```

### New fields for `programmes` table:
```sql
ALTER TABLE programmes ADD COLUMN thumbnail_url VARCHAR(500);
ALTER TABLE programmes ADD COLUMN format VARCHAR(50); -- 'online', 'in-person', 'hybrid'
ALTER TABLE programmes ADD COLUMN duration VARCHAR(100); -- '12 weeks', '6 months', etc.
ALTER TABLE programmes ADD COLUMN highlights JSON; -- Array of key points
ALTER TABLE programmes ADD COLUMN learning_outcomes JSON; -- Array of outcomes
ALTER TABLE programmes ADD COLUMN prerequisites TEXT;
ALTER TABLE programmes ADD COLUMN price_info VARCHAR(255);
```

### New tables:
```sql
-- Organisation statistics
CREATE TABLE organisation_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  total_learners INT DEFAULT 0,
  programmes_completed INT DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  years_experience INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Testimonials
CREATE TABLE testimonials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  learner_name VARCHAR(255) NOT NULL,
  learner_avatar VARCHAR(500),
  programme_name VARCHAR(255),
  quote TEXT NOT NULL,
  rating INT DEFAULT 5,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- FAQs
CREATE TABLE organisation_faqs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organisation_slug VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_org_email (organisation_slug, email)
);
```

## SEO Improvements

### Add meta tags:
```typescript
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const orgData = await getOrganisationPage(params.slug);
  
  return {
    title: `${orgData.convener.organisation_name} | Cohortle`,
    description: orgData.convener.organisation_description,
    openGraph: {
      title: orgData.convener.organisation_name,
      description: orgData.convener.organisation_description,
      images: [orgData.convener.hero_image_url || '/default-og-image.jpg'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: orgData.convener.organisation_name,
      description: orgData.convener.organisation_description,
    },
  };
}
```

### Add structured data:
```typescript
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": orgData.convener.organisation_name,
    "description": orgData.convener.organisation_description,
    "url": `https://cohortle.com/org/${slug}`,
    "logo": orgData.convener.organisation_logo_url,
    "contactPoint": {
      "@type": "ContactPoint",
      "email": orgData.convener.contact_email,
      "contactType": "customer service"
    }
  })}
</script>
```

## Implementation Priority

### Immediate (Week 1):
1. Enhanced visual design with hero section
2. Improved programme cards with better styling
3. Add navigation header and footer
4. Mobile responsive improvements

### Short-term (Week 2-3):
5. Contact information section
6. Social media links
7. Statistics section
8. Basic SEO meta tags

### Medium-term (Month 2):
9. Testimonials section
10. FAQ section
11. Newsletter signup
12. Database schema updates

### Long-term (Month 3+):
13. Programme comparison
14. Video integration
15. Live chat
16. Advanced analytics

## Conclusion

The current organisation page is functional but needs significant design and feature improvements to be effective as a marketing/recruitment tool. The recommendations above will transform it from a basic listing page into a professional, conversion-optimized landing page that builds trust and encourages applications.
