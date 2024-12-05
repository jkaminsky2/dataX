// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SendETH {
    address public recipient = 0xaBeFD60715851dC3a951b7e590B5D2096D42c26B;

    constructor() payable {}
    function sendETH(uint256 amount) public payable {
      
        require(msg.value >= amount, "Insufficient balance sent by the sender.");

        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Transfer failed.");

        uint256 excess = msg.value - amount;
        if (excess > 0) {
            payable(msg.sender).transfer(excess); 
        }
    }

    receive() external payable {}
}
