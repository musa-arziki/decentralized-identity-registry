;; Decentralized Identity Registry
;; A simple smart contract for associating Stacks addresses with identity metadata

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))
(define-constant err-invalid-username (err u103))
(define-constant err-unauthorized (err u104))

;; Data Variables
(define-data-var contract-paused bool false)

;; Data Maps
(define-map identities
  { user: principal }
  {
    username: (string-ascii 50),
    display-name: (string-utf8 100),
    bio: (string-utf8 500),
    avatar-url: (string-ascii 200),
    social-twitter: (optional (string-ascii 100)),
    social-github: (optional (string-ascii 100)),
    social-discord: (optional (string-ascii 100)),
    created-at: uint,
    updated-at: uint
  }
)

(define-map username-to-address
  { username: (string-ascii 50) }
  { user: principal }
)

;; Private Functions
(define-private (is-valid-username (username (string-ascii 50)))
  (and
    (> (len username) u2)
    (<= (len username) u50)
    ;; Add more validation as needed
    true
  )
)

;; Read-only Functions
(define-read-only (get-identity (user principal))
  (map-get? identities { user: user })
)

(define-read-only (get-identity-by-username (username (string-ascii 50)))
  (match (map-get? username-to-address { username: username })
    user-data (get-identity (get user user-data))
    none
  )
)

(define-read-only (get-username-owner (username (string-ascii 50)))
  (map-get? username-to-address { username: username })
)

(define-read-only (is-username-available (username (string-ascii 50)))
  (is-none (map-get? username-to-address { username: username }))
)

(define-read-only (get-contract-info)
  {
    owner: contract-owner,
    paused: (var-get contract-paused)
  }
)

;; Public Functions
(define-public (register-identity 
  (username (string-ascii 50))
  (display-name (string-utf8 100))
  (bio (string-utf8 500))
  (avatar-url (string-ascii 200))
  (social-twitter (optional (string-ascii 100)))
  (social-github (optional (string-ascii 100)))
  (social-discord (optional (string-ascii 100)))
)
  (let
    (
      (caller tx-sender)
    )
    (asserts! (not (var-get contract-paused)) err-owner-only)
    (asserts! (is-valid-username username) err-invalid-username)
    (asserts! (is-username-available username) err-already-exists)
    (asserts! (is-none (get-identity caller)) err-already-exists)
    
    ;; Register the identity
    (map-set identities
      { user: caller }
      {
        username: username,
        display-name: display-name,
        bio: bio,
        avatar-url: avatar-url,
        social-twitter: social-twitter,
        social-github: social-github,
        social-discord: social-discord,
        created-at: burn-block-height,
        updated-at: burn-block-height
      }
    )
    
    ;; Map username to address
    (map-set username-to-address
      { username: username }
      { user: caller }
    )
    
    (ok true)
  )
)

(define-public (update-identity
  (display-name (string-utf8 100))
  (bio (string-utf8 500))
  (avatar-url (string-ascii 200))
  (social-twitter (optional (string-ascii 100)))
  (social-github (optional (string-ascii 100)))
  (social-discord (optional (string-ascii 100)))
)
  (let
    (
      (caller tx-sender)
      (current-identity (unwrap! (get-identity caller) err-not-found))
    )
    (asserts! (not (var-get contract-paused)) err-owner-only)
    
    ;; Update the identity (keep username and created-at unchanged)
    (map-set identities
      { user: caller }
      {
        username: (get username current-identity),
        display-name: display-name,
        bio: bio,
        avatar-url: avatar-url,
        social-twitter: social-twitter,
        social-github: social-github,
        social-discord: social-discord,
        created-at: (get created-at current-identity),
        updated-at: burn-block-height
      }
    )
    
    (ok true)
  )
)

(define-public (delete-identity)
  (let
    (
      (caller tx-sender)
      (current-identity (unwrap! (get-identity caller) err-not-found))
    )
    (asserts! (not (var-get contract-paused)) err-owner-only)
    
    ;; Remove identity
    (map-delete identities { user: caller })
    ;; Remove username mapping
    (map-delete username-to-address { username: (get username current-identity) })
    
    (ok true)
  )
)

;; Admin Functions
(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set contract-paused true)
    (ok true)
  )
)

(define-public (unpause-contract)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set contract-paused false)
    (ok true)
  )
)

(define-public (admin-delete-identity (user principal))
  (let
    (
      (target-identity (unwrap! (get-identity user) err-not-found))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    ;; Remove identity
    (map-delete identities { user: user })
    ;; Remove username mapping
    (map-delete username-to-address { username: (get username target-identity) })
    
    (ok true)
  )
)