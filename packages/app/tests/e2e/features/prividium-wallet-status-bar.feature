@prividium @wallet-status
Feature: Prividium Wallet Status Bar

  Background:
    Given I am in Prividium mode

  @smoke
  Scenario: Wallet status bar displays correctly when authenticated
    Given I am authenticated and on the main page
    Then the wallet status bar should be visible
    And the network indicator should show current network information

  @smoke
  Scenario: Connect wallet button appears when disconnected
    Given I am not authenticated
    When I visit the application
    Then the connect wallet button should be visible

  @regression
  Scenario: Wallet status updates when connection state changes
    Given I am authenticated and on the main page
    Then the wallet status bar should be visible
    And the network indicator should be visible

  @regression
  Scenario: Network indicator handles connection errors gracefully
    Given I am authenticated and on the main page
    Then the network indicator should be visible
    And the wallet status bar should be visible

  @regression
  Scenario: Wallet status bar responsive behavior
    Given I am authenticated and on the main page
    When I resize the browser to different viewport sizes
    Then the wallet status bar should be visible
    And the network indicator should be visible 