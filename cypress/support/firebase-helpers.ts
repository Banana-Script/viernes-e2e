/**
 * Firebase-specific helper utilities for E2E testing
 * Provides utilities for handling Firebase authentication, rate limiting, and error handling
 */

// Firebase authentication delays to prevent rate limiting
const FIREBASE_DELAYS = {
  AUTH_REQUEST: 50,
  BETWEEN_ATTEMPTS: 100,
  SESSION_VALIDATION: 200,
  NETWORK_TIMEOUT: 10000,
  TOAST_TIMEOUT: 10000,
}

// Common Firebase error messages and their user-friendly equivalents
const FIREBASE_ERRORS = {
  'auth/user-not-found': 'No user found with this email address',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password should be at least 6 characters',
}

/**
 * Firebase authentication utilities
 */
export class FirebaseTestUtils {
  /**
   * Wait for Firebase authentication to complete
   */
  static waitForAuth(timeout: number = FIREBASE_DELAYS.NETWORK_TIMEOUT): void {
    cy.get('body', { timeout }).should('exist')
    cy.wait(FIREBASE_DELAYS.AUTH_REQUEST)
  }

  /**
   * Wait between authentication attempts to prevent rate limiting
   */
  static waitBetweenAttempts(): void {
    cy.wait(FIREBASE_DELAYS.BETWEEN_ATTEMPTS)
  }

  /**
   * Validate session by checking authentication state
   */
  static validateSession(): void {
    cy.wait(FIREBASE_DELAYS.SESSION_VALIDATION)
    cy.get('body').should('exist')
  }

  /**
   * Clear all Firebase-related storage and cookies
   */
  static clearFirebaseState(): void {
    cy.clearLocalStorage()
    cy.clearCookies()

    // Clear IndexedDB (Firebase may use it for offline persistence)
    cy.window().then((win) => {
      if (win.indexedDB) {
        // Clear Firebase-specific IndexedDB stores
        const deleteDB = (dbName: string) => {
          const deleteReq = win.indexedDB.deleteDatabase(dbName)
          deleteReq.onerror = () => console.warn(`Failed to delete ${dbName}`)
          deleteReq.onsuccess = () => console.log(`Deleted ${dbName}`)
        }

        // Common Firebase IndexedDB names
        deleteDB('firebaseLocalStorageDb')
        deleteDB('firebase-heartbeat-database')
        deleteDB('firebase-installations-database')
      }
    })
  }

  /**
   * Intercept Firebase authentication requests for testing
   */
  static interceptAuthRequests(): void {
    // Intercept Firebase Auth REST API calls
    cy.intercept('POST', '**/identitytoolkit/v3/relyingparty/verifyPassword**').as('signInRequest')
    cy.intercept('POST', '**/identitytoolkit/v3/relyingparty/signupNewUser**').as('signUpRequest')
    cy.intercept('POST', '**/identitytoolkit/v3/relyingparty/getAccountInfo**').as('getAccountRequest')

    // Intercept Firebase Auth v1 API
    cy.intercept('POST', '**/v1/accounts:signInWithPassword**').as('signInV1Request')
    cy.intercept('POST', '**/v1/accounts:signUp**').as('signUpV1Request')
  }

  /**
   * Simulate Firebase rate limiting for testing
   */
  static simulateRateLimit(): void {
    cy.intercept('POST', '**/identitytoolkit/**', {
      statusCode: 429,
      body: {
        error: {
          code: 429,
          message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
          errors: [
            {
              message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
              domain: 'global',
              reason: 'rateLimitExceeded',
            },
          ],
        },
      },
    }).as('rateLimitedRequest')
  }

  /**
   * Simulate Firebase network error for testing
   */
  static simulateNetworkError(): void {
    cy.intercept('POST', '**/identitytoolkit/**', { forceNetworkError: true }).as('networkErrorRequest')
  }

  /**
   * Verify Firebase authentication request was made
   */
  static verifyAuthRequest(): void {
    cy.wait('@signInRequest').then((interception) => {
      expect(interception.request.body).to.have.property('email')
      expect(interception.request.body).to.have.property('password')
      expect(interception.request.body).to.have.property('returnSecureToken', true)
    })
  }

