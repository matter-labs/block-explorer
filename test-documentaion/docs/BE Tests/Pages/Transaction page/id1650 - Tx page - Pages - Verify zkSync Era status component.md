---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'Active']
---

# id1650 Tx page - Pages - Verify "zkSync Era" status component

## Description
Tx with Processed status
  - https://sepolia.explorer.zksync.io/tx/0x480008d47178040052dcabfc3ad714528797ed3990dab99c03781c1926eb6f75

## Precondition


## Scenario
- Open any tx with "Processed" status (you can use link from description)
- Open "General Info" tab
- Verify transaction has "zkSync Processed" value in "Status" field
    - Text
      - zkSync
- Background is light green
- Text
    - Processed
- Tick icon displayed before "Processed" status
- Background is green
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1650.png)
