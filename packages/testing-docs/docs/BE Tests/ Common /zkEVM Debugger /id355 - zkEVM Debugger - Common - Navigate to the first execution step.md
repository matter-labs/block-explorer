---
tags: ['Common', 'Debugger', 'Full test', 'Navigation', 'Smoke test', 'ZKF-2279', 'Active']
---

# id355 zkEVM Debugger - Common - Navigate to the first execution step

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger?network=goerli-beta

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Navigate to any execution step except 1
- Click on the "Start" button left to the "Previous step" button
- Verify user navigated to the filled execution step
- Verify "Start" and "Previous step" buttons are disabled
