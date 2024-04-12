---
tags: ['Common', 'Debugger', 'Fullscreen mode', 'Full test', 'manual', 'regression', 'ZKF-2528', 'Active']
---

# id602 zkEVM Debugger - Common - Verify full screen mode for different screen resolutions

## Description
  - https://goerli.staging-scan-v2.zksync.dev/tools/debugger

## Precondition


## Scenario
- Open Debugger
- Upload JSON
- Click "Start" button
- Click full screen toggle button
- For 1920+ screen resolution
    - Verify instructions list, "current contract" and "parent contract"/"child contract" blocks shown in 3 columns with equal width
- 3 columns have equal width
- For less than 1920 screen resolution
    - Verify instructions list, "current contract" and "parent contract"&"child contract" blocks shown in 2 columns
- 3 columns have width 1/3 vs 2/3
- Verify each column has separate scroll
