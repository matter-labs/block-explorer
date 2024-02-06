---
sidebar_label: 'id807 Account page - Pages - Artifacts (Empty state)'
sidebar_position: 4
tags: [Artifacts, Account, Balances, Empty state, Manual, Regression]
---

# id807 Account page - Pages - Artifacts (Empty state)

## Preconditions
1. Open page of [empty account (Mainnet)](https://staging-scan-v2.zksync.dev/address/0xe9f4149276e8a4f8db89e0e3bb78fd853f01e87d) 

## Scenario
1. Account info table  
    - Address
    - Committed nonce	- 0
    - Verified nonce - 0
2. Balances table
    - Title
        - This account doesn’t have any balances
    - Text
        - We can’t find any balances related to this account.
3. Latest Transactions
    - Title
        - This account doesn’t have any transactions
    - Text
        - We can’t find any transaction related to this account. It’s your chance to be the first

![logo](/img/id807EmptyAccount.png)

