---
tags: ['Child/Parent block', 'Common', 'Debugger', 'Full test', 'manual', 'regression', 'ZKF-2467', 'Active']
---

# id611 zkEVM Debugger - Common - Verify Parent block functionality in Debugger (Parent&Child is present)

## Description
  - https://goerli.explorer.zksync.io/
  - Check that user can navigate to Parent Smart Contract (SC).
  - For checking this issue you can use trace file attached to the test case.
  - A small explanation for the step 3. Why do we choose exactly command line # 22?
  - Explanation:
  - It's the first number of the Child SC (second one that was initiated by the parent one).

## Precondition


## Scenario
- Open zkEVM Debugger page (https://goerli.explorer.zksync.io/tools/debugger)
- Drag and drop or download file attached in the test case (ZKF-2467 test file.json)
- Enter "Execution step" value 22 and press Enter
    - Appropriate command line is opened
- Child block information should display information about Child SC
    - Tab title  should show contract address + label Child
- Tab address has a link to SC
- Info on the tab shows return data of current contract (child)
- Parent  block information should display information about Parent SC
    - Tab title  should show contract address + label Parent
- Tab address has a link to SC
- Tab address redirects to this SC inside of the block explorer
- Parent tab is opened automatically
- Info on the tab shows return data of current contract (parent)
