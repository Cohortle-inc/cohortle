const request = require("supertest");
const JwtService = require("../../services/JwtService");
const BackendSDK = require("../../core/BackendSDK");

jest.mock("../../core/BackendSDK");

const app = require("../../app");

describe("GET /v1/api/learner/cohorts", () => {
  let studentToken;
  const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
  process.env.JWT_SECRET = JWT_SECRET;

  beforeAll(() => {
    studentToken = JwtService.createAccessToken(
      {
        user_id: 1,
        role: "student",
        email: "student@example.com",
      },
      24 * 60 * 60 * 1000,
      JWT_SECRET
    );
  });

  it("should be reachable and return 200", async () => {
    const mockCommunities = [
      {
        community_id: 1,
        community_name: "Test Community",
        cohort_id: 1,
        cohort_name: "Test Cohort",
        programme_id: 1,
        module_count: 5,
      },
    ];

    BackendSDK.prototype.rawQuery.mockResolvedValue(mockCommunities);

    const response = await request(app)
      .get("/v1/api/learner/cohorts")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("error", false);
    expect(response.body).toHaveProperty("communities");
    expect(response.body.communities).toHaveLength(1);
    expect(response.body.communities[0].community_name).toBe("Test Community");
  });

  it("should return 400 if user_id is invalid", async () => {
    const invalidUserToken = JwtService.createAccessToken(
      {
        user_id: "invalid",
        role: "student",
        email: "student@example.com",
      },
      24 * 60 * 60 * 1000,
      JWT_SECRET
    );

    const response = await request(app)
      .get("/v1/api/learner/cohorts")
      .set("Authorization", `Bearer ${invalidUserToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", true);
    expect(response.body.message).toBe("Invalid user ID");
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/v1/api/learner/cohorts");
    expect(response.status).toBe(401);
  });

  it("should return 403 if wrong role is provided", async () => {
    const convenerToken = JwtService.createAccessToken(
      {
        user_id: 2,
        role: "convener",
        email: "convener@example.com",
      },
      24 * 60 * 60 * 1000,
      JWT_SECRET
    );

    const response = await request(app)
      .get("/v1/api/learner/cohorts")
      .set("Authorization", `Bearer ${convenerToken}`);

    expect(response.status).toBe(403);
  });
});
