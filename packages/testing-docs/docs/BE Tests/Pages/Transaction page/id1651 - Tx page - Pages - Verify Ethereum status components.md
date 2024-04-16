---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'Active']
---

# id1651 Tx page - Pages - Verify "Ethereum" status components

## Description
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
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1651_1.png)
    - Validating
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1651_2.png)
    - Executing
  - Loading spinner shown after the "Ethereum" text before the  status
  - Background is grey
  - Verify the list of components reveal on hover for "Ethereum" status component
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1651_3.png)
- Verify Ethereum status shown after "zkSyns Era" status
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1651_2.png)
