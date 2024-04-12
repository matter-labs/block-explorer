---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'UEXP-4264', 'UEXP-4307', 'Active']
---

# id1652 Tx page - Pages - Verify "Executed" "Ethereum" status component

## Description
  - https://linear.app/matterlabs/issue/UEXP-4307/create-hover-component-with-detailed-tx-statuses-changes
  - Tx with Processed status
  - tx/0x586c333379cecdf235de7d26ac9217d65f1652875ff7f15651e21fa700d0bf36

## Precondition


## Scenario
- Open any tx with "Processed" status (you can use link from description)
- Open "General Info" tab
- Verify transaction has "Ethereum" value in "Status" field
    - Text
    - Ethereum
- Background is light green
- Text
    - Executed
- Tick icon displayed before "Processed" status
- Background is green
- Verify the list of components reveal on hover for "Ethereum" status component
    - Sent
- Validated
- Executed
- Status name is green
- Tick icon displayed before status
- Each item has icon notifying about redirect
