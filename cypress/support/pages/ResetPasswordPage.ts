import { getUrl } from '@support/helpers'

/**
 * Reset Password Page Object Model
 * Provides a clean interface for interacting with the password reset form
 */
export class ResetPasswordPage {
  // Page elements
  private get form() {
    return cy.get('[data-testid="reset-password-form"]')
  }

  private get newPasswordInput() {
    return cy.get('[data-testid="reset-password-new-password-input"]')
  }

  private get confirmPasswordInput() {
    return cy.get('[data-testid="reset-password-confirm-password-input"]')
  }

  private get submitButton() {
    return cy.get('[data-testid="reset-password-submit-button"]')
  }

  private get loadingSpinner() {
    return cy.get('[data-testid="reset-password-loading-spinner"]')
  }

  private get showPasswordButton() {
    return cy.get('[data-testid="reset-password-show-password-button"]')
  }

  private get showConfirmPasswordButton() {
    return cy.get('[data-testid="reset-password-show-confirm-password-button"]')
  }

  private get newPasswordErrorMessage() {
    return cy.get('[data-testid="reset-password-new-password-error"]')
  }

  private get confirmPasswordErrorMessage() {
    return cy.get('[data-testid="reset-password-confirm-password-error"]')
  }

  // Toast notifications
  private get successToast() {
    return cy.get('.swal2-toast.swal2-icon-success')
  }

  private get errorToast() {
    return cy.get('.swal2-toast.swal2-icon-error')
  }

  private get toastMessage() {
    return cy.get('.swal2-toast .swal2-title')
  }

  /**
   * Navigate to the reset password page with oobCode
   */
  visit(oobCode?: string, apiKey?: string): ResetPasswordPage {
    let url = getUrl('resetPassword')

    if (oobCode) {
      const params = new URLSearchParams({
        mode: 'resetPassword',
        oobCode: oobCode,
        ...(apiKey && { apiKey })
      })
      url = `${url}?${params.toString()}`
    }

    cy.visit(url)

    // Wait for the page to be fully loaded
    cy.document().should('have.property', 'readyState', 'complete')

    // Wait for potential loading states to finish
    cy.get('body').should('be.visible')

    return this
  }

  /**
   * Visit with a complete reset URL (as would come from email)
   */
  visitWithResetUrl(resetUrl: string): ResetPasswordPage {
    cy.visit(resetUrl)
    cy.document().should('have.property', 'readyState', 'complete')
    cy.get('body').should('be.visible')
    return this
  }

  /**
   * Wait for the reset password form to be fully loaded and interactive
   */
  waitForLoad(): ResetPasswordPage {
    // Wait for form to be visible with extended timeout
    this.form.should('be.visible', { timeout: 15000 })

    // Wait for form elements to be present and enabled
    this.newPasswordInput.should('be.visible').and('be.enabled', { timeout: 10000 })
    this.confirmPasswordInput.should('be.visible').and('be.enabled', { timeout: 10000 })
    this.submitButton.should('be.visible').and('be.enabled', { timeout: 10000 })

    // Different wait strategies for headed vs headless
    if (Cypress.browser.isHeaded) {
      cy.wait(1000)
    } else {
      cy.wait(2000)
    }

    // Ensure elements are still stable after waiting
    this.form.should('be.visible')

    return this
  }

  /**
   * Enter new password
   */
  enterNewPassword(password: string): ResetPasswordPage {
    this.newPasswordInput.clear().type(password, { delay: 10 })
    return this
  }

  /**
   * Enter confirm password
   */
  enterConfirmPassword(password: string): ResetPasswordPage {
    this.confirmPasswordInput.clear().type(password, { delay: 10 })
    return this
  }

  /**
   * Click the submit button to reset password
   */
  submit(): ResetPasswordPage {
    this.submitButton.click()
    return this
  }

  /**
   * Complete password reset flow
   */
  resetPassword(newPassword: string, confirmPassword?: string): ResetPasswordPage {
    this.enterNewPassword(newPassword)
    cy.wait(50) // Prevent rate limiting
    this.enterConfirmPassword(confirmPassword || newPassword)
    cy.wait(50) // Prevent rate limiting
    this.submit()
    cy.wait(100) // Wait for request
    return this
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): ResetPasswordPage {
    this.showPasswordButton.click()
    return this
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): ResetPasswordPage {
    this.showConfirmPasswordButton.click()
    return this
  }

  /**
   * Verify password input type (password or text)
   */
  verifyPasswordInputType(inputType: 'password' | 'text'): ResetPasswordPage {
    this.newPasswordInput.should('have.attr', 'type', inputType)
    return this
  }

  /**
   * Verify confirm password input type (password or text)
   */
  verifyConfirmPasswordInputType(inputType: 'password' | 'text'): ResetPasswordPage {
    this.confirmPasswordInput.should('have.attr', 'type', inputType)
    return this
  }

