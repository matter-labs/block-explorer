@prividium
Feature: Prividium Auth Flow

  Scenario: Authorized user can log in successfully
    Given I am an authorized user
    And I am on the login page
    When I click the login button
    Then I should see the main page
    And I should see the wallet status bar
    When I click the wallet status bar
    Then I should see the wallet info modal
    When I click the logout button
    Then I should be logged out

  Scenario: Unauthorized user is redirected
    Given I am an unauthorized user
    And I am on the login page
    When I click the login button
    Then I should see the not authorized page
