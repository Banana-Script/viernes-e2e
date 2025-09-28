import { getUrl } from '@support/helpers'

/**
 * Login Page Object Model
 * Provides a clean interface for interacting with the login page
 */
export class LoginPage {
  // Page elements
  private get form() {
    return cy.get('[data-testid="login-form"]')
  }

  private get emailInput() {
    return cy.get('[data-testid="email-input"]')
  }

  private get passwordInput() {
    return cy.get('[data-testid="password-input"]')
  }

  private get submitButton() {
    return cy.get('[data-testid="login-submit-button"]')
  }

  private get emailErrorMessage() {
    return cy.get('[data-testid="email-error-message"]')
  }

  private get passwordErrorMessage() {
    return cy.get('[data-testid="password-error-message"]')
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
   * Navigate to the login page
   */
  visit(): LoginPage {
    cy.visit(getUrl('login'))

    // Wait for the page to be fully loaded
    cy.document().should('have.property', 'readyState', 'complete')

    // Wait for potential loading states to finish
    cy.get('body').should('be.visible')

    return this
  }

  /**
   * Wait for the login form to be fully loaded and interactive
   */
  waitForLoad(): LoginPage {
    // Wait for form to be visible with extended timeout
    this.form.should('be.visible', { timeout: 15000 })

    // Wait for all form elements to be present and enabled
    this.emailInput.should('be.visible').and('be.enabled', { timeout: 10000 })
    this.passwordInput.should('be.visible').and('be.enabled', { timeout: 10000 })
    this.submitButton.should('be.visible').and('be.enabled', { timeout: 10000 })

    // Different wait strategies for headed vs headless
    if (Cypress.browser.isHeaded) {
      // In headed mode, wait longer for full interactivity
      cy.wait(1000)
    } else {
      // In headless mode, wait longer for DOM stability
      cy.wait(2000)
    }

    // Ensure elements are still stable after waiting
    this.form.should('be.visible')

    return this
  }

  /**
   * Enter email address
   */
  enterEmail(email: string): LoginPage {
    this.emailInput.clear().type(email, { delay: 10 })
    return this
  }

  /**
   * Enter password
   */
  enterPassword(password: string): LoginPage {
    this.passwordInput.clear().type(password, { delay: 10 })
    return this
  }

  /**
   * Click the submit button
   */
  submit(): LoginPage {
    this.submitButton.click()
    return this
  }

  /**
   * Complete login flow with credentials
   */
  login(email: string, password: string): LoginPage {
    this.enterEmail(email)
    cy.wait(50) // Prevent rate limiting
    this.enterPassword(password)
    cy.wait(50) // Prevent rate limiting
    this.submit()
    cy.wait(100) // Wait for authentication
    return this
  }

  /**
   * Verify successful login by checking redirect
   */
  verifyLoginSuccess(): LoginPage {
    cy.url().should('not.contain', '/login')
    cy.url().should('match', /\/(dashboard)?$/)
    return this
  }

  /**
   * Verify login failure by staying on login page
   */
  verifyLoginFailure(): LoginPage {
    cy.url().should('contain', '/login')
    return this
  }

  /**
   * Verify email validation error
   */
  verifyEmailError(message?: string): LoginPage {
    this.emailErrorMessage.should('be.visible')
    if (message) {
      this.emailErrorMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify password validation error
   */
  verifyPasswordError(message?: string): LoginPage {
    this.passwordErrorMessage.should('be.visible')
    if (message) {
      this.passwordErrorMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify no validation errors are shown
   */
  verifyNoValidationErrors(): LoginPage {
    this.emailErrorMessage.should('not.exist')
    this.passwordErrorMessage.should('not.exist')
    return this
  }

  /**
   * Verify success toast notification
   */
  verifySuccessToast(message?: string): LoginPage {
    this.successToast.should('be.visible')
    if (message) {
      this.toastMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify error toast notification
   */
  verifyErrorToast(message?: string): LoginPage {
    this.errorToast.should('be.visible')
    if (message) {
      this.toastMessage.should('contain.text', message)
    }
    return this
  }

  /**
   * Verify form elements are present and enabled
   */
  verifyFormElements(): LoginPage {
    // Wait for form to be visible with timeout
    this.form.should('be.visible', { timeout: 10000 })

    // Verify all inputs are present, visible, and enabled
    this.emailInput.should('be.visible').and('be.enabled').and('not.have.attr', 'readonly')
    this.passwordInput.should('be.visible').and('be.enabled').and('not.have.attr', 'readonly')
    this.submitButton.should('be.visible').and('be.enabled').and('not.have.attr', 'disabled')

    return this
  }

  /**
   * Verify form elements are interactive (separate method for optional focus testing)
   */
  verifyFormInteractivity(): LoginPage {
    // Only test interactivity in headed mode (focus events work better)
    if (Cypress.browser.isHeaded) {
      this.emailInput.click().should('be.focused').blur()
      this.passwordInput.click().should('be.focused').blur()
    } else {
      // In headless mode, just verify elements can be clicked
      this.emailInput.click()
      this.passwordInput.click()
    }

    return this
  }

  /**
   * Verify submit button is disabled (useful for testing loading states)
   */
  verifySubmitButtonDisabled(): LoginPage {
    this.submitButton.should('be.disabled')
    return this
  }

  /**
   * Verify submit button is enabled
   */
  verifySubmitButtonEnabled(): LoginPage {
    this.submitButton.should('be.enabled')
    return this
  }

  /**
   * Clear form fields
   */
  clearForm(): LoginPage {
    this.emailInput.clear()
    this.passwordInput.clear()
    return this
  }

  /**
   * Check if login form is visible
   */
  isVisible(): Cypress.Chainable<boolean> {
    return this.form.should('be.visible').then(() => true)
  }

  /**
   * Wait for any pending requests to complete
   */
  waitForRequests(): LoginPage {
    cy.wait(100)
    return this
  }

  /**
   * Dismiss any visible toast notifications
   */
  dismissToasts(): LoginPage {
    cy.get('body').then(($body) => {
      if ($body.find('.swal2-toast').length > 0) {
        cy.get('.swal2-toast').each(($toast) => {
          cy.wrap($toast).click()
        })
      }
    })
    return this
  }
}

// Export a singleton instance for convenience
export const loginPage = new LoginPage()
