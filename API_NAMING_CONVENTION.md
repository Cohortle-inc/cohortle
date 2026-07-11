# API Naming Convention

## Recommendation

- Backend should use `snake_case` for all JSON request and response payloads.
- Frontend should use `camelCase` for all internal data objects and component props.
- Use a conversion layer at the API boundary:
  - convert backend responses from `snake_case` to `camelCase`
  - convert frontend request payloads from `camelCase` to `snake_case`

## Why this is best

- `snake_case` is a common backend convention for APIs and matches the existing database / SQL field naming.
- `camelCase` is idiomatic for JavaScript/TypeScript and keeps frontend code consistent.
- A dedicated boundary layer avoids leaking backend naming into React components and keeps the backend contract explicit.

## Current project pattern

- `cohortle-api` endpoints and request/query/body fields use `snake_case`.
- `cohortle-web` converts API payloads using utilities in `src/lib/utils/caseTransform.ts`.
- Example frontend call:
  - `getLearnerDetail(cohortId, learnerId)` uses `/v1/api/cohorts/${cohortId}/learners/${learnerId}`
  - response is transformed into camelCase before use.

## Frontend best practice

- Keep React hooks, page props, and UI data in `camelCase`.
- Use typed request/response adapters in `src/lib/api/*`.
- Avoid direct use of `snake_case` fields in components.
- Example:
  - `lessonProgress` instead of `lesson_progress`
  - `enrollmentId` instead of `enrollment_id`

## Backend best practice

- Keep controller and route payload contracts in `snake_case`.
- Document endpoint responses in `snake_case`.
- Keep SQL queries and DB field names consistent with response naming.
- Example:
  - return `lesson_progress`, `enrollment_id`, `cohort_id` in JSON responses

## Practical rule

- At the API boundary: transform `snake_case` <-> `camelCase`.
- Internally in backend: continue using `snake_case` for database and API keys.
- Internally in frontend: continue using `camelCase` for models, props, and state.

## Notes

- This aligns with the current codebase and avoids introducing a mixed naming style.
- If a new endpoint is added, follow this doc for request/response naming.
