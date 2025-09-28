# Password Reset E2E Testing Implementation

This document provides a comprehensive overview of the password reset E2E testing implementation for the Viernes application.

## Overview

The password reset testing suite provides complete coverage of the password reset workflow, from requesting a reset email to completing the password change. The implementation follows the existing OptimumQA boilerplate patterns and integrates seamlessly with the current login testing infrastructure.

## Architecture

### Page Object Models

#### ForgotPasswordPage (`/cypress/support/pages/ForgotPasswordPage.ts`)

- **Route**: `/auth/boxed-password-reset`
- **Purpose**: Handles the password reset request form
- **Key Features**:
  - Email validation testing
  - Form submission and loading states
  - Toast notification verification
  - Navigation back to login

#### ResetPasswordPage (`/cypress/support/pages/ResetPasswordPage.ts`)

- **Route**: `/resetPassword`
- **Purpose**: Handles the password reset confirmation form
- **Key Features**:
  - Password strength validation
  - Password confirmation matching
  - Password visibility toggles
  - URL parameter validation (oobCode)

### Custom Cypress Commands

#### Core Commands (`/cypress/support/e2e/viernes/commands.ts`)

1. **`cy.requestPasswordReset(email, options)`**

   - Requests password reset for given email
   - Supports success/failure scenarios
   - Integrates with toast verification

2. **`cy.resetPassword(oobCode, newPassword, options)`**

   - Completes password reset with oobCode
   - Supports password confirmation testing
   - Handles success/failure responses

3. **`cy.generateResetCode()`**

   - Generates realistic Firebase oobCode for testing
   - 120-character format matching Firebase standards

4. **`cy.generateResetUrl(email, apiKey)`**

   - Creates complete password reset URLs
   - Includes mode=resetPassword and oobCode parameters

5. **`cy.mockPasswordResetRequest(email, shouldSucceed)`**

   - Mocks Firebase sendOobCode API calls
   - Returns realistic success/error responses

6. **`cy.mockPasswordResetConfirmation(oobCode, shouldSucceed)`**

   - Mocks Firebase resetPassword API calls
   - Handles invalid/expired code scenarios

7. **`cy.completePasswordResetFlow(email, newPassword, options)`**
   - End-to-end workflow automation
   - Combines request and reset steps
   - Supports both mocked and real scenarios

### Firebase API Mocking Strategy

#### Request Mocking Pattern

```typescript
// Success Response
{
  statusCode: 200,
  body: {
    kind: 'identitytoolkit#GetOobConfirmationCodeResponse',
    email: 'user@example.com'
  }
}

// Error Response
{
  statusCode: 400,
  body: {
    error: {
      code: 400,
      message: 'EMAIL_NOT_FOUND',
      errors: [{ message: 'EMAIL_NOT_FOUND', domain: 'global', reason: 'invalid' }]
    }
  }
}
```

#### Confirmation Mocking Pattern

```typescript
// Success Response
{
  statusCode: 200,
  body: {
    kind: 'identitytoolkit#ResetPasswordResponse',
    email: 'user@example.com',
    requestType: 'PASSWORD_RESET'
  }
}

// Error Response
{
  statusCode: 400,
  body: {
    error: {
      code: 400,
      message: 'INVALID_OOB_CODE',
      errors: [{ message: 'INVALID_OOB_CODE', domain: 'global', reason: 'invalid' }]
    }
  }
}
```

## Test Coverage

### Forgot Password Flow Tests (`/cypress/e2e/viernes/password-reset.cy.ts`)

#### UI Testing

- ✅ Form element presence and accessibility
- ✅ Data-testid attribute verification
- ✅ Focus behavior (headed/headless compatible)
- ✅ Navigation to/from login page

#### Form Validation

- ✅ Empty email validation
- ✅ Invalid email format validation
- ✅ Valid email acceptance
- ✅ Reactive validation clearing

#### Request Flow

