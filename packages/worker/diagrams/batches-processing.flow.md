# Process batches flow

## The following process runs for each batch state (Executed, Proven, Committed, New):

```mermaid
flowchart
  SetCurrentState("Define batches to process state (currentSate = one of executed/proven/committed/new)") --> DeclareLastProcessedBatchNumberVar(Declare lastProcessedBatchNumber variable = NULL)
  DeclareLastProcessedBatchNumberVar --> CheckIfLastProcessedBatchNumberIsNull{lastProcessedBatchNumber == NULL ?}
  CheckIfLastProcessedBatchNumberIsNull --> |Yes| GetLastBatchFromDB(Get last batch number with state == currentState from DB)
  GetLastBatchFromDB --> SetLastDBBatch(Set lastProcessedBatchNumber variable with last batch number from DB)
  CheckIfLastProcessedBatchNumberIsNull --> |No| GetNextBatchFromBlockchain
  SetLastDBBatch --> GetNextBatchFromBlockchain("Get the next batch from blockchain (lastProcessedBatchNumber + 1)")
  GetNextBatchFromBlockchain --> CheckIfRequestSuccessful{Is request sucessful ?}
  CheckIfRequestSuccessful --> |No| ResetLastDBBatch(Set lastProcessedBatchNumber = NULL)
  CheckIfRequestSuccessful --> |Yes| CheckIfBatchExists{Does the next batch exist ?}
  CheckIfBatchExists --> |No| ResetLastDBBatch(Set lastProcessedBatchNumber = NULL)
  ResetLastDBBatch --> WaitFor1Minute(Wait for 1 minute)
  WaitFor1Minute --> CheckIfLastProcessedBatchNumberIsNull
  CheckIfBatchExists --> |Yes| CheckIfNextBatchHasTheSameState{Is the next batch state equal to currentState ?}
  CheckIfNextBatchHasTheSameState --> |No| ResetLastDBBatch
  CheckIfNextBatchHasTheSameState --> |Yes| UpsertBatchInDB(Instert or update the next batch in DB)
  UpsertBatchInDB --> IncrementLastProcessedDBBatchNumber(Set lastProcessedBatchNumber = lastProcessedBatchNumber + 1)
  IncrementLastProcessedDBBatchNumber --> CheckIfLastProcessedBatchNumberIsNull
```

### Batch state definition
Batch state is defined and used only internally. There are 4 batch states: `Executed`, `Proven`, `Committed` and `New`.
- `Executed` - batch has `executeTxHash` and `executedAt`.
- `Proven` - batch has `proveTxHash` and `provenAt`.
- `Committed` - batch has `commitTxHash` and `committedAt`.
- `New` - batch does't have any of `executeTxHash`, `proveTxHash` or `commitTxHash`.

Note, each `Executed` batch is also `Proven` and `Committed`, each `Proven` batch is also `Committed`.
