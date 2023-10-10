//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract L1 is ERC20 {
    uint256 constant _initial_supply = 1000 * (10 ** 18);

    constructor(address _recipient) public ERC20("L1 ERC20 token", "L1") {
        _mint(_recipient, _initial_supply);
    }
}