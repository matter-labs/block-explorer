---
tags: ['Common', 'Debugger', 'Full test', 'manual', 'Memory', 'regression', 'ZKF-2527', 'Active']
---

# id605 zkEVM Debugger - Common - Verify calldata memory tab

## Description
  - https://goerli.staging-scan-v2.zksync.dev/tools/debugger

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Start debugging
- Verify "calldata" tab is dispayed in case it has  non zero index
- Verify "calldata" tab is not dispayed in case it has '0' index
