// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
// Monad is not an OP Stack chain: deploy EAS and SchemaRegistry explicitly.
import {EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {SchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
