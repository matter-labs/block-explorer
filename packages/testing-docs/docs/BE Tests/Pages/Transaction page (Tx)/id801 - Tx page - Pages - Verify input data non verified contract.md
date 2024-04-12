---
tags: ['Actions', 'Full test', 'manual', 'Pages', 'regression', 'Transaction', 'ZKF-3221', 'Active']
---

# id801 Tx page - Pages - Verify input data (non verified contract)

## Description
  - Example of non verified contract
  - https://goerli.staging-scan-v2.zksync.dev/address/0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b

## Precondition


## Scenario
- Open non verified contract page
- Click on any tx link from "Transactions" tab
- Verify "Input data" field has binary view
- Verify binary view can't be decoded
- Text displayed under the binary view
    - Unable to decode input data (Contract not verified)
