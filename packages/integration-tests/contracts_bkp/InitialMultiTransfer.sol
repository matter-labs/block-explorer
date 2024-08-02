// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v4.6.0

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;


contract TokenF2L2 {
    // Declare the using directive on the contract scope
    using SafeERC20 for IERC20;
    using Address for address payable;

    //Be able to receive any funds to the contract
    receive() external payable {
        pay();
    }

    function pay() public payable {
        emit Paid(msg.sender, msg.value, block.timestamp);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    event Paid(address indexed _from, uint _amount, uint _timestamp);

    modifier onlyOwner() {
        require(owner == msg.sender, "You are not the owner");
        _; // continue
    }

    function multiTransfer(
        address[] memory _recivers,
        address[] memory _tokenAddresses,
        uint256[] memory _tokenAmounts
    ) public payable onlyOwner {
        // Check that the length of the tokenAddresses array is equal to the length of the tokenAmounts array
        require(_tokenAddresses.length == _tokenAmounts.length, "Arrays must have the same length");
        require(_tokenAddresses.length == _recivers.length, "Arrays must have the same length");

        // Iterate over the arrays and transfer the specified amount of each token
        for (uint i = 0; i < _tokenAddresses.length; i++) {
            if (_tokenAddresses[i] == address(0)) {
                payable(_recivers[i]).sendValue(_tokenAmounts[i]);
            } else {
                // Cast the token address to an IERC20 contract to access its safeTransfer function
                IERC20 token = IERC20(_tokenAddresses[i]);

                // Attempt to transfer the specified amount of the token
                token.safeTransfer(_recivers[i], _tokenAmounts[i]);
            }
        }
    }
}