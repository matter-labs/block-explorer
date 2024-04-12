---
tags: ['Error', 'Full test', 'Pages', 'regression', 'ZKF-2235', 'Active']
---

# id374 Error page - Pages - Verify Error page enabling for Block page

## Description
  - I am on https://staging-scan-v2.zksync.dev/block/block_number page

## Precondition


## Scenario
- Open Dev Tools
- Emulate an error when receiving the Block request
                - (e.g. block the block request in Dev Tools when loading "Block" page)
    - Verify "Something went wrong" error shown on Block's page
