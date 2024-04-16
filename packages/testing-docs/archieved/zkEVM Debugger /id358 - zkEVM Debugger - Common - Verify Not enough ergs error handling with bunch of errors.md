---
tags: ['Common', 'Debugger', 'Error', 'Full test', 'regression', 'ZKF-2263', 'Active']
---

# id358 zkEVM Debugger - Common - Verify "Not enough ergs" error handling with bunch of errors

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger?network=goerli-beta

## Precondition


## Scenario
- Open Debugger
- Upload JSON trace file bunch of "Not enough ergs" values for "error" parameter
- Verify user can see visualization of the problem near the execution steps ("Not enough ergs" error messages)