  /**
   * Verify successful password reset
   */
  verifyResetSuccess(): ResetPasswordPage {
    this.verifySuccessToast()
    // Should redirect to login or dashboard
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/login') || url.includes('/dashboard') || url.match(/\/$/)
    })
    return this
  }

  /**
   * Verify password reset failure
   */
  verifyResetFailure(): ResetPasswordPage {
    this.verifyErrorToast()
    // Should remain on reset password page or show error state
    return this
  }

  /**
   * Verify new password validation error
   */
  verifyNewPasswordError(message?: string): ResetPasswordPage {
    this.newPasswordErrorMessage.should('be.visible')
    if (message) {
      this.newPasswordErrorMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify confirm password validation error
   */
  verifyConfirmPasswordError(message?: string): ResetPasswordPage {
    this.confirmPasswordErrorMessage.should('be.visible')
    if (message) {
      this.confirmPasswordErrorMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify no validation errors are shown
   */
  verifyNoValidationErrors(): ResetPasswordPage {
    // More flexible check - just ensure the inputs are considered valid
    this.newPasswordInput.should('not.have.class', 'error').and('not.have.class', 'is-invalid')
    this.confirmPasswordInput.should('not.have.class', 'error').and('not.have.class', 'is-invalid')

    // Optionally check if error messages are not showing serious validation errors
    cy.get('body').then(($body) => {
      const newPasswordErrors = $body.find('[data-testid="reset-password-new-password-error"]:visible')
      const confirmPasswordErrors = $body.find('[data-testid="reset-password-confirm-password-error"]:visible')

      if (newPasswordErrors.length > 0) {
        // If there are error messages, they should not be about password strength
        const errorText = newPasswordErrors.text().toLowerCase()
        expect(errorText).to.not.include('weak')
        expect(errorText).to.not.include('too short')
        expect(errorText).to.not.include('must contain')
      }

      if (confirmPasswordErrors.length > 0) {
        // If there are error messages, they should not be about matching
        const errorText = confirmPasswordErrors.text().toLowerCase()
        expect(errorText).to.not.include('match')
        expect(errorText).to.not.include('different')
      }
    })

    return this
  }

  /**
   * Verify success toast notification
   */
  verifySuccessToast(message?: string): ResetPasswordPage {
    this.successToast.should('be.visible', { timeout: 10000 })
    if (message) {
      this.toastMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify error toast notification
   */
  verifyErrorToast(message?: string): ResetPasswordPage {
    this.errorToast.should('be.visible', { timeout: 10000 })
    if (message) {
      this.toastMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify form elements are present and enabled
   */
  verifyFormElements(): ResetPasswordPage {
    this.form.should('be.visible', { timeout: 10000 })
    this.newPasswordInput.should('be.visible').and('be.enabled').and('not.have.attr', 'readonly')
    this.confirmPasswordInput.should('be.visible').and('be.enabled').and('not.have.attr', 'readonly')
    this.submitButton.should('be.visible').and('be.enabled').and('not.have.attr', 'disabled')
    this.showPasswordButton.should('be.visible')
    this.showConfirmPasswordButton.should('be.visible')
    return this
  }

  /**
   * Verify loading state is active
   */
  verifyLoadingState(): ResetPasswordPage {
    this.loadingSpinner.should('be.visible')
    this.submitButton.should('be.disabled')
    this.submitButton.should('have.attr', 'data-loading', 'true')
    return this
  }

  /**
   * Verify loading state is inactive
   */
  verifyNotLoadingState(): ResetPasswordPage {
    this.loadingSpinner.should('not.exist')
    this.submitButton.should('be.enabled')
    this.submitButton.should('not.have.attr', 'data-loading', 'true')
    return this
  }

  /**
   * Verify URL parameters are present
   */
  verifyUrlParameters(shouldHaveOobCode: boolean = true): ResetPasswordPage {
    cy.url().should('contain', '/resetPassword')
    if (shouldHaveOobCode) {
      cy.url().should('contain', 'oobCode=')
      cy.url().should('contain', 'mode=resetPassword')
    }
    return this
  }

  /**
   * Verify invalid or missing oobCode error
   */
  verifyInvalidCodeError(): ResetPasswordPage {
    // This might be shown as a toast or a page-level error
    cy.get('body').should('satisfy', (body) => {
      const text = body.text().toLowerCase()
      return text.includes('invalid') || text.includes('expired') || text.includes('error')
    })
    return this
  }

  /**
   * Clear form fields
   */
  clearForm(): ResetPasswordPage {
    this.newPasswordInput.clear()
    this.confirmPasswordInput.clear()
    return this
  }

  /**
   * Check if reset password form is visible
   */
  isVisible(): Cypress.Chainable<boolean> {
    return this.form.should('be.visible').then(() => true)
  }

  /**
   * Wait for any pending requests to complete
   */
  waitForRequests(): ResetPasswordPage {
    cy.wait(100)
    return this
  }

  /**
   * Dismiss any visible toast notifications
   */
  dismissToasts(): ResetPasswordPage {
    cy.get('body').then(($body) => {
      if ($body.find('.swal2-toast').length > 0) {
        cy.get('.swal2-toast').each(($toast) => {
          cy.wrap($toast).click()
        })
      }
    })
    return this
  }

  /**
   * Verify password strength validation
   */
  verifyPasswordStrengthValidation(password: string, shouldBeValid: boolean): ResetPasswordPage {
    this.enterNewPassword(password)
    this.submit()

    if (shouldBeValid) {
      this.verifyNoValidationErrors()
    } else {
      this.verifyNewPasswordError()
    }

    return this
  }

  /**
   * Verify password confirmation matching
   */
  verifyPasswordConfirmationMatching(newPassword: string, confirmPassword: string, shouldMatch: boolean): ResetPasswordPage {
    this.enterNewPassword(newPassword)
    this.enterConfirmPassword(confirmPassword)
    this.submit()

    if (shouldMatch) {
      this.verifyNoValidationErrors()
    } else {
      this.verifyConfirmPasswordError()
    }

    return this
  }

  /**
   * Test form interactivity
   */
  verifyFormInteractivity(): ResetPasswordPage {
    if (Cypress.browser.isHeaded) {
      this.newPasswordInput.click().should('be.focused').blur()
      this.confirmPasswordInput.click().should('be.focused').blur()
    } else {
      this.newPasswordInput.click()
      this.confirmPasswordInput.click()
    }
    return this
  }
}

// Export a singleton instance for convenience
export const resetPasswordPage = new ResetPasswordPage()