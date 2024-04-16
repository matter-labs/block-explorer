---
tags: ['Artifacts', 'Full test', 'manual', 'Pages', 'Transaction', 'Active']
---

# id1904 Tx page - Pages - Verify "Reason" field

## Description
- Failed transactions
  - Mainnet: /tx/0x1836670cf1d66283293c672f5354de0bf04fa6a56c54791e51749fe27e116dd5
  - Testnet: /tx/0x5b1c435d13279f31d1986b03ef4510cb96b2509ea96df2f38c9d35bb83b63eb3

## Precondition


## Scenario
- Open any tx with "Failed" status (you can use link from description)
- Open "General Info" tab
- Verify transaction has "Reason" field with failure reason value
    - Failure reason text is red
![Screenshot](../../../../static/img/Pages/Transaction%20page/id1904.png)

