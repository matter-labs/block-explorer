@artifactsSet2
Feature: Main Page

  Background:
    Given I am on main page

  @id236:I @testnet
  Scenario Outline: Verify left table contains "<Row>" row and "<Value>" value on Block page
    Given I go to page "/block/13781"
    When Table contains cell with "<Row>"
    Then Element with "text" "<Value>" should be "visible"

    Examples:
      | Row          | Value    |
      | Block Number | 13781    |
      | Block Size   | 1        |
      | Status       | Verified |

  @id236:I @mainnet
  Scenario Outline: Verify left table contains "<Row>" row and "<Value>" value on Block page
    Given I go to page "/block/13781"
    When Table contains cell with "<Row>"
    Then Element with "text" "<Value>" should be "visible"

    Examples:
      | Row          | Value    |
      | Block Number | 13781    |
      | Block Size   | 6        |
      | Status       | Verified |

  @id236:II @testnet
  Scenario Outline: Verify left table contains "<Row>" row and "<Value>" value on Block page
    Given I go to page "/block/13781"
    When Table contains cell with "<Row>"
    Then Element with "partial text" "<Value>" should be "visible"

    Examples:
      | Row            | Value                  |
      | Root hash      | 0xfa8fadc06c46dc8a3c52 |
      | Timestamp      | 2023-02-09             |
      | Commit tx hash | 0xc3211d8bc51163f923ff |

  @id236:II @mainnet
  Scenario Outline: Verify left table contains "<Row>" row and "<Value>" value on Block page
    Given I go to page "/block/13781"
    When Table contains cell with "<Row>"
    Then Element with "partial text" "<Value>" should be "visible"

    Examples:
      | Row            | Value                  |
      | Root hash      | 0xfa8fadc06c46dc8a3c52 |
      | Timestamp      | 2023-03-24             |
      | Commit tx hash | 0xeb94693555bd2ef92c82 |

  @id264 @testnet
  Scenario Outline: Verify right table contains "<Row>" row and "<Value>" value on Block page
    Given I go to page "/block/13781"
    When Table contains cell with "<Row>"
    Then Element with "partial text" "<Value>" should be "visible"

    Examples:
      | Row             | Value                   |
      | Committed       | 2023-02-09              |
      | Prove tx hash   | 0xc30de91b87be5939ac1c4 |
      | Proven          | 2023-02-09              |
      | Execute tx hash | 0x898385316483aef82e6d  |
      | Executed        | 2023-02-09              |
  
  @id264 @mainnet
  Scenario Outline: Verify right table contains "<Row>" row and "<Value>" value on Block page
    Given I go to page "/block/13781"
    When Table contains cell with "<Row>"
    Then Element with "partial text" "<Value>" should be "visible"

    Examples:
      | Row             | Value                   |
      | Committed       | 2023-03-24              |
      | Prove tx hash   | 0xbda7a65f5de30c866639a |
      | Proven          | 2023-03-24              |
      | Execute tx hash | 0x1ddae5de222936cb7f5c  |
      | Executed        | 2023-03-25              |

  @id265
  Scenario Outline: Verify block transactions table contains "<Column name>"
    Given I go to page "/block/1"
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name      |
      | Status           |
      | Transaction Hash |
      | Age              |
      | From             |
      | To               |
      | Method           |
      | Value            |
      | Fee              |

  @id245
  Scenario Outline: Verify table contains "<Column name>" column name on Blocks page
    Given I go to page "/blocks"
    And Pagination form should be visible
    And Table "Blocks" should have "10" rows
    Then Element with "text" "<Column name>" should be "visible"

    Examples:
      | Column name |
      | Block       |
      | Status      |
      | Age         |

  @id247
  Scenario Outline: Verify table contains "<Column name>" column name on Transactions page
    Given I go to page "/transactions"
    And Pagination form should be visible
    And Table "Transactions" should have "10" rows
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name      |
      | Status           |
      | Transaction Hash |
      | Age              |
      | From             |
      | To               |
      | Method           |
      | Value            |
      | Fee              |

  @id273 @testnet
  Scenario Outline: Verify Network stats component contains "<Block>" block
    Then Network stats "<Block>" block should be visible

    Examples:
      | Block                                    |
      | Network Stats                            |
      | Stats are occasionally reset on testnet. |
      | Committed Blocks                         |
      | Verified Blocks                          |
      | Transactions                             |

  @id273 @mainnet 
  Scenario Outline: Verify Network stats component contains "<Block>" block
    Then Network stats "<Block>" block should be visible

    Examples:
      | Block                                    |
      | Network Stats                            |
      | zkSync Era Mainnet is open to everyone.  |
      | Committed Blocks                         |
      | Verified Blocks                          |
      | Transactions                             |

  @id271:I @testnet 
  Scenario Outline: Verify Contract tab for "<Element>" visibility on Contracts page
    Given I go to page "/address/0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b"
    When I select "Contract" tab on "Contract" page
    Then Element with "<Selector type>" "<Element>" should be "<Assertion>"

    Examples:
      | Selector type | Element                                                     | Assertion |
      | text          | Are you owner of this smart-contract?                       | visible   |
      | partial text  | Verify and Publish your contract source code today!         | visible   |
      | partial text  | This contract was created by the contract code at           | visible   |
      | partial text  | 0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b                  | visible   |
      | text          | Verify Smart Contract                                       | clickable |
      | text          | Verify Smart Contract                                       | visible   |
      | partial text  | 0x000400000000000200030000000000020000000003010019000000600 | clickable |
      | partial text  | 0x000400000000000200030000000000020000000003010019000000600 | visible   |

  @id271:I @mainnet
  Scenario Outline: Verify Contract tab for "<Element>" visibility on Contracts page
    Given I go to page "/address/0x8f9e8Fd0b8442a1dc72d2D9506e99cBDA134B382"
    When I select "Contract" tab on "Contract" page
    Then Element with "<Selector type>" "<Element>" should be "<Assertion>"

    Examples:
      | Selector type | Element                                                     | Assertion |
      | text          | Are you owner of this smart-contract?                       | visible   |
      | partial text  | Verify and Publish your contract source code today!         | visible   |
      | partial text  | This contract was created by the contract code at           | visible   |
      | partial text  | 0x8f9e8Fd0b8442a1dc72d2D9506e99cBDA134B382                  | visible   |
      | text          | Verify Smart Contract                                       | clickable |
      | text          | Verify Smart Contract                                       | visible   |
      | partial text  | 0x000400000000000200050000000                               | clickable |
      | partial text  | 0x000400000000000200050000000                               | visible   |

  @id271:II @testnet 
  Scenario: Verify Contract tab dropdown on Contracts page
    Given I go to page "/address/0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b"
    When I select "Contract" tab on "Contract" page
    When I click on bytecode dropdown
    Then Element with "partial text" "0x000400000000000200030000000000020000000003010019000000600" should be "visible"

  @id271:II @mainnet 
  Scenario: Verify Contract tab dropdown on Contracts page
    Given I go to page "/address/0x8f9e8Fd0b8442a1dc72d2D9506e99cBDA134B382"
    When I select "Contract" tab on "Contract" page
    When I click on bytecode dropdown
    Then Element with "partial text" "0x000400000000000200050000000" should be "visible"

  @id270 @testnet 
  Scenario Outline: Verify column "<Column name>" tab on Contract page
    Given I go to page "/address/0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b"
    # And Element with "text" "Show more transactions ->" should be "visible"
    # And Element with "text" "Show more transactions ->" should be "clickable"
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name      |
      | Status           |
      | Transaction Hash |
      | From             |
      | Method           |
      | Age              |

  @id270 @mainnet 
  Scenario Outline: Verify column "<Column name>" tab on Contract page
    Given I go to page "/address/0x8f9e8Fd0b8442a1dc72d2D9506e99cBDA134B382"
    # And Element with "text" "Show more transactions ->" should be "visible"
    # And Element with "text" "Show more transactions ->" should be "clickable"
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name      |
      | Status           |
      | Transaction Hash |
      | From             |
      | Method           |
      | Age              |

  @id261 @testnet
  Scenario Outline: Verify column "<Column name>" for Balances on Account page
    When I go to page "/address/0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6"
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name   |
      | Asset         |
      | Balance       |
      | Token Address |
