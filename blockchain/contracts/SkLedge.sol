// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Contract
contract SkLedge {
  address public owner;
  uint256 public nextRecordId;

  struct FinancialRecord {
    uint256 id;
    address official;
    string barangay;
    uint256 amount;
    uint256 timestamp;
    string purpose;
    string recordType; // Either for Allocation or for Expense
  }

  FinancialRecord[] public records;

  mapping (address => bool) public isAuthorizedOfficial;

  // Events
  event RecordAdded(
    uint256 indexed id,
    address indexed official,
    string barangay,
    uint256 amount,
    uint256 timestamp,
    string recordType
  );

  event OfficialAuthorizationChanged(address indexed official, bool isAuthorized);

  // Modifiers
  modifier onlyOwner() {
    require(msg.sender == owner, "SkLedge: Only the contract owner can perform this action.");
    _;
  }

  modifier onlyAuthorizedOfficial() {
    require(isAuthorizedOfficial[msg.sender], "SkLedge: Your wallet is not an authorized SK Official.");
    _;
  }

  constructor() {
    owner = msg.sender;
    isAuthorizedOfficial[msg.sender] = true;
    nextRecordId = 1;
  }
  
  /**
  * @notice Authorizes or revokes SK Official wallets.
  * @param _official Wallet address of the SK Official.
  * @param _status True = authorize, False = revoke.
  */
  function setOfficialAuthorization(address _official, bool _status) external onlyOwner {
    require(_official != address(0), "SkLedge: Invalid wallet address");
    isAuthorizedOfficial[_official] = _status;
    emit OfficialAuthorizationChanged(_official, _status);
  }

  /**
    * @notice Adds a new financial record to the blockchain.
    * @param _barangay Barangay name.
    * @param _amount Amount of the transaction.
    * @param _purpose Purpose of the transaction.
    * @param _recordType Transaction type ("Allocation" or "Expense").
  */
  function addRecord(
    string calldata _barangay,
    uint256 _amount,
    string calldata _purpose,
    string calldata _recordType
  ) external onlyAuthorizedOfficial {
    require(_amount > 0, "SkLedge: Amount must be greater than zero");

    bytes32 typeHash = keccak256(abi.encodePacked(_recordType));
    require(
      typeHash == keccak256(abi.encodePacked("Allocation")) ||
      typeHash == keccak256(abi.encodePacked("Expense")),
      "SkLedge: Type must be 'Allocation' or 'Expense'"
    );

    records.push(FinancialRecord({
      id: nextRecordId,
      official: msg.sender,
      barangay: _barangay,
      amount: _amount,
      timestamp: block.timestamp,
      purpose: _purpose,
      recordType: _recordType
    }));

    emit RecordAdded(nextRecordId, msg.sender, _barangay, _amount, block.timestamp, _recordType);

    nextRecordId++;
  }

  /**
    * @notice Helper getter to return all records.
  */
  function getAllRecords() external view returns (FinancialRecord[] memory) {
    return records; 
  }
}