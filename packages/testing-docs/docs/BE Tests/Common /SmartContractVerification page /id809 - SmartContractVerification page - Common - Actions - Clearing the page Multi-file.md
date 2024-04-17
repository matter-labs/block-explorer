---
tags: ['Actions', 'Artifacts', 'Full test', 'Multi-contract', 'Smart Contract Verification page', 'Smoke test', 'Active']
---

# id809 SmartContractVerification page - Common - Actions - Clearing the page (Multi-file)

## Description
  - https://sepolia.staging-scan-v2.zksync.dev/contracts/verify

## Precondition


## Scenario
- Select "Solidity (Multi-part contract)" in "Compiler type" dropdown
- Fill all the fields on Smart Contract Verification page:
    - Contract address field
- Contract Name
- Optimization
- ZkSolc compiler version
- Solc version
- Upload files
- Select Main file in "Main File" dropdown
- Constructor Arguments
- Click on Clear button
  ![Screenshot](../../../../static/img/Common/SmartContractVerification/id809_1.png)
- Verify text fields are cleared
  ![Screenshot](../../../../static/img/Common/SmartContractVerification/id809_2.png)
  ![Screenshot](../../../../static/img/Common/SmartContractVerification/id809_3.png)
  ![Screenshot](../../../../static/img/Common/SmartContractVerification/id809_4.png)
- Verify "ZkSolc version" and "Solc Version" dropdowns  set to default values (latest versions)
- Verify "Optimization" radio buttons set to default values (Yes)
- Verify uploaded files removed
