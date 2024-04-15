---
tags: ['ABI', 'Contract', 'Full test', 'Fields', 'regression', 'Active']
---

# id675 Contract page - Pages - Verify amount input validation for a payable function

## Description
Example of contract:
https://sepolia.explorer.zksync.io/address/0x000000000000000000000000000000000000800A#contract

## Precondition


## Scenario
- Open Contract's page
- Click on "Contract" tab
  - Make input to Charge function active
- Input data:
  - letters - error message should be displayed
  - numbers \<0 - error message should be displayed
  - -*/+ symbols - error message should be displayed
  - positive number (e.g. 50) - no error message should be displayed
![id675](../../../../static/img/Fields/Contract%20page/id675.png)
