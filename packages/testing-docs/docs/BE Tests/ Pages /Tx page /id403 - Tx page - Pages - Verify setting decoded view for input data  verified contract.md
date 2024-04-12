---
tags: ['Actions', 'Full test', 'manual', 'Pages', 'regression', 'Transaction', 'ZKF-2372', 'Active']
---

# id403 Tx page - Pages - Verify setting decoded view for input data  (verified contract)

## Description
  - Prerequisites: (you can use https://github.com/JackHamer09/zkSync-2.0-Hardhat-example guide)
  - 1. upload your own contract with event
  - 2. verify this contract
  - 3. make a transaction

## Precondition


## Scenario
- Open transaction page
- Click "Show binary" button to set binary view for transaction method interface and arguments
- Click "Decode Input Data"
- Verify transaction method interface and arguments have decoded view
- Verify "Show binary" button shown instead of  "Decode Input Data" button
