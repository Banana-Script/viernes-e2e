import { getUrl } from '@support/helpers'

/**
 * Forgot Password Page Object Model
 * Provides a clean interface for interacting with the password reset request page
 */
export class ForgotPasswordPage {
  // Page elements
  private get form() {
    return cy.get('[data-testid="forgot-password-form"]')
  }

  private get emailInput() {
    return cy.get('[data-testid="forgot-password-email-input"]')
  }

  private get submitButton() {
    return cy.get('[data-testid="forgot-password-submit-button"]')
  }

  private get loadingSpinner() {
    return cy.get('[data-testid="forgot-password-loading-spinner"]')
  }

  private get emailErrorMessage() {
    return cy.get('[data-testid="forgot-password-email-error"]')
  }

  private get backToLoginLink() {
    return cy.get('[data-testid="forgot-password-back-to-login-link"]')
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
   * Navigate to the forgot password page
   */
  visit(): ForgotPasswordPage {
    cy.visit(getUrl('forgotPassword'))

    // Wait for the page to be fully loaded
    cy.document().should('have.property', 'readyState', 'complete')

    // Wait for potential loading states to finish
    cy.get('body').should('be.visible')

    return this
  }

  /**
   * Wait for the forgot password form to be fully loaded and interactive
   */
  waitForLoad(): ForgotPasswordPage {
    // Wait for form to be visible with extended timeout
    this.form.should('be.visible', { timeout: 15000 })

    // Wait for form elements to be present and enabled
    this.emailInput.should('be.visible').and('be.enabled', { timeout: 10000 })
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
   * Enter email address
   */
  enterEmail(email: string): ForgotPasswordPage {
    this.emailInput.clear().type(email, { delay: 10 })
    return this
  }

  /**
   * Click the submit button to request password reset
   */
  submit(): ForgotPasswordPage {
    this.submitButton.click()
    return this
  }

  /**
   * Request password reset with email
   */
  requestPasswordReset(email: string): ForgotPasswordPage {
    this.enterEmail(email)
    cy.wait(50) // Prevent rate limiting
    this.submit()
    cy.wait(100) // Wait for request
    return this
  }

  /**
   * Verify successful password reset request
   */
  verifyRequestSuccess(): ForgotPasswordPage {
    this.verifySuccessToast()
    return this
  }

  /**
   * Verify password reset request failure
   */
  verifyRequestFailure(): ForgotPasswordPage {
    this.verifyErrorToast()
    return this
  }

  /**
   * Verify email validation error
   */
  verifyEmailError(message?: string): ForgotPasswordPage {
    // Try to find error message, if not found, check for form validation state
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="forgot-password-email-error"]').length > 0) {
        this.emailErrorMessage.should('be.visible')
        if (message) {
          this.emailErrorMessage.should('contain.text', message)
        }
      } else {
        // Check for visual validation states or form invalidity
        this.emailInput.should('satisfy', ($el) => {
          const element = $el[0] as HTMLInputElement
          return !element.validity.valid || $el.hasClass('is-invalid') || $el.hasClass('error')
        })
      }
    })
    return this
  }

  /**
   * Verify no validation errors are shown
   */
  verifyNoValidationErrors(): ForgotPasswordPage {
    this.emailErrorMessage.should('not.exist')
    return this
  }

  /**
   * Verify success toast notification
   */
  verifySuccessToast(message?: string): ForgotPasswordPage {
    this.successToast.should('be.visible', { timeout: 10000 })
    if (message) {
      this.toastMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify error toast notification
   */
  verifyErrorToast(message?: string): ForgotPasswordPage {
    this.errorToast.should('be.visible', { timeout: 10000 })
    if (message) {
      this.toastMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify form elements are present and enabled
   */
  verifyFormElements(): ForgotPasswordPage {
    this.form.should('be.visible', { timeout: 10000 })
    this.emailInput.should('be.visible').and('be.enabled').and('not.have.attr', 'readonly')
    this.submitButton.should('be.visible').and('be.enabled').and('not.have.attr', 'disabled')
    this.backToLoginLink.should('be.visible')
    return this
  }

  /**
   * Verify loading state is active
   */
  verifyLoadingState(): ForgotPasswordPage {
    this.loadingSpinner.should('be.visible')
    this.submitButton.should('be.disabled')
    this.submitButton.should('have.attr', 'data-loading', 'true')
    return this
  }

  /**
   * Verify loading state is inactive
   */
  verifyNotLoadingState(): ForgotPasswordPage {
    this.loadingSpinner.should('not.exist')
    this.submitButton.should('be.enabled')
    this.submitButton.should('not.have.attr', 'data-loading', 'true')
    return this
  }

  /**
   * Click back to login link
   */
  clickBackToLogin(): ForgotPasswordPage {
    this.backToLoginLink.click()
    return this
  }

  /**
   * Verify navigation to login page
   */
  verifyNavigationToLogin(): ForgotPasswordPage {
    // Accept both /login and /auth/boxed-signin as valid login pages
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/login') || url.includes('/auth/boxed-signin')
    })
    return this
  }

  /**
   * Clear form fields
   */
  clearForm(): ForgotPasswordPage {
    this.emailInput.clear()
    return this
  }

  /**
   * Check if forgot password form is visible
   */
  isVisible(): Cypress.Chainable<boolean> {
    return this.form.should('be.visible').then(() => true)
  }

  /**
   * Wait for any pending requests to complete
   */
  waitForRequests(): ForgotPasswordPage {
    cy.wait(100)
    return this
  }

  /**
   * Dismiss any visible toast notifications
   */
  dismissToasts(): ForgotPasswordPage {
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
   * Verify form submission with specific email validation
   */
  verifyEmailValidation(email: string, shouldBeValid: boolean): ForgotPasswordPage {
    this.enterEmail(email)
    this.submit()

    if (shouldBeValid) {
      this.verifyNoValidationErrors()
    } else {
      this.verifyEmailError()
    }

    return this
  }

  /**
   * Test form interactivity
   */
  verifyFormInteractivity(): ForgotPasswordPage {
    if (Cypress.browser.isHeaded) {
      this.emailInput.click().should('be.focused').blur()
    } else {
      this.emailInput.click()
    }
    return this
  }
}

// Export a singleton instance for convenience
export const forgotPasswordPage = new ForgotPasswordPage()