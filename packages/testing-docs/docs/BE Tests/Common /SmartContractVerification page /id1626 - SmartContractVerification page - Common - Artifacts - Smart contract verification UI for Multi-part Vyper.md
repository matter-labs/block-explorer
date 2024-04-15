---
tags: ['Artifacts', 'Full test', 'Multi-contract', 'Smart Contract Verification page', 'Smoke test', 'Vyper', 'Active']
---

# id1626 SmartContractVerification page - Common - Artifacts - Smart contract verification (UI for Multi-part Vyper)

## Description
  - https://goerli.explorer.zksync.io/contracts/verify
  - Select "Vyper (Multi-part contract)" in "Compiler type" dropdown

## Precondition


## Scenario
- SCV interface:
- Notification
    - You can also verify your smart-contract using HardHat Plugin
- Link - "HardHat Plugin"
- "Contract Address" headline
    - Contract address field
    - Placeholder - "0x0000..."
- Text - "The 0x address supplied on contract creation."
- "Compilation Info" headline
    - "Compiler type" dropdown
    - Text - "Contract verification method"
- "Zkvyper version" dropdown
    - "Details" link
- "Vyper version" dropdown
- Optimization
    - "Yes" radiobutton (enabled by default)
- "No" radiobutton
- Text - "If you enabled optimization during compilation, select yes."
- "Contract info" headline
    - "Contract Name" field
    - Placeholder: "Name"
- Text under the field
    - Must match the filename. For example, in contract MyContract.vy MyContract is the contract name.
- Text: "Please select the Vyper (*.vy) files for upload"
- "Choose Files" button
    - If files were added:
- "You Files" text
- Numeric list with added contracts
- Name of the contract file
- Bin logo each added contract
- "Constructor Arguments"
    - "0x" Placeholder
- "Verify Smart Contract" button
- Clear button
