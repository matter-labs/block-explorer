@redirectionSet2 @regression

Feature: Redirection

  Background:
    Given I am on main page

  #Common pages part
  @id276
  Scenario: Check Dashboard redirection from Account page to Main page
    Given I go to page "/address/0x0000000000000000000000000000000000000000"
    When  I click by text "Dashboard"
    Given I am on main page

  @id238
  Scenario: Check zkSync logo redirection from Account page to Main page
    Given I go to page "/address/0x0000000000000000000000000000000000000000"
    When I click on main logo
    Given I am on main page

  #Contract page
  @id268 @testnet 
  Scenario: Verify redirection for Contract button from Contract Page to verification interface
    Given I go to page "/address/0x0faF6df7054946141266420b43783387A78d82A9"
    When I select "Contract" tab on "Contract" page
    And I press Verify Smart Contract button
    Then Current page have "/contracts/verify?address=0x0faF6df7054946141266420b43783387A78d82A9" address


  @id242:I @testnet @testnetSmokeSuite
  Scenario Outline: Verify redirection from Contracts page after "<Artifact type>" click
    Given I go to page "/address/0x000000000000000000000000000000000000800A"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url           |
      | tx hash           | /tx/          |

  @id242:I @mainnet
  Scenario Outline: Verify redirection from Contracts page after "<Artifact type>" click
    Given I go to page "/address/0x0000000000000000000000000000000000000000"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url           |
      | tx hash           | /tx/          |

  @id242:II @testnet
  Scenario: Verify redirection from Contracts page after Creator click
    Given I go to page "/address/0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b"
    When I click by text "0xA38E...1df8"
    Given Current page have "/address/0xA38EDFcc55164a59e0f33918D13a2d559BC11df8" address

  @id242:III @mainnet
  Scenario: Verify redirection from Contracts page after Creator click
    Given I go to page "/address/0x70B86390133d4875933bE54AE2083AAEbe18F2dA"
    When I click by text "0xE593...C670"
    Given Current page have "/address/0xE5939999825340E0Fec8e8a091cd695c93b4C670" address

  #Main page - Dashboard
  @id234 @testnetSmokeSuite
  Scenario Outline: Verify redirection for "<Artifact type>" from Main Page
    Given I click on the first "<Artifact type>" link
    Then Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url             |
      | batch number      | /batch/         |
      | batch size        | /batch/         |
      | tx hash           | /tx/            |
      | committed blocks  | /blocks/        |
      | verified blocks   | /blocks/        |
      | transactions      | /transactions/  |

  #Transaction Logs tab
  @id256 @testnet
  Scenario: Verify redirection for Address from Logs tab in transaction Page
    Given I go to page "/tx/0x6fc015405255af17fb38f5a1408557f5f00d094e07a2f8f6af933a889d9a3330"
    When I click on the first contract address
    Then Page with part address "/address/" includes ID result

  #Transaction Logs tab
  @id256 @mainnet
  Scenario: Verify redirection for Address from Logs tab in transaction Page
    Given I go to page "/tx/0xcbeff0db1300cbb5c1e5fc18a57ae46c94962eeebed7e82bc81e553ba27d0e9a"
    When I click on the first contract address
    Then Page with part address "/address/" includes ID result

  #Transaction page 241 - navigation, 553 - redirection
  @id241 @id553 @id339 @id340 @testnet @testnetSmokeSuite
  Scenario Outline: Verify redirection from Transaction page after "<Artifact type>" click
    Given I go to page "/tx/0x095ba0e946b09767085c7ddfb0f9ff36fab230fc819b56d41185a3033de27bea"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url        |
      | block number      | /block/    |
      | To                | /address/  |
      | Fee               | /address/  |
      | Tokens Transferred | /address/ |

  @id241 @id553 @id339 @id340 @mainnet 
  Scenario Outline: Verify redirection from Transaction page after "<Artifact type>" click
    Given I go to page "/tx/0xcbeff0db1300cbb5c1e5fc18a57ae46c94962eeebed7e82bc81e553ba27d0e9a"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url        |
      | block number      | /block/    |
      | To                | /address/  |
      | Fee               | /address/  |
      | Tokens Transferred | /address/ |

  #Transactions page
  @id248
  Scenario Outline: Verify redirection from Transactions page after "<Artifact type>" click
    Given I go to page "/transactions/"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url         |
      | tx hash           | /tx/        |
      # | initiator address | /address/   | Removed
      | from address      | /address/   |
      | to address        | /address/   |
      | Value             | /address/   |
      | Fee               | /address/   |


  #Tokens page 
  @id250 @testnetSmokeSuite
  Scenario Outline: Verify redirection from Tokens page after "<Artifact type>" click
    Given I go to page "/tokenlist/"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url         |
      | token icon        | /address/   |
      | token address     | /address/   |
