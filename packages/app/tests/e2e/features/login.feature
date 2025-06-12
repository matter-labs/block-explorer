@prividium
Feature: Prividium Auth Flow

  Scenario: Login flow
    Given I am on the login page
    When I click the connect wallet button
    And I sign the message to log in
    Then I should see the main page
    Then I should see the wallet status bar
    Then I should see the wrong network indicator
    When I click the wallet status bar
    Then I should see the wallet info modal
    Then I should see the switch network button in the wallet info modal
    When I click the disconnect button
    Then I should be logged out
