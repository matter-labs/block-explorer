@search @regression

Feature: Search field

  Background:
    Given I am on main page

  #Addresses/Accounts
  @id213
  Scenario: Search correct address / account
    Given I fill the search field by "0xc24215226336d22238a20a72f8e489c005b44c4a"
    When I press search button
    And Title contains text "Account 0xc242...4C4A"
    Then Current page have "/address/0xc24215226336d22238a20a72f8e489c005b44c4a" address

  @id214
  Scenario: Search incorrect address / account
    Given I fill the search field by "0xAbebcd41ceabbc85da9bb67527f58d69ad4dfff51"
    When I press search button
    Then I am on main page
    Then Search field color should be red

  @id226
  Scenario: Search random address / account
    Given I fill the search field by "0xc24215226336d22238a20a72f8e489c005b44c41"
    When I press search button
    And Title contains text "Account 0xC242...4c41"
    And Current page have "/address/0xc24215226336d22238a20a72f8e489c005b44c41" address
    Then Element with "text" "We can’t find any balances related to this account." should be "visible"

  #Block Numbers
  @id218
  Scenario: Search correct batch number
    Given I fill the search field by "1"
    When I press search button
    Then Current page have "/batch/1" address
    Then Title contains text "Batch # 1 "

  @id217
  Scenario Outline: Search incorrect batch number with "<Value>"
    Given I fill the search field by "<Value>"
    When I press search button
    Then Search field color should be red

    Examples:
      | Value   |
      | 341 844 |
      | 341а44  |
      | 341$44  |

  @id227
  Scenario: Search random batch number/inexistent
    Given I fill the search field by "341844341844"
    When I press search button
    Then Element with "text" "Oops, we can’t find anything" should be "visible"

  #Contract hash
  @id219
  Scenario: Search correct contract hash
    Given I fill the search field by "0x0000000000000000000000000000000000000000"
    When I press search button
    Then Current page have "/address/0x0000000000000000000000000000000000000000" address

  @id220
  Scenario: Search incorrect contract hash
    Given I fill the search field by "0x00000123532234232100000000000000000000"
    When I press search button
    Then Search field color should be red

  @id229
  Scenario: Search random contract hash / inexistent
    Given I fill the search field by "0x98ddd69b2443fc67755f0901aeb9828a8a62cc61"
    When I press search button
    Then Element with "text" "We can’t find any balances related to this account." should be "visible"

  #TX Hash From/To
  @id224:I @testnet 
  Scenario: Search correct tx hash
    Given I fill the search field by "0x74a780a26da5751178eef9918e1383348f2281df9e259cc10e200974a2bce679"
    When I press search button
    Then Current page have "/tx/0x74a780a26da5751178eef9918e1383348f2281df9e259cc10e200974a2bce679" address

  @id224:II @mainnet 
  Scenario: Search correct tx hash
    Given I fill the search field by "0x97e3d593e03e764df14e352e73ba6af487faf8d04bd65a1fd3d55208b6e0d972"
    When I press search button
    Then Current page have "/tx/0x97e3d593e03e764df14e352e73ba6af487faf8d04bd65a1fd3d55208b6e0d972" address

  @id223
  Scenario Outline: Search incorrect tx hash with "<Value>"
    Given I fill the search field by "<Value>"
    When I press search button
    Then Search field color should be red

    Examples:
      | Value                                                              |
      | 0x!6adbc2511be767d03be088a4242d07829433e0bbb9d8a27489b971f1113ecff |
      | 0x16adbc2511be767d03be088a4242d07829433e0bbb9d8a27489b971f1113ec   |
      | 0x16adbc2511be767d03be088a4242d07829433e0bbb9d8a27489b971f1113ec f |
      | 0xW6adbc2511be767d03be088a4242d07829433e0bbb9d8a27489b971f1113ecff |

  @id228
  Scenario Outline: Search random tx hash / inexistent with "<Value>"
    Given I fill the search field by "<Value>"
    When I press search button
    Then Element with "text" "Oops, we can’t find anything" should be "visible"

    Examples:
      | Value                                                              |
      | 0x16adbc2511be767d03be088a4242d07829433e0bbb9d8a27489b971f1113ecfa |
      | 0x16adbc2511be767d03be088a4242d07829433e0bbb9d8a27489b971f1114ecff |

  #Empty Search field
  @id225
  Scenario: Fill the search field by empty value and try to search
    Given I fill the search field by ""
    When I press search button
    Given Search field color should be red
