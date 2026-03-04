# Convener Setup Guide - Create Your First Programme

This guide shows you how to create a WLIMP programme that learners can join.

## Prerequisites

1. Deploy backend to Coolify (so the endpoints exist)
2. Have a convener account with authentication token
3. Use a tool like Postman, Insomnia, or curl to make API requests

---

## Step 1: Create a Programme

**Endpoint:** `POST /v1/api/programmes`

**Headers:**
```
Authorization: Bearer YOUR_CONVENER_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "WLIMP – Workforce Leadership & Impact Mentorship Programme",
  "description": "A 12-week structured programme for emerging leaders",
  "start_date": "2026-03-01"
}
```

**Response:**
```json
{
  "error": false,
  "message": "Programme created successfully",
  "programme": {
    "id": 1,
    "name": "WLIMP – Workforce Leadership & Impact Mentorship Programme",
    "description": "A 12-week structured programme for emerging leaders",
    "start_date": "2026-03-01",
    "created_at": "2026-02-22T...",
    "updated_at": "2026-02-22T..."
  }
}
```

**Save the `programme.id` - you'll need it for the next steps!**

---

## Step 2: Create a Cohort (with Enrollment Code)

**Endpoint:** `POST /v1/api/programmes/{programme_id}/cohorts`

Replace `{programme_id}` with the ID from Step 1.

**Headers:**
```
Authorization: Bearer YOUR_CONVENER_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "WLIMP 2026 Cohort 1",
  "enrollment_code": "WLIMP-2026",
  "start_date": "2026-03-01"
}
```

**Response:**
```json
{
  "error": false,
  "message": "Cohort created successfully",
  "cohort": {
    "id": 1,
    "programme_id": 1,
    "name": "WLIMP 2026 Cohort 1",
    "enrollment_code": "WLIMP-2026",
    "start_date": "2026-03-01",
    "created_at": "2026-02-22T...",
    "updated_at": "2026-02-22T..."
  }
}
```

**Save the `enrollment_code` - learners will use this to join!**

---

## Step 3: Create Weeks

**Endpoint:** `POST /v1/api/programmes/{programme_id}/weeks`

Create Week 1:

**Headers:**
```
Authorization: Bearer YOUR_CONVENER_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "week_number": 1,
  "title": "Introduction to Leadership",
  "start_date": "2026-03-01"
}
```

**Response:**
```json
{
  "error": false,
  "message": "Week created successfully",
  "week": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "programme_id": 1,
    "week_number": 1,
    "title": "Introduction to Leadership",
    "start_date": "2026-03-01",
    "created_at": "2026-02-22T...",
    "updated_at": "2026-02-22T..."
  }
}
```

**Save the `week.id` (UUID) - you'll need it to add lessons!**

Repeat for Week 2, 3, etc. (change `week_number`, `title`, and `start_date`):

```json
{
  "week_number": 2,
  "title": "Communication Skills",
  "start_date": "2026-03-08"
}
```

---

## Step 4: Add Lessons to Weeks

**Endpoint:** `POST /v1/api/weeks/{week_id}/lessons`

Replace `{week_id}` with the UUID from Step 3.

**Headers:**
```
Authorization: Bearer YOUR_CONVENER_TOKEN
Content-Type: application/json
```

**Body (Video Lesson):**
```json
{
  "title": "What is Leadership?",
  "description": "An introduction to leadership principles and practices",
  "content_type": "video",
  "content_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  "order_index": 0
}
```

**Body (Link Lesson):**
```json
{
  "title": "Leadership Reading Material",
  "description": "Essential reading on leadership theory",
  "content_type": "link",
  "content_url": "https://example.com/leadership-article",
  "order_index": 1
}
```

**Body (PDF Lesson):**
```json
{
  "title": "Leadership Workbook",
  "description": "Download and complete this workbook",
  "content_type": "pdf",
  "content_url": "https://example.com/workbook.pdf",
  "order_index": 2
}
```

**Response:**
```json
{
  "error": false,
  "message": "Lesson created successfully",
  "lesson": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "week_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "What is Leadership?",
    "description": "An introduction to leadership principles and practices",
    "content_type": "video",
    "content_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
    "order_index": 0,
    "created_at": "2026-02-22T...",
    "updated_at": "2026-02-22T..."
  }
}
```

Add multiple lessons per week by changing `title`, `content_url`, and `order_index`.

---

## Step 5: Learners Can Now Enroll!

Once you've created the programme, cohort, weeks, and lessons, learners can:

1. Go to `/join` page on your website
2. Enter the enrollment code: `WLIMP-2026`
3. Click "Join Programme"
4. They'll be enrolled and can see the programme on their dashboard!

---

## Quick Setup Script (Example)

Here's a curl script to create a basic programme:

```bash
# Set your token
TOKEN="your_convener_token_here"
API_URL="https://api.cohortle.com"

# 1. Create Programme
PROGRAMME_RESPONSE=$(curl -X POST "$API_URL/v1/api/programmes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WLIMP 2026",
    "description": "Leadership programme",
    "start_date": "2026-03-01"
  }')

PROGRAMME_ID=$(echo $PROGRAMME_RESPONSE | jq -r '.programme.id')
echo "Programme ID: $PROGRAMME_ID"

# 2. Create Cohort
COHORT_RESPONSE=$(curl -X POST "$API_URL/v1/api/programmes/$PROGRAMME_ID/cohorts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WLIMP 2026 Cohort 1",
    "enrollment_code": "WLIMP-2026",
    "start_date": "2026-03-01"
  }')

echo "Cohort created with code: WLIMP-2026"

# 3. Create Week 1
WEEK_RESPONSE=$(curl -X POST "$API_URL/v1/api/programmes/$PROGRAMME_ID/weeks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "week_number": 1,
    "title": "Introduction to Leadership",
    "start_date": "2026-03-01"
  }')

WEEK_ID=$(echo $WEEK_RESPONSE | jq -r '.week.id')
echo "Week ID: $WEEK_ID"

# 4. Create Lesson 1
curl -X POST "$API_URL/v1/api/weeks/$WEEK_ID/lessons" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "What is Leadership?",
    "description": "Introduction video",
    "content_type": "video",
    "content_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "order_index": 0
  }'

echo "Programme setup complete! Enrollment code: WLIMP-2026"
```

---

## Testing the Setup

After creating the programme:

1. **As a learner**, go to `/join`
2. Enter code: `WLIMP-2026`
3. Click "Join Programme"
4. Go to `/dashboard` - you should see the programme
5. Click on the programme - you should see Week 1
6. Click on a lesson - you should see the content

---

## Troubleshooting

### "Programme not found"
- Make sure you deployed the backend first
- Check that migrations ran successfully
- Verify the programme_id is correct

### "Enrollment code already exists"
- Each code must be unique
- Try a different code like `WLIMP-2026-B`

### "Week not found"
- Make sure you're using the correct week UUID
- Verify the week was created successfully

### "Invalid URL format"
- content_url must be a valid URL
- Include `https://` in the URL
- YouTube URLs should be full URLs, not shortened

---

## Next Steps

Once the programme is set up:

1. Share the enrollment code with learners
2. Monitor enrollments in the database
3. Add more weeks and lessons as needed
4. Update lesson content using the update endpoints (if implemented)

---

## Need Help?

If you encounter issues:

1. Check backend logs in Coolify
2. Verify migrations ran successfully
3. Test endpoints with Postman/Insomnia
4. Check database tables: `programmes`, `cohorts`, `weeks`, `lessons`, `enrollments`

