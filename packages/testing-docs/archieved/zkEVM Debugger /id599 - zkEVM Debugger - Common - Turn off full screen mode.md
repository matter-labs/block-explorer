---
tags: ['Common', 'Debugger', 'Fullscreen mode', 'Full test', 'manual', 'regression', 'ZKF-2528', 'Active']
---

# id599 zkEVM Debugger - Common - Turn off full screen mode

## Description
  - https://goerli.staging-scan-v2.zksync.dev/tools/debugger

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Click "Start" button
- Full screen toggle button displayed above the metadata block
- Click full screen toggle button to turn on full screen mode
- Click full screen toggle button again to turn off full screen mode
- Verify "parent contract" and "child contract" blocks moved from right part of the screen under the "current contract" block
