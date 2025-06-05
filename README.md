# Decentralized Identity Registry

A simple and secure smart contract for associating Stacks addresses with identity metadata, built on the Stacks blockchain using Clarity.

## Overview

The Decentralized Identity Registry enables users to create and manage their Web3 identities by linking their Stacks addresses to usernames, profile information, and social media accounts. This contract serves as a foundation for Web3 login systems and decentralized identity management.

## Features

- **Unique Username Registration**: Each user can register a unique username (3-50 characters)
- **Rich Profile Data**: Store display names, bios, avatar URLs, and social media links
- **Username-to-Address Mapping**: Lookup addresses by username and vice versa
- **Profile Updates**: Users can update their profile information while keeping their username
- **Admin Controls**: Contract owner can pause/unpause the contract and manage identities
- **Identity Deletion**: Users can delete their own identities

## Contract Structure

### Data Storage

The contract uses two main data maps:

1. **identities**: Maps user addresses to their profile data
2. **username-to-address**: Maps usernames to user addresses for reverse lookup

### Profile Data Fields

- `username`: Unique identifier (3-50 ASCII characters)
- `display-name`: Human-readable name (up to 100 UTF-8 characters)
- `bio`: Profile description (up to 500 UTF-8 characters)
- `avatar-url`: Profile picture URL (up to 200 ASCII characters)
- `social-twitter`: Optional Twitter handle
- `social-github`: Optional GitHub username
- `social-discord`: Optional Discord username
- `created-at`: Block height when identity was created
- `updated-at`: Block height when identity was last updated

## Functions

### Read-Only Functions

- `get-identity(user)`: Get identity data for a specific address
- `get-identity-by-username(username)`: Get identity data by username
- `get-username-owner(username)`: Get the address that owns a username
- `is-username-available(username)`: Check if a username is available
- `get-contract-info()`: Get contract owner and pause status

### Public Functions

- `register-identity(...)`: Register a new identity with username and profile data
- `update-identity(...)`: Update profile data (username cannot be changed)
- `delete-identity()`: Delete your own identity and free up the username

### Admin Functions

- `pause-contract()`: Pause the contract (owner only)
- `unpause-contract()`: Unpause the contract (owner only)
- `admin-delete-identity(user)`: Delete any user's identity (owner only)

## Usage Examples

### Registering an Identity

```clarity
(contract-call? .identity-registry register-identity
  "alice123"                    ;; username
  u"Alice Cooper"              ;; display-name
  u"Web3 developer and blockchain enthusiast" ;; bio
  "https://example.com/avatar.jpg" ;; avatar-url
  (some "alice_crypto")        ;; social-twitter
  (some "alicedev")           ;; social-github
  none                        ;; social-discord
)
```

### Updating Profile

```clarity
(contract-call? .identity-registry update-identity
  u"Alice Cooper - Senior Developer" ;; display-name
  u"Senior Web3 developer with 5+ years experience" ;; bio
  "https://example.com/new-avatar.jpg" ;; avatar-url
  (some "alice_crypto")        ;; social-twitter
  (some "alicedev")           ;; social-github
  (some "alice#1234")         ;; social-discord
)
```

### Looking Up Identities

```clarity
;; Get identity by address
(contract-call? .identity-registry get-identity 'SP1HTBVD3JG9C05J7HDJKDYR7S9Q47FYRN4V7FHJHP)

;; Get identity by username
(contract-call? .identity-registry get-identity-by-username "alice123")

;; Check if username is available
(contract-call? .identity-registry is-username-available "newuser")
```

## Error Codes

- `u100`: Owner only operation
- `u101`: Identity or username not found
- `u102`: Identity or username already exists
- `u103`: Invalid username format
- `u104`: Unauthorized operation

## Security Features

- **Username Uniqueness**: Each username can only be registered once
- **Owner-Only Admin Functions**: Critical operations require contract owner
- **Pause Functionality**: Contract can be paused in emergencies
- **Input Validation**: Username length and format validation
- **Self-Ownership**: Users can only modify their own identities

## Integration with Web3 Login Systems

This contract can be integrated into Web3 applications to provide:

1. **User Authentication**: Verify identity ownership through wallet signatures
2. **Profile Display**: Show rich user profiles in applications
3. **Username Resolution**: Convert user-friendly names to addresses
4. **Social Verification**: Link Web3 identities to social media accounts
