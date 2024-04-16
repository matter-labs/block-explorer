---
tags: ['ABI', 'Contract', 'Full test', 'Fields', 'regression', 'Active']
---

# id675 Contract page - Pages - Verify amount input validation for a payable function

## Description
  - https://goerli.staging-scan-v2.zksync.dev/address/0xAED6e18d8fe6397fc622A17402e8EB350d6D6c45#contract
  - Example of contract is added to the attachments section.

## Precondition


## Scenario
- Open Contract's page
- Click on "Contract" tab
    - Make input to Charge function active
- Input data:
    - letters - error message should be displayed
- numbers \<0 - error message should be displayed
- -*/- symbols - error message should be displayed
- positive number (e.g. 50) - no error message should be displayed
