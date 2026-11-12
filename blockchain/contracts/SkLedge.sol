// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Contract
contract SkLedge {
    uint256 private constant MAX_CANONICAL_BARANGAYS_PER_BATCH = 20;
    uint256 public constant MAX_BARANGAY_NAME_BYTES = 64;
    uint256 public constant MAX_PURPOSE_BYTES = 256;
    uint256 public constant MAX_VOID_REASON_BYTES = 256;

    error StringEmpty();
    error BarangayNameTooLong(uint256 length, uint256 max);
    error PurposeTooLong(uint256 length, uint256 max);
    error VoidReasonTooLong(uint256 length, uint256 max);

    address public owner;
    address public pendingOwner;
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
        bool voided;
        string voidReason;
        uint256 predecessorId;
        bool superseded;
    }

    FinancialRecord[] public records;

    mapping(address => bool) public isAuthorizedOfficial;
    mapping(address => bool) public isApprover;
    mapping(address => mapping(uint256 => bool))
        private officialBarangayAuthorizationById;

    string[] private canonicalBarangayNames;
    mapping(bytes32 => uint256) private canonicalBarangayIds;

    // Allocation ceiling per barangay
    mapping(uint256 => uint256) private allocationCeilingsById;

    // Running total of allocations per barangay
    mapping(uint256 => uint256) private allocatedTotalsById;

    // True when a barangay is locked after record approval
    mapping(uint256 => bool) private barangayLockedById;
    mapping(uint256 => uint256) private successorById;
    mapping(uint256 => bool) private correctionRejectedById;

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

    event OfficialBarangayAuthorizationChanged(
        address indexed official,
        uint256 indexed barangayId,
        string barangay,
        bool isAuthorized
    );

    event ApproverAuthorizationChanged(
        address indexed approver,
        bool isApproved
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

    event RecordVoided(
        uint256 indexed id,
        address indexed voidedBy,
        string reason
    );

    event RecordCorrectionSubmitted(
        uint256 indexed predecessorId,
        uint256 indexed correctionId,
        address indexed official
    );

    event RecordCorrectionActivated(
        uint256 indexed predecessorId,
        uint256 indexed correctionId
    );

    event BarangayLocked(string barangay, bool locked);
    event CanonicalBarangayRegistered(string barangay);

    // Ownership Transfer Events
    event OwnershipTransferStarted(
        address indexed previousOwner,
        address indexed newOwner
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event OwnershipTransferCanceled(
        address indexed currentOwner,
        address indexed canceledNominee
    );

    // Modifiers
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "SkLedge: Only the contract owner can perform this action."
        );
        _;
    }

    modifier onlyOwnerOrApprover() {
        require(
            msg.sender == owner || isApprover[msg.sender],
            "SkLedge: Only the contract owner or an authorized approver can perform this action."
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
     * @notice Step 1: Nominates a new owner. Callable only by the current owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(
            newOwner != address(0),
            "SkLedge: Cannot nominate zero address"
        );
        require(newOwner != owner, "SkLedge: Already the owner");

        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /**
     * @notice Step 2: Accepts the ownership transfer. Callable only by the pendingOwner.
     */
    function acceptOwnership() external {
        require(
            msg.sender == pendingOwner,
            "SkLedge: Caller is not the pending owner"
        );

        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferred(oldOwner, owner);
    }

    /**
     * @notice Cancels a pending ownership transfer. Callable only by the current owner.
     */
    function cancelOwnershipTransfer() external onlyOwner {
        require(
            pendingOwner != address(0),
            "SkLedge: No pending ownership transfer"
        );

        address canceledNominee = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferCanceled(owner, canceledNominee);
    }

    function _validateBarangayName(string calldata _name) internal pure {
        uint256 len = bytes(_name).length;
        if (len == 0) revert StringEmpty();
        if (len > MAX_BARANGAY_NAME_BYTES) {
            revert BarangayNameTooLong(len, MAX_BARANGAY_NAME_BYTES);
        }
    }

    function _validatePurpose(string calldata _purpose) internal pure {
        uint256 len = bytes(_purpose).length;
        if (len == 0) revert StringEmpty();
        if (len > MAX_PURPOSE_BYTES) {
            revert PurposeTooLong(len, MAX_PURPOSE_BYTES);
        }
    }

    function _validateVoidReason(string calldata _reason) internal pure {
        uint256 len = bytes(_reason).length;
        if (len == 0) revert StringEmpty();
        if (len > MAX_VOID_REASON_BYTES) {
            revert VoidReasonTooLong(len, MAX_VOID_REASON_BYTES);
        }
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
     * @notice Assigns or revokes an official's access to a registered barangay.
     * @param _official Wallet address of the SK Official.
     * @param _barangay Registered canonical barangay name or alias.
     * @param _status True = authorize, False = revoke.
     */
    function setOfficialBarangayAuthorization(
        address _official,
        string calldata _barangay,
        bool _status
    ) external onlyOwner {
        require(
            _official != address(0),
            "SkLedge: Invalid wallet address"
        );

        uint256 barangayId = _getBarangayId(_barangay);
        officialBarangayAuthorizationById[_official][barangayId] = _status;

        emit OfficialBarangayAuthorizationChanged(
            _official,
            barangayId,
            canonicalBarangayNames[barangayId - 1],
            _status
        );
    }

    /**
     * @notice Checks an official's access to a registered barangay.
     */
    function isOfficialAuthorizedForBarangay(
        address _official,
        string calldata _barangay
    ) external view returns (bool) {
        return
            officialBarangayAuthorizationById[_official][
                _getBarangayId(_barangay)
            ];
    }

    /**
     * @notice Authorizes or revokes approval permissions for a wallet.
     * @param _approver Wallet address of the approver.
     * @param _status True = authorize, False = revoke.
     */
    function setApproverAuthorization(
        address _approver,
        bool _status
    ) external onlyOwner {
        require(
            _approver != address(0),
            "SkLedge: Invalid wallet address"
        );

        isApprover[_approver] = _status;

        emit ApproverAuthorizationChanged(
            _approver,
            _status
        );
    }

    /**
     * @notice Registers canonical barangay identities and unambiguous aliases.
     * @dev Each alias maps to the canonical name at the same array index.
     */
    function registerCanonicalBarangays(
        string[] calldata _names,
        string[] calldata _aliases
    ) external onlyOwner {
        require(
            _names.length > 0 &&
                _names.length <= MAX_CANONICAL_BARANGAYS_PER_BATCH &&
                _names.length == _aliases.length,
            "SkLedge: Invalid barangay registration batch"
        );

        for (uint256 i = 0; i < _names.length; i++) {
            _validateBarangayName(_names[i]);

            bytes32 canonicalKey = _barangayKey(_names[i]);
            uint256 barangayId = canonicalBarangayIds[canonicalKey];
            if (barangayId == 0) {
                canonicalBarangayNames.push(_names[i]);
                barangayId = canonicalBarangayNames.length;
                canonicalBarangayIds[canonicalKey] = barangayId;
                emit CanonicalBarangayRegistered(_names[i]);
            } else {
                require(
                    keccak256(bytes(canonicalBarangayNames[barangayId - 1])) ==
                        keccak256(bytes(_names[i])),
                    "SkLedge: Barangay name conflicts with an alias"
                );
            }

            if (bytes(_aliases[i]).length > 0) {
                _validateBarangayName(_aliases[i]);
                bytes32 aliasKey = _barangayKey(_aliases[i]);
                uint256 existingId = canonicalBarangayIds[aliasKey];
                require(
                    existingId == 0 || existingId == barangayId,
                    "SkLedge: Barangay alias is ambiguous"
                );
                canonicalBarangayIds[aliasKey] = barangayId;
            }
        }
    }

    /**
     * @notice Returns the canonical name for a registered barangay or alias.
     */
    function canonicalizeBarangay(
        string calldata _barangay
    ) external view returns (string memory) {
        uint256 barangayId = _getBarangayId(_barangay);
        return canonicalBarangayNames[barangayId - 1];
    }

    function isCanonicalBarangay(
        string calldata _barangay
    ) external view returns (bool) {
        return canonicalBarangayIds[_barangayKey(_barangay)] != 0;
    }

    function canonicalBarangayCount() external view returns (uint256) {
        return canonicalBarangayNames.length;
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
        _validateBarangayName(_barangay);
        uint256 barangayId = _getBarangayId(_barangay);

        require(
            _ceiling > 0,
            "SkLedge: Ceiling must be greater than zero"
        );

        allocationCeilingsById[barangayId] = _ceiling;

        emit AllocationCeilingChanged(
            canonicalBarangayNames[barangayId - 1],
            _ceiling
        );
    }

    function allocationCeilings(
        string calldata _barangay
    ) external view returns (uint256) {
        return allocationCeilingsById[_getBarangayId(_barangay)];
    }

    function isBarangayLocked(
        string calldata _barangay
    ) external view returns (bool) {
        return barangayLockedById[_getBarangayId(_barangay)];
    }

    /**
     * @notice Returns the total allocated amount for a barangay.
     * @param _barangay Barangay name.
     */
    function getAllocated(
        string calldata _barangay
    ) external view returns (uint256) {
        return allocatedTotalsById[_getBarangayId(_barangay)];
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
        _validateBarangayName(_barangay);
        _validatePurpose(_purpose);

        uint256 barangayId = _getBarangayId(_barangay);
        require(
            officialBarangayAuthorizationById[msg.sender][barangayId],
            "SkLedge: Your wallet is not authorized for this barangay."
        );

        string memory canonicalBarangay = canonicalBarangayNames[
            barangayId - 1
        ];

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

        if (
            typeHash != keccak256(abi.encodePacked("Allocation"))
        ) {
            require(
                !barangayLockedById[barangayId],
                "SkLedge: Barangay is locked after approval"
            );
        }

        // Enforce the allocation ceiling for Allocation records when one is set.
        if (
            typeHash == keccak256(
                abi.encodePacked("Allocation")
            )
        ) {
            uint256 ceiling = allocationCeilingsById[barangayId];

            if (ceiling > 0) {
                require(
                    allocatedTotalsById[barangayId] + _amount <= ceiling,
                    "SkLedge: Allocation exceeds ceiling"
                );
            }

            allocatedTotalsById[barangayId] += _amount;
        }

        records.push(
            FinancialRecord({
                id: nextRecordId,
                official: msg.sender,
                barangay: canonicalBarangay,
                amount: _amount,
                timestamp: block.timestamp,
                purpose: _purpose,
                recordType: _recordType,
                approved: false,
                approvedBy: address(0),
                voided: false,
                voidReason: "",
                predecessorId: 0,
                superseded: false
            })
        );

        emit RecordAdded(
            nextRecordId,
            msg.sender,
            canonicalBarangay,
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
    ) external onlyOwnerOrApprover {
        require(
            _id > 0 && _id < nextRecordId,
            "SkLedge: Record does not exist"
        );

        FinancialRecord storage record = records[_id - 1];
        require(!record.voided, "SkLedge: Record is voided");
        require(
            !correctionRejectedById[_id],
            "SkLedge: Correction was rejected"
        );
        require(
            _approved || !record.approved || record.predecessorId == 0,
            "SkLedge: Approved correction cannot be removed"
        );
        uint256 barangayId = _getBarangayId(record.barangay);

        if (!_approved && record.predecessorId != 0) {
            correctionRejectedById[_id] = true;
            successorById[record.predecessorId] = 0;
        }

        if (_approved) {
            if (record.predecessorId != 0) {
                FinancialRecord storage predecessor = records[
                    record.predecessorId - 1
                ];
                require(
                    successorById[record.predecessorId] == _id &&
                        predecessor.approved &&
                        !predecessor.voided &&
                        !predecessor.superseded,
                    "SkLedge: Predecessor is no longer active"
                );
                _applyCorrectionAccounting(predecessor, record, barangayId);
                predecessor.superseded = true;
                emit RecordCorrectionActivated(record.predecessorId, _id);
            }

            record.approved = true;
            record.approvedBy = msg.sender;
            barangayLockedById[barangayId] = true;
            emit BarangayLocked(record.barangay, true);
        } else {
            record.approved = false;
            record.approvedBy = address(0);

            // Unlock the barangay only if no OTHER record for it is still approved.
            bool anyOtherApproved = false;
            for (uint256 i = 0; i < records.length; i++) {
                if (i != _id - 1 && records[i].approved) {
                    if (
                        _getBarangayId(records[i].barangay) == barangayId
                    ) {
                        anyOtherApproved = true;
                        break;
                    }
                }
            }

            if (!anyOtherApproved) {
                barangayLockedById[barangayId] = false;
                emit BarangayLocked(record.barangay, false);
            }
        }

        emit ApprovalChanged(
            _id,
            _approved,
            record.approvedBy
        );
    }

    /**
     * @notice Submits a pending correction for an approved active record.
     * @dev The predecessor remains active until this correction is approved.
     */
    function submitCorrection(
        uint256 _predecessorId,
        uint256 _amount,
        string calldata _purpose,
        string calldata _recordType
    ) external onlyAuthorizedOfficial {
        require(
            _predecessorId > 0 && _predecessorId < nextRecordId,
            "SkLedge: Predecessor does not exist"
        );
        require(_amount > 0, "SkLedge: Amount must be greater than zero");
        _validatePurpose(_purpose);

        FinancialRecord storage predecessor = records[_predecessorId - 1];
        require(
            predecessor.approved &&
                !predecessor.voided &&
                !predecessor.superseded &&
                !correctionRejectedById[_predecessorId],
            "SkLedge: Predecessor is not active"
        );
        require(
            successorById[_predecessorId] == 0,
            "SkLedge: Predecessor already has a successor"
        );

        uint256 barangayId = _getBarangayId(predecessor.barangay);
        require(
            officialBarangayAuthorizationById[msg.sender][barangayId],
            "SkLedge: Your wallet is not authorized for this barangay."
        );

        bytes32 typeHash = keccak256(abi.encodePacked(_recordType));
        require(
            typeHash == keccak256(abi.encodePacked("Allocation")) ||
                typeHash == keccak256(abi.encodePacked("Expense")) ||
                typeHash == keccak256(abi.encodePacked("Award")),
            "SkLedge: Type must be 'Allocation', 'Expense', or 'Award'"
        );

        string memory canonicalBarangay = canonicalBarangayNames[
            barangayId - 1
        ];
        records.push(
            FinancialRecord({
                id: nextRecordId,
                official: msg.sender,
                barangay: canonicalBarangay,
                amount: _amount,
                timestamp: block.timestamp,
                purpose: _purpose,
                recordType: _recordType,
                approved: false,
                approvedBy: address(0),
                voided: false,
                voidReason: "",
                predecessorId: _predecessorId,
                superseded: false
            })
        );

        successorById[_predecessorId] = nextRecordId;
        emit RecordCorrectionSubmitted(
            _predecessorId,
            nextRecordId,
            msg.sender
        );
        emit RecordAdded(
            nextRecordId,
            msg.sender,
            canonicalBarangay,
            _amount,
            block.timestamp,
            _recordType
        );
        nextRecordId++;
    }

    function _applyCorrectionAccounting(
        FinancialRecord storage _predecessor,
        FinancialRecord storage _correction,
        uint256 _barangayId
    ) private {
        bool predecessorIsAllocation =
            keccak256(bytes(_predecessor.recordType)) ==
            keccak256(bytes("Allocation"));
        bool correctionIsAllocation =
            keccak256(bytes(_correction.recordType)) ==
            keccak256(bytes("Allocation"));

        if (predecessorIsAllocation) {
            require(
                allocatedTotalsById[_barangayId] >= _predecessor.amount,
                "SkLedge: Allocation total is inconsistent"
            );
            allocatedTotalsById[_barangayId] -= _predecessor.amount;
        }

        if (correctionIsAllocation) {
            uint256 resultingTotal =
                allocatedTotalsById[_barangayId] + _correction.amount;
            uint256 ceiling = allocationCeilingsById[_barangayId];
            require(
                ceiling == 0 || resultingTotal <= ceiling,
                "SkLedge: Allocation exceeds ceiling"
            );
            allocatedTotalsById[_barangayId] = resultingTotal;
        }
    }

    /**
     * @notice Permanently voids an invalid record without deleting its history.
     * @dev The reason is public and permanent; callers must not include confidential
     *      or personal information.
     */
    function voidRecord(
        uint256 _id,
        string calldata _reason
    ) external onlyOwner {
        _validateVoidReason(_reason);
        require(
            _id > 0 && _id < nextRecordId,
            "SkLedge: Record does not exist"
        );

        FinancialRecord storage record = records[_id - 1];
        require(!record.voided, "SkLedge: Record is already voided");
        if (successorById[_id] != 0) {
            correctionRejectedById[successorById[_id]] = true;
            successorById[_id] = 0;
        }

        bool wasApproved = record.approved;
        uint256 barangayId = _getBarangayId(record.barangay);

        if (
            keccak256(bytes(record.recordType)) ==
            keccak256(bytes("Allocation"))
        ) {
            require(
                allocatedTotalsById[barangayId] >= record.amount,
                "SkLedge: Allocation total is inconsistent"
            );
            allocatedTotalsById[barangayId] -= record.amount;
        }

        record.voided = true;
        record.voidReason = _reason;
        record.approved = false;
        record.approvedBy = address(0);

        if (wasApproved) {
            bool anyOtherApproved = false;
            for (uint256 i = 0; i < records.length; i++) {
                if (
                    i != _id - 1 &&
                    records[i].approved &&
                    !records[i].voided &&
                    _getBarangayId(records[i].barangay) == barangayId
                ) {
                    anyOtherApproved = true;
                    break;
                }
            }

            if (!anyOtherApproved) {
                barangayLockedById[barangayId] = false;
                emit BarangayLocked(record.barangay, false);
            }

            emit ApprovalChanged(_id, false, address(0));
        }

        emit RecordVoided(_id, msg.sender, _reason);
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

    /**
     * @notice Returns all financial records belonging to a specific barangay.
     * @param _barangay Barangay name.
     */
    function getRecordsByBarangay(
        string calldata _barangay
    ) external view returns (FinancialRecord[] memory) {
        uint256 barangayId = _getBarangayId(_barangay);
        uint256 count = 0;
        for (uint256 i = 0; i < records.length; i++) {
            if (_getBarangayId(records[i].barangay) == barangayId) {
                count++;
            }
        }

        FinancialRecord[] memory barangayRecords = new FinancialRecord[](
            count
        );

        uint256 index = 0;
        for (uint256 i = 0; i < records.length; i++) {
            if (_getBarangayId(records[i].barangay) == barangayId) {
                barangayRecords[index] = records[i];
                index++;
            }
        }

        return barangayRecords;
    }

    function _getBarangayId(
        string memory _barangay
    ) private view returns (uint256) {
        uint256 barangayId = canonicalBarangayIds[_barangayKey(_barangay)];
        require(barangayId > 0, "SkLedge: Unknown barangay");
        return barangayId;
    }

    function _barangayKey(
        string memory _barangay
    ) private pure returns (bytes32) {
        bytes memory input = bytes(_barangay);
        uint256 start = 0;
        uint256 end = input.length;

        while (start < end && _isWhitespace(input[start])) {
            start++;
        }
        while (end > start && _isWhitespace(input[end - 1])) {
            end--;
        }

        if (end - start >= 9 && _hasBarangayPrefix(input, start)) {
            start += 9;
            while (start < end && _isWhitespace(input[start])) {
                start++;
            }
        }

        bytes memory normalized = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            uint8 character = uint8(input[i]);
            if (character >= 65 && character <= 90) {
                character += 32;
            }
            normalized[i - start] = bytes1(character);
        }
        return keccak256(normalized);
    }

    function _hasBarangayPrefix(
        bytes memory _value,
        uint256 _start
    ) private pure returns (bool) {
        bytes memory prefix = bytes("barangay ");
        for (uint256 i = 0; i < prefix.length; i++) {
            uint8 character = uint8(_value[_start + i]);
            if (character >= 65 && character <= 90) {
                character += 32;
            }
            if (character != uint8(prefix[i])) {
                return false;
            }
        }
        return true;
    }

    function _isWhitespace(bytes1 _character) private pure returns (bool) {
        return
            _character == 0x20 ||
            _character == 0x09 ||
            _character == 0x0a ||
            _character == 0x0d;
    }
}