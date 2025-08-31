// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import "./Test.sol";

// Mock forge-std Script contract for compilation
contract Script {
    // VM interface for scripting
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    
    // Script entry point
    function run() public virtual {}
}
