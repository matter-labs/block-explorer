@prividium @metamask @authentication @smoke
Feature: Prividium MetaMask Flow

  Background:
    Given I am in Prividium mode

  @smoke @authentication
  Scenario: Complete MetaMask authentication flow
    Given I am not authenticated
    When I visit the application
    Then I should see the login screen
    When I connect with MetaMask
    And the wallet connection is successful
    Then I should be able to connect to MetaMask
    And I should be redirected to the main application
    And the wallet status bar should be visible
    And the network indicator should be visible

  @smoke @network
  Scenario: Network switching after authentication
    Given I am authenticated and on the main page
    When I switch networks in MetaMask
    Then I should be able to switch networks
    And the network indicator should show current network information

  @smoke @rpc
  Scenario: RPC endpoint request
    Given I am authenticated and on the main page
    When I request an RPC endpoint
    Then I should be able to get an RPC endpoint

  @smoke @authentication
  Scenario: Disconnect from MetaMask
    Given I am authenticated and on the main page
    When I disconnect from MetaMask
    Then I should be able to disconnect
    And I should see the login screen 