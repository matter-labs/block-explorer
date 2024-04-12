---
tags: ['Full test', 'manual', 'Multi-contract', 'regression', 'Smart Contract Verification page', 'ZKF-2841', 'Active']
---

# id716 SmartContractVerification page - Common  - Verify removing files for Multi-Contract

## Description
  - https://staging-scan-v2.zksync.dev/contracts/verify

## Precondition


## Scenario
- Click "Choose Files" button
- Verify file selecting window opened
- Select few .sol files
- Click "Remove" button
- Verify file removed from "Your files" block
- Remove all added files
- Verify "Your files" block is removed
- "Remove" button is not displayed
- Verify "Main File" headline is not displayed
- Verify "Choose main file" dropdown is not displayed
