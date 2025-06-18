@prividium
Feature: Prividium Auth Flow

  Scenario: Authorized user can log in successfully
    Given I am an authorized user
    And I am on the login page
    When I click the connect wallet button
    And I sign the message to log in
    Then I should see the main page
    And I should see the wallet status bar
    And I should see the wrong network indicator
    When I click the wallet status bar
    Then I should see the wallet info modal
    And I should see the switch network button in the wallet info modal
    When I click the disconnect button
    Then I should be logged out

  Scenario: Unauthorized user is redirected
    Given I am an unauthorized user
    And I am on the login page
    When I click the connect wallet button
    And I sign the message to log in
    Then I should see the not authorized page
