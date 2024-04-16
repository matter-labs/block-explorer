---
tags: ['Common', 'Debugger', 'Full test', 'Smoke test', 'ZKF-2383', 'Active']
---

# id418 zkEVM Debugger - Common - Verify debugger general state after starting debugging

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger

## Precondition


## Scenario
- Open Debugger
- Upload JSON with execution steps
- Start debugging
- Verify user is able to see a complete memory state at particular step for current contract
- Verify user can switch between Memory tabs (stack, heap, code, returndata, calldata)
- Verify memory state is updated in tabs after  step back/forward
