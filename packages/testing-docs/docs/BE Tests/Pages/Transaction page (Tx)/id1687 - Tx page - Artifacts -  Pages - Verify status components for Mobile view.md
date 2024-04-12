---
tags: ['Artifacts', 'Full test', 'manual', 'Mobile view', 'Pages', 'Smoke test', 'Status Component', 'Transaction', 'UEXP-4308', 'Active']
---

# id1687 Tx page - Artifacts -  Pages - Verify status components for Mobile view

## Description
  - Tx with Processed status
  - tx/0x586c333379cecdf235de7d26ac9217d65f1652875ff7f15651e21fa700d0bf36
  - Created based on the ticket:
  - https://linear.app/matterlabs/issue/UEXP-4308/create-tx-statuses-popup-for-mobile-devices

## Precondition


## Scenario
- Open any tx with \<zk Sync Era Processed\> status
- Open "General Info" tab
- "Ethereum Sending" status is displayed
    - Click on "Ethereum Sending"
- Modal window is displayed:
    - header
- status present
- status present
- status present
- After tx was sent modal window is changed:
    - status present
- status present
- status present
- After tx was Finalized:
    - text (higlhighted)
- text (highlighted)
- text (highlighted)
