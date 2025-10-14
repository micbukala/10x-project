import { describe, it, expect } from "vitest";

const API_URL = process.env.API_URL || "http://localhost:3000";
const TEST_TOKEN = process.env.TEST_TOKEN;

if (!TEST_TOKEN) {
  throw new Error("TEST_TOKEN environment variable is required for smoke tests");
}

describe("POST /api/summaries/generate-ai", () => {
  const endpoint = `${API_URL}/api/summaries/generate-ai`;

  // Valid test data
  const validSummary = {
    title: "Test Summary",
    content: {
      research_objective: "To test the AI summary generation endpoint",
      methods: "Automated smoke testing",
      results: "Endpoint functioning as expected",
      discussion: "All validation and business rules working",
      open_questions: "What other scenarios to test?",
      conclusions: "Endpoint is production-ready",
    },
    ai_model_name: "test-model/v1",
  };

  it("should successfully create an AI summary", async () => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(validSummary),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("remaining_generations");
    expect(data.title).toBe(validSummary.title);
    expect(data.creation_type).toBe("ai");
    expect(data.ai_model_name).toBe(validSummary.ai_model_name);
  });

  it("should reject unauthorized requests", async () => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validSummary),
    });

    expect(response.status).toBe(401);
    const error = await response.json();
    expect(error.error.code).toBe("UNAUTHORIZED");
  });

  it("should validate request body", async () => {
    const invalidSummary = {
      title: "", // Invalid: empty title
      content: {
        // Missing required fields
      },
      ai_model_name: "test-model/v1",
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(invalidSummary),
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe("VALIDATION_ERROR");
  });
});
