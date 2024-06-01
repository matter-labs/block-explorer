// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IGreeter {
    function greet() external view returns (string memory);
    function setGreeting(string memory) external;
}

contract Middle {
    address public myAddress;

    constructor(address _myAddress) {
        myAddress = _myAddress;
    }

    function setGreet(string memory newGreeting) external {
        IGreeter(myAddress).setGreeting(newGreeting);
    }

    function callGreeter() external view returns (string memory) {
        return IGreeter(myAddress).greet();
    }
}