- ✅ Successful password reset requests
- ✅ Non-existent email error handling
- ✅ Network error handling
- ✅ Loading state verification

### Reset Password Flow Tests

#### UI Testing

- ✅ Form element presence and accessibility
- ✅ Password visibility toggles
- ✅ URL parameter validation
- ✅ oobCode presence verification

#### Form Validation

- ✅ Empty password field validation
- ✅ Weak password rejection
- ✅ Strong password acceptance
- ✅ Password confirmation matching
- ✅ Reactive validation clearing

#### Confirmation Flow

- ✅ Successful password reset with valid code
- ✅ Invalid/expired code error handling
- ✅ Network error handling
- ✅ Loading state verification

### Integration Testing

#### Complete Workflow

- ✅ End-to-end password reset flow
- ✅ Invalid code handling in complete flow
- ✅ Login with new password verification

#### Error Handling

- ✅ Missing oobCode parameter
- ✅ Malformed oobCode parameter
- ✅ Rate limiting prevention
- ✅ Expired reset link handling

#### Security Testing

- ✅ Sensitive information exposure prevention
- ✅ Form data clearing after reset
- ✅ Concurrent request handling

#### Cross-browser Compatibility

- ✅ Mobile viewport testing
- ✅ Form state maintenance during navigation
- ✅ Headed/headless mode compatibility

## Data-TestId Requirements

### Forgot Password Page

```typescript
data-testid="forgot-password-form"
data-testid="forgot-password-email-input"
data-testid="forgot-password-submit-button"
data-testid="forgot-password-loading-spinner"
data-testid="forgot-password-email-error"
data-testid="forgot-password-back-to-login-link"
data-loading={isSubmitting}
```

### Reset Password Page

```typescript
data-testid="reset-password-form"
data-testid="reset-password-new-password-input"
data-testid="reset-password-confirm-password-input"
data-testid="reset-password-submit-button"
data-testid="reset-password-loading-spinner"
data-testid="reset-password-show-password-button"
data-testid="reset-password-show-confirm-password-button"
data-testid="reset-password-new-password-error"
data-testid="reset-password-confirm-password-error"
data-loading={isSubmitting}
```

## Integration with Existing Infrastructure

### OptimumQA Boilerplate Compatibility

- **Environment Configuration**: Uses existing routes.json and users.json
- **Helper Functions**: Leverages getUrl() and users from helpers.ts
- **Command Patterns**: Follows existing Firebase authentication command structure
- **Session Management**: Integrates with existing cleanFirebaseState() patterns

### Login Test Patterns

- **Page Object Model**: Consistent structure with LoginPage
- **Toast Verification**: Uses same verifySuccessToast()/verifyErrorToast() commands
- **Rate Limiting**: Applies FIREBASE_AUTH_DELAY consistently
- **Error Handling**: Matches login error handling patterns

### Firebase State Management

- **IndexedDB Clearing**: Compatible with existing clearFirebaseIndexedDB()
- **Session Caching**: Works with existing session management
- **Authentication State**: Properly cleans state between tests

## Usage Examples

### Basic Password Reset Request

```typescript
cy.requestPasswordReset('user@example.com')
```

### Complete Password Reset Flow

```typescript
cy.completePasswordResetFlow('user@example.com', 'NewPassword123!', {
  useValidCode: true,
  mockRequests: true,
})
```

### Custom Test Scenario

```typescript
// Mock the request
cy.mockPasswordResetRequest('user@example.com', true)

// Use page objects
forgotPasswordPage.visit().waitForLoad().requestPasswordReset('user@example.com')

cy.wait('@passwordResetRequest')
forgotPasswordPage.verifyRequestSuccess()
```

### Reset Password with Generated Code

```typescript
cy.generateResetCode().then((oobCode) => {
  cy.mockPasswordResetConfirmation(oobCode, true)

  resetPasswordPage.visit(oobCode).waitForLoad().resetPassword('NewPassword123!')

  cy.wait('@passwordResetConfirmation')
  resetPasswordPage.verifyResetSuccess()
})
```

