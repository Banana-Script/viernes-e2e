import { getUrl } from '@support/helpers'

describe('Viernes - Basic Navigation', () => {
  it('should load the home page successfully', () => {
    cy.visit(getUrl('baseUrl'))
    cy.get('body').should('be.visible')
    cy.title().should('not.be.empty')
  })

  it('should verify page loads without errors', () => {
    cy.visit(getUrl('baseUrl'))
    cy.url().should('contain', 'bananascript.io')
  })
})
