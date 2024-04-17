---
tags: ['automated', 'Full test', 'main page', 'Navigation', 'Smoke test','Automated']
---

# id234 Dashboard - Pages - Navigation

## Description
  - Block page example: https://staging-scan-v2.zksync.dev/block/78283
  - Transaction page example: https://staging-scan-v2.zksync.dev/tx/0x97e0b83ef89230deb9a97c5fad325bfa7359bc94495d990a9efeaf1b5dea230a
  - - I am on the main page

## Precondition


## Scenario
- "Batch" navigates to the batch page
    - https://sepolia.staging-scan-v2.zksync.dev/batch/(batchnumber)
- "Size" link navigates to the batch page (Batch Transactions section)
    - https://sepolia.staging-scan-v2.zksync.dev/batch/(batchnumber)
- Transactions hash navigates to transaction page
    - https://staging-scan-v2.zksync.dev/tx/0x97e0b83ef89230deb9a97c5fad325bfa7359bc94495d990a9efeaf1b5dea230a
- "Committed Blocks" navigates to Blocks page
    - https://staging-scan-v2.zksync.dev/blocks/
- "Verified Blocks" navigates to Blocks page
    - https://staging-scan-v2.zksync.dev/blocks/
- "Transactions" navigates to Transactions page
    - https://staging-scan-v2.zksync.dev/transactions/
