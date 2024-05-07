---
tags: ['Common', 'Debugger', 'Full test', 'regression', 'ZKF-2265', 'Active']
---

# id347 zkEVM Debugger - Common - Verify non numeric values for "Execution Step" field

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger?network=goerli-beta

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Try to enter any non numeric value to "Execution Step" field (e.g special symbol, letters e.g)
- Verify entered non numeric value is not added to a field
- Press Enter
- Verify default 1 step opened after pressing Enter
