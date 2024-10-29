@copying @regression

Feature: Copying

  Background:
    Given I am on main page

  @id209:III @id230:II
  Scenario Outline: Check copy button action on "<Page>" page
    Given I go to page "<Page>"
    When I click on the first copy button
    Then Element with "text" "Copied!" should be "visible"

    Examples:
      | Page                                                                   |
      | /tx/0xe7286a5fca5b1f5eb19ab5e63752de713059a042efc4cd3725213051951a77b0 |
      | /address/0x000000000000000000000000000000000000800A                    |
      | /tx/0xf47aaa3fde4cec0015cad3a38a46e047e667f81753ecf8642a0e60a5901eb00f |
      | /block/1                                                               |
      | /address/0x574343B3d1544477f2C4dF38c2Ef720Ab33e782b                    |

  @id239 @testnet
  Scenario Outline: Check "<Row>" hashes copying for Transaction page
    Given I go to page "/tx/0xe7a91cc9b270d062328ef995e0ef67195a3703d43ce4e1d375f87d5c64e51981"
    When I click on the copy button with "<Row>" row on "Transaction" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row                 | Text                                                               |
      | Transaction Hash    | 0xe7a91cc9b270d062328ef995e0ef67195a3703d43ce4e1d375f87d5c64e51981 |
      | From                | 0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6                         |
      | To                  | 0x0faF6df7054946141266420b43783387A78d82A9                         |
      | Input data          | 0xa9059cbb0000000000000000000000000faf6df7054946141266420b43783387a78d82a90000000000000000000000000000000000000000000000000000000000989680 |

  @id239 @mainnet 
  Scenario Outline: Check "<Row>" hashes copying for Transaction page
    Given I go to page "/tx/0x97e3d593e03e764df14e352e73ba6af487faf8d04bd65a1fd3d55208b6e0d972"
    When I click on the copy button with "<Row>" row on "Transaction" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row                 | Text                                                               |
      | Transaction Hash    | 0x97e3d593e03e764df14e352e73ba6af487faf8d04bd65a1fd3d55208b6e0d972 |
      | From                | 0xE1D6FA366B480Ea437419333333b31366C8a158F                         |
      | To                  | 0xA0924Cc8792836F48D94759c76D32986BC74B54c                         |
      | Input data          | 0x2e4dbe8f000000000000000000000000000000000000000000000000000000000001bc45000000000000000000000000d613effb65b11e301f1338f71013b390985380300000000000000000000000000000000000000000000000000000000008116e2b000000000000000000000000000000000000000000000000000000000001bc4500000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000004123131c5b6401f42c98f7e84ae00ef577fa5e580f313a83a135c8fc893103ec884bc0bbd4b5d3ef32ec774eb20529ffebb7aae5d250d2568cff65e5ac412f99f21c00000000000000000000000000000000000000000000000000000000000000 |

  @id257 @testnet 
  Scenario Outline: Check "<Row>" hashes copying for Logs tab on Transaction page
    Given I go to page "/tx/0xe7a91cc9b270d062328ef995e0ef67195a3703d43ce4e1d375f87d5c64e51981"
    And I select "Logs" tab on "Transaction" page
    When I click on the copy button with "<Row>" row on "Transaction" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row     | Text                                                               |
      | Address | 0x000000000000000000000000000000000000800A                         |
      | Topics  | 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef |
      | Data    | 855606582320872                                                    |

  @id257:I @mainnet
  Scenario Outline: Check "<Row>" hashes copying for Logs tab on Transaction page
    Given I go to page "/tx/0x97e3d593e03e764df14e352e73ba6af487faf8d04bd65a1fd3d55208b6e0d972"
    And I select "Logs" tab on "Transaction" page
    When I click on the copy button with "<Row>" row on "Transaction" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row     | Text                                                               |
      | Address | 0x000000000000000000000000000000000000800A                         |
      | Topics  | 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef |
      | Data    | 490189750000000                                                    |

  @id269:I
  Scenario Outline: Check Address hashes copying for Contract page
    Given I go to page "/address/0x000000000000000000000000000000000000800A"
    When I click on the copy button with "<Row>" row on "Contract" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row     | Text                                       |
      | Address | 0x000000000000000000000000000000000000800A |

  @id269:II @id266:II @id244:II
  Scenario Outline: Check hashes copying from title on Contract/Block/Accounts page
    Given I go to page "<Address>"
    When I click on the copy button for page title
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Address                                             | Text                                       |
      | /address/0x0faF6df7054946141266420b43783387A78d82A9 | 0x0faF6df7054946141266420b43783387A78d82A9 |
      | /block/1                                            | 1                                          |
      | /address/0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6 | 0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6 |


  @id272
  Scenario Outline: Check hashes copying for Contracts tab on Contracts page
    Given I go to page "/address/0x000000000000000000000000000000000000800A"
    When I select "Contract" tab on "Contract" page
    And I click on the copy button for deployed bytecode
    Then Clipboard includes "<Text>" value

    Examples:
      | Text |
      | 0x   |

  @id266:I @testnet 
  Scenario Outline: Check "<Row>" hashes copying on Block page
    Given I go to page "/block/1"
    When I click on the copy button with "<Row>" row on "Block" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row             | Text                                                               |
      | Block hash      | 0x51f81bcdfc324a0dff2b5bec9d92e21cbebc4d5e29d3a3d30de3e03fbeab8d7f |
      | Commit tx hash  | 0x6ad6a118e09a27e39ee57c63e812953788de4974987c76bc954c14a8c32688e8 |
      | Prove tx hash   | 0xfbd3a89cee83e4f28999bc8fd5e96d133b7ebc367d5c7026f173d21687998379 |
      | Execute tx hash | 0x5131c1bb47dca3d42ccdfd12d1ab7224cbb88fb9ad91b94e2da26631602f6fab |

  @id266:III @mainnet 
  Scenario Outline: Check "<Row>" hashes copying on Block page
    Given I go to page "/block/1"
    When I click on the copy button with "<Row>" row on "Block" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row             | Text                                                               |
      | Block hash       | 0x51f81bcdfc324a0dff2b5bec9d92e21cbebc4d5e29d3a3d30de3e03fbeab8d7f |
      | Commit tx hash  | 0x33143afba6c91f77d18b0d7a50248e6255461ec0e0cd80a06d3bd86f2686768c |
      | Prove tx hash   | 0x424cdbfb877178a909fbbe6dca6ef131a752e6c91c8b24470d919e30c06e3692 |
      | Execute tx hash | 0x51425089db3b2ce38b1893ec2f1dc23e3f5db8e9f48f06bb624e99d77fe76aca |

  @id244:I
  Scenario Outline: Check account address hashes copying for Account page
    Given I go to page "/address/0x000000000000000000000000000000000000800A"
    When I click on the copy button with "<Row>" row on "Account" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row     | Text                                       |
      | Address | 0x000000000000000000000000000000000000800A |
