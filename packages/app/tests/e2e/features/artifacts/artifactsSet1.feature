@artifactsSet1
Feature: Main Page

  Background:
    Given I am on main page


  @id253:I @featureEnv @testnetSmokeSuite @testnet
  Scenario Outline: Check the element "<Sub-Section>" in Tools section is available, clickable and have correct href (Sepolia)
    Given I click by text "Tools"
    Given Element with "text" "<Sub-Section>" should be "visible"
    When Element with "text" "<Sub-Section>" should be "clickable"
    Then Element with "text" "<Sub-Section>" should have "<url>" value

    Examples:
      | Sub-Section                 | url                                              |
      | Smart Contract Verification | /contracts/verify                                |
      | Bridge                      | https://portal.zksync.io/bridge/?network=sepolia |

  @id253:II @mainnet
  Scenario Outline: Check the element "<Sub-Section>" in Tools section is available, clickable and have correct href (Mainnet)
    Given I click by text "Tools"
    Given Element with "text" "<Sub-Section>" should be "visible"
    When Element with "text" "<Sub-Section>" should be "clickable"
    Then Element with "text" "<Sub-Section>" should have "<url>" value

    Examples:
      | Sub-Section                 | url                                              |
      | Smart Contract Verification | /contracts/verify                                |
      | Bridge                      | https://portal.zksync.io/bridge/?network=mainnet |

  @id231
  Scenario Outline: Check social networks icon "<Value>" is available, clickable and have correct href
    Given Element with "partial href" "<Value>" should be "visible"
    When Element with "partial href" "<Value>" should be "clickable"
    Then Element with "partial href" "<Value>" should have "<url>" value

    Examples:
      | Value   | url                        |
      # discord renamed to "join"
      | join    | https://join.zksync.dev/   |
      | twitter | https://twitter.com/zksync |

  @id254:I
  Scenario Outline: Check dropdown "<Dropdown>" for "<Value>" and verify
    Given Set the "<Value>" value for "<Dropdown>" switcher
    Then Check the "<Value>" value is actual for "<Dropdown>" switcher

    Examples:
      | Value                      | Dropdown |
      | zkSync Era Mainnet         | network  |
      | EN                         | language |
      | UA                         | language |

  @id254:II @featureEnv
  Scenario Outline: Check dropdown "<Dropdown>" for "<Value>" and verify
    Given Set the "<Value>" value for "<Dropdown>" switcher
    Then Check the "<Value>" value is actual for "<Dropdown>" switcher

  Examples:
      | Value                       | Dropdown |
      | zkSync Era Sepolia Testnet  | network  |
      | zkSync Era Goerli Testnet   | network  |
      | Goerli (Stage2)             | network  |

  @id254:II @productionEnv
  Scenario Outline: Check dropdown "<Dropdown>" for "<Value>" and verify
    Given Set the "<Value>" value for "<Dropdown>" switcher
    Then Check the "<Value>" value is actual for "<Dropdown>" switcher

  Examples:
      | Value                      | Dropdown |
      | zkSync Era Goerli Testnet  | network  |
      | zkSync Era Sepolia Testnet | network  |

  Scenario: Network stats is displayed
    Then Element with "text" "Network Stats" should be "visible"

  @id101:I @id274:I @testnetSmokeSuite
  Scenario Outline: Count rows in "<Table>" table
    Then Table "<Table>" should have "<Number of rows>" rows

    Examples:
      | Table               | Number of rows |
      | Latest Batches      | 10             |
      | Latest Transactions | 10             |

  @id101:II @id274:II @testnetSmokeSuite
  Scenario Outline: Verify "<Column>" column in "<Table>" table
    Then Table "<Table>" on Main page contains "<Column>" name

    Examples:
      | Table               | Column           |
      | Latest Transactions | Status           |
      | Latest Transactions | Transaction Hash |
      | Latest Transactions | Age              |
      | Latest Batches      | Status           |
      | Latest Batches      | Batch            |
      | Latest Batches      | Size             |
      | Latest Batches      | Age              |

  #  @id127 #should be fixed on the ci
  #  Scenario Outline: Verify "<Title name>" Tab title
  #    Given I go to page "<Page>"
  #    Then Tab title on "<Page>" contains "<Title name>"
  #
  #    Examples:
  #      | Page                                                                             | Title name                  |
  #      | /accounts/0x0bda7f2dc633b66b2cff59718fddb25cf6b2e760                             | Account 0x0bda7f...e760     |
  #      | /block/635161                                                                   | Block #635161               |
  #      | /contracts/0x92131f10c54f9b251a5deaf3c05815f7659bbe02                            | Contract 0x92131f...be02    |
  #      | /ts/0x2134e1f86ac15d7fadb0b7ea68698103ac23eebe6f95aed0fa4f5712eaff22a5 | Transaction 0x2134e1...22a5 |

  @id103 @testnetSmokeSuite
  Scenario: Check Search field is visible
    Given I go to page "/address/0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6"
    Then Element with "id" "search" should be "visible"

  @id209:I @testnet
  Scenario Outline: Verify Transaction table contains "<Row>" row
    Given I go to page "/tx/0xe7a91cc9b270d062328ef995e0ef67195a3703d43ce4e1d375f87d5c64e51981"
    When Table contains row with "<Row>"
    Then Element with "text" "<Value>" should be "visible"
    Examples:
      | Row              | Value                                                              |
      | Transaction Hash | 0xe7a91cc9b270d062328ef995e0ef67195a3703d43ce4e1d375f87d5c64e51981 |
      | Status           | Processed                                                          |
      | Status           | Executed                                                           |
      | From             | 0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6                         |
      | To               | 0x0faF6df7054946141266420b43783387A78d82A9                         |
      | Fee              | ETH                                                                |
      | Nonce            | 0                                                                  |



  @id209:II @testnet
  Scenario Outline: Verify Transaction table contains "<Row>" row
    Given I go to page "/tx/0xe7a91cc9b270d062328ef995e0ef67195a3703d43ce4e1d375f87d5c64e51981"
    When Table contains row with "<Row>"
    Then Element with "partial text" "<Value>" should be "visible"
    Examples:
      | Row                | Value                                                              |
      | Input data         | 0xa9059cbb00000000000000000000000                                  |
      | Block              | 45751                                                              |
      | Batch              | #661                                                               |
      | Created            | 2023-02-10                                                         |
      | Tokens Transferred | 0x8f0F33583a5                                                      |
      | Tokens Transferred | From                                                               |
      | Tokens Transferred | 0x8f0F33583a5...d8f6                                               |
      | Tokens Transferred | To                                                                 |
      | Tokens Transferred | 0x0faF6df7054...82A9                                               |

  @id209:I @mainnet
  Scenario Outline: Verify Transaction table contains "<Row>" row
    Given I go to page "/tx/0xc598db886275ce5d7900fbfb6797afb3231a117446d91eb0dd8cf69addf90779"
    When Table contains row with "<Row>"
    Then Element with "text" "<Value>" should be "visible"
    Examples:
      | Row              | Value                                                              |
      | Transaction Hash | 0xc598db886275ce5d7900fbfb6797afb3231a117446d91eb0dd8cf69addf90779 |
      | Status           | Processed                                                          |
      | Status           | Executed                                                           |
      | From             | 0xc2C6aE3B10c741A3FD291a1C1Baadc41fD2d84d5                         |
      | To               | 0x6Ef9598Bf85bc651780e17D6848f2E1Ff1Ce5Aae                         |
      | Fee              | ETH                                                                |
      | Nonce            | 60                                                                 |

  @id209:II @mainnet
  Scenario Outline: Verify Transaction table contains "<Row>" row
    Given I go to page "/tx/0xc598db886275ce5d7900fbfb6797afb3231a117446d91eb0dd8cf69addf90779"
    When Table contains row with "<Row>"
    Then Element with "partial text" "<Value>" should be "visible"
    Examples:
      | Row                | Value                                                              |
      | Input data         | Function: transfer                                                 |
      | Block              | 3491940                                                            |
      | Batch              | #28739                                                             |
      | Created            | 2023-05-14                                                         |


  @id211 @testnet
  Scenario Outline: Verify Contract info table contains "<Row>" row
    Given I go to page "/address/0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b"
    Then Element with "text" "<Row>" should be "visible"

    Examples:
      | Row          |
      | Address      |
      | Creator      |
      | Transactions |

  @id211 @mainnet
  Scenario Outline: Verify Contract info table contains "<Row>" row
    Given I go to page "/address/0x6Ef9598Bf85bc651780e17D6848f2E1Ff1Ce5Aae"
    Then Element with "text" "<Row>" should be "visible"

    Examples:
      | Row          |
      | Address      |
      | Creator      |
      | Transactions |

  @id212
  Scenario Outline: Verify Smart contract verification Page
    Given I go to page "/contracts/verify"
    Then Element with "<Selector type>" "<Element>" should be "<Assertion>"

    Examples:
      | Selector type | Element               | Assertion |
      | id            | contractAddress       | visible   |
      | id            | contractName          | visible   |
      | testId        | radio-buttons         | visible   |
      | id            | compilerVersion       | visible   |
      | id            | zkCompilerVersion     | visible   |
      | id            | sourceCode            | visible   |
      | id            | constructorArguments  | visible   |
      | text          | Verify Smart Contract | clickable |
      | text          | Clear                 | clickable |
