@prividium @authentication
Feature: Prividium Unauthenticated User Experience

  Background:
    Given I am in Prividium mode
    And I am not authenticated

  @smoke
  Scenario: User can access login page when not authenticated
    When I visit the application
    Then I should see the login screen
    And the connect wallet button should be visible

  @smoke  
  Scenario: Successful authentication redirects to main page
    When I visit the application
    And the wallet connection is successful
    Then I should be redirected to the main application
    And I should see the wallet status bar

  @regression
  Scenario: User can logout from authenticated state
    Given I am authenticated and on the main page
    When I logout
    Then I should be redirected to the login page
    And I should see the login screen

  @regression
  Scenario: Unauthenticated users are redirected to login
    When I visit the application
    Then I should be redirected to the login page
    And I should see the login screen 