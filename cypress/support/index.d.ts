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
  }
}
