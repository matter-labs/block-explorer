@prividium @network
Feature: Prividium Network Indicator

  Background:
    Given I am in Prividium mode

  @smoke
  Scenario: Network indicator displays correctly when authenticated
    Given I am authenticated and on the main page
    Then the network indicator should be visible
    And the network indicator should show current network information
    And the network indicator should have proper styling

  @regression
  Scenario: Network indicator shows wrong network state
    Given I am authenticated and on the main page
    When I am connected to a wrong network
    Then the network indicator should show "Wrong network" text
    And the network indicator should have warning styling

  @regression
  Scenario: Network indicator responsive behavior
    Given I am authenticated and on the main page
    When I resize the browser to different viewport sizes
    Then the network indicator should adapt responsively
    And the network indicator should remain functional

  @smoke
  Scenario: Network indicator content validation
    Given I am authenticated and on the main page
    Then the network indicator should show the correct network name
    And the network indicator should display the appropriate network icon 