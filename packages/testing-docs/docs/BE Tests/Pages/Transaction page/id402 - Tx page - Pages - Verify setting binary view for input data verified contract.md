---
tags: ['Actions', 'Full test', 'manual', 'Pages', 'regression', 'Transaction', 'Active']
---

# id402 Tx page - Pages - Verify setting binary view for input data (verified contract)

## Description
https://sepolia.explorer.zksync.io/tx/0xc925878434bbc62ead5744cbde52e5043c80ec3790109ba817d450ba50523af0#overview

## Precondition


## Scenario
- Open transaction page
- Verify transaction method interface and arguments have decoded view
![Screenshot](../../../../static/img/Pages/Transaction%20page/id402_1.png)
- Verify "Show original input" button available
- Click "Show original input" button
- Verify transaction method interface and arguments have binary view
![Screenshot](../../../../static/img/Pages/Transaction%20page/id402_2.png)
- Verify "Decode Input Data" button shown instead of "Show Binary" button
- Verify the dropdown with format selection shown with "Decoded bytecode" option available
