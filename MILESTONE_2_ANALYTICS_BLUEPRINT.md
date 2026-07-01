# Milestone 2: Analytics & Reporting
## Convener Operations Center — Data Intelligence Layer

**Status:** In Progress  
**Priority:** High  
**Estimated Complexity:** Medium  
**Dependencies:** Milestone 1 (Data foundation + UI) ✅ Complete  

**Current Implementation Status:**
- Convener operations center overview page and cohort analytics integration completed in frontend.
- Organisation analytics, cohort health shortcut, and learner operations workflows are implemented and verified.
- Frontend production build validates successfully after cleanup.
- Backend analytics API and operational models have been added; generated migration logs are excluded from commits.

---

## Overview

Milestone 2 extends the Convener Operations Center with advanced analytics, providing conveners with actionable insights into learner health, engagement, and progress. This transforms raw operational data into strategic intelligence for proactive intervention.

## Strategic Objectives

1. **At-Risk Detection** — Identify struggling learners automatically
2. **Engagement Tracking** — Monitor participation and interaction patterns
3. **Progress Analytics** — Visualize learning trajectories
4. **Communication Intelligence** — Track outreach effectiveness
5. **Attendance Patterns** — Identify participation trends
6. **Predictive Insights** — Flag early warning signs before learners fail

---

## Feature Set: Analytics & Reporting

### 1. **Dashboard: Learner Health Overview**

**Purpose:** Single-screen view of cohort health status

**Components:**
```
┌─────────────────────────────────────────────────────┐
│          COHORT HEALTH DASHBOARD                     │
├─────────────────────────────────────────────────────┤
│  [📊 Overview] [🚨 At-Risk] [📈 Progress] [💬 Comms]│
│                                                       │
│  ┌─────────────┬─────────────┬─────────────┐        │
│  │ Overall     │ Engagement  │ Progress    │        │
│  │ Health: 78% │ Score: 6.2  │ Velocity: ↑ │        │
│  │ 🟢 Healthy  │ 📈 Normal   │ Trending up │        │
│  └─────────────┴─────────────┴─────────────┘        │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ At-Risk Learners: 5                             │  │
│  │ • Suspended: 2                                  │  │
│  │ • At-Risk Status: 3 (flagged)                   │  │
│  │ • Last Activity >7 days: 8                      │  │
│  │ • Completion <30%: 2                            │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ Recent Alerts (24h)                             │  │
│  │ • [🔴] Mike Johnson: No activity 10 days       │  │
│  │ • [🟡] Sarah Lee: Assignment overdue 3 days    │  │
│  │ • [🟡] Tom Wilson: 40% completion, week 2      │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Metrics Displayed:**
- Overall Health Score (0-100%)
- Engagement Score (0-10)
- Progress Velocity (trend indicator)
- Cohort Size & Status Breakdown
- At-Risk Count by Category
- Recent Alerts Feed

**Query Requirements:**
```sql
-- Overall Health Score Calculation:
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN lifecycle_stage = 'active' THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN lifecycle_stage = 'completed' THEN 1 ELSE 0 END) as completed_count,
  SUM(CASE WHEN lifecycle_stage = 'at_risk' THEN 1 ELSE 0 END) as at_risk_count,
  SUM(CASE WHEN lifecycle_stage IN ('suspended', 'removed') THEN 1 ELSE 0 END) as inactive_count,
  AVG(CASE WHEN graduation_status IS NOT NULL THEN 1 ELSE 0 END) * 100 as progress_avg
FROM enrollments
WHERE cohort_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

### 2. **At-Risk Learner Detection System**

**Purpose:** Identify struggling learners before they disengage completely

**At-Risk Indicators:**

| Category | Indicator | Threshold | Score Weight |
|----------|-----------|-----------|--------------|
| **Engagement** | Days since last activity | > 7 days | 25% |
| | Assignments submitted | < 50% of cohort | 20% |
| | Forum/Discussion posts | 0 in last week | 15% |
| **Progress** | Completion percentage | < 40% cohort average | 20% |
| | Assignment grades | < 60% (F grade) | 15% |
| | Milestones completed | < 50% expected | 10% |
| **Communication** | Messages sent by convener | 0 in last 14 days | 10% |
| | Support notes logged | 0 despite low grades | 10% |
| **Behavioral** | Lifecycle stage | = 'at_risk' | 30% |
| | Suspension history | Ever suspended | 5% |

