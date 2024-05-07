---
tags: ['Full test', 'regression', 'Search', 'Active']
---

# id300 Fields - Case sensitive search

## Description
  - https://sepolia.explorer.zksync.io/address/0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6
  - https://sepolia.explorer.zksync.io/address/0x8f0f33583a56908f7f933cd6f0aae382ac3fd8f6

## Precondition


## Scenario
- Use address with uppercase  0x8f0F33583a56908F7F933cd6F0AaE382aC3fd8f6
  - Search works well
  - Direction of the transaction is correct
- Use address with lowercase 0x8f0f33583a56908f7f933cd6f0aae382ac3fd8f6
  - Search works well
  - All fields are the same as for uppercase search
![id300](../../../static/img/Fields/id300.png)
