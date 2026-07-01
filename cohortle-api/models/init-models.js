var DataTypes = require("sequelize").DataTypes;
var _activity_logs = require("./activity_logs");
var _announcement_comments = require("./announcement_comments");
var _announcements = require("./announcements");
var _cohort_members = require("./cohort_members");
var _cohorts = require("./cohorts");
var _communities = require("./communities");
var _community_members = require("./community_members");
var _programme_modules = require("./programme_modules");
var _discussion_comments = require("./discussion_comments");
var _discussions = require("./discussions");
var _lessonProgress = require("./lessonProgress");
var _lesson_schedule = require("./lesson_schedule");
var _module_lessons = require("./module_lessons");
var _partner_contexts = require("./partner_contexts");
var _lesson_comments = require("./lesson_comments");
var _programme_progress = require("./programme_progress");
var _programmes = require("./programmes");
var _programme_intents = require("./programme_intents");
var _users = require("./users");
var _weeks = require("./weeks");
var _lessons = require("./lessons");
var _enrollments = require("./enrollments");
var _lesson_completions = require("./lesson_completions");
var _cohort_posts = require("./cohort_posts");
var _post_likes = require("./post_likes");
var _post_comments = require("./post_comments");
var _user_preferences = require("./user_preferences");
var _learning_goals = require("./learning_goals");
var _achievements = require("./achievements");
var _user_achievements = require("./user_achievements");
var _roles = require("./roles");
var _permissions = require("./permissions");
var _role_permissions = require("./role_permissions");
var _user_role_assignments = require("./user_role_assignments");
var _role_assignment_history = require("./role_assignment_history");
var _user_streaks = require("./user_streaks");
var _applications = require("./applications");
var _organisation_stats = require("./organisation_stats");
var _testimonials = require("./testimonials");
var _organisation_faqs = require("./organisation_faqs");
var _LearnerNote = require("./LearnerNote");
var _LearnerCommunicationEvent = require("./LearnerCommunicationEvent");
var _LearnerAttendance = require("./LearnerAttendance");
var _learner_payments = require("./LearnerPayment");
var _installment_plans = require("./InstallmentPlan");

