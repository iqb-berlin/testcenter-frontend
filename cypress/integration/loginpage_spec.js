import { login, logout, visitLoginPage } from './utils'

describe('Login page tests', () => {

  beforeEach(visitLoginPage)
  it('Visits the homepage', () => {
    cy.contains('IQB-Testcenter')
      .should('exist');
    cy.contains('Anmeldename')
      .should('exist');
  })

  it('Signs in a user with login code and logout', () => {
    login('test', 'user123');
    cy.get('#login')
      .click()
      .wait(5);
    cy.url().should('eq', 'http://localhost:4200/#/r/code-input');
    cy.get('.mat-form-field-infix')
      .type('yyy')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click();
    logout();
  })

  it('Signs in a user with wrong login code and logout', () => {
    login('test', 'user123')
    cy.get('#login')
      .click()
      .wait(5);
    cy.url().should('eq', 'http://localhost:4200/#/r/code-input');
    cy.get('.mat-form-field-infix')
      .type('ttt')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click();
    cy.contains('Der Code ist leider nicht gültig. Bitte noch einmal versuchen')
      .should('exist');
    logout();
  })

  it('Signs in a user and logout', () => {
    login('test-demo', 'user123')
    cy.get('#login')
      .click()
      .wait(5);
    cy.url().should('eq', 'http://localhost:4200/#/r/test-starter');
    logout();
  })

  it('Signs in an admin and logout', () => {
    login('super', 'user123')
    cy.contains('Weiter als Admin')
      .click()
    cy.url().should('eq', 'http://localhost:4200/#/r/admin-starter');
    logout()
  })

  it('Signs in a user without password', () => {
    cy.get('mat-form-field input').eq(0)
      .type('test-no-pw')
    cy.contains('Weiter')
      .click()
    cy.url().should('eq', 'http://localhost:4200/#/r/test-starter');
    logout()
  })

  it('Try to sign in with wrong credentials', () => {
    login('test', 'wrongpassword')
    cy.get('#login')
      .click()
    cy.contains('Anmeldedaten sind nicht gültig. Bitte noch einmal versuchen!')
      .should('exist')
  })

  it('Try to sign in with expired credentials', () => {
    cy.get('mat-form-field input').eq(0)
      .type('test-expired')
    cy.contains('Weiter')
      .click()
    cy.contains('Anmeldedaten sind abgelaufen')
      .should('exist')

  })

  it('Try to sign in with not activated login credentials', () => {
    cy.get('mat-form-field input').eq(0)
      .type('test-future')
    cy.contains('Weiter')
      .click()
    cy.contains('Anmeldung abgelehnt. Anmeldedaten sind noch nicht freigeben.')
      .should('exist')
  })

  it('Should get to legal disclosure and return to login page', () => {
    cy.visit('http://localhost:4200');
    cy.contains('Impressum/Datenschutz')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/legal-notice');
    cy.contains('zurück zur Startseite')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/r/login/');
  })

  it('Should get to System Check and return to login page', () => {
    cy.visit('http://localhost:4200');
    cy.contains('System-Check')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/r/check-starter');
    cy.contains('zurück zur Startseite')
      .click()
    cy.url().should('eq', 'http://localhost:4200/#/r/login/');
  })

})


