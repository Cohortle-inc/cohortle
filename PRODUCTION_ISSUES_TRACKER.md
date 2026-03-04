# 🔧 Cohortle Production Issues & Feature Gaps

**Build Version**: v0.5 (Latest)
**Test Date**: 2026-02-20
**Status**: Critical issues identified

---

## 🚨 Critical Issues (P0 - Blockers)

### 1. Lesson Save Failure
**Priority**: P0 - Critical
**Status**: 🔴 Blocking

**Issue**:
- Saving a lesson fails when `lessonId` is missing
- Lessons cannot be updated properly
- Affects all lesson types

**Impact**: Core functionality broken - conveners cannot create/edit lessons

**Root Cause**: Missing lessonId in save/update flow

**Fix Required**:
- [ ] Investigate lesson save API call
- [ ] Ensure lessonId is properly generated/passed
- [ ] Add validation for required fields
- [ ] Test all lesson types (Video, Assignment, Live, Form, PDF, Text, Link)

---

### 2. Community Post Visibility (Security Issue)
**Priority**: P0 - Critical Security
**Status**: 🔴 Blocking

**Issue**:
- Posts are visible to ALL users across ALL communities and cohorts
- No access control or scoping
- Test posts appear globally

**Expected Behavior**:
- Convener should select visibility when posting:
  - Entire Community
  - Specific Cohort
- Posts only visible to members within selected scope
- Proper access control enforced

**Impact**: Privacy/security breach - users see content they shouldn't

**Fix Required**:
- [ ] Add visibility selector to post creation UI
- [ ] Implement backend access control
- [ ] Filter posts by community/cohort membership
- [ ] Add database indexes for performance
- [ ] Test with multiple communities/cohorts

---

### 3. Live Session Navigation Bug
**Priority**: P0 - Critical
**Status**: 🔴 Blocking

**Issue**:
- Clicking into Live Session shows blank screen
- Navigating back exits the app entirely
- Navigation stack corrupted

**Impact**: Live sessions completely unusable

**Fix Required**:
- [ ] Debug Live Session screen rendering
- [ ] Fix navigation stack handling
- [ ] Ensure proper back navigation
- [ ] Test navigation flow thoroughly

---

### 4. Learner Join Flow Bug
**Priority**: P0 - Critical
**Status**: 🔴 Blocking

**Issue**:
- Learner who joined `WLIMP-2026ABJE18YA` keeps seeing "Join Community" screen
- Shows "Already a member of this community" but doesn't proceed
- Programme dashboard not shown
- Join state not persisting

**Impact**: Learners cannot access joined communities

**Fix Required**:
- [ ] Debug join state persistence
- [ ] Check AsyncStorage/database sync
- [ ] Fix navigation after successful join
- [ ] Add proper error handling
- [ ] Test join flow end-to-end

---

## ⚠️ High Priority Issues (P1)

### 5. Lesson Type Routing Issues
**Priority**: P1 - High
**Status**: 🟡 Needs Fix

**Issues**:
- Lesson types not functioning reliably
- Assignment lesson type screen routed incorrectly
- Shows up on navigation buttons unexpectedly
- "Select Lesson Type" button unmatched
- Forms and surveys redirect to wrong location

**Fix Required**:
- [ ] Audit all lesson type routes
- [ ] Fix assignment screen routing
- [ ] Remove unexpected navigation buttons
- [ ] Test each lesson type creation flow
- [ ] Verify lesson type selection modal

---

### 6. Missing Convener Controls
**Priority**: P1 - High
**Status**: 🟡 Needs Implementation

**Missing Features**:
- Delete posts
- Delete lessons
- Delete modules
- Remove learners from cohort/community

**Impact**: Conveners cannot manage their content/members

**Fix Required**:
- [ ] Add delete post functionality
- [ ] Add delete lesson functionality
- [ ] Add delete module functionality
- [ ] Add remove learner functionality
- [ ] Add confirmation dialogs
- [ ] Implement soft delete (recommended)
- [ ] Add audit logging

---

### 7. Learner Profile Screen Failure
**Priority**: P1 - High
**Status**: 🔴 Broken

**Issue**:
- Learner profile screen fails to load/crashes

**Fix Required**:
- [ ] Debug profile screen errors
- [ ] Check API calls
- [ ] Fix data loading
- [ ] Add error boundaries
- [ ] Test profile updates

---

### 8. Learner Cannot Post in Community
**Priority**: P1 - High
**Status**: 🔴 Broken

