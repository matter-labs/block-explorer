@artifactsSet4
Feature: Main Page

  Background:
    Given I am on main page

  @id261 @mainnet
  Scenario Outline: Verify column "<Column name>" for Balances on Account page
    When I go to page "/address/0x73f49Abb4f830270866B93cf26753ea8074CFE19"
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name   |
      | Asset         |
      | Balance       |
      | Token Address |

  # @id267 #Temporary deprecated
  # Scenario Outline: Verify column "<Column name>" for Balances on Сontraсt page
  #   When I go to page "/address/0x0000000000000000000000000000000000008006"
  #   Then Column with "<Column name>" name is visible

  #   Examples:
  #     | Column name   |
  #     | Asset         |
  #     | Balance       |
  #     | Token Address |

  @id260 @testnet
  Scenario Outline: Verify row "<Row>" for Account info on Account page
    When I go to page "/address/0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6"
    Then Element with "text" "<Row>" should be "visible"

    Examples:
      | Row             |
      | Address         |
      | Committed nonce |
      | Verified nonce  |

  @id260 @mainnet
  Scenario Outline: Verify row "<Row>" for Account info on Account page
    When I go to page "/address/0x9671075872d0b9f797cfF2b05586710Ea34e88E0"
    Then Element with "text" "<Row>" should be "visible"

    Examples:
      | Row             |
      | Address         |
      | Committed nonce |
      | Verified nonce  |

  @id262 @testnet 
  Scenario Outline: Verify Latest transaction "<Column name>" on Account page
    Given I go to page "/address/0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6"
    # And Element with "text" "Show more transactions ->" should be "clickable"
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

  @id262 @mainnet 
  Scenario Outline: Verify Latest transaction "<Column name>" on Account page
    Given I go to page "/address/0x9671075872d0b9f797cfF2b05586710Ea34e88E0"
    # And Element with "text" "Show more transactions ->" should be "clickable"
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

