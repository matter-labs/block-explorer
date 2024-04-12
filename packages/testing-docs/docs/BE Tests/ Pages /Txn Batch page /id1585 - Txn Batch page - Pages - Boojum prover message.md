---
tags: ['APIv1-APIv2', 'Artifacts', 'Full test', 'Pages', 'Redirection', 'regression', 'Txn Batch', 'UEXP-4106', 'Active']
---

# id1585 Txn Batch page - Pages - Boojum prover message

## Description
  - Testnet: /98717
  - Mainnet: /74249

## Precondition


## Scenario
- Txn Batch table contains all the general fields except:
    - Prove Tx hash
    - Message
    - This transaction was also proved with our upcoming new prover, Boojum. Want to learn more and verify yourself? Check here.
- "Check here" is a link
- Verify "Check here" link redirects to Github page
    - https://github.com/matter-labs/era-boojum-validator-cli
