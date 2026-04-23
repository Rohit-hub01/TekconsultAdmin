
# Implementation Plan - Waiting for Consultant Screen & SignalR Integration

I have implemented the "Waiting for Consultant" screen logic within the `UserChatSession` component. This integration ensures the user is correctly waiting for the consultant to accept the session request, and handles real-time updates via SignalR.

## Key Changes

### 1. SignalR Integration in `UserChatSession.tsx`
- **Hub Connection**: Established connection to `[API_BASE_URL]/chatHub` using the user's Auth Bearer token.
- **Join Session**: immediately invokes `JoinSession` with `sessionId` upon connection or sessionId availability.

### 2. Event Listeners
- **`SessionAccepted`**:
  - Updates component state to `isAccepted = true` and `isActive = true`.
  - Sets `maxAllowedEndTime` from the payload to initialize the countdown timer.
  - Updates `timeLeft` immediately to avoid initial delay.
  - Displays a success toast.
  - Enables the chat input.

- **`SessionRejected`**:
  - Displays a destructive toast with the rejection message.
  - Redirects the user to `/user/home`.

### 3. UI/UX Logic
- The "Waiting" spinner/overlay is controlled by `!isAccepted` state.
- Upon `SessionAccepted`, the overlay is removed, revealing the chat interface.
- Upon `SessionRejected`, the user is navigated away.

## Verification
- **Waiting Screen**: Verify that when a session is created but not yet accepted, the "Waiting for Acceptance" overlay is visible.
- **Acceptance**: Verify that upon consultant acceptance, the overlay disappears, and the timer starts based on `maxAllowedEndTime`.
- **Rejection**: Verify that upon rejection, the user is redirected with an appropriate message.
