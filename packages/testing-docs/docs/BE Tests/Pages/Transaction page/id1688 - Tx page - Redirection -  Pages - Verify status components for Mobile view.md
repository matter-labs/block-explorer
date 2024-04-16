---
tags: ['Full test', 'manual', 'Mobile view', 'Pages', 'Redirection', 'Smoke test', 'Status Component', 'Transaction', 'Active']
---

# id1688 Tx page - Redirection -  Pages - Verify status components for Mobile view

## Description

## Precondition


## Scenario
- Open any tx with \<Verified\> status
- Open "General Info" tab
- "Ethereum Sending" status is displayed
  - Click on "Ethereum Executed"
- After tx was Validated:
  - **Sent** text (higlhighted) - redirects to https://sepolia.etherscan.io/tx/\{address)
  - **Validated** text (highlighted)  - redirects to https://sepolia.etherscan.io/tx/\{address\}
  - **Executed** text (highlighted) - redirects to https://sepolia.etherscan.io/tx/\{address\}
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1687_4.png)
