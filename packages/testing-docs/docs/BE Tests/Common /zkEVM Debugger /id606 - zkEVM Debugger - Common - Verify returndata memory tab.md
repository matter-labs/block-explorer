---
tags: ['Common', 'Debugger', 'Full test', 'manual', 'Memory', 'regression', 'ZKF-2527', 'Active']
---

# id606 zkEVM Debugger - Common - Verify returndata memory tab

## Description
  - https://goerli.staging-scan-v2.zksync.dev/tools/debugger

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Start debugging
- Verify "returndata" tab is dispayed in case it has non zero index
- Verify "returndata" tab is not dispayed in case it has '0' index
