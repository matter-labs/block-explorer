---
tags: ['Child/Parent block', 'Common', 'Debugger', 'Full test', 'manual', 'regression', 'ZKF-2467', 'Active']
---

# id612 zkEVM Debugger - Common - Verify Parent block functionality in Debugger (no Child block)

## Description
  - https://goerli.explorer.zksync.io/
  - Check that user can navigate to Parent Smart Contract (SC).
  - For checking this issue you can use trace file attached to the test case.
  - A small explanation for the step 3. Why do we choose exactly the last command line?
  - Explanation:
  - It's the command line of the last SC  in the sequence (it will not have Child SC).

## Precondition


## Scenario
- Open zkEVM Debugger page (https://goerli.explorer.zksync.io/tools/debugger)
- Drag and drop or download file attached in the test case (ZKF-2467 test file.json)
- Click on the "End" button right to the "Next step" button
    - Last command line is opened
- Parent block information should display information about Parent SC
    - Tab title  should show contract address + label Parent
- Info on the tab shows return data of current contract (parent)
- Parent tab is opened automatically
- No Child tab is displayed
