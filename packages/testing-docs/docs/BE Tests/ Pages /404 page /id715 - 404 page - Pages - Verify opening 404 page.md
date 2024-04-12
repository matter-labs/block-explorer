---
tags: ['404 page', 'Error', 'Full test', 'regression', 'Search', 'Active']
---

# id715 404 page - Pages - Verify opening 404 page

## Description
  - Check error message after inserting random (not existing) hash to search field.
  - For example: 0x7e7f53d0a3716698db00ad03847a36439772fbf7111cfb70a5933c610ad8dc4a

## Precondition


## Scenario
- Open page https://goerli.staging-scan-v2.zksync.dev/
    - Instert non-existing hash to Search field 0x7e7f53d0a3716698db00ad03847a36439772fbf7111cfb70a5933c610ad8dc4a
- Press on Enter/Click on Search button
- You will see "Oops, we can’t find anything" page
