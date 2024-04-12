---
tags: ['APIv1-APIv2', 'automated', 'Full test', 'Navigation', 'Pages', 'Smoke test', 'Transaction', 'ZKF-2601', 'Active Partly Manual']
---

# id241 Tx page - Pages - Navigation

## Description


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