  /**
   * Mock successful Firebase authentication response
   */
  static mockSuccessfulAuth(user: { email: string; uid: string }): void {
    cy.intercept('POST', '**/identitytoolkit/v3/relyingparty/verifyPassword**', {
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: user.uid,
        email: user.email,
        displayName: '',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
      },
    }).as('successfulAuthRequest')
  }

  /**
   * Mock failed Firebase authentication response
   */
  static mockFailedAuth(errorCode: string = 'auth/user-not-found'): void {
    const errorMessage = FIREBASE_ERRORS[errorCode] || 'Authentication failed'

    cy.intercept('POST', '**/identitytoolkit/**', {
      statusCode: 400,
      body: {
        error: {
          code: 400,
          message: errorCode.replace('auth/', '').toUpperCase(),
          errors: [
            {
              message: errorMessage,
              domain: 'global',
              reason: 'invalid',
            },
          ],
        },
      },
    }).as('failedAuthRequest')
  }

  /**
   * Wait for and verify toast notification
   */
  static verifyToast(
    type: 'success' | 'error',
    message?: string,
    timeout: number = FIREBASE_DELAYS.TOAST_TIMEOUT,
  ): void {
    const toastSelector = `.swal2-toast.swal2-icon-${type}`

    cy.get(toastSelector, { timeout }).should('be.visible')

    if (message) {
      cy.get('.swal2-toast .swal2-title').should('contain.text', message)
    }
  }

  /**
   * Dismiss all visible toast notifications
   */
  static dismissAllToasts(): void {
    cy.get('body').then(($body) => {
      if ($body.find('.swal2-toast').length > 0) {
        cy.get('.swal2-toast').each(($toast) => {
          cy.wrap($toast).click()
        })
      }
    })
  }

  /**
   * Create a unique test user email to avoid conflicts
   */
  static generateTestUserEmail(baseEmail: string): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const [localPart, domain] = baseEmail.split('@')
    return `${localPart}+test${timestamp}${random}@${domain}`
  }

  /**
   * Retry authentication operation with exponential backoff
   */
  static retryAuth(operation: () => void, maxRetries: number = 3): void {
    let retryCount = 0

    const attemptAuth = () => {
      try {
        operation()
      } catch (error) {
        retryCount++
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * FIREBASE_DELAYS.BETWEEN_ATTEMPTS
          cy.wait(delay)
          attemptAuth()
        } else {
          throw error
        }
      }
    }

    attemptAuth()
  }

  /**
   * Check if Firebase rate limiting is in effect
   */
  static checkRateLimit(): Cypress.Chainable<boolean> {
    return cy.window().then((win) => {
      // Check for rate limiting indicators in localStorage
      const rateLimitData = win.localStorage.getItem('firebase-rate-limit')
      if (rateLimitData) {
        const data = JSON.parse(rateLimitData)
        const now = Date.now()
        return now < data.resetTime
      }
      return false
    })
  }

  /**
   * Set up Firebase performance monitoring for tests
   */
  static setupPerformanceMonitoring(): void {
    cy.window().then((win) => {
      // Monitor Firebase authentication performance
      win.performance.mark('firebase-auth-start')

      // Set up performance observer for Firebase operations
      if (win.PerformanceObserver) {
        const observer = new win.PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name.includes('firebase') || entry.name.includes('auth')) {
              console.log(`Firebase operation: ${entry.name} took ${entry.duration}ms`)
            }
          })
        })
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
      }
    })
  }

  /**
   * Validate Firebase configuration is properly set up
   */
  static validateFirebaseConfig(): void {
    cy.window().then((win: any) => {
      // Check if Firebase is properly initialized
      expect(win).to.have.property('firebase')

      // Verify Firebase app configuration
      const app = win.firebase?.app()
      expect(app).to.exist
      expect(app.options).to.have.property('projectId')
      expect(app.options).to.have.property('apiKey')
    })
  }
}

/**
 * Firebase test data helpers
 */
export class FirebaseTestData {
  /**
   * Generate test credentials for different scenarios
   */
  static getTestCredentials() {
    return {
      valid: {
        email: 'valid@example.com',
        password: 'ValidPassword123!',
      },
      invalid: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      },
      malformed: {
        email: 'not-an-email',
        password: 'short',
      },
      empty: {
        email: '',
        password: '',
      },
    }
  }

  /**
   * Generate test user data for registration
   */
  static generateTestUser() {
    const timestamp = Date.now()
    return {
      email: `test+${timestamp}@example.com`,
      password: 'TestPassword123!',
      displayName: `Test User ${timestamp}`,
    }
  }
}

// Export utility instances for convenience
export const firebaseUtils = FirebaseTestUtils
export const firebaseTestData = FirebaseTestData

// Export constants for easy access
export { FIREBASE_DELAYS, FIREBASE_ERRORS }
