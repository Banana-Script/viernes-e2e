import { users, getUrl } from '@support/helpers'

// Firebase authentication delay to prevent rate limiting
const FIREBASE_AUTH_DELAY = 50

/*
 * Firebase Authentication State Management:
 *
 * Firebase v9+ uses IndexedDB to persist authentication state across browser sessions.
 * This includes user tokens, refresh tokens, and authentication metadata stored in
 * databases that begin with 'firebase' (e.g., 'firebaseLocalStorageDb').
 *
 * When testing authentication flows, we must clear:
 * 1. localStorage - For basic session data
 * 2. cookies - For HTTP-only authentication cookies
 * 3. sessionStorage - For temporary session data
 * 4. IndexedDB - For persistent Firebase authentication state
 *
 * Without clearing IndexedDB, authentication state persists between tests,
 * causing false positives and test interference.
 */

// Firebase authentication commands
const commands = {
  /**
   * Login command with Firebase session caching to prevent rate limiting
   * @param email - User email (optional, defaults to primary user)
   * @param password - User password (optional, defaults to primary user)
   * @param options - Additional options for login behavior
   */
  login: (
    email?: string,
    password?: string,
    options: {
      cacheSession?: boolean
      skipSessionCache?: boolean
      visitLoginPage?: boolean
    } = {},
  ) => {
    const { cacheSession = true, skipSessionCache = false, visitLoginPage = true } = options

    const userEmail = email || users.primary.email
    const userPassword = password || users.primary.password
    const sessionName = `viernes-auth-${userEmail}`

    if (cacheSession && !skipSessionCache) {
      cy.session(
        sessionName,
        () => {
          cy.performLogin(userEmail, userPassword, { visitLoginPage })
        },
        {
          validate: () => {
            // Validate session by checking if user is redirected to dashboard
            cy.visit(getUrl('baseUrl'))
            cy.url().should('not.contain', '/login')
          },
          cacheAcrossSpecs: true,
        },
      )
    } else {
      cy.performLogin(userEmail, userPassword, { visitLoginPage })
    }
  },

  /**
   * Perform actual login without session caching
   * @param email - User email
   * @param password - User password
   * @param options - Login options
   */
  performLogin: (email: string, password: string, options: { visitLoginPage?: boolean } = {}) => {
    const { visitLoginPage = true } = options

    if (visitLoginPage) {
      cy.visit(getUrl('login'))
    }

    // Wait for login form to be visible
    cy.get('[data-testid="login-form"]').should('be.visible')

    // Fill in credentials with delays to prevent rate limiting
    cy.get('[data-testid="email-input"]').clear().type(email, { delay: 10 })

    cy.wait(FIREBASE_AUTH_DELAY)

    cy.get('[data-testid="password-input"]').clear().type(password, { delay: 10 })

    cy.wait(FIREBASE_AUTH_DELAY)

    // Submit the form
    cy.get('[data-testid="login-submit-button"]').click()

    // Wait for authentication to complete
    cy.wait(FIREBASE_AUTH_DELAY * 2)

    // Verify successful login by checking for redirect to dashboard
    cy.url().should('not.contain', '/login')
    cy.url().should('match', /\/(dashboard)?$/)
  },

  /**
   * Login as primary user with session caching
   */
  loginAsPrimaryUser: (options = {}) => {
    cy.login(users.primary.email, users.primary.password, options)
  },

  /**
   * Login as secondary user with session caching
   */
  loginAsSecondaryUser: (options = {}) => {
    cy.login(users.secondary.email, users.secondary.password, options)
  },

  /**
   * Logout command that clears authentication state including Firebase IndexedDB
   */
  logout: () => {
    // Clear any authentication-related local storage or cookies
    cy.clearLocalStorage()
    cy.clearCookies()

    // Clear Firebase IndexedDB databases
    cy.clearFirebaseIndexedDB()

    // Visit login page to ensure logout
    cy.visit(getUrl('login'))
    cy.url().should('contain', '/login')
  },

  /**
   * Clear Firebase IndexedDB databases that start with 'firebase'
   */
  clearFirebaseIndexedDB: () => {
    cy.window().then((win) => {
      // Get IndexedDB instance
      const indexedDB = win.indexedDB

      if (indexedDB && indexedDB.databases) {
        // Modern browsers with databases() method
        indexedDB
          .databases()
          .then((databases) => {
            databases.forEach((db) => {
              if (db.name && db.name.startsWith('firebase')) {
                const deleteReq = indexedDB.deleteDatabase(db.name)
                deleteReq.onsuccess = () => {
                  console.log(`Deleted Firebase IndexedDB: ${db.name}`)
                }
                deleteReq.onerror = () => {
                  console.log(`Failed to delete Firebase IndexedDB: ${db.name}`)
                }
              }
            })
          })
          .catch(() => {
            // Fallback for browsers that don't support databases()
            cy.clearFirebaseIndexedDBFallback()
          })
      } else {
        // Fallback for older browsers
        cy.clearFirebaseIndexedDBFallback()
      }
    })
  },

  /**
   * Fallback method to clear common Firebase IndexedDB databases
   */
  clearFirebaseIndexedDBFallback: () => {
    cy.window().then((win) => {
      const indexedDB = win.indexedDB

      // Common Firebase IndexedDB database names
      const firebaseDBNames = [
        'firebaseLocalStorageDb',
        'firebase-app-check-database',
        'firebase-messaging-database',
        'firebase-installations-database',
        'firebase-analytics-database',
        'firebase-remote-config-database',
        'firebase-performance-database',
      ]

      firebaseDBNames.forEach((dbName) => {
        const deleteReq = indexedDB.deleteDatabase(dbName)
        deleteReq.onsuccess = () => {
          console.log(`Deleted Firebase IndexedDB: ${dbName}`)
        }
        deleteReq.onerror = () => {
          console.log(`Firebase IndexedDB ${dbName} may not exist or already deleted`)
        }
      })
    })
  },

  /**
   * Check if user is authenticated
   */
  isLoggedIn: () => {
    cy.visit(getUrl('baseUrl'))
    return cy.url().then((url) => !url.includes('/login'))
  },

  /**
   * Wait for Firebase authentication to complete
   */
  waitForAuth: (timeout = 10000) => {
    cy.get('body', { timeout }).should('exist')
    cy.wait(FIREBASE_AUTH_DELAY)
  },

  /**
   * Verify success toast notification
   */
  verifySuccessToast: (message?: string) => {
    cy.get('.swal2-toast.swal2-icon-success', { timeout: 10000 }).should('be.visible')
    if (message) {
      cy.get('.swal2-toast .swal2-title').should('contain.text', message)
    }
  },

  /**
   * Verify error toast notification
   */
  verifyErrorToast: (message?: string) => {
    cy.get('.swal2-toast.swal2-icon-error', { timeout: 10000 }).should('be.visible')
    if (message) {
      cy.get('.swal2-toast .swal2-title').should('contain.text', message)
    }
  },

  /**
   * Dismiss any visible toast notifications
   */
  dismissToasts: () => {
    cy.get('body').then(($body) => {
      if ($body.find('.swal2-toast').length > 0) {
        cy.get('.swal2-toast').each(($toast) => {
          cy.wrap($toast).click()
        })
      }
    })
  },

  /**
   * Clean all Firebase authentication state (for use in beforeEach)
   */
  cleanFirebaseState: () => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.clearFirebaseIndexedDB()

    // Clear session storage as well
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
  },

  // Password Reset Commands

  /**
   * Request password reset email
   * @param email - Email address to send reset link to
   * @param options - Additional options for the request
   */
  requestPasswordReset: (
    email: string,
    options: {
      shouldSucceed?: boolean
      skipToast?: boolean
    } = {},
  ) => {
    const { shouldSucceed = true, skipToast = false } = options

    cy.visit(getUrl('forgotPassword'))

    // Wait for form to be visible
    cy.get('[data-testid="forgot-password-form"]').should('be.visible')

    // Fill in email with delay to prevent rate limiting
    cy.get('[data-testid="forgot-password-email-input"]').clear().type(email, { delay: 10 })

    cy.wait(FIREBASE_AUTH_DELAY)

    // Submit the form
    cy.get('[data-testid="forgot-password-submit-button"]').click()

    // Wait for request to complete
    cy.wait(FIREBASE_AUTH_DELAY * 2)

    if (!skipToast) {
      if (shouldSucceed) {
        cy.verifySuccessToast()
      } else {
        cy.verifyErrorToast()
      }
    }
  },

  /**
   * Reset password using oobCode
   * @param oobCode - The reset code from Firebase
   * @param newPassword - The new password to set
   * @param options - Additional options for the reset
   */
  resetPassword: (
    oobCode: string,
    newPassword: string,
    options: {
      confirmPassword?: string
      shouldSucceed?: boolean
      skipToast?: boolean
    } = {},
  ) => {
    const { confirmPassword = newPassword, shouldSucceed = true, skipToast = false } = options

    // Visit reset password page with oobCode
    const resetUrl = `${getUrl('resetPassword')}?mode=resetPassword&oobCode=${oobCode}`
    cy.visit(resetUrl)

    // Wait for form to be visible
    cy.get('[data-testid="reset-password-form"]').should('be.visible')

    // Fill in passwords with delays to prevent rate limiting
    cy.get('[data-testid="reset-password-new-password-input"]').clear().type(newPassword, { delay: 10 })

    cy.wait(FIREBASE_AUTH_DELAY)

    cy.get('[data-testid="reset-password-confirm-password-input"]').clear().type(confirmPassword, { delay: 10 })

    cy.wait(FIREBASE_AUTH_DELAY)

    // Submit the form
    cy.get('[data-testid="reset-password-submit-button"]').click()

    // Wait for request to complete
    cy.wait(FIREBASE_AUTH_DELAY * 2)

    if (!skipToast) {
      if (shouldSucceed) {
        cy.verifySuccessToast()
      } else {
        cy.verifyErrorToast()
      }
    }
  },

  /**
   * Generate a realistic oobCode for testing
   * This simulates what Firebase would generate
   */
  generateResetCode: (): Cypress.Chainable<string> => {
    // Generate a realistic oobCode similar to Firebase format
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    let result = ''
    for (let i = 0; i < 120; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return cy.wrap(result)
  },

  /**
   * Generate a complete password reset URL with oobCode
   * @param email - Email address (for context)
   * @param apiKey - Firebase API key (optional)
   */
  generateResetUrl: (email?: string, apiKey?: string): Cypress.Chainable<string> => {
    return cy.generateResetCode().then((oobCode) => {
      const baseUrl = getUrl('resetPassword')
      const params = new URLSearchParams({
        mode: 'resetPassword',
        oobCode: oobCode,
        ...(apiKey && { apiKey }),
      })
      return `${baseUrl}?${params.toString()}`
    })
  },

  /**
   * Mock Firebase password reset email request
   * @param email - Email to mock request for
   * @param shouldSucceed - Whether the request should succeed
   */
  mockPasswordResetRequest: (email: string, shouldSucceed: boolean = true) => {
    const mockResponse = shouldSucceed
      ? {
          statusCode: 200,
          body: {
            kind: 'identitytoolkit#GetOobConfirmationCodeResponse',
            email: email,
          },
        }
      : {
          statusCode: 400,
          body: {
            error: {
              code: 400,
              message: 'EMAIL_NOT_FOUND',
              errors: [
                {
                  message: 'EMAIL_NOT_FOUND',
                  domain: 'global',
                  reason: 'invalid',
                },
              ],
            },
          },
        }

    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:sendOobCode*', mockResponse).as(
      'passwordResetRequest',
    )
  },

  /**
   * Mock Firebase password reset confirmation
   * @param oobCode - The reset code to mock
   * @param shouldSucceed - Whether the reset should succeed
   */
  mockPasswordResetConfirmation: (oobCode: string, shouldSucceed: boolean = true) => {
    const mockResponse = shouldSucceed
      ? {
          statusCode: 200,
          body: {
            kind: 'identitytoolkit#ResetPasswordResponse',
            email: 'test@example.com',
            requestType: 'PASSWORD_RESET',
          },
        }
      : {
          statusCode: 400,
          body: {
            error: {
              code: 400,
              message: 'INVALID_OOB_CODE',
              errors: [
                {
                  message: 'INVALID_OOB_CODE',
                  domain: 'global',
                  reason: 'invalid',
                },
              ],
            },
          },
        }

    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:resetPassword*', mockResponse).as(
      'passwordResetConfirmation',
    )
  },

  /**
   * Complete password reset flow from start to finish
   * @param email - Email to reset password for
   * @param newPassword - New password to set
   * @param options - Flow options
   */
  completePasswordResetFlow: (
    email: string,
    newPassword: string,
    options: {
      useValidCode?: boolean
      mockRequests?: boolean
    } = {},
  ) => {
    const { useValidCode = true, mockRequests = true } = options

    if (mockRequests) {
      // Mock the email request
      cy.mockPasswordResetRequest(email, true)
    }

    // Step 1: Request password reset
    cy.requestPasswordReset(email, { skipToast: mockRequests })

    if (mockRequests) {
      cy.wait('@passwordResetRequest')
    }

    // Step 2: Generate reset URL (simulating email link)
    cy.generateResetUrl(email).then((resetUrl) => {
      if (mockRequests) {
        // Extract oobCode from URL for mocking
        const urlParams = new URLSearchParams(resetUrl.split('?')[1])
        const oobCode = urlParams.get('oobCode')

        if (oobCode) {
          cy.mockPasswordResetConfirmation(oobCode, useValidCode)
        }
      }

      // Step 3: Visit reset URL and complete password reset
      cy.visit(resetUrl)
      cy.get('[data-testid="reset-password-form"]').should('be.visible')

      cy.get('[data-testid="reset-password-new-password-input"]').clear().type(newPassword, { delay: 10 })
      cy.wait(FIREBASE_AUTH_DELAY)

      cy.get('[data-testid="reset-password-confirm-password-input"]').clear().type(newPassword, { delay: 10 })
      cy.wait(FIREBASE_AUTH_DELAY)

      cy.get('[data-testid="reset-password-submit-button"]').click()

      if (mockRequests) {
        cy.wait('@passwordResetConfirmation')

        if (useValidCode) {
          cy.verifySuccessToast()
          // Should redirect to login or dashboard
          cy.url().should('satisfy', (url: string) => {
            return url.includes('/login') || url.includes('/dashboard') || url.match(/\/$/)
          })
        } else {
          cy.verifyErrorToast()
        }
      }
    })
  },
}

export default commands
