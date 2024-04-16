---
tags: ['automated', 'Full test', 'main page', 'Navigation', 'Smoke test','Automated']
---

# id234 Dashboard - Pages - Navigation

## Description
  - Block page example: https://staging-scan-v2.zksync.dev/block/78283
  - Transaction page example: https://staging-scan-v2.zksync.dev/tx/0x2bd6f6367091248fbfb5ed8de986340a56f00c04cd7a45a503a803d6228fa208
  - - I am on the main page

## Precondition


## Scenario
- "Batch" navigates to the batch page
    - https://goerli.staging-scan-v2.zksync.dev/batch/(batchnumber)
- "Size" link navigates to the batch page (Batch Transactions section)
    - https://goerli.staging-scan-v2.zksync.dev/batch/(batchnumber)
- Transactions hash navigates to transaction page
    - https://staging-scan-v2.zksync.dev/tx/0x2cc829a9697f2fce664d4f25ce78f2bfce41c8e1a167a85b45953385ddb2ee86
- "Committed Blocks" navigates to Blocks page
    - https://staging-scan-v2.zksync.dev/blocks/
- "Verified Blocks" navigates to Blocks page
    - https://staging-scan-v2.zksync.dev/blocks/
- "Transactions" navigates to Transactions page
    - https://staging-scan-v2.zksync.dev/transactions/
