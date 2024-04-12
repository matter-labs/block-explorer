---
tags: ['Account', 'APIv1-APIv2', 'automated', 'Full test', 'Navigation', 'Automated']
---

# id259 Acc page - Pages - Navigation

## Description
  - Input an account address to the search field, f.e. 0x851df0eDcc4109C7E620d0AAdFDB99348821EB79
  - url: https://staging-scan-v2.zksync.dev/address/0x851df0eDcc4109C7E620d0AAdFDB99348821EB79

## Precondition


## Scenario
- Links navigates user:
    - TX Hash -\> to Transaction
    - https://goerli.explorer.zksync.io/tx/0x629465e041109e49f67835501371219c17a60f721c460eead0acbbc8c72509eb
- From hash -\> to Account (internal link)
    - https://goerli.etherscan.io/address/0x851df0eDcc4109C7E620d0AAdFDB99348821EB79
- To hash -\> to Account (internal link)
    - https://goerli.explorer.zksync.io/address/0x851df0eDcc4109C7E620d0AAdFDB99348821EB79
- Fee -\> to Contract page
    - https://goerli.explorer.zksync.io/address/0x000000000000000000000000000000000000800A
- Value - \> Contract page
    - https://goerli.explorer.zksync.io/address/0x000000000000000000000000000000000000800A
