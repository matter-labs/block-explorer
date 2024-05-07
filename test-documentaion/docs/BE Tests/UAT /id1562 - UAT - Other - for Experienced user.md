---
tags: ['UAT', 'Active']
---

# id1562 UAT - Other - for Experienced user

## Description
  - Experienced user test cases (user type - Developer)
  - In this part we will focus on the areas of Block Explorer which require interaction from user (like connecting MetaMask wallet for adding data to contracts via ABI, verifying smart contracts and working with Debugger tool)

## Precondition


## Scenario
- Smart Contract verification page can be reached via navigation menu
- User gets the explanation of the mechanism of Smart Contract verification (SCV) flow (what is the purpose of it and what data required for verification)
- User can proceed with using Debugger with slow 3G internet connection
- User can proceed with Smart Contract verification (SCV) flow with slow 3G internet connection
- User gets an informative error message in case of losing internet connection
- All the fields for SCV has names/placeholder/text explaining what inputs can be accepted
- Additional Docs/Github links available for user to simplify/speed up interaction process
- User gets a clear notification about SCV process completing/further steps
- Debugger tool currently can be reached via direct link only \{env_link/tools/debugger\}
- Debugger tool accepts only specific trace JSON files
- In case uploaded JSON file can’t be parsed user receives appropriate error notification
- User can upload JSON trace file in any state of debugger (no matter if he already inspecting any file or just has empty state with no file uploaded)
- User has all the necessary toolkit for interacting with JSON trace file
  - Instruction list
  - Search
  - Step counter/navigation
  - Memory state etc.
- User can switch between data types available
- User has a possibility to use full screen/collapsed modes
- User can interact with Debugger via buttons to keyboard hotkeys (commands highlighted)
- User can get a state of parent/child contracts memory state
- Errors for instruction list displayed correctly (in case they mentioned in JSON file)
- User can interact with “Contract” tab of verified contracts
- “Read” ABI methods of verified contracts can be called by any users
- Contract owner user can interact with “Write” ABI methods after connecting his MetaMask wallet (appropriate instructions for it available in ABI design)
- User is notified about state of his MetaMask wallet when using ABI contract methods
- Balance state of searched account is displayed on “Account” page
- User can get list of all events for specific contract address (“Events” tab of  “Account” page)
- User can get “Logs” for each transaction with all the internal parameters
