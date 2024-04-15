---
tags: ['Common', 'Error', 'Full test', 'regression', 'Smart Contract Verification page', 'ZKF-2258', 'Active']
---

# id343 SmartContractVerification page - Common - Сheck Solc version dropdown error state

## Description
  - https://staging-scan-v2.zksync.dev/contracts/verify

## Precondition


## Scenario
- Open Smart Contract Verification page
- Emulate an error when receiving the list of Solc versions
                - (e.g. block solc_versions request in Dev Tools when loading "Smart Contract Verification" page)
    - Verify error shown when failed to get list of versions below the dropdown: dropdown highlighted with red border + "Unable to get list of supported Solc versions" message shown
