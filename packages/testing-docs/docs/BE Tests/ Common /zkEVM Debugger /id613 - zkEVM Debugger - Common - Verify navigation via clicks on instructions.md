---
tags: ['Common', 'Debugger', 'Full test', 'manual', 'Navigation', 'Smoke test', 'ZKF-2464', 'Active']
---

# id613 zkEVM Debugger - Common - Verify navigation via clicks on instructions

## Description
  - https://goerli.staging-scan-v2.zksync.dev/

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Click "Start" to start debugging
- Click on any highlighted instruction line from the list
- Verify the execution step is opened
- Verify the memory block displayed for opened execution step
- Verify correct value set in "execution step" field after clicking on instruction line
- Verify user can't click on not highlighted lines
