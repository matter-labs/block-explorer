// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IGreeter2 {
    function callGreeter() external view returns (string memory);
    function setGreet(string memory greeting) external;
}

contract GCaller {
    address public myAddress;
    address public callAddress;
    string private defaultGreeting = "Hi from Caller";

    constructor(address _callAddress) {
        myAddress = address(this);
        callAddress = _callAddress;
    }

    function newSetGreet(string memory _greeting) external {
        bytes memory greetingBytes = bytes(_greeting);
        string memory greeting = (greetingBytes.length > 0) ? _greeting : defaultGreeting;
        IGreeter2(callAddress).setGreet(greeting);
    }

    function newCallGreeter() external view returns (string memory) {
        return IGreeter2(callAddress).callGreeter();
    }
}
