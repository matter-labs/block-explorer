---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'UEXP-4264', 'UEXP-4307', 'Active']
---

# id1651 Tx page - Pages - Verify "Ethereum" status components

## Description
  - https://linear.app/matterlabs/issue/UEXP-4307/create-hover-component-with-detailed-tx-statuses-changes
  - Open any tx link from "Latest transactions"

## Precondition


## Scenario
- Open any tx with loading Ethereum status (see description)
- Open "General Info" tab
- Verify transaction has "Ethereum" value in "Status" field
    - Text
    - Ethereum
- Background is grey
- Verify Ethereum statuses available for txs
    - Sending
- Validating
- Executing
- Loading spinner shown after the "Ethereum" text before the  status
- Background is grey
- Verify the list of components reveal on hover for "Ethereum" status component
- Verify Ethereum status shown after "zkSyns Era" status
