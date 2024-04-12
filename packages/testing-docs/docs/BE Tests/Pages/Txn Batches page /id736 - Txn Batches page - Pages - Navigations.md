---
tags: ['Full test', 'Navigation', 'Pages', 'regression', 'Txn Batch', 'ZKF-3253', 'Active']
---

# id736 Txn Batches page - Pages - Navigations

## Description
  - https://goerli.explorer.zksync.io/batches

## Precondition


## Scenario
- Open URL https://goerli.explorer.zksync.io/batches/
- Click on BATCH link for batch in the list
    - User is navigated to https://goerli.staging-scan-v2.zksync.dev/batch/(batchnumber)
- "Size" link navigates to the batch page (Batch Transactions section)
    - https://goerli.staging-scan-v2.zksync.dev/batch/(batchnumber)
