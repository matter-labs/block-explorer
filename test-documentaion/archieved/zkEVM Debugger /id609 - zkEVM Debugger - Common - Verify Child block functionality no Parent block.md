---
tags: ['Child/Parent block', 'Common', 'Debugger', 'Full test', 'manual', 'regression', 'ZKF-2467', 'Active']
---

# id609 zkEVM Debugger - Common - Verify Child block functionality (no Parent block)

## Description
  - https://goerli.explorer.zksync.io/
  - Check that user can navigate to Parent Smart Contract (SC).
  - For checking this issue you can use trace file attached to the test case.
  - A small explanation for the step 3. Why do we choose exactly command line # 21?
  - Explanation:
  - It's the last number of the parent SC (first one that initiated full sequence) and next line (line 22) will be the first command line of next SC (Child one).

## Precondition


## Scenario
- Open zkEVM Debugger page (https://goerli.explorer.zksync.io/tools/debugger)
- Drag and drop or download file attached in the test case (ZKF-2467 test file.json)
    - Information about JSON file is displayed
- Enter "Execution step" value 21 and press Enter
    - Appropriate command line is opened
- Child block information should display information about Child SC
    - Tab title  should show contract address + label Child
- Tab address has a link to SC
- Info on the tab shows return data of current contract (child)
- Child block is automatically opened
- No Parent tab is displayed