**Issue**:
- Learners cannot create posts in Community feature
- Only conveners can post (incorrect)

**Expected**: Learners should be able to post in their communities

**Fix Required**:
- [ ] Check post creation permissions
- [ ] Enable learner post creation
- [ ] Test post visibility for learners
- [ ] Verify community engagement features

---

## 📋 Major Features Missing (P2)

### 9. Dashboard Screen (4th Tab)
**Priority**: P2 - Major Feature
**Status**: 🟡 Not Implemented

**Requirement**: Dedicated Dashboard as 4th navigation tab

**Learner Dashboard Should Show**:
- Current activities
- Upcoming sessions
- Assignment deadlines
- Progress tracking
- Cohort overview

**Convener Dashboard Should Show**:
- Programme overview
- Cohort analytics
- Learner progress
- Engagement stats
- Recent activity

**Fix Required**:
- [ ] Design dashboard UX (wireframes)
- [ ] Create dashboard screen component
- [ ] Implement learner dashboard
- [ ] Implement convener dashboard
- [ ] Add data aggregation APIs
- [ ] Add charts/visualizations
- [ ] Test performance with large datasets

---

### 10. Onboarding Flow Alignment
**Priority**: P2 - Important
**Status**: 🟡 Needs Review

**Issues**:
- Convener onboarding screens need review
- Flow doesn't distinguish between:
  - Community target market
  - Institutional target market
- Unclear structure and positioning

**Fix Required**:
- [ ] Review current onboarding flow
- [ ] Define target market segments
- [ ] Create separate flows for each segment
- [ ] Add market selection screen
- [ ] Update onboarding content
- [ ] Test with real users

---

### 11. Splash Screen Issue
**Priority**: P2 - Polish
**Status**: 🟡 Needs Improvement

**Issue**:
- Opening app shows placeholder before welcome screen
- Should show "Cohortle" branding
- Consider pulsating animation

**Fix Required**:
- [ ] Update splash screen image
- [ ] Add "Cohortle" branding
- [ ] Add pulsating animation (optional)
- [ ] Test on different devices
- [ ] Optimize splash screen duration

---

## 📊 Issue Summary

| Priority | Count | Status |
|----------|-------|--------|
| P0 (Critical) | 4 | 🔴 Blocking |
| P1 (High) | 4 | 🟡 Needs Fix |
| P2 (Major Feature) | 3 | 🟡 Not Implemented |
| **Total** | **11** | |

---

## 🎯 Recommended Fix Order

### Phase 1: Critical Blockers (Week 1)
1. **Community Post Visibility** (Security issue)
2. **Lesson Save Failure** (Core functionality)
3. **Learner Join Flow Bug** (User onboarding)
4. **Live Session Navigation** (Core feature)

### Phase 2: High Priority (Week 2)
5. **Lesson Type Routing Issues**
6. **Learner Profile Screen**
7. **Learner Post Creation**
8. **Convener Delete Controls**

### Phase 3: Major Features (Week 3-4)
9. **Dashboard Screen** (Requires UX design)
10. **Onboarding Flow Alignment**
11. **Splash Screen Polish**

---

## 🔍 Testing Checklist

After fixes, test:
- [ ] All lesson types (Video, Assignment, Live, Form, PDF, Text, Link)
- [ ] Post visibility across communities/cohorts
- [ ] Learner join flow (new and existing members)
- [ ] Live session navigation
- [ ] Profile screens (learner and convener)
- [ ] Post creation (learner and convener)
- [ ] Delete operations (posts, lessons, modules, members)
- [ ] Dashboard data accuracy
- [ ] Onboarding flows (both market segments)
- [ ] Splash screen on various devices

---

## 📝 Notes

- **Security**: Post visibility issue is a security concern - prioritize
- **UX**: Dashboard requires thoughtful design - don't rush
- **Testing**: Need comprehensive testing after each fix
- **Performance**: Monitor performance with large datasets
- **Logging**: Add proper error logging for debugging

---

## 🚀 Next Steps

1. **Triage**: Review and confirm priorities with team
2. **Assign**: Assign issues to developers
3. **Design**: Create dashboard wireframes/mockups
4. **Develop**: Fix critical issues first
5. **Test**: Comprehensive testing after each fix
6. **Deploy**: Staged rollout with monitoring
7. **Monitor**: Track error rates and user feedback

---

**Last Updated**: 2026-02-20
**Reported By**: User Testing
**Build**: v0.5
