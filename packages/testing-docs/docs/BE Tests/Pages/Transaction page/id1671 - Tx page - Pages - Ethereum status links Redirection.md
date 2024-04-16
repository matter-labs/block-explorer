---
tags: ['Full test', 'manual', 'Pages', 'Redirection', 'Smoke test', 'Transaction', 'Active']
---

# id1671 Tx page - Pages - "Ethereum" status links (Redirection)

## Description
  - Open any completed (finalised) tx link - transaction with "Ethereum Executed" status

## Precondition


## Scenario
- Open any tx with loading Ethereum status (see description)
- Open "General Info" tab
- Hover the cursor on  the "Ethereum" status component
- Dropdown with statuses expanded
    - Sent
- Validated
- Executed
- Verify each dropdown item link redirects to it's https://goerli.etherscan.io/tx/\{tx_hash\} page
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1671.png)