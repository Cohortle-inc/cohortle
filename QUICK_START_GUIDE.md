# Quick Start Guide - Set Up WLIMP Programme

Follow these steps to create your first WLIMP programme that learners can join.

---

## Step 1: Deploy Backend (2-3 minutes)

1. Open your **Coolify dashboard**
2. Find the **cohortle-api** application
3. Click the **"Deploy"** button
4. Wait for deployment to complete (2-3 minutes)
5. Check logs for migration messages:
   ```
   == 20260301000000-create-wlimp-weeks: migrated
   == 20260301000001-create-wlimp-lessons: migrated
   == 20260301000002-create-wlimp-enrollments: migrated
   == 20260301000003-add-enrollment-code-to-cohorts: migrated
   ```

---

## Step 2: Get Convener Token (1 minute)

### Option A: Register New Convener Account

Run this command:
```powershell
powershell -ExecutionPolicy Bypass -File get-convener-token.ps1 -Action register
```

You'll be asked for:
- Email address
- Password
- First name
- Last name

The script will create a convener account and give you a token.

### Option B: Login with Existing Account

If you already have a convener account:
```powershell
powershell -ExecutionPolicy Bypass -File get-convener-token.ps1 -Action login
```

You'll be asked for:
- Email address
- Password

The script will give you a token.

**Save the token!** You'll need it for the next step.

---

## Step 3: Create Programme (30 seconds)

Run this command with your token:
```powershell
powershell -ExecutionPolicy Bypass -File create-test-programme.ps1 -Token "YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the token from Step 2.

This will automatically create:
- ✅ A WLIMP programme
- ✅ A cohort with enrollment code: **WLIMP-2026**
- ✅ 3 weeks of content
- ✅ 4 lessons

---

## Step 4: Test as Learner (1 minute)

1. Go to your website: `https://cohortle.com/join`
2. Enter enrollment code: **WLIMP-2026**
3. Click "Join Programme"
4. Go to dashboard: `https://cohortle.com/dashboard`
5. You should see the WLIMP programme!
6. Click on it to see weeks and lessons

---

## Troubleshooting

### "Failed to create programme"

**Cause**: Backend not deployed yet or migrations didn't run

**Solution**:
1. Check Coolify logs for backend deployment
2. Look for "migrated" messages in logs
3. If no migrations, manually run: `npm run migrate`

### "Email already in use"

**Cause**: You already registered with that email

**Solution**:
- Use `-Action login` instead of `-Action register`
- Or use a different email address

### "Invalid token" or "Unauthorized"

**Cause**: Token expired or invalid

**Solution**:
- Get a new token by running the login script again
- Tokens expire after 24 hours

### "Enrollment code already exists"

**Cause**: You already created a cohort with code WLIMP-2026

**Solution**:
- Edit `create-test-programme.ps1`
- Change `enrollment_code` to something else like `WLIMP-2026-B`
- Run the script again

---

## What Gets Created

### Programme
- Name: "WLIMP – Workforce Leadership & Impact Mentorship Programme"
- Description: "A 12-week structured programme for emerging leaders"
- Start Date: March 1, 2026

### Cohort
- Name: "WLIMP 2026 Cohort 1"
- Enrollment Code: **WLIMP-2026** (learners use this to join)
- Start Date: March 1, 2026

### Weeks
1. Week 1: Introduction to Leadership (March 1)
2. Week 2: Communication Skills (March 8)
3. Week 3: Team Building (March 15)

### Lessons
- Week 1: "What is Leadership?" (video)
- Week 1: "Leadership Styles" (link)
- Week 2: "Effective Communication" (video)
- Week 3: "Building High-Performance Teams" (video)

---

## Next Steps

After setup:

1. **Share the enrollment code** with learners: `WLIMP-2026`
2. **Add more weeks** using the convener endpoints (see CONVENER_SETUP_GUIDE.md)
3. **Add more lessons** to existing weeks
4. **Update lesson content** with real YouTube videos and resources

---

## Manual Setup (Alternative)

If you prefer to create the programme manually using API calls, see:
- `CONVENER_SETUP_GUIDE.md` - Detailed API documentation
- Use Postman or Insomnia to make requests

---

## Need Help?

If something goes wrong:

1. Check backend logs in Coolify
2. Verify migrations ran successfully
3. Test the backend is accessible: `https://api.cohortle.com/health`
4. Check database tables exist: `programmes`, `cohorts`, `weeks`, `lessons`

---

## Summary

```
1. Deploy backend in Coolify (2-3 min)
2. Get convener token (1 min)
3. Run setup script (30 sec)
4. Test as learner (1 min)

Total time: ~5 minutes
```

You'll have a working WLIMP programme that learners can join!

