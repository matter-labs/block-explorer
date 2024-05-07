---
tags: ['Common', 'Debugger', 'Full test', 'manual', 'regression', 'ZKF-2698', 'Active']
---

# id647 zkEVM Debugger - Common - Verify HEX to Decimals switcher changes format of data

## Description
  - https://staging-scan-v2.zksync.dev/tools/debugger?network=goerli-beta

## Precondition


## Scenario
- Open Debugger
- Upload JSON file (example is attached)
    - Information in Current Contract, Parent, Child components are shown in HEX format
- HEX to Decimals switcher is present
- HEX to Decimals switcher is active and clickable
- Press on HEX to Decimals switcher and choose Decimal format
    - Information in Current Contract is presented in DEC format
- Information in Parent tab is presented in DEC format
- Information in Child tab is presented in DEC format
- Press on HEX to Decimals switcher and choose HEX format
    - Information in Current Contract is presented in DEC format
- Information in Parent tab is presented in DEC format
- Information in Child tab is presented in DEC format
