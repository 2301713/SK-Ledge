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
        string recordType; // "Allocation", "Expense", or "Award"
        bool approved;
        address approvedBy;
    }

    FinancialRecord[] public records;

    mapping(address => bool) public isAuthorizedOfficial;

    // Allocation ceiling per barangay
    mapping(string => uint256) public allocationCeilings;

    // Running total of allocations per barangay
    mapping(string => uint256) private allocatedTotals;

    // Events
    event RecordAdded(
        uint256 indexed id,
        address indexed official,
        string barangay,
        uint256 amount,
        uint256 timestamp,
        string recordType
    );

    event OfficialAuthorizationChanged(
        address indexed official,
        bool isAuthorized
    );

    event AllocationCeilingChanged(
        string barangay,
        uint256 ceiling
    );

    event ApprovalChanged(
        uint256 indexed id,
        bool approved,
        address indexed approvedBy
    );

    // Modifiers
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "SkLedge: Only the contract owner can perform this action."
        );
        _;
    }

    modifier onlyAuthorizedOfficial() {
        require(
            isAuthorizedOfficial[msg.sender],
            "SkLedge: Your wallet is not an authorized SK Official."
        );
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
    function setOfficialAuthorization(
        address _official,
        bool _status
    ) external onlyOwner {
        require(
            _official != address(0),
            "SkLedge: Invalid wallet address"
        );

        isAuthorizedOfficial[_official] = _status;

        emit OfficialAuthorizationChanged(
            _official,
            _status
        );
    }

    /**
     * @notice Sets the maximum allocation ceiling for a barangay.
     * @param _barangay Barangay name.
     * @param _ceiling Maximum allowed allocation amount.
     */
    function setAllocationCeiling(
        string calldata _barangay,
        uint256 _ceiling
    ) external onlyOwner {
        require(
            bytes(_barangay).length > 0,
            "SkLedge: Invalid barangay"
        );

        require(
            _ceiling > 0,
            "SkLedge: Ceiling must be greater than zero"
        );

        allocationCeilings[_barangay] = _ceiling;

        emit AllocationCeilingChanged(
            _barangay,
            _ceiling
        );
    }

    /**
     * @notice Returns the total allocated amount for a barangay.
     * @param _barangay Barangay name.
     */
    function getAllocated(
        string calldata _barangay
    ) external view returns (uint256) {
        return allocatedTotals[_barangay];
    }

    /**
     * @notice Adds a new financial record to the blockchain.
     * @param _barangay Barangay name.
     * @param _amount Amount of the transaction.
     * @param _purpose Purpose of the transaction.
     * @param _recordType Transaction type ("Allocation", "Expense", or "Award").
     */
    function addRecord(
        string calldata _barangay,
        uint256 _amount,
        string calldata _purpose,
        string calldata _recordType
    ) external onlyAuthorizedOfficial {
        require(
            _amount > 0,
            "SkLedge: Amount must be greater than zero"
        );

        bytes32 typeHash = keccak256(
            abi.encodePacked(_recordType)
        );

        require(
            typeHash == keccak256(abi.encodePacked("Allocation")) ||
                typeHash == keccak256(abi.encodePacked("Expense")) ||
                typeHash == keccak256(abi.encodePacked("Award")),
            "SkLedge: Type must be 'Allocation', 'Expense', or 'Award'"
        );

        // Enforce the allocation ceiling for Allocation records when one is set.
        if (
            typeHash == keccak256(
                abi.encodePacked("Allocation")
            )
        ) {
            uint256 ceiling = allocationCeilings[_barangay];

            if (ceiling > 0) {
                require(
                    allocatedTotals[_barangay] + _amount <= ceiling,
                    "SkLedge: Allocation exceeds ceiling"
                );
            }

            allocatedTotals[_barangay] += _amount;
        }

        records.push(
            FinancialRecord({
                id: nextRecordId,
                official: msg.sender,
                barangay: _barangay,
                amount: _amount,
                timestamp: block.timestamp,
                purpose: _purpose,
                recordType: _recordType,
                approved: false,
                approvedBy: address(0)
            })
        );

        emit RecordAdded(
            nextRecordId,
            msg.sender,
            _barangay,
            _amount,
            block.timestamp,
            _recordType
        );

        nextRecordId++;
    }

    /**
     * @notice Approves or rejects a financial record.
     * @param _id Record ID.
     * @param _approved True to approve, false to remove approval.
     */
    function setRecordApproval(
        uint256 _id,
        bool _approved
    ) external onlyOwner {
        require(
            _id > 0 && _id < nextRecordId,
            "SkLedge: Record does not exist"
        );

        FinancialRecord storage record = records[_id - 1];

        record.approved = _approved;

        if (_approved) {
            record.approvedBy = msg.sender;
        } else {
            record.approvedBy = address(0);
        }

        emit ApprovalChanged(
            _id,
            _approved,
            record.approvedBy
        );
    }

    /**
     * @notice Helper getter to return all records.
     */
    function getAllRecords()
        external
        view
        returns (FinancialRecord[] memory)
    {
        return records;
    }
}