**At-Risk Score Formula:**
```javascript
atRiskScore = (
  (daysSinceLastActivity / 14) * 0.25 +
  ((100 - assignmentCompletionRate) / 100) * 0.20 +
  ((100 - forumPostsCount) / avgForumPosts) * 0.15 +
  (((cohortAvgCompletion - learnerCompletion) / cohortAvgCompletion) * 0.20) +
  (((100 - avgGrade) / 100) * 0.15 +
  ((expectedMilestones - completedMilestones) / expectedMilestones) * 0.10 +
  (daysSinceConvenerContact / 28) * 0.10 +
  (!supportNotesRecent ? 0.10 : 0) +
  (lifecycle_stage === 'at_risk' ? 0.30 : 0) +
  (wasSuspended ? 0.05 : 0)
) / 1.45 * 100; // normalize to 0-100

// Classification:
// 0-25: Green (Healthy)
// 26-50: Yellow (Monitor)
// 51-75: Orange (At-Risk)
// 76-100: Red (Critical)
```

**Backend Service: `LearnerHealthService`**

```javascript
// cohortle-api/services/LearnerHealthService.js

class LearnerHealthService {
  // Calculate at-risk score for single learner
  static async calculateAtRiskScore(enrollmentId) {
    const enrollment = await Enrollment.findByPk(enrollmentId);
    const metrics = await this.gatherHealthMetrics(enrollmentId);
    return this.computeAtRiskScore(enrollment, metrics);
  }

  // Batch calculate for cohort
  static async getAtRiskLearners(cohortId, threshold = 51) {
    const enrollments = await Enrollment.findAll({
      where: { cohort_id: cohortId, lifecycle_stage: { [Op.ne]: 'removed' } }
    });
    
    const scores = await Promise.all(
      enrollments.map(e => this.calculateAtRiskScore(e.id))
    );
    
    return scores
      .filter(s => s.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  // Cohort health aggregate
  static async getCohortHealth(cohortId) {
    const enrollments = await Enrollment.findAll({ where: { cohort_id: cohortId } });
    const allScores = await Promise.all(
      enrollments.map(e => this.calculateAtRiskScore(e.id))
    );

    return {
      overallScore: this.aggregateScore(allScores),
      healthDistribution: {
        healthy: allScores.filter(s => s.score < 25).length,
        monitor: allScores.filter(s => s.score >= 25 && s.score < 50).length,
        atRisk: allScores.filter(s => s.score >= 50 && s.score < 75).length,
        critical: allScores.filter(s => s.score >= 75).length,
      },
      engagementScore: this.calculateEngagementScore(enrollments),
      progressVelocity: this.calculateProgressVelocity(enrollments),
    };
  }

  // Supporting methods
  static async gatherHealthMetrics(enrollmentId) {
    // Fetch: last activity, assignment completion, forum posts, grades,
    // milestones, communication history, support notes, lifecycle events
  }

  static computeAtRiskScore(enrollment, metrics) {
    // Apply weighted formula
  }

  static aggregateScore(scores) {
    // Average with weighting for critical cases
  }

  static calculateEngagementScore(enrollments) {
    // 0-10 scale based on activity patterns
  }

  static calculateProgressVelocity(enrollments) {
    // Trend direction: up, stable, down
  }
}

module.exports = LearnerHealthService;
```

---

### 3. **Progress Analytics View**

**Purpose:** Track learner progression through course modules/milestones

**Visualization: Progress Heatmap**

