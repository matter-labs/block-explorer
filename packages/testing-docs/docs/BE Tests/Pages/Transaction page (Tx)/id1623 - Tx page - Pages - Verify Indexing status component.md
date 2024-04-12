---
tags: ['Full test', 'manual', 'Pages', 'Transaction', 'Active']
---

# id1623 Tx page - Pages - Verify "Indexing" status component

## Description
  - Open any newly made tx (Indexer has to have a delay to see this status)
  - Indexing status displayed only on UI when no tx in API but exists in blockchain

## Precondition


## Scenario
- Open any tx with "Indexing" status (you can use info from description)
- Open "General Info" tab
- Verify transaction has "Verified" value in "Status" field
    - Icon is grey
- Loading mark shown before "Indexing" text
- Text - "Indexing"
- Tooltip icon is shown after "Indexing"
