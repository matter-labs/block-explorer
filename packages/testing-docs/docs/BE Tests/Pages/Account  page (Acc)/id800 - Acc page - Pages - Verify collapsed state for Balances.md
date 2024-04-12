---
tags: ['Account', 'Artifacts', 'Balances', 'Full test', 'manual', 'regression', 'ZKF-2858', 'Active']
---

# id800 Acc page - Pages - Verify collapsed state for Balances

## Description
  - Open page with a lot of tokens balance (5+ tokens) (https://goerli.staging-scan-v2.zksync.dev/address/0xd0d84927ff84183ca8899b21116e480a3863fe61)

## Precondition


## Scenario
- Balances table displays the balance of L2
    - Asset/Token
- Balance
- Address/smart contract hash
- USD price is displayed for ERC20 tokens
- 5 tokens displayed in the table
- "Show all Balances \{number\}" button displayed under the tokens list
- Number of all tokens displayed on "Show all Balances \{number\}" button
- Click on "Show all Balances \{number\}" button
- Verify expanded list of tokens displayed