```
┌────────────────────────────────────────────────────────┐
│ LEARNER PROGRESS TIMELINE                               │
├────────────────────────────────────────────────────────┤
│ Learner             │ W1 │ W2 │ W3 │ W4 │ W5 │ Final   │
├─────────────────────┼────┼────┼────┼────┼────┼─────────┤
│ Mike Johnson        │ 🟢 │ 🟢 │ 🟡 │ 🟡 │ 🔴 │ 20%     │
│ Sarah Lee           │ 🟢 │ 🟢 │ 🟢 │ 🟢 │ 🟢 │ 100%    │
│ Tom Wilson          │ 🟢 │ 🟡 │ 🟡 │ ⚪ │ ⚪ │ 40%     │
│ Emma Chen           │ 🟢 │ 🟢 │ 🟢 │ 🟢 │ 🟡 │ 80%     │
│ James Rodriguez     │ 🟢 │ 🟢 │ 🟢 │ 🟢 │ 🟢 │ 95%     │
├─────────────────────┼────┼────┼────┼────┼────┼─────────┤
│ Cohort Average      │100%│ 96%│ 88%│ 76%│ 64%│ 67% ↓   │
└────────────────────────────────────────────────────────┘

Legend:
🟢 = On Track (>80%)
🟡 = Behind (40-80%)
🔴 = Critical (<40%)
⚪ = Not Started (0%)
```

**Features:**
- Week-by-week completion tracking
- Color-coded progress indicators
- Hover for detailed breakdown
- Trend analysis (accelerating, stable, decelerating)
- Comparative view (individual vs. cohort average)
- Export to CSV for reporting

**Data Structure:**
```javascript
{
  enrollmentId: 123,
  learnerName: "Mike Johnson",
  modules: [
    {
      weekNumber: 1,
      moduleName: "Fundamentals",
      status: "completed",
      completionDate: "2026-01-08",
      score: 85,
      timeSpent: 240, // minutes
      trend: "on-track"
    },
    {
      weekNumber: 2,
      moduleName: "Core Concepts",
      status: "completed",
      completionDate: "2026-01-15",
      score: 78,
      timeSpent: 320,
      trend: "on-track"
    },
    // ... more modules
  ],
  overallProgress: 0.67,
  velocity: "slowing", // accelerating | stable | slowing
  predictedCompletion: "2026-02-28"
}
```

---

### 4. **Engagement Analytics**

**Purpose:** Measure participation depth and consistency

**Engagement Dashboard:**

```
┌─────────────────────────────────────────────────────┐
│ ENGAGEMENT ANALYTICS                                 │
├─────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐  │
│ │ Engagement Funnel (Weekly Avg)                 │  │
│ │                                                │  │
│ │ Content Views:        ████████████ 87%        │  │
│ │ Assignments Started:  ██████████░░ 75%        │  │
│ │ Assignments Submitted:████████░░░░ 68%        │  │
│ │ Forum Posts:          ████░░░░░░░░ 32%        │  │
│ │ Office Hours Attended:██░░░░░░░░░░ 18%        │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Engagement Score Distribution                  │  │
│ │                                                │  │
│ │ High (8-10):      ██████░░░░░░░░░░ 35% (14)  │  │
│ │ Medium (5-7):     ███████████░░░░░ 55% (22)  │  │
│ │ Low (2-4):        ░░░░░░░░░░░░░░░░ 8% (3)   │  │
│ │ Inactive (0-1):   ░░░░░░░░░░░░░░░░ 2% (1)   │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Activity Timeline (Last 30 Days)               │  │
│ │ Daily Activity:    ▂▅▇█▆▄▂▁▃▆█▇▅▃▂▄▆█▇▆▅▃▂▁│  │
│ │ Week 1: 847 events │ Week 2: 756 │ ...       │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Metrics Calculated:**
- **Engagement Score** (0-10): Composite of activity frequency, depth, consistency
- **Session Duration**: Time spent per session, trending
- **Interaction Types**: Content views, assignments, forum posts, messages
- **Peak Activity Times**: When learners are most active
- **Streaks**: Consecutive days of activity
- **Consistency**: Regularity of engagement

**Query Template:**
```sql
SELECT
  e.id as enrollment_id,
  e.firstname, e.lastname,
  COUNT(DISTINCT DATE(la.created_at)) as active_days,
  COUNT(DISTINCT CASE WHEN la.activity_type = 'lesson_viewed' THEN la.id END) as lessons_viewed,
  COUNT(DISTINCT CASE WHEN la.activity_type = 'assignment_submitted' THEN la.id END) as assignments_submitted,
  COUNT(DISTINCT CASE WHEN la.activity_type = 'forum_post' THEN la.id END) as forum_posts,
  AVG(TIMESTAMPDIFF(MINUTE, la.started_at, la.ended_at)) as avg_session_duration,
  MAX(la.created_at) as last_activity_at
