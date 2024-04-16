---
tags: ['Error', 'Full test', 'Pages', 'regression', 'ZKF-2235', 'Active']
---

# id376 Error page - Pages - Verify Error page enabling for Address page

## Description
  - I am on https://staging-scan-v2.zksync.dev/address/address_hash page

## Precondition


## Scenario
- Open Dev Tools
- Emulate an error when receiving the address request
                - (e.g. block address request in Dev Tools when loading "Address" page)
    - Verify "Something went wrong" error shown on Address page
![Screenshot](../../../../static/img/Pages/ErrorPage/id376_1.png)