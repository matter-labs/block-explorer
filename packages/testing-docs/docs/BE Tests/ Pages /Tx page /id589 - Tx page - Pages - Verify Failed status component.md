---
tags: ['Full test', 'manual', 'Pages', 'Smoke test', 'Transaction', 'ZKF-2448', 'Automated']
---

# id589 Tx page - Pages - Verify "Failed" status component

## Description
  - Tx with failed status
  - https://goerli.staging-scan-v2.zksync.dev/tx/0x6dd189e0205028282a85a74b75024c1d9624ce79bf4c7f914e400fa0521bbc0e#overview

## Precondition


## Scenario
- Open any tx with "Verified" status (you can use link from description)
- Open "General Info" tab
- Verify transaction has "Failed" value in "Status" field
    - Icon is red with explanation mark
- Text - "Failed"
- No icon displayed before "Failed" icon
