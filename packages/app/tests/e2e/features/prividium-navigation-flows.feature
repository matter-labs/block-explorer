@prividium @navigation
Feature: Prividium Navigation Flows

  Background:
    Given I am in Prividium mode

  @smoke
  Scenario: Authentication state persists during navigation
    Given I am authenticated and on the main page
    When I navigate to different sections of the application
    Then I should remain authenticated
    And the header components should persist

  @regression
  Scenario: Deep link navigation while authenticated
    Given I am authenticated and on the main page
    When I navigate directly to a specific page via URL
    Then I should access the page without authentication challenges
    And the authentication state should be maintained

  @regression
  Scenario: Header components display correctly when authenticated
    Given I am authenticated and on the main page
    Then the wallet status bar should be visible
    And the network indicator should be visible
    And all header elements should be properly displayed 