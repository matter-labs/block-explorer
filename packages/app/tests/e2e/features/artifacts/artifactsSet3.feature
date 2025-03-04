@artifactsSet3
Feature: Main Page

  Background:
    Given I am on main page

  @id230 @testnet 
  Scenario Outline: Verify Logs tab artifact for "<Element>" on Transaction page
    Given I go to page "/tx/0x4f7406f5565d875ce1a2ebb7c83f582e9795294ad57276eae3909b59537ab051"
    When I select "Logs" tab on "Transaction" page
    Then Element with "<Selector type>" "<Element>" should be "<Assertion>"

    Examples:
      | Selector type | Element                                                            | Assertion |
      | log tab          | Address                                                            | visible   |
      | log tab          | Name                                                               | visible   |
      | log tab          | Topics                                                             | visible   |
      | log tab          | Data                                                               | visible   |
      | log tab          | 180817500000000                                                    | visible   |
      | log tab          | 180817500000000                                                    | clickable |
      | log tab          | 0x0000000000000000000000000000000000000000000000000de0b6b3a7640000 | visible   |
      | log tab          | 0x0000000000000000000000000000000000000000000000000de0b6b3a7640000 | clickable |

  @id230 @mainnet 
  Scenario Outline: Verify Logs tab artifact for "<Element>" on Transaction page
    Given I go to page "/tx/0xc598db886275ce5d7900fbfb6797afb3231a117446d91eb0dd8cf69addf90779"
    When I select "Logs" tab on "Transaction" page
    Then Element with "<Selector type>" "<Element>" should be "<Assertion>"

    Examples:
      | Selector type | Element                                                            | Assertion |
      | log tab          | Address                                                            | visible   |
      | log tab          | Name                                                               | visible   |
      | log tab          | Topics                                                             | visible   |
      | log tab          | Data                                                               | visible   |
      | log tab          | 345359500000000                                                    | visible   |
      | log tab          | 345359500000000                                                    | clickable |

  @id209:III @id230:II @testnet 
  Scenario Outline: Check copy button action on "<Page>" page
    Given I go to page "<Page>"
    When I click on the first copy button
    Then Element with "text" "Copied!" should be "visible"

    Examples:
      | Page                                                                   |
      | /tx/0x4f7406f5565d875ce1a2ebb7c83f582e9795294ad57276eae3909b59537ab051 |
      | /address/0xed7175341f123f7718aBaCF1702d6980CFc08784                    |
      | /block/1                                                               |
      | /address/0x574343B3d1544477f2C4dF38c2Ef720Ab33e782b                    |

  @id209:III @id230:II @mainnet 
  Scenario Outline: Check copy button action on "<Page>" page
    Given I go to page "<Page>"
    When I click on the first copy button
    Then Element with "text" "Copied!" should be "visible"

    Examples:
      | Page                                                                   |
      | /tx/0xc598db886275ce5d7900fbfb6797afb3231a117446d91eb0dd8cf69addf90779 |
      | /address/0x6Ef9598Bf85bc651780e17D6848f2E1Ff1Ce5Aae                    |
      | /block/1                                                               |
      | /address/0xc2C6aE3B10c741A3FD291a1C1Baadc41fD2d84d5                    |

  @id249 @testnet @testnetSmokeSuite
  Scenario Outline: Verify table contains "<Column name>" column name on Tokens page
    Given I go to page "/tokenlist"
    # And Table "Tokens" should have "1" rows
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name   |
      | Token Name    |
      | Price         |
      | Token Address |

  @id249 @mainnet
  Scenario Outline: Verify table contains "<Column name>" column name on Tokens page
    Given I go to page "/tokenlist"
    # And Table "Tokens" should have "56" rows
    Then Column with "<Column name>" name is visible

    Examples:
      | Column name   |
      | Token Name    |
      | Price         |
      | Token Address |

  @id381 @testnet @testnetSmokeSuite
  Scenario Outline: Verify label "out" for Account info on Account page
    When I go to page "/address/0xed7175341f123f7718aBaCF1702d6980CFc08784"
    Then Element with "text" "out" should be "visible"

  @id380 @testnet @testnetSmokeSuite
  Scenario: Verify label "in" for Account info on Account page
    Given I go to page "/address/0xed7175341f123f7718aBaCF1702d6980CFc08784"
    # When I click by text "Show more transactions ->"
    Then Element with "text" "in" should be "visible"

  @id382 @testnet @testnetSmokeSuite
  Scenario: Verify label "self" for Account info on Account page
    Given I go to page "/address/0xed7175341f123f7718aBaCF1702d6980CFc08784"
    # When I click by text "Show more transactions ->"
    Then Element with "text" "self" should be "visible"

  @id381 @mainnet
  Scenario Outline: Verify label "out" for Account info on Account page
    When I go to page "/address/0x9CE4Feb41669BbD3FAA50EbbB6ffF85FC5Dec16C"
    Then Element with "text" "out" should be "visible"

  @id380 @mainnet
  Scenario: Verify label "in" for Account info on Account page
    Given I go to page "/address/0x0000000000000000000000000000000000000000"
    Then Element with "text" "in" should be "visible"

  @id382 @mainnet
  Scenario: Verify label "self" for Account info on Account page
    Given I go to page "/address/0xed7175341f123f7718aBaCF1702d6980CFc08784"
    Then Element with "text" "self" should be "visible"

  @id580 @id578 @id619 @testnet
  Scenario Outline: Verify label "<label name>" for method column on Contract page
    Given I go to page "<Page>"
    Then Column with "Method" name includes "<label name>" cell

    Examples:
      | Page                                                | label name    |
      | /address/0x8128948710d00d2698BAB65B5DBed7e839C71434 | multiTransfer |
  #  | /address/0x574343B3d1544477f2C4dF38c2Ef720Ab33e782b    | 0xcd72250d |
  #  | /address/0x4A80888F58D004c5ef2013d2Cf974f00f42DD934    | mintNFT    |

  @id580 @id578 @id619 @mainnet
  Scenario Outline: Verify label "<label name>" for method column on Contract page
    Given I go to page "<Page>"
    Then Column with "Method" name includes "<label name>" cell

    Examples:
      | Page                                                | label name    |
      | /address/0x0000000000000000000000000000000000008006 | create        |

  @id258 @testnet @testnetSmokeSuite
  Scenario Outline: Check data type dropdown for "<Row>" and select "<Value>"
    Given I go to page "/tx/0x4dca9c536124e5e2b29af17d075c3e55d15f119acf5f3327c9fdb1a3ffeab427"
    When I select "Logs" tab on "Transaction" page
    When I click on datatype dropdown of "<Row>" row
    When I click by text "<Value>"
    Then Check the element have the exact text "<Value>"

    Examples:
      | Row    | Value   |
      | Topics | Hex     |
      | Topics | Number  |
      | Topics | Text    |
      | Topics | Address |
      | Data   | Hex     |
      | Data   | Number  |
      | Data   | Text    |
      | Data   | Address |

  @id258 @mainnet 
  Scenario Outline: Check data type dropdown for "<Row>" and select "<Value>"
    Given I go to page "/tx/0xc598db886275ce5d7900fbfb6797afb3231a117446d91eb0dd8cf69addf90779"
    When I select "Logs" tab on "Transaction" page
    When I click on datatype dropdown of "<Row>" row
    When I click by text "<Value>"
    Then Check the element have the exact text "<Value>"

    Examples:
      | Row    | Value   |
      | Topics | Hex     |
      | Topics | Number  |
      | Topics | Text    |
      | Topics | Address |
      | Data   | Hex     |
      | Data   | Number  |
      | Data   | Text    |
      | Data   | Address |

  @id587 @testnetSmokeSuite
  Scenario: Check Processed status component for Transaction page
    Given I go to the first Processed transaction link
    Then Verify the badge with "Processed" status is visible
    Then Verify the badge with "Sending" status is visible
    Then Sending spinner should be visible
    Then Element with "text" "Sending" should be "visible"
    # Then Status component color with "Sending" status should be "grey"

  @id588 @testnet @testnetSmokeSuite
  Scenario: Check Processed status component for Transaction page
    Given I go to page "/tx/0x4dca9c536124e5e2b29af17d075c3e55d15f119acf5f3327c9fdb1a3ffeab427"
    Then Verify the badge with "Processed" status is visible
    Then Verify the badge with "Executed" status is visible
    Then Element with "text" "Executed" should be "visible"
    # Then Status component color with "Executed" status should be "green"

  @id589 @testnet @testnetSmokeSuite
  Scenario: Check Failed status component for Transaction page
    Given I go to page "/tx/0xd5f436a8f6785ae6d4d21375c5f497e4d0350407582a584a867cd7e01efbbc15"
    Then Verify the badge with "Failed" status is visible
    Then Element with "text" "Failed" should be "visible"
    # Then Status component color with "failed" status should be "red"

  @id588 @mainnet 
  Scenario: Check Verified status component for Transaction page
    Given I go to page "/tx/0xec06ab90e8cbada2b205874567504ceed9e005df452a997472823a8b59cb30ec"
    Then Verify the badge with "Processed" status is visible
    Then Verify the badge with "Executed" status is visible
    Then Element with "text" "Executed" should be "visible"
    # Then Status component color with "Executed" status should be "green"

  @id589 @mainnet 
  Scenario: Check Failed status component for Transaction page
    Given I go to page "/tx/0x2eb8b2afc76783e09fbebfc2db085e4ebd4d0944ddd241b4a35bc2e03de23fb5"
    Then Verify the badge with "Failed" status is visible
    Then Element with "text" "Failed" should be "visible"
    # Then Status component color with "failed" status should be "red"
    