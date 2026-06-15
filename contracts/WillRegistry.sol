// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./WillLocker.sol";

contract WillRegistry {
    mapping(address => address[]) public userWills;
    mapping(address => address[]) public beneficiaryWills;

    event WillCreated(address indexed owner, address locker);

    function createWill(
        string calldata cid,
        address beneficiary,
        uint256 checkInInterval,
        uint256 gracePeriod
    ) external returns (address) {
        WillLocker locker = new WillLocker(
            msg.sender,
            cid,
            beneficiary,
            checkInInterval,
            gracePeriod
        );

        userWills[msg.sender].push(address(locker));
        beneficiaryWills[beneficiary].push(address(locker));

        emit WillCreated(msg.sender, address(locker));
        return address(locker);
    }

    function getMyWills() external view returns (address[] memory) {
        return userWills[msg.sender];
    }

    function getWillsAsBeneficiary() external view returns (address[] memory) {
        return beneficiaryWills[msg.sender];
    }
}
