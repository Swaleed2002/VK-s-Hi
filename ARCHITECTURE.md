# Architecture & Data Model

## Database Schema (Firestore)

### 1. `users`
Profiles and online presence.
- `id` (String): Document ID (UID)
- `username` (String): Lowercase unique handle
- `displayName` (String)
- `email` (String)
- `avatarUrl` (String, Optional)
- `bio` (String, Optional)
- `isOnline` (Boolean)
- `lastSeen` (Timestamp)
- `createdAt` (Timestamp)

### 2. `usernames`
Enforces global username uniqueness.
- Document ID: the lowercase username
- `uid` (String): The UID of the user who owns it

### 3. `conversations`
Tracks chats between two or more users.
- `id` (String): Deterministic for DMs (e.g., `uid1_uid2`), random for groups.
- `type` (String): 'direct' | 'group'
- `participantIds` (Array<String>): Active member UIDs
- `participants` (Map): Denormalized display names and avatars for rapid rendering
- `lastMessagePreview` (String)
- `lastMessageTime` (Timestamp)

### 4. `conversations/{id}/messages`
The actual chat history.
- `senderId` (String)
- `type` (String): 'text' | 'image' | 'video' | 'file'
- `content` (String): Text content or media URL
- `fileName`, `fileSize`, `fileType` (Metadata for files)
- `createdAt` (Timestamp)
- `status` (Map): Delivery receipts

### 5. `calls`
WebRTC signaling and call history.
- `callerId` (String)
- `receiverId` (String)
- `type` (String): 'voice' | 'video'
- `status` (String): 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'busy' | 'missed'
- `offer` (Map): SDP Offer
- `answer` (Map): SDP Answer
- Subcollections: `callerCandidates` and `receiverCandidates` for ICE trickle.

## WebRTC Lifecycle

1. **Initiate:** Caller creates a `calls` document with status `initiating`, generates an SDP Offer, and updates the doc.
2. **Ring:** Receiver's global listener detects `initiating` call targeted at them. Shows ringing UI.
3. **Accept:** Receiver accepts, changes status to `connecting`. Generates SDP Answer, updates doc.
4. **Trickle ICE:** Both parties continuously write their ICE candidates to the respective subcollections (`callerCandidates` / `receiverCandidates`) which are synced in realtime.
5. **Connect:** Peer connection establishes, status becomes `connected`.
6. **End:** Either party hangs up, status becomes `ended`, RTCPeerConnection is torn down, and streams are released.
