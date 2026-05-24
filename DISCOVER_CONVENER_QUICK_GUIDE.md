# Discover Feature - Convener Quick Guide

## How to Make Your Programme Discoverable

For your programme to appear on the public `/discover` page, you need to configure these settings:

### ✅ Required Settings

1. **Lifecycle Status**
   - Set to: `recruiting`
   - Location: Programme settings
   - Why: Only recruiting programmes appear on discover

2. **Onboarding Mode**
   - Set to: `application` or `hybrid`
   - Location: Programme settings
   - Why: Discover is for application-based programmes

3. **Application Form Slug**
   - Example: `leadership-fellowship-2026`
   - Location: Programme application settings
   - Why: Enables the "Apply" button

### 📅 Optional but Recommended

4. **Application Deadline**
   - Set a future date or leave blank
   - If blank: Programme appears indefinitely
   - If set: Must be in the future
   - Why: Creates urgency, appears in "closing soon" filter

### 🎨 Enrichment Fields (Highly Recommended)

These fields make your programme stand out:

5. **Format**
   - Options: `online`, `in-person`, `hybrid`
   - Shows as a blue badge
   - Enables format filtering

6. **Duration**
   - Example: "12 weeks", "6 months"
   - Shows as a gray badge
   - Helps learners understand commitment

7. **Price Info**
   - Example: "Free", "Fully funded", "£500"
   - Shows as a green badge
   - Enables "free/funded" filter

8. **Highlights**
   - JSON array of 3-5 bullet points
   - Example: `["Weekly live sessions", "1-on-1 mentorship", "Certificate on completion"]`
   - Shows on programme card

9. **Thumbnail URL**
   - Cover image for your programme
   - Recommended size: 800x400px
   - Makes your programme visually appealing

### 🔍 Visibility Check

Your programme will appear on `/discover` if:
```
✅ lifecycle_status = 'recruiting'
✅ onboarding_mode = 'application' OR 'hybrid'
✅ application_deadline is NULL OR in the future
✅ application_form_slug is set
```

### 📊 What Learners See

When your programme appears on discover, learners see:
- Programme name and description
- Your organisation name
- Format, duration, and price badges
- Up to 3 highlights
- Deadline with urgency indicator
- "Apply" button (links to your application form)
- "View organisation" button (links to your org page)

### 🎯 Best Practices

1. **Write a compelling description** (2-3 sentences)
2. **Add 3-5 highlights** that showcase unique value
3. **Set a clear deadline** to create urgency
4. **Use a professional thumbnail** image
5. **Keep price info clear** ("Free" or "Fully funded" works best)
6. **Update regularly** to keep information current

### 📈 Track Your Success

Monitor how many learners:
- View your programme on discover
- Click "Apply"
- Complete applications
- Get accepted

(Analytics dashboard coming in Phase 2)

---

**Questions?** Contact support or check the full documentation.
