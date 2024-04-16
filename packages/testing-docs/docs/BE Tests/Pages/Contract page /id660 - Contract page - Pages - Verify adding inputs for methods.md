---
tags: ['ABI', 'Contract', 'Full test', 'Pages', 'regression', 'Active']
---

# id660 Contract page - Pages - Verify "+" button for adding inputs for methods

## Description
- https://https://goerli.staging-scan-v2.zksync.dev/address/0xAED6e18d8fe6397fc622A17402e8EB350d6D6c45#contract

## Precondition


## Scenario
- Open Contract's page
- Click on the "Contract" tab
- Verify "+" button shown only for writing methods which can receive an array as an input - value type has [] (e.g. uint 256[])
- Verify button "+" isn't available for parameter if this parameter could accept single value (e.g. uint256).
  ![Screenshot](../../../../static/img/Pages/Contracts/id660_1.png)