# related to ZKF-2551. It needs to be uncommented after the fix of the main issue.
#  @id244:II
#  Scenario: Check token address hashes copying for Account page
#    Given I go to page "/address/0xE60EB4Bbd3F8EA522CBFA8025b8763442FaDe55e"
#    When I click on the copy button for the first token asset
#    And Element with "text" "Copied!" should be "visible"
#    Then Clipboard value is not empty

  @id275 @testnet @testnetSmokeSuite
  Scenario Outline: Check "<Row>" hashes copying for Tokens page
    Given I go to page "/tokenlist"
    When I click on the copy button with "<Row>" row on "Tokens" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row             | Text                                       |
      | ETH             | 0x000000000000000000000000000000000000800A |

  @id275:I @mainnet
  Scenario Outline: Check "<Row>" hashes copying for Tokens page
    Given I go to page "/tokenlist"
    When I click on the copy button with "<Row>" row on "Tokens" page
    And Element with "text" "Copied!" should be "visible"
    Then Clipboard contains "<Text>" value

    Examples:
      | Row             | Text                                       |
      | ETH             | 0x000000000000000000000000000000000000800A |
      | USDC.e          | 0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4 |
      | MUTE            | 0x0e97C7a0F8B2C9885C8ac9fC6136e829CbC21d42 |
      | COMBO           | 0xc2B13Bb90E33F1E191b8aA8F44Ce11534D5698E3 |
      | PERP            | 0x42c1c56be243c250AB24D2ecdcC77F9cCAa59601 |
