---
tags: ['Common', 'Full test', 'regression', 'Smart Contract Verification page', 'ZKF-2258', 'Active']
---

# id341 SmartContractVerification page - Common - Сheck Solc version dropdown

## Description
  - https://staging-scan-v2.zksync.dev/contracts/verify

## Precondition


## Scenario
- Open Smart Contract Verification page
- Click Solc version dropdown
- Verify list of versions that backend supports shown
- Verify default version is the last one in the list
- Verify the list sorted in descending order, e.g. [v.1.1.1, v1.1.0, v1.0.0]. But keep in mind, this is server, not a plain string
