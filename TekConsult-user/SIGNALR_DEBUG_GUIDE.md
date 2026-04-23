# SignalR Debugging Quick Reference

## 🔍 **Quick Diagnostic Commands**

### **Check Browser Console for These Logs:**

#### **✅ GOOD - Connection Successful:**
```
🔌 Starting SignalR connection...
✅ SignalR connection established
🚪 Joining session: abc-123-def
✅ Successfully joined session: abc-123-def
```

#### **✅ GOOD - Session Accepted:**
```
🚀 Session Accepted Signal received: { sessionId: "abc-123" }
```

#### **✅ GOOD - Message Received:**
```
📩 Message received via SignalR: { messageId: "xyz", text: "Hello", senderId: "user-123" }
```

#### **⚠️ WARNING - Duplicate Detected:**
```
⚠️ Duplicate message detected, skipping: { id: "xyz", text: "Hello" }
```

#### **❌ BAD - No Logs:**
If you see **NO logs** after clicking "Accept" or sending a message:
- Event handlers not registered
- Connection not established
- Check for JavaScript errors

---

## 🐛 **Common Issues & Quick Fixes**

### **Issue 1: User Stuck on "Waiting for Acceptance"**

**Symptoms:**
- Consultant accepts session
- User still sees "Waiting..." overlay
- No console errors

**Diagnosis:**
```javascript
// Check console for:
✅ "🚀 Session Accepted Signal received" → Handler working
❌ No log → Handler not registered or event not sent
```

**Fix:**
1. Verify event handlers registered **before** `connection.start()`
2. Check backend sends `SessionAccepted` or `SessionStarted` event
3. Verify `JoinSession` was called successfully

---

### **Issue 2: Duplicate Messages**

**Symptoms:**
- Messages appear twice in UI
- Both have same text but different IDs

**Diagnosis:**
```javascript
// Check console for:
⚠️ "Duplicate message detected, skipping" → Dedup working
❌ No warning → Dedup not working
```

**Fix:**
1. Remove optimistic message insertion
2. Verify deduplication logic checks both ID and content
3. Ensure server sends message only once

---

### **Issue 3: Messages Not Appearing**

**Symptoms:**
- Send message → no error
- Message doesn't appear on either side

**Diagnosis:**
```javascript
// Check console for:
✅ "📩 Message received via SignalR" → SignalR working
❌ No log → SignalR not receiving message
```

**Fix:**
1. Verify `ReceiveMessage` handler registered
2. Check backend broadcasts message to session group
3. Verify `JoinSession` added user to correct group

---

### **Issue 4: Connection Fails**

**Symptoms:**
- No SignalR logs in console
- Connection never established

**Diagnosis:**
```javascript
// Check console for:
❌ "Failed to start connection" → Auth or network issue
❌ 401 Unauthorized → Token invalid
❌ 404 Not Found → Hub URL wrong
```

**Fix:**
1. Verify token exists: `localStorage.getItem('token')`
2. Check hub URL: `http://localhost:5041/chatHub`
3. Verify backend SignalR hub is running
4. Check CORS settings

---

## 🧪 **Manual Testing Steps**

### **Test 1: Session Acceptance (2 minutes)**
1. Open two browser windows (or incognito)
2. Login as User in Window 1
3. Login as Consultant in Window 2
4. User: Create session with consultant
5. User: Navigate to chat → see "Waiting..."
6. Consultant: See session request in dashboard
7. Consultant: Click "Accept"
8. **VERIFY:** User's "Waiting..." disappears **instantly**
9. **VERIFY:** Console shows "🚀 Session Accepted Signal received"

### **Test 2: Message Exchange (1 minute)**
1. User: Type "Hello from user" → Send
2. **VERIFY:** Message appears on user side **once**
3. **VERIFY:** Message appears on consultant side **once**
4. Consultant: Type "Hello from consultant" → Send
5. **VERIFY:** Message appears on consultant side **once**
6. **VERIFY:** Message appears on user side **once**
7. **VERIFY:** No duplicates on either side

### **Test 3: Rapid Messages (1 minute)**
1. User: Send 5 messages rapidly
2. **VERIFY:** All 5 appear **exactly once** on both sides
3. **VERIFY:** Correct order maintained
4. **VERIFY:** No console errors

---

## 📊 **SignalR Event Reference**

### **Events Sent by Server:**

| Event Name | Sent To | Purpose | Payload |
|------------|---------|---------|---------|
| `ReceiveMessage` | All session members | Broadcast new message | `{ messageId, text, senderId, timestamp }` |
| `SessionAccepted` | User | Session accepted by consultant | `{ sessionId }` |
| `SessionStarted` | Both | Session is now active | `{ sessionId }` |
| `SessionRequestAccepted` | User | Alternative acceptance event | `{ sessionId }` |
| `SessionRequestRejected` | User | Session rejected | `{ sessionId }` |
| `SessionEnded` | Both | Session terminated | `{ sessionId }` |
| `NewSessionRequest` | Consultant | New session request | `{ sessionId, userId, userName }` |

### **Methods Invoked by Client:**

| Method Name | Called By | Purpose | Parameters |
|-------------|-----------|---------|------------|
| `JoinSession` | Both | Join SignalR group for session | `sessionId: string` |
| `SendMessage` | Both (optional) | Send message via SignalR | `sessionId: string, message: string` |

---

## 🔧 **Browser DevTools Checklist**

### **Console Tab:**
- [ ] No red errors
- [ ] See "🔌 Starting SignalR connection..."
- [ ] See "✅ SignalR connection established"
- [ ] See "🚪 Joining session: ..."
- [ ] See "📩 Message received via SignalR" when messages sent

### **Network Tab:**
- [ ] WebSocket connection to `/chatHub` shows "101 Switching Protocols"
- [ ] WebSocket status is "OPEN" (green)
- [ ] See frames being sent/received

### **Application Tab:**
- [ ] localStorage has `token` key
- [ ] Token is not expired

---

## 🚨 **Emergency Debugging**

### **If Nothing Works:**

1. **Clear everything:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   // Refresh page
   ```

2. **Check backend is running:**
   - Navigate to `http://localhost:5041/chatHub`
   - Should see "Connection ID required" or similar

3. **Verify token:**
   ```javascript
   console.log(localStorage.getItem('token'));
   // Should see JWT token
   ```

4. **Test SignalR manually:**
   ```javascript
   const connection = new signalR.HubConnectionBuilder()
       .withUrl("http://localhost:5041/chatHub", {
           accessTokenFactory: () => localStorage.getItem('token')
       })
       .build();
   
   connection.on("ReceiveMessage", (msg) => {
       console.log("TEST MESSAGE:", msg);
   });
   
   await connection.start();
   console.log("Connection started");
   ```

5. **Check backend logs:**
   - Look for `JoinSession` invocations
   - Look for message broadcasts
   - Look for connection errors

---

## 📞 **Support Checklist**

When reporting issues, include:

- [ ] Browser console logs (full output)
- [ ] Network tab WebSocket frames
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] User role (User or Consultant)
- [ ] Session ID
- [ ] Timestamp of issue

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2026-02-10
