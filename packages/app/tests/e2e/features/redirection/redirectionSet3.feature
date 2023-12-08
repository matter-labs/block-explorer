@redirectionSet3 @regression

Feature: Redirection

  Background:
    Given I am on main page

  #Block page - Pages
  @id368 @testnet @testnetSmokeSuite
  Scenario: Verify redirection from Block page L1 addresses to etherscan after address click
    Given I go to page "/block/<Block Number>"
    When I click on the first "<Artifact type>" link
    Then Page with part address "<url>" includes ID result

    Examples:
    | Block Number     | Artifact type       | url         |
    |  100            | from address        | /address/   |
    |  100            | to address          | /address/   |

  @id368:I @mainnet 
  Scenario: Verify redirection from Block page L1 addresses to etherscan after address click
    Given I go to page "/block/<Block Number>"
    When I click on the first "<Artifact type>" link
    Then Page with part address "<url>" includes ID result

    Examples:
    | Block Number  | Artifact type       | url         |
    |  100          | from address        | /address/   |
    |  100          | to address          | /address/   |

  #Main Page - Transaction page
  @id338 @testnetSmokeSuite
  Scenario: Verify redirection from Main page after latest transactions click
    Given I click on the first "transaction hash" link
    Given Page with part address "/tx/" includes ID result

  #Block page - Pages - Block's URL
#  @id337
#  Scenario: Verify block's link from "Latest Blocks" section leads to correct URL
#    Given I click on the first "block number" link
#    Given Page with part address "/block/" includes ID result

  #369 Contract page - Pages - Redirection
  @id369 @testnet @testnetSmokeSuite
  Scenario: Verify contract link on the Contacts page
    Given I go to page "/address/0xed7175341f123f7718aBaCF1702d6980CFc08784"
    When I click on the first "from address" link
    Given Page with part address "/address/" includes ID result

  @id369:I @mainnet 
  Scenario: Verify contract link on the Contacts page
    Given I go to page "/address/0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295"
    When I click on the first "from address" link
    Given Page with part address "/address/" includes ID result

  #Common - Network navigation (feature branch) - Redirection
  @id561 @id562 @id563 @featureEnv @testnetSmokeSuite
  Scenario Outline: Verify redirection to "<Network>" network 
    Given I go to page "<Initial page>" 
    When Set the "<Network>" value for "network" switcher
    Then Current page have "<url>" address 

    Examples: 
     | Initial page                                             | Network                   | url                                                                      |
     | /address/0x000000000000000000000000000000000000800A      | zkSync Era Goerli Testnet | /address/0x000000000000000000000000000000000000800A/?network=goerli      | 
     | /address/0x000000000000000000000000000000000000800A      | Goerli (Stage2)           | /address/0x000000000000000000000000000000000000800A/?network=goerli-beta | 
     | /address/0x000000000000000000000000000000000000800A      | zkSync Era Mainnet        | /address/0x000000000000000000000000000000000000800A/?network=mainnet     |
     | /address/0x000000000000000000000000000000000000800A      | zkSync Era Sepolia Testnet | /address/0x000000000000000000000000000000000000800A/?network=sepolia    |  

  @id561:I @id562:I @id563:I @productionEnv
  Scenario Outline: Verify redirection to "<Network>" network 
    Given I go to page "<Initial page>" 
    When Set the "<Network>" value for "network" switcher
    Then Current page have "<url>" address 

    Examples: 
     | Initial page                                         | Network                           | url                                                                      | 
     | /address/0x000000000000000000000000000000000000800A  | zkSync Era Goerli Testnet         | /address/0x000000000000000000000000000000000000800A/?network=goerli      |
     | /address/0x000000000000000000000000000000000000800A  | zkSync Era Sepolia Testnet        | /address/0x000000000000000000000000000000000000800A/?network=sepolia     | 
     | /address/0x000000000000000000000000000000000000800A  | zkSync Era Mainnet                | /address/0x000000000000000000000000000000000000800A/?network=mainnet     | 