## Configuration Updates

### Routes Configuration (`/cypress/fixtures/viernes/routes.json`)

```json
{
  "commonPaths": {
    "login": "/login",
    "forgotPassword": "/auth/boxed-password-reset",
    "resetPassword": "/resetPassword",
    "dashboard": "/",
    "home": "/"
  }
}
```

### TypeScript Definitions (`/cypress/support/index.d.ts`)

All new commands are properly typed with comprehensive JSDoc documentation and parameter specifications.

## Running the Tests

### Individual Test Files

```bash
# Run forgot password and reset password tests
npm run viernes-development -- --spec "cypress/e2e/viernes/password-reset.cy.ts"

# Run integration tests
npm run viernes-development -- --spec "cypress/e2e/viernes/password-reset-integration.cy.ts"
```

### All Password Reset Tests

```bash
# Run all password reset related tests
npm run viernes-development -- --spec "cypress/e2e/viernes/password-reset*.cy.ts"
```

### With Different Environments

```bash
# Development environment
npm run viernes-development -- --spec "cypress/e2e/viernes/password-reset.cy.ts"

# Staging environment
npm run viernes-staging -- --spec "cypress/e2e/viernes/password-reset.cy.ts"

# Production environment
npm run viernes-production -- --spec "cypress/e2e/viernes/password-reset.cy.ts"
```

## Best Practices

### Test Organization

- **Descriptive Context Blocks**: Group related test scenarios
- **Consistent Naming**: Follow existing login test naming patterns
- **Error Scenarios**: Test both happy path and error conditions

### Mocking Strategy

- **Realistic Responses**: Use actual Firebase response formats
- **Error Simulation**: Test various Firebase error scenarios
- **Network Conditions**: Test network failures and timeouts

### State Management

- **Clean State**: Use cleanFirebaseState() in beforeEach/afterEach
- **Session Isolation**: Ensure tests don't interfere with each other
- **Toast Management**: Dismiss toasts between tests

### Performance Considerations

- **Rate Limiting**: Use appropriate delays between Firebase requests
- **Timeout Handling**: Set appropriate timeouts for async operations
- **Resource Cleanup**: Properly clean up resources after tests

## Troubleshooting

### Common Issues

1. **Data-TestId Not Found**

   - Ensure React specialist has implemented all required data-testid attributes
   - Check element selectors match the expected format

2. **Firebase Mock Not Working**

   - Verify intercept patterns match actual Firebase URLs
   - Check that mocks are set up before the actual requests

3. **Toast Verification Failures**

   - Ensure toasts are dismissed between tests
   - Check that toast selectors match SweetAlert2 structure

4. **Loading State Issues**

   - Verify data-loading attributes are implemented
   - Check timing of loading state assertions

5. **URL Parameter Problems**
   - Ensure oobCode generation produces valid format
   - Check URL construction includes all required parameters

### Debug Commands

```typescript
// Debug generated reset URLs
cy.generateResetUrl('debug@example.com').then(console.log)

// Debug oobCode generation
cy.generateResetCode().then(console.log)

// Debug form state
cy.get('[data-testid="reset-password-form"]').then(console.log)
```

## Future Enhancements

### Potential Improvements

1. **Visual Regression Testing**: Add screenshot comparisons
2. **Accessibility Testing**: Enhance a11y test coverage
3. **Mobile-Specific Tests**: Add touch/gesture testing
4. **Performance Monitoring**: Add performance metrics
5. **Real Email Testing**: Integration with email testing services
6. **Multi-language Support**: Test localized error messages

### Scalability Considerations

1. **Command Abstraction**: Further abstract common patterns
2. **Data Factories**: Create test data factories for users
3. **Configuration Management**: Environment-specific test configuration
4. **Parallel Execution**: Optimize for parallel test execution

This comprehensive implementation provides a robust foundation for testing password reset functionality while maintaining consistency with existing patterns and ensuring high-quality user experience validation.
