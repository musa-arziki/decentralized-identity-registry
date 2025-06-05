import { describe, it, expect, beforeEach } from "vitest";

// Mock Clarity environment and functions
const mockClarityEnv = {
  currentBlock: 1000,
  contracts: new Map(),
  accounts: {
    deployer: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    alice: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    bob: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    charlie: "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC",
  },
  maps: new Map(),
  variables: new Map(),
};

// Mock contract state
let contractState = {
  identities: new Map(),
  usernameToAddress: new Map(),
  contractPaused: false,
  contractOwner: mockClarityEnv.accounts.deployer,
};

// Reset contract state before each test
beforeEach(() => {
  contractState = {
    identities: new Map(),
    usernameToAddress: new Map(),
    contractPaused: false,
    contractOwner: mockClarityEnv.accounts.deployer,
  };
  mockClarityEnv.currentBlock = 1000;
});

// Helper functions to simulate Clarity contract functions
const contractFunctions = {
  isValidUsername(username) {
    return username.length > 2 && username.length <= 50;
  },

  isUsernameAvailable(username) {
    return !contractState.usernameToAddress.has(username);
  },

  getIdentity(user) {
    return contractState.identities.get(user) || null;
  },

  getIdentityByUsername(username) {
    const userAddress = contractState.usernameToAddress.get(username);
    if (!userAddress) return null;
    return contractState.identities.get(userAddress) || null;
  },

  getUsernameOwner(username) {
    return contractState.usernameToAddress.get(username) || null;
  },

  registerIdentity(
    caller,
    username,
    displayName,
    bio,
    avatarUrl,
    socialTwitter,
    socialGithub,
    socialDiscord
  ) {
    // Check contract not paused
    if (contractState.contractPaused) {
      return { error: 100, message: "Contract paused" };
    }

    // Validate username
    if (!this.isValidUsername(username)) {
      return { error: 103, message: "Invalid username" };
    }

    // Check username availability
    if (!this.isUsernameAvailable(username)) {
      return { error: 102, message: "Username already exists" };
    }

    // Check user doesn't already have identity
    if (contractState.identities.has(caller)) {
      return { error: 102, message: "User already has identity" };
    }

    // Create identity
    const identity = {
      username,
      displayName,
      bio,
      avatarUrl,
      socialTwitter,
      socialGithub,
      socialDiscord,
      createdAt: mockClarityEnv.currentBlock,
      updatedAt: mockClarityEnv.currentBlock,
    };

    // Store identity and username mapping
    contractState.identities.set(caller, identity);
    contractState.usernameToAddress.set(username, caller);

    return { success: true };
  },

  updateIdentity(
    caller,
    displayName,
    bio,
    avatarUrl,
    socialTwitter,
    socialGithub,
    socialDiscord
  ) {
    // Check contract not paused
    if (contractState.contractPaused) {
      return { error: 100, message: "Contract paused" };
    }

    // Get current identity
    const currentIdentity = contractState.identities.get(caller);
    if (!currentIdentity) {
      return { error: 101, message: "Identity not found" };
    }

    // Update identity (keep username and createdAt unchanged)
    const updatedIdentity = {
      ...currentIdentity,
      displayName,
      bio,
      avatarUrl,
      socialTwitter,
      socialGithub,
      socialDiscord,
      updatedAt: mockClarityEnv.currentBlock,
    };

    contractState.identities.set(caller, updatedIdentity);
    return { success: true };
  },

  deleteIdentity(caller) {
    // Check contract not paused
    if (contractState.contractPaused) {
      return { error: 100, message: "Contract paused" };
    }

    // Get current identity
    const currentIdentity = contractState.identities.get(caller);
    if (!currentIdentity) {
      return { error: 101, message: "Identity not found" };
    }

    // Delete identity and username mapping
    contractState.identities.delete(caller);
    contractState.usernameToAddress.delete(currentIdentity.username);

    return { success: true };
  },

  pauseContract(caller) {
    if (caller !== contractState.contractOwner) {
      return { error: 100, message: "Owner only" };
    }
    contractState.contractPaused = true;
    return { success: true };
  },

  unpauseContract(caller) {
    if (caller !== contractState.contractOwner) {
      return { error: 100, message: "Owner only" };
    }
    contractState.contractPaused = false;
    return { success: true };
  },

  adminDeleteIdentity(caller, targetUser) {
    if (caller !== contractState.contractOwner) {
      return { error: 100, message: "Owner only" };
    }

    const targetIdentity = contractState.identities.get(targetUser);
    if (!targetIdentity) {
      return { error: 101, message: "Identity not found" };
    }

    // Delete identity and username mapping
    contractState.identities.delete(targetUser);
    contractState.usernameToAddress.delete(targetIdentity.username);

    return { success: true };
  },

  getContractInfo() {
    return {
      owner: contractState.contractOwner,
      paused: contractState.contractPaused,
    };
  },
};

