---
tags: ['Full test', 'manual', 'Mobile view', 'Pages', 'Redirection', 'Smoke test', 'Status Component', 'Transaction', 'UEXP-4308', 'Active']
---

# id1688 Tx page - Rediraction -  Pages - Verify status components for Mobile view

## Description
  - Tx with Processed status
  - tx/0x586c333379cecdf235de7d26ac9217d65f1652875ff7f15651e21fa700d0bf36
  - Created based on the ticket:
  - https://linear.app/matterlabs/issue/UEXP-4308/create-tx-statuses-popup-for-mobile-devices

## Precondition


## Scenario
- Open any tx with \<Verified\> status
- Open "General Info" tab
- "Ethereum Sending" status is displayed
    - Click on "Ethereum Executed"
- After tx was Validated:
    - text (higlhighted) - redirects to https://goerli.etherscan.io/tx/\{address)
- text (highlighted)  - redirects to https://goerli.etherscan.io/tx/\{address\}
- text (highlighted) - redirects to https://goerli.etherscan.io/tx/\{address\}
