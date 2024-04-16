---
tags: ['Artifacts', 'Error', 'Full test', 'main page', 'Pages', 'regression', 'Transaction', 'Active']
---

# id925 Dashboard - Pages - Verify Error page messages for empty state (Latest Transactions)

## Description
  - I am on https://staging-scan-v2.zksync.dev/block/block_number page

## Precondition


## Scenario
- Open Dev Tools
- Emulate an error when receiving the Block request
                - (e.g. block the block request in Dev Tools when loading "Block" page)
    - Verify error message is present:
    - "Transactions information is unavailable. Please reload the page.
      ![Screenshot](../../../../static/img/Pages/DashboardPage/id925_1.png)