describe("Decentralized Identity Registry", () => {
  describe("Identity Registration", () => {
    it("should register a new identity successfully", () => {
      const result = contractFunctions.registerIdentity(
        mockClarityEnv.accounts.alice,
        "alice123",
        "Alice Cooper",
        "Web3 developer",
        "https://example.com/avatar.jpg",
        "alice_crypto",
        "alicedev",
        null
      );

      expect(result.success).toBe(true);

      const identity = contractFunctions.getIdentity(
        mockClarityEnv.accounts.alice
      );
      expect(identity).toBeTruthy();
      expect(identity.username).toBe("alice123");
      expect(identity.displayName).toBe("Alice Cooper");
      expect(identity.bio).toBe("Web3 developer");
      expect(identity.createdAt).toBe(1000);
      expect(identity.updatedAt).toBe(1000);
    });

    it("should fail to register with invalid username", () => {
      const result = contractFunctions.registerIdentity(
        mockClarityEnv.accounts.alice,
        "ab", // Too short
        "Alice Cooper",
        "Web3 developer",
        "https://example.com/avatar.jpg",
        "alice_crypto",
        "alicedev",
        null
      );

      expect(result.error).toBe(103);
      expect(result.message).toBe("Invalid username");
    });

    it("should fail to register duplicate username", () => {
      // First registration
      contractFunctions.registerIdentity(
        mockClarityEnv.accounts.alice,
        "alice123",
        "Alice Cooper",
        "Web3 developer",
        "https://example.com/avatar.jpg",
        null,
        null,
        null
      );

      // Second registration with same username
      const result = contractFunctions.registerIdentity(
        mockClarityEnv.accounts.bob,
        "alice123",
        "Bob Smith",
        "Another developer",
        "https://example.com/bob.jpg",
        null,
        null,
        null
      );

      expect(result.error).toBe(102);
      expect(result.message).toBe("Username already exists");
    });

    it("should fail to register multiple identities for same user", () => {
      // First registration
      contractFunctions.registerIdentity(
        mockClarityEnv.accounts.alice,
        "alice123",
        "Alice Cooper",
        "Web3 developer",
        "https://example.com/avatar.jpg",
        null,
        null,
        null
      );

      // Second registration for same user
      const result = contractFunctions.registerIdentity(
        mockClarityEnv.accounts.alice,
        "alice456",
        "Alice Smith",
        "Another identity",
        "https://example.com/alice2.jpg",
        null,
        null,
        null
      );

      expect(result.error).toBe(102);
      expect(result.message).toBe("User already has identity");
    });

    it("should fail to register when contract is paused", () => {
      contractFunctions.pauseContract(mockClarityEnv.accounts.deployer);

      const result = contractFunctions.registerIdentity(
        mockClarityEnv.accounts.alice,
        "alice123",
        "Alice Cooper",
        "Web3 developer",
        "https://example.com/avatar.jpg",
        null,
        null,
        null
      );

      expect(result.error).toBe(100);
      expect(result.message).toBe("Contract paused");
    });
  });

  describe("Identity Updates", () => {
    beforeEach(() => {
      // Register an identity for testing updates
      contractFunctions.registerIdentity(
        mockClarityEnv.accounts.alice,
        "alice123",
        "Alice Cooper",
        "Web3 developer",
        "https://example.com/avatar.jpg",
        "alice_crypto",
        "alicedev",
        null
      );
    });

    it("should update identity successfully", () => {
      mockClarityEnv.currentBlock = 1100;

      const result = contractFunctions.updateIdentity(
        mockClarityEnv.accounts.alice,
        "Alice Cooper - Senior Dev",
        "Senior Web3 developer with 5+ years experience",
        "https://example.com/new-avatar.jpg",
        "alice_crypto_new",
        "alicedev",
        "alice#1234"
      );

      expect(result.success).toBe(true);

      const identity = contractFunctions.getIdentity(
        mockClarityEnv.accounts.alice
      );
      expect(identity.username).toBe("alice123"); // Username unchanged
      expect(identity.displayName).toBe("Alice Cooper - Senior Dev");
      expect(identity.bio).toBe(
        "Senior Web3 developer with 5+ years experience"
      );
      expect(identity.socialDiscord).toBe("alice#1234");
      expect(identity.createdAt).toBe(1000); // Creation time unchanged
      expect(identity.updatedAt).toBe(1100); // Update time changed
    });
  });
});
