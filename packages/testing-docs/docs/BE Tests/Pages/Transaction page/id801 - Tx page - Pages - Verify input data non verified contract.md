---
tags: ['Actions', 'Full test', 'manual', 'Pages', 'regression', 'Transaction', 'Active']
---

# id801 Tx page - Pages - Verify input data (non verified contract)

## Description
Example of non verified contract
  - https://sepolia.explorer.zksync.io/tx/0x7c1cae98bb4aa3a8b92be9418e6f432f948abc4ce9d90a9b88f2700b88b4a9b8

## Precondition


## Scenario
- Open non verified contract page
- Click on any tx link from "Transactions" tab
- Verify "Input data" field has binary view
![Screenshot](../../../../static/img/Pages/Transaction%20page/id801_1.png)
- Verify binary view can't be decoded
- Text displayed under the binary view
    - Unable to decode input data (Contract not verified)
![Screenshot](../../../../static/img/Pages/Transaction%20page/id801_2.png)

