---
tags: ['Common', 'Debugger', 'Full test', 'manual', 'Navigation', 'Smoke test', 'ZKF-2464', 'Active']
---

# id614 zkEVM Debugger - Common - Verify highlighted instructions

## Description
  - https://goerli.staging-scan-v2.zksync.dev/

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Click "Start" to start debugging
- Verify each line in source code is highlighted if it was executed at least once in the particular trace
- Verify lines in source code aren't highlighted in case they aren't executed at least once in the particular trace
