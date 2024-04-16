---
tags: ['Full test', 'Navigation', 'Pages', 'Smoke test', 'Transaction', 'Active Partly Manual']
---

# id241 Tx page - Pages - Navigation

## Description
Test solution address/parameter
- Mainnet: /tx/0xcbeff0db1300cbb5c1e5fc18a57ae46c94962eeebed7e82bc81e553ba27d0e9a
- Testnet: /tx/0x6fc015405255af17fb38f5a1408557f5f00d094e07a2f8f6af933a889d9a3330

## Precondition


## Scenario
- Block - navigates to block page
    - block/70020
- Batch - navigates to batch page
    - batch/\<batchnumber\>
- From - link navigates to Account page
    - /address/0xF4B50fCb90b8b4412214d3f7ceDC5c6D837c9e62
- To - link navigates to Account page
    - /address/0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8
- L2 Tokens transfer navigates to Acc page
    - accounts/0xF4B50fCb90b8b4412214d3f7ceDC5c6D837c9e62
- Fee and Token pictures - navigates to contract page (Fee in ETH only)
    - /address/0x000000000000000000000000000000000000800A
![Screenshot](../../../../static/img/Pages/Transaction%20page/id241.png)
