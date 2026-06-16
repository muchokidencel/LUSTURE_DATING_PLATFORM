# Lustre QA Strategy: Sprint Breakdown & STLC Implementation

This document outlines the roadmap to transition Lustre from a "Verified" state to a "Certified Stable" state with **70% Code Coverage** and a full **BDD (Behavior Driven Development)** workflow.

## 🎯 High-Level Goals
- **Frameworks**: Vitest (Unit/Integration), Playwright (E2E), Cucumber.js (BDD).
- **Metric**: 70% Minimum Line Coverage.
- **Methodology**: STLC (Requirement Analysis -> Test Planning -> Execution).

---

## 🏃 Sprint 1: Foundation & Unit Hardening (Weeks 1-2)
**Focus**: Infrastructure setup and low-level logic validation.

### 📝 Tasks
1. **Infra Setup**:
    - Install Vitest in `client` and `server`.
    - Setup Playwright with Cucumber.js integration.
    - Configure `vitest/coverage-v8` for reporting.
2. **Unit Testing (70% Target)**:
    - **Server**: Validate `shared/schemas.ts`, auth utils, and referral calculations.
    - **Client**: Test `utils/imageCompressor.ts`, `lib/api.ts` interceptors, and date formatters.
3. **STLC Step**: Requirement Analysis. Map every existing endpoint to a "Feature" requirement.

### 🏁 Deliverable
- Test runners integrated into `package.json`.
- Coverage report showing >20% total project coverage.

---

## 🏃 Sprint 2: BDD & Integration (Weeks 3-4)
**Focus**: Behavior-driven logic using Gherkin and Integration tests.

### 📝 Tasks
1. **Gherkin Feature Writing**:
    - Create `.feature` files for: `Registration`, `Discovery_Filtering`, `Premium_Upgrade`.
2. **Integration Testing**:
    - **Server**: Mock DB (or use test container) to test route -> controller -> DB flows.
    - **Client**: Test complex hooks in `useQueries.ts` using `@testing-library/react-hooks`.
3. **Behavior Mapping**:
    - Implement `Given/When/Then` step definitions for API contract testing.

### 🏁 Deliverable
- `.features` directory with documented behaviors.
- Integration tests covering all critical API paths.
- Coverage reaching 45%.

---

## 🏃 Sprint 3: E2E & User Journeys (Weeks 5-6)
**Focus**: Full system validation using Playwright.

### 📝 Tasks
1. **Playwright User Flows**:
    - **Happy Path**: Register -> Upload Photo -> Swipe Right -> Match -> View WhatsApp.
    - **Edge Cases**: Insufficient referral points for withdrawal, expired premium status.
2. **Cucumber + Playwright**:
    - Execute E2E tests using Gherkin syntax for stakeholder visibility.
3. **STLC Step**: Test Execution & Bug Logging.

### 🏁 Deliverable
- Automated E2E suite running in headless mode.
- Coverage reaching 60%.

---

## 🏃 Sprint 4: Coverage Hardening & CI/CD (Weeks 7-8)
**Focus**: Reaching the 70% threshold and automating quality gates.

### 📝 Tasks
1. **Gap Analysis**: Use Vitest/Playwright coverage heatmaps to identify untested branches.
2. **Refactoring for Testability**:
    - Extract hidden logic in `Discovery.tsx` into testable pure functions.
3. **CI Integration**:
    - Block PRs if coverage drops below 70%.
    - Automate Gherkin report generation on every build.

### 🏁 Deliverable
- **Final QA Sign-off**.
- Project-wide coverage >= 70%.
- Verified STLC Closure Report.

---

## 🛠 Technical Stack Implementation Details

### Unit/Integration (Vitest)
```typescript
// Example: server/src/shared/schemas.test.ts
import { registerSchema } from './schemas';
import { describe, it, expect } from 'vitest';

describe('Register Schema', () => {
  it('should invalidate weak passwords', () => {
    const res = registerSchema.safeParse({ email: 'test@me.com', password: '123' });
    expect(res.success).toBe(false);
  });
});
```

### E2E / BDD (Gherkin + Playwright)
```gherkin
# client/tests/features/premium.feature
Feature: Premium Upgrade
  Scenario: User pays via M-Pesa
    Given I am a "free" user
    When I navigate to "/premium"
    And I enter my phone "0712345678"
    And I click "Send STK Push"
    Then I should see "STK Push sent"
    And my account should eventually show "Gold Member"
```

### Coverage Command
```bash
npm run test:coverage # Generates LCOV & HTML reports
```
