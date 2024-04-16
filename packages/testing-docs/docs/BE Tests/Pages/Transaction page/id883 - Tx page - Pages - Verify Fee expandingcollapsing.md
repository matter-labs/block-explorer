---
tags: ['Artifacts', 'Fee', 'Full test', 'Pages', 'Smoke test', 'Transaction', 'Active']
---

# id883 Tx page - Pages - Verify Fee expanding/collapsing

## Description
  - https://sepolia.explorer.zksync.io/tx/0x1587ac7944057de67b6c4825a7b56fdc1fdaaf99c7227d4e3aac296a9b8dcf77

## Precondition


## Scenario
- Click on "More Details" button of the "Fee" field
- Verify additional fee data (Initial, Refunded, Refunds) displayed
- "More Details" button changed to "Close Details"
- Verify the fee data displayed after expanding
![Screenshot](../../../../static/img/Pages/Transaction%20page/id883_1.png)
- Click on "Close Details" button of the "Fee" field
- Verify additional fee data collapsed
- "Close Details" button changed to "More Details"
![Screenshot](../../../../static/img/Pages/Transaction%20page/id883_2.png)