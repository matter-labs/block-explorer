---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'UEXP-4264', 'Active']
---

# id1650 Tx page - Pages - Verify "zkSync Era" status component

## Description
  - Tx with Processed status
  - tx/0x586c333379cecdf235de7d26ac9217d65f1652875ff7f15651e21fa700d0bf36

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
