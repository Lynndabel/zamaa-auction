// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

// Mock forge-std Test contract for compilation
contract Test {
    // VM interface for testing
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    
    // Assertions
    function assertTrue(bool condition) internal pure {
        require(condition, "Assertion failed");
    }
    
    function assertEq(uint256 a, uint256 b) internal pure {
        require(a == b, "Values not equal");
    }
    
    function assertEq(address a, address b) internal pure {
        require(a == b, "Addresses not equal");
    }
    
    // Setup function to be overridden
    function setUp() public virtual {}
}

// Mock VM interface
interface Vm {
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function deal(address, uint256) external;
    function warp(uint256) external;
    function expectRevert(string memory) external;
    function createSelectFork(string memory) external returns (uint256);
    function startBroadcast(uint256) external;
    function stopBroadcast() external;
    function envUint(string memory) external returns (uint256);
    function toString(address) external returns (string memory);
    function toString(uint256) external returns (string memory);
    function writeFile(string memory, string memory) external;
}

// Mock console for logging
library console {
    function log(string memory) internal view {}
    function log(string memory, address) internal view {}
    function log(string memory, uint256) internal view {}
}
