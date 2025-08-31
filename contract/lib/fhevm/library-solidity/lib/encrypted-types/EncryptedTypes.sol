// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

// Minimal encrypted type definitions to satisfy TFHE library imports.
// These are user-defined value types wrapping bytes32 handles managed by the coprocessor.
// The TFHE library provides functions operating on these types.

// Encrypted booleans and integers
type ebool is bytes32;
type euint8 is bytes32;
type euint16 is bytes32;
type euint32 is bytes32;
type euint64 is bytes32;
type euint128 is bytes32;
type euint256 is bytes32;

// Encrypted address
type eaddress is bytes32;

// External input handle types (ciphertext handles provided by client with proofs)
type externalEbool is bytes32;
type externalEuint8 is bytes32;
type externalEuint16 is bytes32;
type externalEuint32 is bytes32;
type externalEuint64 is bytes32;
type externalEuint128 is bytes32;
type externalEuint256 is bytes32;
type externalEaddress is bytes32;
