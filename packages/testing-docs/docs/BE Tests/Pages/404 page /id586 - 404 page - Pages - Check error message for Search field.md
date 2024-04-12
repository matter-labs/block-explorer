---
tags: ['404 page', 'Error', 'Full test', 'regression', 'Search', 'ZKF-2591', 'Active']
---

# id586 404 page - Pages - Check error message for Search field

## Description
  - https://goerli.staging-scan-v2.zksync.dev/a

## Precondition


## Scenario
- Open page https://goerli.staging-scan-v2.zksync.dev/a
- Insert non-existing hash   0x7e7f53d0a3716698db00ad03847a36439772fbf7111cfb70a5933c610ad8dc4a22
    - Press Enter/Click on Search button
- Pay attention to: input box should be highlighted in red
- Pay attention to:  "Please, enter a correct query" message to be displayed correctly with no overlapping with other elements on the page.
