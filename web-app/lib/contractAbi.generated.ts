// AUTO-GENERATED FILE - DO NOT EDIT
export const SK_LEDGE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "barangay",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ceiling",
        "type": "uint256"
      }
    ],
    "name": "AllocationCeilingChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approvedBy",
        "type": "address"
      }
    ],
    "name": "ApprovalChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "approver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isApproved",
        "type": "bool"
      }
    ],
    "name": "ApproverAuthorizationChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "barangay",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "locked",
        "type": "bool"
      }
    ],
    "name": "BarangayLocked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "official",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isAuthorized",
        "type": "bool"
      }
    ],
    "name": "OfficialAuthorizationChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "official",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "barangay",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "recordType",
        "type": "string"
      }
    ],
    "name": "RecordAdded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_barangay",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_purpose",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_recordType",
        "type": "string"
      }
    ],
    "name": "addRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "allocationCeilings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllRecords",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "official",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "barangay",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "purpose",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "recordType",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "approvedBy",
            "type": "address"
          }
        ],
        "internalType": "struct SkLedge.FinancialRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_barangay",
        "type": "string"
      }
    ],
    "name": "getAllocated",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_barangay",
        "type": "string"
      }
    ],
    "name": "getRecordsByBarangay",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "official",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "barangay",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "purpose",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "recordType",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "approvedBy",
            "type": "address"
          }
        ],
        "internalType": "struct SkLedge.FinancialRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isApprover",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isAuthorizedOfficial",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "isBarangayLocked",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextRecordId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "records",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "official",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "barangay",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "purpose",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "recordType",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "approvedBy",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_barangay",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_ceiling",
        "type": "uint256"
      }
    ],
    "name": "setAllocationCeiling",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_approver",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_status",
        "type": "bool"
      }
    ],
    "name": "setApproverAuthorization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_official",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_status",
        "type": "bool"
      }
    ],
    "name": "setOfficialAuthorization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_approved",
        "type": "bool"
      }
    ],
    "name": "setRecordApproval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
