---
tags: ['Full test', 'manual', 'Pages', 'regression', 'Transaction', 'ZKF-2109', 'Active']
---

# id392 Tx page - Pages - Verify tx with event for custom token

## Description
  - https://goerli.explorer.zksync.io/tx/0x7d40bc04f310be8b0a4bfdc4c0bada0606811a946aa677795cbd3c1c5e14f0cf#eventlog
  - Prerequisites: (you can use https://github.com/JackHamer09/zkSync-2.0-Hardhat-example guide)
  - 1. Deploy your own token (contract need to have an event)
  - 2. verify this contract
  - 3. make a transaction

## Precondition


## Scenario
- Open transaction's page
- Open "Logs" tab
- Verify "Name" field with added event displayed (layer, type and parameter name)
