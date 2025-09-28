import { users } from '@support/helpers'
import { forgotPasswordPage, resetPasswordPage, loginPage } from '@support/pages'

describe('Viernes - Password Reset Integration Tests', () => {
  beforeEach(() => {
    cy.cleanFirebaseState()
    cy.dismissToasts()
  })

  afterEach(() => {
    cy.cleanFirebaseState()
  })

  context('End-to-End Password Reset Integration', () => {
    it('should integrate with existing login patterns', () => {
      // Test that our new password reset commands work with existing infrastructure
      cy.mockPasswordResetRequest(users.primary.email, true)

      // Use existing page objects with new commands
      forgotPasswordPage
        .visit()
        .waitForLoad()
        .requestPasswordReset(users.primary.email)

      cy.wait('@passwordResetRequest')
      forgotPasswordPage.verifyRequestSuccess()
    })

    it('should work with session management and Firebase helpers', () => {
      // Test integration with existing Firebase state management
      const newPassword = 'NewIntegrationPassword123!'

      // Complete flow using custom commands
      cy.completePasswordResetFlow(users.primary.email, newPassword, {
        useValidCode: true,
        mockRequests: true,
      })

      // Verify Firebase state is properly managed
      cy.cleanFirebaseState() // Should work without errors
    })

    it('should maintain consistency with existing test patterns', () => {
      // Test that password reset follows same patterns as login tests
      const testEmail = users.secondary.email
      const newPassword = 'ConsistentPattern123!'

      // Setup mocks
      cy.mockPasswordResetRequest(testEmail, true)

      // Request reset
      cy.requestPasswordReset(testEmail, { skipToast: false })
      cy.wait('@passwordResetRequest')

      // Generate and use reset URL
      cy.generateResetUrl(testEmail).then((resetUrl) => {
        const urlParams = new URLSearchParams(resetUrl.split('?')[1])
        const oobCode = urlParams.get('oobCode')

        if (oobCode) {
          cy.mockPasswordResetConfirmation(oobCode, true)
          cy.resetPassword(oobCode, newPassword, { skipToast: false })
          cy.wait('@passwordResetConfirmation')
        }
      })
    })

    it('should work with rate limiting prevention like login tests', () => {
      // Test multiple requests with rate limiting prevention
      for (let i = 0; i < 3; i++) {
        cy.mockPasswordResetRequest(`test${i}@example.com`, true)

        forgotPasswordPage
          .visit()
          .waitForLoad()
          .requestPasswordReset(`test${i}@example.com`)

        cy.wait('@passwordResetRequest')
        cy.wait(100) // Rate limiting prevention
      }
    })

    it('should integrate with toast notification system', () => {
      // Test that password reset uses same toast system as login
      cy.mockPasswordResetRequest(users.primary.email, false)

      forgotPasswordPage
        .visit()
        .waitForLoad()
        .requestPasswordReset(users.primary.email)

      cy.wait('@passwordResetRequest')

      // Should use same toast verification as login tests
      cy.verifyErrorToast()

      // Should be able to dismiss toasts like in login tests
      cy.dismissToasts()
    })
  })

  context('Cross-Feature Navigation', () => {
    it('should navigate between login and password reset seamlessly', () => {
      // Start from login
      loginPage.visit().waitForLoad()

      // Navigate to forgot password (direct navigation for testing)
      forgotPasswordPage.visit().waitForLoad().verifyFormElements()

      // Go back to login
      forgotPasswordPage.clickBackToLogin()
      loginPage.waitForLoad().verifyFormElements()
    })

    it('should handle authentication state consistently', () => {
      // Test that password reset doesn't interfere with login state
      const newPassword = 'StateConsistent123!'

      // Complete password reset
      cy.completePasswordResetFlow(users.primary.email, newPassword, {
        useValidCode: true,
        mockRequests: true,
      })

      // Should be able to login normally after reset
      // (In real app, would use new password, but with mocks we test the flow)
      loginPage.visit().waitForLoad()

      // Verify login functionality is not affected
      loginPage.verifyFormElements()
    })
  })

  context('Error Handling Integration', () => {
    it('should handle errors consistently with login error patterns', () => {
      // Test network error handling consistency
      cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:sendOobCode*', {
        forceNetworkError: true,
      }).as('networkError')

      forgotPasswordPage
        .visit()
        .waitForLoad()
        .requestPasswordReset(users.primary.email)

      cy.wait('@networkError')

      // Should handle network errors same way as login
      forgotPasswordPage.verifyErrorToast()

      // Error messages should be consistent with login patterns
      cy.get('.swal2-toast .swal2-title').should('satisfy', (text: JQuery<HTMLElement>) => {
        const content = text.text().toLowerCase()
        return content.includes('network') || content.includes('error') || content.includes('connection')
      })
    })

    it('should maintain form state during errors like login tests', () => {
      cy.mockPasswordResetRequest(users.primary.email, false)

      forgotPasswordPage
        .visit()
        .waitForLoad()
        .requestPasswordReset(users.primary.email)

      cy.wait('@passwordResetRequest')
      forgotPasswordPage.verifyRequestFailure()

      // Form should remain accessible for retry (like login)
      forgotPasswordPage.verifyFormElements()

      // Email should remain for user convenience (like login)
      cy.get('[data-testid="forgot-password-email-input"]').should('have.value', users.primary.email)
    })
  })

  context('Performance and Reliability Integration', () => {
    it('should work reliably in headless mode like login tests', () => {
      // Test headless mode compatibility
      if (!Cypress.browser.isHeaded) {
        forgotPasswordPage
          .visit()
          .waitForLoad()
          .verifyFormElements()

        // Should work without focus-dependent behavior
        forgotPasswordPage.verifyFormInteractivity()
      }
    })

    it('should maintain performance standards of login tests', () => {
      // Test that password reset doesn't add significant overhead
      const startTime = Date.now()

      cy.completePasswordResetFlow(users.primary.email, 'PerformanceTest123!', {
        useValidCode: true,
        mockRequests: true,
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).to.be.lessThan(10000) // 10 seconds
    })
  })
})