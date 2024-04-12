---
tags: ['Contract', 'Full test', 'Pages', 'regression', 'ZKF-2134', 'ZKF-2704', 'Active']
---

# id432 Contract page - Pages - Verify list of methods on the "Contracts" tab for token's contract

## Description
  - https://staging-scan-v2.zksync.dev/address/contract_address
  - Prerequisites: (you can use https://github.com/JackHamer09/zkSync-2.0-Hardhat-example guide) or search for 0x772ab24587013a106e08f3868ef18361c8f3a4da contract
  - 1. upload your own contract for token with methods
  - 2. verify this contract
  - https://goerli.staging-scan-v2.zksync.dev/address/0x4A80888F58D004c5ef2013d2Cf974f00f42DD934#contract - page for verified contract, method name has abbereviation

## Precondition


## Scenario
- Open Contract's page
- Click on the "Contract" tab
- Verify correct Read and Write methods for interacting with this smart contract displayed
- Verify  exact method name displayed  for method name with abbereviation (with no extra spaces)
