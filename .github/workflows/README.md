# GitHub Actions Configuration

This directory contains the GitHub Actions workflows for automated E2E testing.

## Workflows

### 1. `viernes-e2e-tests.yml`
Main workflow that runs the E2E tests when triggered by the viernes-front repository.

**Triggers:**
- `repository_dispatch` with event `viernes-front-main-updated` → Runs development tests
- `repository_dispatch` with event `viernes-front-release-created` → Runs production tests  
- `workflow_dispatch` → Manual trigger for testing

**Jobs:**
- **test-development**: Runs when main branch is updated in viernes-front
- **test-production**: Runs when a release is created in viernes-front

### 2. `trigger-from-viernes-front.yml` 
This workflow should be copied to the `viernes-front` repository at `.github/workflows/trigger-e2e-tests.yml`.

## Setup Instructions

### Step 1: Configure Personal Access Token

1. Create a Personal Access Token in GitHub:
   - Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Copy the token

2. Add the token as a secret in the `viernes-front` repository:
   - Go to viernes-front repository → Settings → Secrets and variables → Actions
   - Add new repository secret:
     - Name: `E2E_TRIGGER_TOKEN`
     - Value: Your personal access token

### Step 2: Copy Trigger Workflow

Copy the content of `trigger-from-viernes-front.yml` and create it in the viernes-front repository:
```
viernes-front/.github/workflows/trigger-e2e-tests.yml
```

### Step 3: Configure GitHub Pages (Optional)

If you want to deploy reports to GitHub Pages:

1. Go to viernes-e2e repository → Settings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages / (root)

### Step 4: Configure Notifications (Optional)

For Slack notifications on test failures:

1. Create a Slack webhook URL
2. Add it as a secret in viernes-e2e repository:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your Slack webhook URL

## How it Works

1. **Development Flow:**
   - Developer pushes to `main` branch in `viernes-front`
   - `trigger-e2e-tests.yml` in viernes-front triggers `repository_dispatch`
   - `viernes-e2e-tests.yml` runs development tests
   - Reports are generated and uploaded

2. **Production Flow:**
   - Release is created in `viernes-front`
   - `trigger-e2e-tests.yml` in viernes-front triggers `repository_dispatch`
   - `viernes-e2e-tests.yml` runs production tests
   - Reports are generated and uploaded

## Test Commands Used

- Development: `npm run viernes-development`
- Production: `npm run viernes-production`
- Reports: `npm run mocha.combine-reports`, `npm run mocha.generate-report`, `npm run allure.report`

## Artifacts

Test results are uploaded as artifacts and retained for 30 days:
- **development-test-results**: Results from development tests
- **production-test-results**: Results from production tests

Each artifact contains:
- Cypress reports (Mochawesome)
- Allure reports
- Screenshots and videos (if any failures)