---
tags: ['Common', 'Debugger', 'Full test', 'manual', 'regression', 'ZKF-2265', 'Active']
---

# id349 zkEVM Debugger - Common - Verify "Execution step" field size

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger?network=goerli-beta

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Enter value to "Execution step" field
- Verify Max. amount of symbols in "Execution step" field = total execution steps counter
