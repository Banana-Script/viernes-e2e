import { getUrl } from '@support/helpers'

describe('Viernes - Basic Navigation', () => {
  beforeEach(() => {
    // Clean all Firebase authentication state before each test
    cy.cleanFirebaseState()
  })

  afterEach(() => {
    // Clean up all Firebase authentication state after each test
    cy.cleanFirebaseState()
  })

  it('should load the home page successfully', () => {
    cy.visit(getUrl('baseUrl'))
    cy.get('body').should('be.visible')
    cy.title().should('not.be.empty')
  })
})
