---
tags: ['Artifacts', 'EUXP-3218', 'Fee', 'Full test', 'Pages', 'Smoke test', 'Transaction', 'Active']
---

# id883 Tx page - Pages - Verify Fee expanding/collapsing

## Description
  - https://staging-scan-v2.zksync.dev/tx/0x5327dbed82ee124bf4f95ca3ba37ea7228295fba5261d62f8d2b83456e4c83a0

## Precondition


## Scenario
- Click on "More Details" button of the "Fee" field
- Verify additional fee data (Initial, Refunded, Refunds) displayed
- "More Details" button changed to "Close Details"
- Verify the fee data displayed after expanding
- Click on "Close Details" button of the "Fee" field
- Verify additional fee data collapsed
- "Close Details" button changed to "More Details"
