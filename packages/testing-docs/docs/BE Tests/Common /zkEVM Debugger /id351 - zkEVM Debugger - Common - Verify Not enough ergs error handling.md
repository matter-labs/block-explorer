---
tags: ['Debugger', 'Error', 'Full test', 'regression', 'ZKF-2263', 'Active']
---

# id351 zkEVM Debugger - Common - Verify "Not enough ergs" error handling

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger?network=goerli-beta

## Precondition


## Scenario
- Open Debugger
- Upload JSON trace file with execution error
- Verify user can see visualization of the problem near the execution step ("Not enough ergs" error message)
