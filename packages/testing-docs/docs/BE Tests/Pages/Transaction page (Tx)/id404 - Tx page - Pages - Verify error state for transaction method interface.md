---
tags: ['Full test', 'manual', 'regression', 'Transaction', 'ZKF-2372', 'Active']
---

# id404 Tx page - Pages - Verify error state for transaction method interface

## Description
  - Prerequisites: (you can use https://github.com/JackHamer09/zkSync-2.0-Hardhat-example guide)
  - 1. upload your own contract with event
  - 2. verify this contract
  - 3. make a transaction

## Precondition


## Scenario
- Open transaction page
- Emulate an error when receiving the transaction method request
                - (e.g. block transaction method request in Dev Tools when loading "Tx" page)
    - Verify red "Error" message shown
- Verify "Try again" button shown
- Verify page reloaded after clicking "Try again" button
