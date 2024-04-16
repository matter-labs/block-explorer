---
tags: ['Full test', 'manual', 'regression', 'Transaction', 'Active']
---

# id404 Tx page - Pages - Verify error state for transaction method interface

## Description

## Precondition


## Scenario
- Open transaction page
- Emulate an error when receiving the transaction method request (e.g. block transaction method request in Dev Tools when loading "Tx" page)
- Verify red "Error" message shown
- Verify "Try again" button shown
- Verify page reloaded after clicking "Try again" button
![Screenshot](../../../../static/img/Pages/Transaction%20page/id404.png)
