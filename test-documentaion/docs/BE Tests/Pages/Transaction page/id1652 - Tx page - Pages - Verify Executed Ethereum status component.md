---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'Active']
---

# id1652 Tx page - Pages - Verify "Executed" "Ethereum" status component

## Description
  - Tx with Processed status
  - tx/0x1c95e17c5dc5673db135af5f76f18b70d785d75015cdbdfba5d028b406a91d64

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
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1652.png)