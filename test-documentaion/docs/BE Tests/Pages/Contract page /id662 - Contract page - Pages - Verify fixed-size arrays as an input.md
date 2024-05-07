---
tags: ['ABI', 'Contract', 'Full test', 'Pages', 'regression', 'Active']
---

# id662 Contract page - Pages - Verify fixed-size arrays as an input

## Description
  - https://sepolia.staging-scan-v2.zksync.dev/address/0x53d67E04c777a725C05399850eb942348444B5AF#contract

## Precondition


## Scenario
- Open Contract's page
- Click on the "Contract" tab
- Click "setFixedArray" dropdown (method with fixed array)
- Verify none of the inputs can be empty
- Verify amount of inputs is equal to predefined array size (3)
- Verify inputs can't be added or removed - buttons "+" and "remove" not shown
  ![Screenshot](../../../../static/img/Pages/Contracts/id662_1.png)