@redirectionSet1 @regression

Feature: Redirection

  Background:
    Given I am on main page

  #Footer
  @id232
  Scenario Outline: Verify redirection for "<Extra button name>" on Footer for internal links
    Then I click by text "<Extra button name>"
    Given New page have "<url>" address

    Examples:
      | Extra button name | url                                     |
      | Docs              | https://docs.zksync.io/build/tooling/block-explorer/getting-started.html         |
      | Terms             | https://zksync.io/terms                 |
      | Contact           | https://zksync.io/contact      |

  #Header
  @id231
  Scenario Outline: Verify redirection for "<Icon>" social network icon  on Header
    When I click by element with partial href "<Icon>"
    Then New page have "<url>" address

    Examples:
      | Icon    | url                                |
      # discord renamed to "join"
      | join    | https://join.zksync.dev/           |
      | twitter | https://twitter.com/zksync         |

  @id251
  Scenario: Verify redirection for Documentation link
    Given I click by text "Documentation"
    Then New page have "https://docs.zksync.io/build/tooling/block-explorer/getting-started.html" address

  @id252
  Scenario Outline: Verify redirection for "<Sub-Section>" in BE menu
    Given I click by text "Block Explorer "
    When I click by element with partial href "<url>" and text "<Sub-Section>"
    Then Current page have "<url>" address

    Examples:
      | Sub-Section  | url            |
      | Blocks       | /blocks/       |
      | Transactions | /transactions/ |

  @id253:I
  Scenario Outline: Verify redirection for "<Sub-Section>" in Tools menu
    Given I click by text "Tools "
    When I click by element with partial href "<url>" and text "<Sub-Section>"
    Then Current page have "<url>" address

    Examples:
      | Sub-Section                 | url               |
      | Smart Contract Verification | /contracts/verify |
      # | zkEVM Debugger              | /tools/debugger   |

  @id253:III @featureEnv @testnetSmokeSuite @testnet
  Scenario Outline: Verify redirection for "<Sub-Section>" in Tools menu (Sepolia)
    Given I click by text "Tools "
    When I click by element with partial href "<redirect_url>" and text "<Sub-Section>"
    Then New page have "<url>" address

    Examples:
      | Sub-Section | url                                              | redirect_url                    |
      | Bridge      | https://portal.zksync.io/bridge/?network=sepolia | https://portal.zksync.io/bridge/?network=sepolia |

  @id253:IV @featureEnv @mainnet
  Scenario Outline: Verify redirection for "<Sub-Section>" in Tools menu
    Given I click by text "Tools "
    When I click by element with partial href "<url>" and text "<Sub-Section>"
    Then New page have "<url>" address

    Examples:
      | Sub-Section | url                                              |
      | Bridge      | https://portal.zksync.io/bridge/?network=mainnet |

  #Account page
  @id259 @testnet
  Scenario Outline: Verify redirection from Account page after "<Artifact type>" click
    Given I go to page "/address/0x851df0eDcc4109C7E620d0AAdFDB99348821EB79"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url         |
      | tx hash           | /tx/        |
      | from address      | /address/   |
      | to address        | /address/   |
      | Value             | /address/   |
      | Fee               | /address/   |

  #Account page
  @id367 @testnet
  Scenario Outline: Verify L1 redirection from Account page after "<Artifact type>" click
    Given I go to page "/address/0x851df0eDcc4109C7E620d0AAdFDB99348821EB79"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url         |
      | from address      | /address/   |
      | to address        | /address/   |

  #Account page
  @id259:I @mainnet
  Scenario Outline: Verify redirection from Account page after "<Artifact type>" click
    Given I go to page "/address/0xa9A17Ce49Bf3d0a7b2B633994729f057A90c8130"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url         |
      | tx hash           | /tx/        |
      | from address      | /address/   |
      | to address        | /address/   |
      | Value             | /address/   |
      | Fee               | /address/   |

  #Account page
  @id367:I @mainnet
  Scenario Outline: Verify L1 redirection from Account page after "<Artifact type>" click
    Given I go to page "/address/0xa9A17Ce49Bf3d0a7b2B633994729f057A90c8130"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url         |
      | from address      | /address/   |
      | to address        | /address/   |

  #Block page
  @id235
  Scenario Outline: Verify redirection from Block page after "<Artifact type>" click
    Given I go to page "/block/13780"
    When I click on the first "<Artifact type>" link
    Given Page with part address "<url>" includes ID result

    Examples:
      | Artifact type     | url         |
      | tx hash           | /tx/        |
      | from address      | /address/   |
      | to address        | /address/   |
      | Value             | /address/   |
      | Fee               | /address/   |

  #Blocks page
  @id246
  Scenario: Verify redirection from Main page after block number click
    Given I go to page "/blocks"
    Given I click on the first "block number" link
    Given Page with part address "/block/" includes ID result
