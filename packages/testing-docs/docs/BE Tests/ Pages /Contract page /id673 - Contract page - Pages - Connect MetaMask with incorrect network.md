---
tags: ['ABI', 'Contract', 'Full test', 'MetaMask', 'Pages', 'regression', 'ZKF-2661', 'Active']
---

# id673 Contract page - Pages - Connect MetaMask with incorrect network

## Description
  - https://staging-scan-v2.zksync.dev/address/contract_address
  - * Prerequisites: (you can use https://github.com/JackHamer09/zkSync-2.0-Hardhat-example guide) or search for 0x772ab24587013a106e08f3868ef18361c8f3a4da contract
  - * upload your own contract for token with methods
  - verify this contract
  - * you need to have MetaMask with Mainnet network only

## Precondition


## Scenario
- Open Contract's page
- Click on the "Contract" tab
- Click "Connect MetaMask" button
- MetaMask message for adding a network shown
- MetaMask message for switching a network shown
- Verify MetaMask wallet switched to correct testnet network from Mainnet
- Verify appropriate testnet network added in MetaMask (open MetaMask network list to check)
- Verify wallet is connected
- "Connect Metamask" label changed to the wallet address
