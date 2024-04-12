---
tags: ['APIv1-APIv2', 'Artifacts', 'Full test', 'manual', 'Pages', 'regression', 'Tooltip', 'Transaction', 'ZKF-2448', 'ZKF-2462', 'Active']
---

# id560 Tx page - Pages - Verify informational tooltips on hover

## Description
  - https://goerli.staging-scan-v2.zksync.dev/tx/0x4efdc5ff8ce3cad95ec72d9caf8f3614225eea4f6d0afa0bd03c9114225df02a

## Precondition


## Scenario
- Informational tooltip icon reveal the next content on hover:
    - Transaction Hash
    - Transaction hash is a unique 66-character identifier that is generated whenever a transaction is executed
- Status
    - The status of the transaction.
- Reason (for failed tx)
    - The failure reason of the transaction
- Block
    - Number of the block in which the transaction is recorded.
- Batch
    - The batch index where this transaction is submitted to L1
- From
    - The sending party of the transaction.
- To
    - The receiving party of the transaction.
- Tokens Transfered
    - List of tokens transferred within this transaction.
- Input data
    - Additional data included for this transaction. Commonly used as part of contract interaction or as a message sent to the recipient.
- Value
    - Amount of Ether being transferred from one address to another within a transaction
- Fee
    - Fee which sender paid for this transaction, amount in choosen asset & price in USD at the current time
- Gas limit & used
    - Maximum amount of gas allocated for the transaction & the amount eventually used
- Gas per pubdata
    - Maximum amount of gas the user is willing to pay for a single byte of published data (pubdata)
- Nonce
    - Number of transactions sent from a sender address.
- Created
    - The date and time at which a transaction is added to the block.
- "Included" icon in "Status"
    - Included
