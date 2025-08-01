@prividium
Feature: Prividium Auth Flow


  Scenario: Unauthorized user is redirected
    Given I am an unauthorized user
    And I am on the login page
    When I click the connect wallet button
    And I sign the message to log in
    Then I should see the not authorized page
