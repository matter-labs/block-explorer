---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'Automated']
---

# id589 Tx page - Pages - Verify "Failed" status component

## Description
Test solution address/parameter
- Mainnet: /tx/0x2eb8b2afc76783e09fbebfc2db085e4ebd4d0944ddd241b4a35bc2e03de23fb5
- Testnet: /tx/0xb995a27e03a3cca591f3e7ed04dd3ce6ea6055a0dfcb2a9bb177f3caad4c5e10

## Precondition


## Scenario
- Open any tx with "Verified" status (you can use link from description)
- Open "General Info" tab
- Verify transaction has "Failed" value in "Status" field
  - Icon is red with explanation mark
  - Text - "Failed"
  - No icon displayed before "Failed" icon

![Screenshot](../../../../static/img/Pages/Transaction%20page/id589.png)
