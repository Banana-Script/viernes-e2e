/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Gets element using the data-cy attribute
     */
    dataCy(value: string): Chainable<Element>

    /**
     * Login command with Firebase session caching to prevent rate limiting
     * @param email - User email (optional, defaults to primary user)
     * @param password - User password (optional, defaults to primary user)
     * @param options - Additional options for login behavior
     */
    login(
      email?: string,
      password?: string,
      options?: {
        cacheSession?: boolean
        skipSessionCache?: boolean
        visitLoginPage?: boolean
      },
    ): Chainable<void>

    /**
     * Perform actual login without session caching
     * @param email - User email
     * @param password - User password
     * @param options - Login options
     */
    performLogin(email: string, password: string, options?: { visitLoginPage?: boolean }): Chainable<void>

    /**
     * Login as primary user with session caching
     */
    loginAsPrimaryUser(options?: {
      cacheSession?: boolean
      skipSessionCache?: boolean
      visitLoginPage?: boolean
    }): Chainable<void>

    /**
     * Login as secondary user with session caching
     */
    loginAsSecondaryUser(options?: {
      cacheSession?: boolean
      skipSessionCache?: boolean
      visitLoginPage?: boolean
    }): Chainable<void>

    /**
     * Logout command that clears authentication state including Firebase IndexedDB
     */
    logout(): Chainable<void>

    /**
     * Clear Firebase IndexedDB databases that start with 'firebase'
     */
    clearFirebaseIndexedDB(): Chainable<void>

    /**
     * Fallback method to clear common Firebase IndexedDB databases
     */
    clearFirebaseIndexedDBFallback(): Chainable<void>

    /**
     * Check if user is authenticated
     */
    isLoggedIn(): Chainable<boolean>

    /**
     * Wait for Firebase authentication to complete
     */
    waitForAuth(timeout?: number): Chainable<void>

    /**
     * Verify success toast notification
     */
    verifySuccessToast(message?: string): Chainable<void>

    /**
     * Verify error toast notification
     */
    verifyErrorToast(message?: string): Chainable<void>

    /**
     * Dismiss any visible toast notifications
     */
    dismissToasts(): Chainable<void>

    /**
     * Clean all Firebase authentication state (for use in beforeEach)
     */
    cleanFirebaseState(): Chainable<void>

    /**
     * Verify form elements are interactive (headed/headless compatible)
     */
    verifyFormInteractivity(): Chainable<void>

    // Password Reset Commands

    /**
     * Request password reset email
     * @param email - Email address to send reset link to
     * @param options - Additional options for the request
     */
    requestPasswordReset(
      email: string,
      options?: {
        shouldSucceed?: boolean
        skipToast?: boolean
      },
    ): Chainable<void>

    /**
     * Reset password using oobCode
     * @param oobCode - The reset code from Firebase
     * @param newPassword - The new password to set
     * @param options - Additional options for the reset
     */
    resetPassword(
      oobCode: string,
      newPassword: string,
      options?: {
        confirmPassword?: string
        shouldSucceed?: boolean
        skipToast?: boolean
      },
    ): Chainable<void>

    /**
     * Generate a realistic oobCode for testing
     * This simulates what Firebase would generate
     */
    generateResetCode(): Chainable<string>

    /**
     * Generate a complete password reset URL with oobCode
     * @param email - Email address (for context)
     * @param apiKey - Firebase API key (optional)
     */
    generateResetUrl(email?: string, apiKey?: string): Chainable<string>

    /**
     * Mock Firebase password reset email request
     * @param email - Email to mock request for
     * @param shouldSucceed - Whether the request should succeed
     */
    mockPasswordResetRequest(email: string, shouldSucceed?: boolean): Chainable<void>

    /**
     * Mock Firebase password reset confirmation
     * @param oobCode - The reset code to mock
     * @param shouldSucceed - Whether the reset should succeed
     */
    mockPasswordResetConfirmation(oobCode: string, shouldSucceed?: boolean): Chainable<void>

    /**
     * Complete password reset flow from start to finish
     * @param email - Email to reset password for
     * @param newPassword - New password to set
     * @param options - Flow options
     */
    completePasswordResetFlow(
      email: string,
      newPassword: string,
      options?: {
        useValidCode?: boolean
        mockRequests?: boolean
      },
    ): Chainable<void>
  }
}
