const express = require("express");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// DEPLOYMENT_MARKER: 2026-03-02-PROFILE-FIELD-FIX

const authRoutes = require("./routes/auth");
const cohortRoutes = require("./routes/cohort");
const communityRoutes = require("./routes/community");
const programmeRoutes = require("./routes/programme");
const moduleRoutes = require("./routes/module");
const lessonRoutes = require("./routes/lesson");
const weekRoutes = require("./routes/week");
const profileRoutes = require("./routes/profile");
const activityRoutes = require("./routes/activity");
const announcementRoutes = require("./routes/announcement");
const discussionRoutes = require("./routes/discussion");
const lessonProgressRoutes = require("./routes/lesson_progress");
const scheduleRoutes = require("./routes/schedule");
const lessonCommentRoutes = require("./routes/lesson_comment");
const postRoutes = require("./routes/post");
const onboardingRoutes = require("./routes/onboarding");
const healthRoutes = require("./routes/health");
const preferencesRoutes = require("./routes/preferences");
const deploymentRoutes = require("./routes/deployment");
const dashboardRoutes = require("./routes/dashboard");
const cohortPostsRoutes = require("./routes/cohort_posts");
const emailRoutes = require("./routes/email");
const rolesRoutes = require("./routes/roles");
const funnelRoutes = require("./routes/funnel");
const applicationRoutes = require("./routes/applications");
const orgRoutes = require("./routes/org");
const driveRoutes = require("./routes/drive");
const newsletterRoutes = require("./routes/newsletter");
const testimonialLinksRoutes = require("./routes/testimonial_links");
const assignmentRoutes = require("./routes/assignment");
const adminRoutes = require("./routes/admin");
const opportunitiesRoutes = require("./routes/opportunities");
const learnerRoutes = require("./routes/learner");
const learnerManagementRoutes = require("./routes/learnerManagement");
const analyticsRoutes = require("./routes/analytics");

const app = express();

// =====================
// Middleware
// =====================
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));

// =====================
// Swagger / OpenAPI
// =====================
const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Cohortle API",
      version: "1.0.0",
      description: "API documentation for Cohortle platform",
    },
    servers: [{ url: "http://localhost:3000" }, {url: 'https://api.cohortle.com'}, { url: process.env.VPS_ADDRESS }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [path.join(__dirname, "routes/*.js")], // Path to your route files with Swagger annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve OpenAPI JSON (for Redoc)
app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});

// Serve Redoc
app.get("/docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cohortle API Docs 0.0.1 </title>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </head>
      <body>
        <redoc spec-url='/openapi.json'></redoc>
      </body>
    </html>
  `);
});

// =====================
// API Routes
// =====================
authRoutes(app);
communityRoutes(app);
programmeRoutes(app);
cohortRoutes(app);
moduleRoutes(app);
lessonRoutes(app);
weekRoutes(app);
profileRoutes(app);
activityRoutes(app);
announcementRoutes(app);
discussionRoutes(app);
lessonProgressRoutes(app);
scheduleRoutes(app);
lessonCommentRoutes(app);
postRoutes(app);
onboardingRoutes(app);
healthRoutes(app);
preferencesRoutes(app);
deploymentRoutes(app);
dashboardRoutes(app);
cohortPostsRoutes(app);
emailRoutes(app);
rolesRoutes(app);
funnelRoutes(app);
adminRoutes(app);
learnerManagementRoutes(app);
analyticsRoutes(app);
applicationRoutes(app);
orgRoutes(app);
driveRoutes(app);
newsletterRoutes(app);
testimonialLinksRoutes(app);
assignmentRoutes(app);
opportunitiesRoutes(app);
learnerRoutes(app);

// =====================
// Fallback Routes
// =====================
app.get("/api-docs", (req, res) =>
  res.sendFile(path.join(__dirname, "index.html")),
);
app.get("/", (req, res) => res.redirect("/api-docs"));

// =====================
// Error Handling
// =====================
app.use("/uploads", (err, req, res, next) => {
  if (err.code === "ENOENT")
    return res.status(404).json({ error: true, message: "Image not found" });
  next(err);
});

module.exports = app;
