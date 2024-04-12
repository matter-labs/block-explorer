---
tags: ['Actions', 'Full test', 'manual', 'Pages', 'regression', 'Transaction', 'ZKF-2372', 'Active']
---

# id402 Tx page - Pages - Verify setting binary view for input data (verified contract)

## Description
  - Prerequisites: (you can use https://github.com/JackHamer09/zkSync-2.0-Hardhat-example guide)
  - 1. upload your own contract with event
  - 2. verify this contract
  - 3. make a transaction

## Precondition


## Scenario
- Open transaction page
- Verify transaction method interface and arguments have decoded view
- Verify "Show original input" button available
- Click "Show original input" button
- Verify transaction method interface and arguments have binary view
- Verify "Decode Input Data" button shown instead of "Show Binary" button
- Verify the dropdown with format selection shown with "Decoded bytecode" option available