FROM enrollments e
LEFT JOIN learner_activity la ON e.id = la.enrollment_id
WHERE e.cohort_id = ? AND la.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY e.id
ORDER BY active_days DESC;
```

---

### 5. **Communication Effectiveness Report**

**Purpose:** Track how well outreach is working

**Report View:**

```
┌──────────────────────────────────────────────────┐
│ COMMUNICATION EFFECTIVENESS                      │
├──────────────────────────────────────────────────┤
│ Total Messages Sent: 247                         │
│ Average Response Rate: 68%                       │
│ Average Response Time: 4.2 hours                 │
│                                                  │
│ By Channel:                                      │
│ 📧 Email         122 sent, 74% opened, 62% acted│
│ 💬 In-App        98 sent, 81% read, 75% acted   │
│ 🔔 Notification  27 sent, 52% viewed, 41% acted │
│                                                  │
│ Most Effective Messages:                        │
│ • "Assignment Deadline 24h": 89% click-through  │
│ • "You're Behind on Progress": 78% response     │
│ • "New Lesson Available": 65% engagement        │
│                                                  │
│ Least Effective:                                │
│ • "Weekly Digest": 31% open rate                │
│ • "Survey Request": 18% completion              │
│ • "General Announcement": 22% click-through     │
└──────────────────────────────────────────────────┘
```

**Data to Track:**
- Messages by channel (email, SMS, in-app, notification)
- Delivery status (pending, sent, delivered, bounced)
- Open/read rates (timestamps)
- Click-through rates (link tracking)
- Response patterns (time to response, type of response)
- Template effectiveness (which messages get best engagement)

**Backend Enhancement:**
```javascript
// Extend learner_communication_events table with:
- click_count (number of link clicks)
- click_timestamp (when first clicked)
- response_content (learner's reply if any)
- response_timestamp (when replied)
- effectiveness_score (calculated metric)
```

---

### 6. **Attendance & Session Patterns**

**Purpose:** Identify participation behaviors and patterns

**Attendance Report:**

```
┌─────────────────────────────────────────────────┐
│ ATTENDANCE PATTERNS (Last 8 Weeks)              │
├─────────────────────────────────────────────────┤
│ Learner              │ Live │ Wshp │ OH │ Score │
│                      │ Sess │ Shop │ Hrs│       │
├──────────────────────┼──────┼──────┼────┼───────┤
│ Sarah Lee            │ 8/8  │ 4/4  │ 2  │ 9.2   │
│ Mike Johnson         │ 6/8  │ 3/4  │ 0  │ 7.1   │
│ Tom Wilson           │ 2/8  │ 0/4  │ 0  │ 2.3   │
│ Emma Chen            │ 8/8  │ 4/4  │ 1  │ 9.0   │
│ James Rodriguez      │ 7/8  │ 4/4  │ 2  │ 8.8   │
├──────────────────────┼──────┼──────┼────┼───────┤
│ Cohort Average       │ 6.2/8│ 3/4  │1.0 │ 7.3   │
└─────────────────────────────────────────────────┘

Attendance Patterns:
├─ Consistent (>80% attendance): 3 learners (Sarah, Emma, James)
├─ Variable (50-80% attendance): 2 learners (Mike, ...)
├─ Irregular (<50% attendance): 1 learner (Tom)
└─ No Attendance (<20%): 0 learners

Session Type Preferences:
├─ Prefer Live Sessions: 4/5
├─ Prefer Workshops: 3/5
├─ Prefer Office Hours: 1/5
└─ No Clear Preference: 1/5
```

**Metrics:**
- Attendance rate by session type
- Session type preferences
- Attendance consistency (streaks vs. sporadic)
- Time of day preferences
- Correlation between attendance and performance

---

### 7. **Cohort Benchmarking & Comparative Analytics**

**Purpose:** Compare cohort performance against targets and other cohorts

**Benchmarking Report:**

```
┌────────────────────────────────────────────────────┐
│ COHORT PERFORMANCE VS. BENCHMARKS                  │
├────────────────────────────────────────────────────┤
│ Metric                    │ Current │ Target │ ±   │
├───────────────────────────┼─────────┼────────┼─────┤
│ Completion Rate           │ 67%     │ 85%    │ -18%│
│ Average Score             │ 74%     │ 75%    │  -1%│
│ Engagement Score          │ 6.2/10  │ 7/10   │ -0.8│
│ Assignment Submission     │ 82%     │ 90%    │  -8%│
│ On-Time Completion        │ 55%     │ 70%    │ -15%│
│ Attendance Rate           │ 77%     │ 85%    │  -8%│
│ Learner Satisfaction      │ 8.1/10  │ 8/10   │ +0.1│
│ Support Ticket Response   │ 4.2h    │ 24h    │ ✓   │
└────────────────────────────────────────────────────┘

Areas Needing Attention:
🔴 On-Time Completion (-15%) — Consider deadline extensions/support
🟡 Completion Rate (-18%) — Focus on at-risk learners
🟡 Assignment Submission (-8%) — Increase submission reminders
```

---

### 8. **Predictive Alerts & Early Warning System**

**Purpose:** Flag emerging issues before they become critical

**Alert Types:**

| Alert | Condition | Trigger | Action |
|-------|-----------|---------|--------|
| **Activity Drop** | Last activity > 10 days | Automatic | Reach out, understand barrier |
| **Grade Decline** | Assignment score drops >15% from average | Automatic | Offer tutoring |
| **Milestone Overdue** | Expected milestone not completed after deadline | Automatic | Check-in on progress |
| **Disengagement Pattern** | 3+ days without any activity when baseline is daily | Automatic | Personalized outreach |
| **Late Submission Trend** | Last 3 assignments submitted after deadline | Automatic | Discuss time management |
| **Forum Silence** | No posts for 2 weeks after baseline | Automatic | Invite to community |
| **Office Hours No-Show** | Registered but didn't attend 2+ sessions | Automatic | Reschedule/remove block |

**Alert Management Service:**

```javascript
// cohortle-api/services/AlertService.js

class AlertService {
  // Generate alerts for cohort
  static async generateCohortAlerts(cohortId) {
    const enrollments = await Enrollment.findAll({ where: { cohort_id: cohortId } });
    const alerts = [];

    for (const enrollment of enrollments) {
      alerts.push(...await this.checkActivityDrop(enrollment));
      alerts.push(...await this.checkGradeDecline(enrollment));
      alerts.push(...await this.checkMilestoneOverdue(enrollment));
      alerts.push(...await this.checkDisengagementPattern(enrollment));
      alerts.push(...await this.checkLateSubmissionTrend(enrollment));
    }

    return alerts.filter(a => a !== null); // Remove null (no alert) entries
  }

  // Check specific condition and create alert if triggered
  static async checkActivityDrop(enrollment) {
    const daysSinceLastActivity = await this.getDaysSinceLastActivity(enrollment.id);
    if (daysSinceLastActivity > 10) {
      return [{
        enrollmentId: enrollment.id,
        type: 'activity_drop',
        severity: 'high',
        message: `${enrollment.firstName} has no activity for ${daysSinceLastActivity} days`,
        suggestedAction: 'Send check-in message',
        createdAt: new Date(),
      }];
    }
    return [];
  }

  // Similar methods for other alert types...

  static async checkGradeDecline(enrollment) { /* ... */ }
  static async checkMilestoneOverdue(enrollment) { /* ... */ }
  static async checkDisengagementPattern(enrollment) { /* ... */ }
  static async checkLateSubmissionTrend(enrollment) { /* ... */ }
}

module.exports = AlertService;
```

---

## Frontend: Analytics Components

### Component Structure

```
cohortle-web/src/components/analytics/
├── DashboardOverview.tsx          — Health metrics & stats
├── AtRiskLearnersList.tsx         — At-risk learners detail
├── ProgressHeatmap.tsx            — Week-by-week progress grid
├── EngagementChart.tsx            — Activity & participation
├── CommunicationReport.tsx        — Message effectiveness
├── AttendanceReport.tsx           — Session attendance
├── BenchmarkingView.tsx           — Cohort vs. targets
├── AlertsPanel.tsx                — Early warning alerts
├── AnalyticsExport.tsx            — CSV/PDF export
└── index.ts
```

### Component Examples

**1. DashboardOverview.tsx**
```typescript
interface DashboardProps {
  cohortId: string;
  programmeName: string;
  cohortName: string;
}

export function DashboardOverview({ cohortId, programmeName, cohortName }: DashboardProps) {
  const { data: health, isLoading } = useQuery({
    queryKey: ['cohort-health', cohortId],
    queryFn: () => getCohortHealth(cohortId),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Health Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HealthCard
          label="Overall Health"
          value={health.overallScore}
          status={getHealthStatus(health.overallScore)}
          trend={health.trend}
        />
        <HealthCard
          label="Engagement"
          value={health.engagementScore}
          max={10}
        />
        <HealthCard
          label="Completion Rate"
          value={health.completionRate}
          max={100}
          unit="%"
        />
        <HealthCard
          label="On-Time Rate"
          value={health.onTimeRate}
          max={100}
          unit="%"
        />
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Learner Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCount
            label="Healthy"
            count={health.healthDistribution.healthy}
            color="green"
            percentage={(health.healthDistribution.healthy / health.total) * 100}
          />
          <StatusCount
            label="Monitor"
            count={health.healthDistribution.monitor}
            color="yellow"
          />
          <StatusCount
            label="At-Risk"
            count={health.healthDistribution.atRisk}
            color="orange"
          />
          <StatusCount
            label="Critical"
            count={health.healthDistribution.critical}
            color="red"
          />
        </div>
      </div>

      {/* Recent Alerts */}
      <AlertsPanel cohortId={cohortId} limit={5} />
    </div>
  );
}
```

**2. AtRiskLearnersList.tsx**
```typescript
export function AtRiskLearnersList({ cohortId }: { cohortId: string }) {
  const { data: atRiskLearners, isLoading } = useQuery({
    queryKey: ['at-risk-learners', cohortId],
    queryFn: () => getAtRiskLearners(cohortId),
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-red-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-red-900">
          At-Risk Learners: {atRiskLearners?.length || 0}
        </h3>
      </div>
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Learner
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Risk Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Primary Issues
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Last Contact
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {atRiskLearners?.map((learner) => (
            <tr key={learner.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {learner.firstName} {learner.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <RiskBadge score={learner.riskScore} />
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-600">
                  {learner.issues.map(issue => (
                    <span key={issue} className="inline-block mr-2 mb-1">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        {issue}
                      </span>
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(learner.lastContactAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                  Reach Out
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Backend Implementation: New Endpoints

### Analytics API Routes

```javascript
// cohortle-api/routes/analytics.js

router.get('/v1/api/analytics/cohorts/:cohortId/health', 
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getCohortHealth);

router.get('/v1/api/analytics/cohorts/:cohortId/at-risk',
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getAtRiskLearners);

router.get('/v1/api/analytics/enrollments/:enrollmentId/progress',
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getProgressAnalytics);

router.get('/v1/api/analytics/cohorts/:cohortId/engagement',
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getEngagementAnalytics);

router.get('/v1/api/analytics/cohorts/:cohortId/communication',
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getCommunicationReport);

router.get('/v1/api/analytics/cohorts/:cohortId/attendance',
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getAttendanceReport);

router.get('/v1/api/analytics/cohorts/:cohortId/alerts',
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getAlerts);

router.get('/v1/api/analytics/cohorts/:cohortId/benchmark',
  TokenMiddleware({ role: 'convener|administrator' }),
  AnalyticsController.getBenchmarkingReport);

module.exports = router;
```

### AnalyticsController

```javascript
// cohortle-api/controllers/AnalyticsController.js

class AnalyticsController {
  static async getCohortHealth(req, res) {
    try {
      const { cohortId } = req.params;
      const health = await LearnerHealthService.getCohortHealth(cohortId);
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAtRiskLearners(req, res) {
    try {
      const { cohortId } = req.params;
      const { threshold = 51 } = req.query;
      const atRisk = await LearnerHealthService.getAtRiskLearners(cohortId, parseInt(threshold));
      res.json(atRisk);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ... other methods
}

module.exports = AnalyticsController;
```

---

## Database Enhancements

### New Migration: Analytics Support Tables

```javascript
// 20260730_create_analytics_cache_tables.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Cache tables for computed metrics (for performance)
    await queryInterface.createTable('cohort_analytics_cache', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cohort_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cohorts', key: 'id' },
      },
      overall_health_score: Sequelize.FLOAT,
      engagement_score: Sequelize.FLOAT,
      completion_rate: Sequelize.FLOAT,
      on_time_rate: Sequelize.FLOAT,
      at_risk_count: Sequelize.INTEGER,
      progress_velocity: Sequelize.ENUM('accelerating', 'stable', 'decelerating'),
      calculated_at: Sequelize.DATE,
      expires_at: Sequelize.DATE,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.createTable('learner_health_cache', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      enrollment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'enrollments', key: 'id' },
      },
      risk_score: Sequelize.FLOAT,
      health_status: Sequelize.ENUM('healthy', 'monitor', 'at_risk', 'critical'),
      primary_issues: Sequelize.JSON,
      calculated_at: Sequelize.DATE,
      expires_at: Sequelize.DATE,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    // Indexes for performance
    await queryInterface.addIndex('cohort_analytics_cache', ['cohort_id']);
    await queryInterface.addIndex('cohort_analytics_cache', ['expires_at']);
    await queryInterface.addIndex('learner_health_cache', ['enrollment_id']);
    await queryInterface.addIndex('learner_health_cache', ['health_status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('cohort_analytics_cache');
    await queryInterface.dropTable('learner_health_cache');
  },
};
```

---

## Implementation Phases

### Phase 2A: Foundation (1-2 weeks)
- ✅ Create LearnerHealthService (at-risk score calculation)
- ✅ Create AlertService (alert generation)
- ✅ Create Analytics database cache tables (migration)
- ✅ Add analytics API endpoints (7 routes)
- ✅ Add AnalyticsController (7 methods)

### Phase 2B: Frontend Components (1-2 weeks)
- ✅ Create DashboardOverview component
- ✅ Create AtRiskLearnersList component
- ✅ Create ProgressHeatmap component
- ✅ Create EngagementChart component
- ✅ Create AlertsPanel component
- ✅ Create AnalyticsPage (main container)

### Phase 2C: Integration (1 week)
- ✅ Add analytics tab to Operations Center
- ✅ Wire up React Query hooks
- ✅ Add export functionality (CSV)
- ✅ Add real-time alert notifications
- ✅ Performance optimization & caching

---

## Key Considerations

### Performance
- **Cache computed metrics** to avoid expensive calculations on every request
- **Pagination** for large learner lists
- **Incremental calculation** for health scores
- **Background jobs** for alert generation (run nightly or scheduled)

### Data Privacy
- **Audit logging** for analytics access
- **Role-based access** (only conveners can see their cohort analytics)
- **Data retention** policy (30-90 days rolling window)

### User Experience
- **Real-time updates** via WebSocket for alerts (optional, phase 3)
- **Export functionality** for reports (CSV, PDF)
- **Custom alerts** configuration (conveners choose thresholds)
- **Historical data** comparison (week-over-week, month-over-month)

---

## Deliverables

**Backend:**
- LearnerHealthService.js (~300 lines)
- AlertService.js (~250 lines)
- AnalyticsController.js (~250 lines)
- analytics.js routes (~50 lines)
- Migration: analytics cache tables (~100 lines)

**Frontend:**
- 8 analytics components (~1,500 lines total)
- AnalyticsPage.tsx (~200 lines)
- useAnalytics custom hook (~150 lines)
- analyticsApi.ts functions (~100 lines)

**Documentation:**
- Analytics user guide
- Alert configuration guide
- Performance tuning guide

---

## Success Metrics

✅ At-risk detection catches 80%+ of struggling learners before failure
✅ Alert generation runs in <2s for cohort of 50 learners
✅ Dashboard loads in <1.5s (with caching)
✅ Conveners report 30%+ improvement in intervention timeliness
✅ Engagement metrics correlate with completion rates (r > 0.7)
✅ Communication reports show 60%+ channel effectiveness difference

---

## Timeline

**Estimated Duration:** 3-4 weeks  
**Complexity:** Medium  
**Team Size:** 1-2 engineers

**Milestones:**
- Week 1: Backend services + database
- Week 2: API endpoints + integration
- Week 3: Frontend components
- Week 4: Testing + optimization + polish

---

**Next: Ready for Phase 2A Backend Implementation?**

Create LearnerHealthService, AlertService, and analytics database infrastructure.
