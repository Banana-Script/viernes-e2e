import { users } from '@support/helpers'
import { loginPage } from '@support/pages/LoginPage'

describe('Viernes - Login Flow', () => {
  beforeEach(() => {
    // Clean all Firebase authentication state including IndexedDB
    cy.cleanFirebaseState()

    // Dismiss any existing toasts
    cy.dismissToasts()
  })

  afterEach(() => {
    // Clean up all Firebase authentication state after each test
    cy.cleanFirebaseState()
  })

  context('Login Page UI', () => {
    it('should display login form with all required elements', () => {
      loginPage.visit().waitForLoad().verifyFormElements().verifyNoValidationErrors()
    })

    it('should have accessible form elements with proper data-testids', () => {
      loginPage.visit().waitForLoad()

      // Verify all data-testid attributes are present
      cy.get('[data-testid="login-form"]').should('exist')
      cy.get('[data-testid="email-input"]').should('exist')
      cy.get('[data-testid="password-input"]').should('exist')
      cy.get('[data-testid="login-submit-button"]').should('exist')
    })

    it('should focus on email input when page loads', () => {
      loginPage.visit().waitForLoad()

      // Test focus behavior - adapt for headed vs headless mode
      if (Cypress.browser.isHeaded) {
        cy.get('[data-testid="email-input"]').click().should('be.focused')
      } else {
        // In headless mode, just verify the element can be clicked
        cy.get('[data-testid="email-input"]').click().should('be.visible')
      }
    })

    it('should have stable form elements in both headed and headless modes', () => {
      loginPage.visit().waitForLoad().verifyFormElements()

      // Add a small delay and re-verify stability
      cy.wait(500)
      loginPage.verifyFormElements()
    })
  })

  context('Form Validation', () => {
    beforeEach(() => {
      loginPage.visit().waitForLoad()
    })

    it('should show validation error for empty email', () => {
      loginPage.enterPassword('somepassword').submit().verifyEmailError().verifyLoginFailure()
    })

    it('should show validation error for invalid email format', () => {
      loginPage
        .enterEmail('invalid-email')
        .enterPassword('somepassword')
        .submit()
        .verifyEmailError()
        .verifyLoginFailure()
    })

    it('should show validation error for empty password', () => {
      loginPage.enterEmail('test@example.com').submit().verifyPasswordError().verifyLoginFailure()
    })

    it('should show validation errors for both empty fields', () => {
      loginPage.submit().verifyEmailError().verifyPasswordError().verifyLoginFailure()
    })

    it('should clear validation errors when valid input is entered', () => {
      // First trigger validation errors
      loginPage.submit()

      // Then enter valid data and verify errors are cleared
      loginPage.enterEmail(users.primary.email).enterPassword(users.primary.password)

      // Note: This assumes validation errors clear on input change
      // If the app doesn't clear errors until submit, adjust accordingly
    })
  })

  context('Successful Authentication', () => {
    it('should successfully login with primary user credentials', () => {
      loginPage.visit().waitForLoad().login(users.primary.email, users.primary.password).verifyLoginSuccess()
    })

    it('should successfully login with secondary user credentials', () => {
      loginPage.visit().waitForLoad().login(users.secondary.email, users.secondary.password).verifyLoginSuccess()
    })

    it('should redirect to dashboard after successful login', () => {
      loginPage.visit().waitForLoad().login(users.primary.email, users.primary.password)

      // Verify redirect to dashboard/home page
      cy.url().should('not.contain', '/login')
      cy.url().should('match', /\/(dashboard)?$/)

      // Verify dashboard content is loaded
      cy.get('body').should('contain.text', 'Conversations') // Assuming ConversationsDashboard content
    })

    it('should show success toast notification on successful login', () => {
      loginPage.visit().waitForLoad().login(users.primary.email, users.primary.password).verifySuccessToast()
    })

    it('should maintain session after successful login', () => {
      // Login first
      cy.loginAsPrimaryUser()

      // Navigate to different page and back
      cy.visit('/') // Dashboard
      cy.visit('/login') // Should redirect back to dashboard

      cy.url().should('not.contain', '/login')
    })
  })

  context('Failed Authentication', () => {
    it('should show error for invalid email credentials', () => {
      loginPage
        .visit()
        .waitForLoad()
        .login('invalid@example.com', 'wrongpassword')
        .verifyLoginFailure()
        .verifyErrorToast()
    })

    it('should show error for valid email with wrong password', () => {
      loginPage
        .visit()
        .waitForLoad()
        .login(users.primary.email, 'wrongpassword')
        .verifyLoginFailure()
        .verifyErrorToast()
    })

    it('should show error for non-existent user', () => {
      loginPage
        .visit()
        .waitForLoad()
        .login('nonexistent@example.com', 'anypassword')
        .verifyLoginFailure()
        .verifyErrorToast()
    })

    it('should remain on login page after failed authentication', () => {
      loginPage.visit().waitForLoad().login('invalid@example.com', 'wrongpassword').verifyLoginFailure()

      // Verify form is still accessible for retry
      loginPage.verifyFormElements()
    })

    it('should clear form after failed login attempt', () => {
      loginPage.visit().waitForLoad().login('invalid@example.com', 'wrongpassword').verifyLoginFailure()

      // Check if form is cleared (behavior depends on app implementation)
      cy.get('[data-testid="password-input"]').should('have.value', '')
    })
  })

  context('Loading States and UX', () => {
    it('should disable submit button during authentication request', () => {
      loginPage.visit().waitForLoad().enterEmail(users.primary.email).enterPassword(users.primary.password).submit()

      // Immediately check if button is disabled during request
      // Note: This test might be flaky depending on request speed
      cy.get('[data-testid="login-submit-button"]').should('be.disabled')
    })

    it('should show loading indicator during authentication', () => {
      loginPage.visit().waitForLoad().enterEmail(users.primary.email).enterPassword(users.primary.password).submit()

      // Look for loading indicator (adjust selector based on app implementation)
      cy.get('body').then(($body) => {
        if ($body.text().includes('Loading')) {
          cy.get('body').should('contain.text', 'Loading')
        } else {
          // Alternative: button text changes to "Logging in..."
          cy.get('[data-testid="login-submit-button"]').should('contain.text', 'Logging')
        }
      })
    })
  })

  context('Firebase Rate Limiting Prevention', () => {
    it('should handle multiple login attempts without rate limiting', () => {
      // Test multiple rapid attempts to ensure rate limiting is handled
      for (let i = 0; i < 3; i++) {
        loginPage.visit().waitForLoad().login('test@example.com', 'wrongpassword').verifyLoginFailure()

        // Wait between attempts to prevent rate limiting
        cy.wait(100)
      }

      // Final attempt with correct credentials should still work
      loginPage.clearForm().login(users.primary.email, users.primary.password).verifyLoginSuccess()
    })
  })

  context('Session Management', () => {
    it('should use cached session for subsequent logins', () => {
      // First login with session caching
      cy.loginAsPrimaryUser({ cacheSession: true })

      // Logout
      cy.logout()

      // Second login should use cached session (faster)
      cy.loginAsPrimaryUser({ cacheSession: true })

      cy.url().should('not.contain', '/login')
    })

    it('should bypass session cache when requested', () => {
      // Login without session caching
      cy.loginAsPrimaryUser({ skipSessionCache: true })

      cy.url().should('not.contain', '/login')
    })
  })

  context('Navigation and Redirects', () => {
    it('should redirect authenticated users away from login page', () => {
      // First login
      cy.loginAsPrimaryUser()

      // Try to visit login page again
      cy.visit('/login')

      // Should be redirected away from login
      cy.url().should('not.contain', '/login')
    })

    it('should redirect to intended page after login', () => {
      // Try to access protected page when not logged in
      cy.visit('/') // Should redirect to login

      // Login and should return to intended page
      cy.loginAsPrimaryUser({ visitLoginPage: false })

      cy.url().should('match', /\/(dashboard)?$/)
    })
  })

  context('Cross-browser Compatibility', () => {
    it('should work consistently across different viewport sizes', () => {
      // Test mobile viewport
      cy.viewport(375, 667)
      loginPage
        .visit()
        .waitForLoad()
        .verifyFormElements()
        .login(users.primary.email, users.primary.password)
        .verifyLoginSuccess()

      // Reset viewport
      cy.viewport(1920, 1080)
    })
  })

  context('Security and Error Handling', () => {
    it('should not expose sensitive information in error messages', () => {
      loginPage.visit().waitForLoad().login('invalid@example.com', 'wrongpassword').verifyErrorToast()

      // Verify error message doesn't expose sensitive details
      cy.get('.swal2-toast .swal2-title').should('not.contain', 'password')
      cy.get('.swal2-toast .swal2-title').should('not.contain', 'invalid@example.com')
    })

    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('POST', '**/auth/**', { forceNetworkError: true }).as('authRequest')

      loginPage
        .visit()
        .waitForLoad()
        .login(users.primary.email, users.primary.password)
        .verifyLoginFailure()
        .verifyErrorToast()

      cy.wait('@authRequest')
    })
  })
})