function initModels(sequelize) {
  var activity_logs = _activity_logs(sequelize, DataTypes);
  var announcement_comments = _announcement_comments(sequelize, DataTypes);
  var announcements = _announcements(sequelize, DataTypes);
  var cohort_members = _cohort_members(sequelize, DataTypes);
  var cohorts = _cohorts(sequelize, DataTypes);
  var communities = _communities(sequelize, DataTypes);
  var community_members = _community_members(sequelize, DataTypes);
  var programme_modules = _programme_modules(sequelize, DataTypes);
  var discussion_comments = _discussion_comments(sequelize, DataTypes);
  var discussions = _discussions(sequelize, DataTypes);
  var lessonProgress = _lessonProgress(sequelize, DataTypes);
  var lesson_schedule = _lesson_schedule(sequelize, DataTypes);
  var module_lessons = _module_lessons(sequelize, DataTypes);
  var partner_contexts = _partner_contexts(sequelize, DataTypes);
  var lesson_comments = _lesson_comments(sequelize, DataTypes);
  var programme_progress = _programme_progress(sequelize, DataTypes);
  var programmes = _programmes(sequelize, DataTypes);
  var programme_intents = _programme_intents(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var weeks = _weeks(sequelize, DataTypes);
  var lessons = _lessons(sequelize, DataTypes);
  var enrollments = _enrollments(sequelize, DataTypes);
  var lesson_completions = _lesson_completions(sequelize, DataTypes);
  var cohort_posts = _cohort_posts(sequelize, DataTypes);
  var post_likes = _post_likes(sequelize, DataTypes);
  var post_comments = _post_comments(sequelize, DataTypes);
  var user_preferences = _user_preferences(sequelize, DataTypes);
  var learning_goals = _learning_goals(sequelize, DataTypes);
  var achievements = _achievements(sequelize, DataTypes);
  var user_achievements = _user_achievements(sequelize, DataTypes);
  var roles = _roles(sequelize, DataTypes);
  var permissions = _permissions(sequelize, DataTypes);
  var role_permissions = _role_permissions(sequelize, DataTypes);
  var user_role_assignments = _user_role_assignments(sequelize, DataTypes);
  var role_assignment_history = _role_assignment_history(sequelize, DataTypes);
  var user_streaks = _user_streaks(sequelize, DataTypes);
  var applications = _applications(sequelize, DataTypes);
  var organisation_stats = _organisation_stats(sequelize, DataTypes);
  var testimonials = _testimonials(sequelize, DataTypes);
  var organisation_faqs = _organisation_faqs(sequelize, DataTypes);
  var learner_note = _LearnerNote(sequelize, DataTypes);
  var learner_communication_event = _LearnerCommunicationEvent(sequelize, DataTypes);
  var learner_attendance = _LearnerAttendance(sequelize, DataTypes);
  var learner_payments = _learner_payments(sequelize, DataTypes);
  var installment_plans = _installment_plans(sequelize, DataTypes);

  // Community Associations
  communities.belongsTo(users, { as: "owner", foreignKey: "owner_id" });
  users.hasMany(communities, { as: "communities", foreignKey: "owner_id" });

  community_members.belongsTo(communities, { as: "community", foreignKey: "community_id" });
  communities.hasMany(community_members, { as: "community_members", foreignKey: "community_id" });

  community_members.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(community_members, { as: "community_members", foreignKey: "user_id" });

  // Programme Associations
  programmes.belongsTo(communities, { as: "community", foreignKey: "community_id" });
  communities.hasMany(programmes, { as: "programmes", foreignKey: "community_id" });

  programme_modules.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(programme_modules, { as: "modules", foreignKey: "programme_id" });

  // Cohort Associations
  cohorts.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(cohorts, { as: "cohorts", foreignKey: "programme_id" });

  cohort_members.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(cohort_members, { as: "members", foreignKey: "cohort_id" });

  cohort_members.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(cohort_members, { as: "cohort_members", foreignKey: "user_id" });

  // Lesson Associations
  module_lessons.belongsTo(programme_modules, { as: "module", foreignKey: "module_id" });
  programme_modules.hasMany(module_lessons, { as: "lessons", foreignKey: "module_id" });

  // Announcements
  announcements.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(announcements, { as: "announcements", foreignKey: "programme_id" });
  announcements.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(announcements, { as: "announcements", foreignKey: "cohort_id" });
  announcements.belongsTo(users, { as: "creator", foreignKey: "created_by" });

  // Announcement Comments
  announcement_comments.belongsTo(announcements, { as: "announcement", foreignKey: "announcement_id" });
  announcements.hasMany(announcement_comments, { as: "comments", foreignKey: "announcement_id" });
  announcement_comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(announcement_comments, { as: "announcement_comments", foreignKey: "user_id" });

  // Discussions
  discussions.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(discussions, { as: "discussions", foreignKey: "programme_id" });
  discussions.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(discussions, { as: "discussions", foreignKey: "cohort_id" });
  discussions.belongsTo(module_lessons, { as: "lesson", foreignKey: "lesson_id" });
  module_lessons.hasMany(discussions, { as: "discussions", foreignKey: "lesson_id" });
  discussions.belongsTo(users, { as: "creator", foreignKey: "created_by" });

  // Discussion Comments
  discussion_comments.belongsTo(discussions, { as: "discussion", foreignKey: "discussion_id" });
  discussions.hasMany(discussion_comments, { as: "comments", foreignKey: "discussion_id" });
  discussion_comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(discussion_comments, { as: "discussion_comments", foreignKey: "user_id" });

  // Lesson Schedule
  lesson_schedule.belongsTo(module_lessons, { as: "lesson", foreignKey: "lesson_id" });
  module_lessons.hasMany(lesson_schedule, { as: "schedules", foreignKey: "lesson_id" });
  lesson_schedule.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(lesson_schedule, { as: "schedules", foreignKey: "cohort_id" });

  // Lesson Comments
  lesson_comments.belongsTo(module_lessons, { as: "lesson", foreignKey: "lesson_id" });
  module_lessons.hasMany(lesson_comments, { as: "comments", foreignKey: "lesson_id" });
  lesson_comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(lesson_comments, { as: "lesson_comments", foreignKey: "user_id" });
  lesson_comments.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(lesson_comments, { as: "lesson_comments", foreignKey: "cohort_id" });

  // Activity Logs
  activity_logs.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(activity_logs, { as: "activity_logs", foreignKey: "user_id" });

  // Programme Intent Associations
  programme_intents.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(programme_intents, { as: "programme_intents", foreignKey: "user_id" });

  // Partner Context Associations
  partner_contexts.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasOne(partner_contexts, { as: "partner_context", foreignKey: "user_id" });

  // Programme Progress
  programme_progress.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(programme_progress, { as: "progress", foreignKey: "user_id" });
  programme_progress.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(programme_progress, { as: "progress", foreignKey: "programme_id" });
  programme_progress.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(programme_progress, { as: "progress", foreignKey: "cohort_id" });

  // WLIMP Weeks Associations
  weeks.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(weeks, { as: "weeks", foreignKey: "programme_id" });

  // WLIMP Lessons Associations
  lessons.belongsTo(weeks, { as: "week", foreignKey: "week_id" });
  weeks.hasMany(lessons, { as: "lessons", foreignKey: "week_id" });

  // WLIMP Enrollments Associations
  enrollments.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(enrollments, { as: "enrollments", foreignKey: "cohort_id" });
  enrollments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(enrollments, { as: "enrollments", foreignKey: "user_id" });

  enrollments.hasMany(learner_note, { as: "notes", foreignKey: "enrollment_id" });
  learner_note.belongsTo(enrollments, { as: "enrollment", foreignKey: "enrollment_id" });

  enrollments.hasMany(learner_communication_event, { as: "communicationEvents", foreignKey: "enrollment_id" });
  learner_communication_event.belongsTo(enrollments, { as: "enrollment", foreignKey: "enrollment_id" });

  enrollments.hasMany(learner_attendance, { as: "attendance", foreignKey: "enrollment_id" });
  learner_attendance.belongsTo(enrollments, { as: "enrollment", foreignKey: "enrollment_id" });

  enrollments.hasMany(learner_payments, { as: "payments", foreignKey: "enrollment_id" });
  learner_payments.belongsTo(enrollments, { as: "enrollment", foreignKey: "enrollment_id" });

  installment_plans.belongsTo(enrollments, { as: "enrollment", foreignKey: "enrollment_id" });
  enrollments.hasMany(installment_plans, { as: "installmentPlans", foreignKey: "enrollment_id" });

  // Lesson Completions Associations
  lesson_completions.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(lesson_completions, { as: "lesson_completions", foreignKey: "user_id" });
  lesson_completions.belongsTo(lessons, { as: "lesson", foreignKey: "lesson_id" });
  lessons.hasMany(lesson_completions, { as: "completions", foreignKey: "lesson_id" });
  lesson_completions.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(lesson_completions, { as: "lesson_completions", foreignKey: "cohort_id" });

  // Cohort Posts Associations
  cohort_posts.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(cohort_posts, { as: "posts", foreignKey: "cohort_id" });
  cohort_posts.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(cohort_posts, { as: "cohort_posts", foreignKey: "user_id" });

  // Post Likes Associations
  post_likes.belongsTo(cohort_posts, { as: "post", foreignKey: "post_id" });
  cohort_posts.hasMany(post_likes, { as: "likes", foreignKey: "post_id" });
  post_likes.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(post_likes, { as: "post_likes", foreignKey: "user_id" });

  // Post Comments Associations
  post_comments.belongsTo(cohort_posts, { as: "post", foreignKey: "post_id" });
  cohort_posts.hasMany(post_comments, { as: "comments", foreignKey: "post_id" });
  post_comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(post_comments, { as: "post_comments", foreignKey: "user_id" });

  // User Preferences Associations
  user_preferences.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasOne(user_preferences, { as: "preferences", foreignKey: "user_id" });

  // Learning Goals Associations
  learning_goals.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasOne(learning_goals, { as: "learning_goal", foreignKey: "user_id" });

  // User Achievements Associations
  user_achievements.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(user_achievements, { as: "user_achievements", foreignKey: "user_id" });
  user_achievements.belongsTo(achievements, { as: "achievement", foreignKey: "achievement_id" });
  achievements.hasMany(user_achievements, { as: "user_achievements", foreignKey: "achievement_id" });

  // Role Associations
  users.belongsTo(roles, { as: "role", foreignKey: "role_id" });
  roles.hasMany(users, { as: "users", foreignKey: "role_id" });

  // Role Permissions Associations (Many-to-Many)
  roles.belongsToMany(permissions, { 
    through: role_permissions, 
    as: "permissions", 
    foreignKey: "role_id",
    otherKey: "permission_id"
  });
  permissions.belongsToMany(roles, { 
    through: role_permissions, 
    as: "roles", 
    foreignKey: "permission_id",
    otherKey: "role_id"
  });

  // User Role Assignments Associations
  user_role_assignments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(user_role_assignments, { as: "role_assignments", foreignKey: "user_id" });
  user_role_assignments.belongsTo(roles, { as: "role", foreignKey: "role_id" });
  roles.hasMany(user_role_assignments, { as: "assignments", foreignKey: "role_id" });
  user_role_assignments.belongsTo(users, { as: "assigner", foreignKey: "assigned_by" });

  // Role Assignment History Associations
  role_assignment_history.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(role_assignment_history, { as: "role_history", foreignKey: "user_id" });
  role_assignment_history.belongsTo(roles, { as: "previous_role", foreignKey: "previous_role_id" });
  role_assignment_history.belongsTo(roles, { as: "new_role", foreignKey: "new_role_id" });
  role_assignment_history.belongsTo(users, { as: "changer", foreignKey: "changed_by" });

  // User Streaks Associations
  user_streaks.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasOne(user_streaks, { as: "streak", foreignKey: "user_id" });

  // Applications Associations
  applications.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(applications, { as: "applications", foreignKey: "programme_id" });
  applications.belongsTo(users, { as: "applicant", foreignKey: "user_id" });
  users.hasMany(applications, { as: "applications", foreignKey: "user_id" });

  // Organisation Stats / Testimonials / FAQs Associations
  organisation_stats.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasOne(organisation_stats, { as: "organisation_stats", foreignKey: "user_id" });

  testimonials.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(testimonials, { as: "testimonials", foreignKey: "user_id" });

  organisation_faqs.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(organisation_faqs, { as: "organisation_faqs", foreignKey: "user_id" });

  return {
    activity_logs,
    announcement_comments,
    announcements,
    cohort_members,
    cohorts,
    communities,
    community_members,
    programme_modules,
    discussion_comments,
    discussions,
    lessonProgress,
    lesson_schedule,
    module_lessons,
    lesson_comments,
    programme_progress,
    programmes,
    programme_intents,
    partner_contexts,
    users,
    weeks,
    lessons,
    enrollments,
    learner_note,
    learner_communication_event,
    learner_attendance,
    lesson_completions,
    cohort_posts,
    post_likes,
    post_comments,
    user_preferences,
    learning_goals,
    achievements,
    user_achievements,
    roles,
    permissions,
    role_permissions,
    user_role_assignments,
    role_assignment_history,
    user_streaks,
    applications,
    organisation_stats,
    testimonials,
    organisation_faqs,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
