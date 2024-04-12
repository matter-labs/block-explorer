---
tags: ['Common', 'Debugger', 'Full test', 'manual', 'regression', 'ZKF-2265', 'Active']
---

# id346 zkEVM Debugger - Common - Verify error state for "Execution Step" field

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger?network=goerli-beta

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Enter any incorrect number to "Execution Step" field (e.g 0, number bigger than steps amount)
- Press Enter
- Verify default 1 step opened after pressing Enter
- Verify default "1" value set in "Execution Step" field after pressing Enter
