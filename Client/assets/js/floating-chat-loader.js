(function () {
  // Use relative path for production, works with nginx proxy
  const API_BASE_URL = "/api/chat";
  const WELCOME_TEMPLATE = `
      <div class="welcome-message">
        <div class="welcome-icon">
          <img src="/assets/images/chatbot.png" alt="Chatbot" />
        </div>
        <h2>Xin chào! Tôi có thể giúp gì?</h2>
        <p>Trợ lý AI của EternaPic Studio</p>
      </div>
    `;
  const getStoredUser = () => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Invalid cached user payload:", error);
      localStorage.removeItem("user");
      return null;
    }
  };

  const getUserIdentifier = () => {
    const user = getStoredUser();
    return user?._id || user?.id || null;
  };

  const getConversationStorageKey = () => {
    const userId = getUserIdentifier();
    return userId ? `chatConversationId_${userId}` : "chatConversationId";
  };

  const getMessageStorageKey = () => {
    const userId = getUserIdentifier();
    return userId ? `chatSessionMessages_${userId}` : null;
  };

  const getCurrentConversationId = () => {
    const key = getConversationStorageKey();
    return key ? localStorage.getItem(key) : null;
  };

  const setCurrentConversationId = (id) => {
    const key = getConversationStorageKey();
    if (!key) return;
    if (id) {
      localStorage.setItem(key, id);
    } else {
      localStorage.removeItem(key);
    }
  };

  // Session messages - temporary storage for current chat session
  const getSessionMessages = () => {
    const key = getMessageStorageKey();
    if (!key) return [];
    try {
      const messages = localStorage.getItem(key);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.warn("Unable to parse cached chat messages:", error);
      localStorage.removeItem(key);
      return [];
    }
  };

  const persistSessionMessages = (messages) => {
    const key = getMessageStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(messages));
  };

  const addSessionMessage = (role, content) => {
    const messages = getSessionMessages();
    messages.push({ role, content, timestamp: new Date().toISOString() });
    persistSessionMessages(messages);
  };

  const clearSessionMessages = () => {
    const messageKey = getMessageStorageKey();
    if (messageKey) {
      localStorage.removeItem(messageKey);
    }
    const conversationKey = getConversationStorageKey();
    if (conversationKey) {
      localStorage.removeItem(conversationKey);
    }
    currentConversationId = null;
  };

  const showWelcomeMessage = () => {
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
      chatMessages.innerHTML = WELCOME_TEMPLATE;
    }
  };

  const renderStoredMessages = () => {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const messages = getSessionMessages();
    if (!messages.length) {
      showWelcomeMessage();
      return;
    }

    chatMessages.innerHTML = "";
    messages.forEach((msg) => {
      addMessageToChat(msg.role, msg.content, { skipScroll: true });
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // Save session messages to database
  const saveSessionToDatabase = async () => {
    const messages = getSessionMessages();
    if (messages.length === 0) return;

    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      // Get current conversation ID or create new one
      const convId = currentConversationId || new Date().getTime().toString();

      const transcript = messages
        .map((msg) => {
          const label = msg.role === "user" ? "User" : "AI";
          const time = msg.timestamp
            ? new Date(msg.timestamp).toLocaleString("vi-VN")
            : "";
          return time
            ? `[${time}] ${label}: ${msg.content}`
            : `${label}: ${msg.content}`;
        })
        .join("\n");

      if (!transcript.trim()) {
        clearSessionMessages();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/transcripts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          conversationId: convId,
          transcript,
          messageCount: messages.length,
          lastMessageAt: messages[messages.length - 1]?.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive chat transcript");
      }
    } catch (error) {
      console.error("Error saving session to database:", error);
    } finally {
      clearSessionMessages();
    }
  };

  let currentConversationId = getCurrentConversationId();
  let token = localStorage.getItem("token");

  function createFloatingChat() {
    // Tạo CSS
    const style = document.createElement("style");
    style.textContent = `
      .floating-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chat-label {
        background: white;
        color: #1a1a1a;
        padding: 10px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        white-space: nowrap;
        opacity: 1;
        visibility: visible;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .chat-label.hidden {
        opacity: 0;
        visibility: hidden;
      }

      .chat-toggle-btn {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: white;
        border: 2px solid #1a1a1a;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 9999;
        opacity: 1;
        visibility: visible;
      }

      .chat-toggle-btn.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .chat-toggle-btn:hover {
        transform: scale(1.08);
        background: #f7fafc;
        border-color: #2a2a2a;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }

      .chat-toggle-btn:active {
        transform: scale(0.95);
      }

      .chat-toggle-btn svg {
        width: 24px;
        height: 24px;
        stroke: white;
        fill: none;
        stroke-width: 2;
      }

      .chat-toggle-btn img {
        width: 34px;
        height: 34px;
        object-fit: contain;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      .chat-window {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 280px;
        height: 400px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        display: none;
        animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
      }

      .chat-window.active {
        display: flex;
      }

      @keyframes slideUp {
        from { 
          opacity: 0; 
          transform: translateY(30px) scale(0.95); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0) scale(1); 
        }
      }

      .chat-window-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        background: white;
        color: #1a1a1a;
        position: relative;
        border-bottom: 2px solid #e2e8f0;
      }

      .chat-window-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-icon {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }

      .close-btn {
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        padding: 0;
      }

      .close-btn:hover {
        background: #e2e8f0;
        border-color: #cbd5e0;
      }

      .close-btn svg {
        width: 14px;
        height: 14px;
        stroke: #1a1a1a;
        stroke-width: 2;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #f7fafc;
      }

      .welcome-message {
        text-align: center;
        padding: 28px 16px 20px;
        animation: fadeIn 0.6s ease-out;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .welcome-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 8px;
        animation: float 3s ease-in-out infinite;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .welcome-icon img {
        width: 70%;
        height: 70%;
        object-fit: contain;
        mix-blend-mode: multiply;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .welcome-message h2 {
        margin: 0;
        font-size: 17px;
        color: #1a1a1a;
        font-weight: 700;
        letter-spacing: -0.3px;
      }

      .welcome-message p {
        font-size: 12px;
        margin: 0;
        line-height: 1.5;
        color: #64748b;
        max-width: 200px;
      }



      .message {
        display: flex;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .message.user {
        justify-content: flex-end;
      }

      .message.assistant {
        justify-content: flex-start;
      }

      .message-avatar {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .user .message-avatar {
        background: #1a1a1a;
        border: 1px solid #333;
        order: 2;
      }

      .assistant .message-avatar {
        background: white;
        border: 1px solid #e2e8f0;
      }

      .message-avatar svg {
        width: 14px;
        height: 14px;
      }

      .user .message-avatar svg {
        stroke: white;
        fill: none;
        stroke-width: 2;
      }

      .assistant .message-avatar svg {
        stroke: #1a1a1a;
        fill: none;
        stroke-width: 2;
      }

      .message-content {
        max-width: 75%;
        padding: 8px 12px;
        border-radius: 12px;
        word-wrap: break-word;
        line-height: 1.4;
        font-size: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        position: relative;
      }

      .user .message-content {
        background: #1a1a1a;
        color: white;
        border-bottom-right-radius: 3px;
      }

      .user .message-content::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: -4px;
        width: 0;
        height: 0;
        border-left: 6px solid #1a1a1a;
        border-bottom: 6px solid transparent;
      }

      .assistant .message-content {
        background: white;
        color: #1a1a1a;
        border: 1px solid #e2e8f0;
        border-bottom-left-radius: 3px;
      }

      .assistant .message-content::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: -4px;
        width: 0;
        height: 0;
        border-right: 6px solid white;
        border-bottom: 6px solid transparent;
      }

      .loading-indicator {
        display: flex;
        gap: 4px;
        padding: 6px 10px;
        background: white;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        align-items: center;
        max-width: fit-content;
      }

      .loading-dot {
        width: 5px;
        height: 5px;
        background: linear-gradient(135deg, #666 0%, #999 100%);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out;
      }

      .loading-dot:nth-child(1) { animation-delay: 0s; }
      .loading-dot:nth-child(2) { animation-delay: 0.2s; }
      .loading-dot:nth-child(3) { animation-delay: 0.4s; }

      .chat-input-form {
        display: flex;
        gap: 6px;
        padding: 10px 12px;
        background: white;
        border-top: 1px solid #e2e8f0;
      }

      #messageInput {
        flex: 1;
        padding: 8px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 16px;
        font-size: 12px;
        outline: none;
        transition: all 0.2s;
        font-family: inherit;
        background: #f7fafc;
      }

      #messageInput:focus {
        border-color: #1a1a1a;
        background: white;
        box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.08);
      }

      #messageInput::placeholder {
        color: #a0aec0;
      }

      .send-btn {
        background: #1a1a1a;
        color: white;
        border: 1px solid #333;
        padding: 8px 16px;
        border-radius: 16px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        transition: all 0.2s;
        font-family: inherit;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      .send-btn:hover:not(:disabled) {
        background: #2a2a2a;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      }

      .send-btn:active:not(:disabled) {
        transform: translateY(0);
        background: #0a0a0a;
      }

      .send-btn:disabled {
        background: #e2e8f0;
        color: #a0aec0;
        border-color: #e2e8f0;
        cursor: not-allowed;
        box-shadow: none;
      }

      .chat-messages::-webkit-scrollbar {
        width: 8px;
      }

      .chat-messages::-webkit-scrollbar-track {
        background: transparent;
        margin: 10px 0;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #d0d0d0 0%, #b0b0b0 100%);
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      .chat-messages::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #b0b0b0 0%, #909090 100%);
        background-clip: padding-box;
      }

      @media (max-width: 480px) {
        .chat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 120px);
          bottom: 70px !important;
          right: 20px !important;
          left: auto !important;
        }

        .message-content {
          max-width: 80%;
        }
      }
    `;
    document.head.appendChild(style);

    // Tạo HTML
    const widget = document.createElement("div");
    widget.className = "floating-chat-widget";
    widget.innerHTML = `
      <div class="chat-label" id="chatLabel">Chat với chúng tôi</div>
      <button class="chat-toggle-btn" id="chatToggleBtn" title="Mở Chat">
        <img src="/assets/images/chatbot.png" alt="Chat" />
      </button>
      <div class="chat-window" id="chatWindow">
        <div class="chat-window-header">
          <h3>
            <img src="/assets/images/chatbot.png" alt="Chatbot" class="header-icon" />
            Trợ lý ảo
          </h3>
          <button class="close-btn" id="closeBtn" title="Đóng">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="chat-messages" id="chatMessages">
          <div class="welcome-message">
          </div>
        </div>

        <form class="chat-input-form" id="chatForm">
          <input type="text" id="messageInput" placeholder="Nhập tin nhắn..." autocomplete="off" required />
          <button type="submit" class="send-btn">Gửi</button>
        </form>
      </div>
    `;
    document.body.appendChild(widget);

    document.body.appendChild(widget);
    renderStoredMessages();

    // Setup event listeners
    setupChatHandlers();
  }

  function setupChatHandlers() {
    const toggleBtn = document.getElementById("chatToggleBtn");
    const closeBtn = document.getElementById("closeBtn");
    const chatWindow = document.getElementById("chatWindow");
    const chatLabel = document.getElementById("chatLabel");
    const form = document.getElementById("chatForm");

    // Auto toggle label every 10 seconds
    let labelInterval = setInterval(() => {
      if (!chatWindow.classList.contains("active")) {
        chatLabel.classList.toggle("hidden");
      }
    }, 10000);

    toggleBtn.addEventListener("click", () => {
      chatWindow.classList.add("active");
      toggleBtn.classList.add("hidden");
      chatLabel.classList.add("hidden");
      clearInterval(labelInterval);

      document.getElementById("messageInput").focus();

      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        showWelcomeMessage();
        return;
      }

      token = currentToken;
      currentConversationId = getCurrentConversationId();
      renderStoredMessages();
    });

    closeBtn.addEventListener("click", () => {
      chatWindow.classList.remove("active");
      toggleBtn.classList.remove("hidden");
      chatLabel.classList.remove("hidden");
      
      // Restart label animation
      labelInterval = setInterval(() => {
        if (!chatWindow.classList.contains("active")) {
          chatLabel.classList.toggle("hidden");
        }
      }, 10000);
    });

    form.addEventListener("submit", handleSendMessage);
  }

  async function handleSendMessage(e) {
    e.preventDefault();

    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message) return;

    // Check current token
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      alert("Vui lòng đăng nhập để sử dụng chatbot");
      window.location.href = "/login.html";
      return;
    }

    token = currentToken;

    messageInput.value = "";
    const sendBtn = document.querySelector(".send-btn");
    sendBtn.disabled = true;

    addMessageToChat("user", message);
    addSessionMessage("user", message);

    try {
      addLoadingIndicator();

      const response = await fetch(`${API_BASE_URL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi gửi tin nhắn");
      }

      const data = await response.json();
      removeLoadingIndicator();

      if (!currentConversationId) {
        currentConversationId = data.conversationId;
        setCurrentConversationId(currentConversationId);
      }

      addMessageToChat("assistant", data.assistantMessage);
      addSessionMessage("assistant", data.assistantMessage);
    } catch (error) {
      console.error("Error:", error);
      removeLoadingIndicator();
      const errorMsg = "❌ Lỗi: " + error.message;
      addMessageToChat("assistant", errorMsg);
      addSessionMessage("assistant", errorMsg);
    } finally {
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }

  function addMessageToChat(role, content, options = {}) {
    const chatMessages = document.getElementById("chatMessages");

    const welcomeMsg = chatMessages.querySelector(".welcome-message");
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    
    if (role === "user") {
      avatar.innerHTML = `
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `;
    } else {
      avatar.innerHTML = `
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"/>
          <circle cx="12" cy="5" r="2"/>
          <path d="M12 7v4"/>
          <line x1="8" y1="16" x2="8" y2="16"/>
          <line x1="16" y1="16" x2="16" y2="16"/>
        </svg>
      `;
    }

    const content_div = document.createElement("div");
    content_div.className = "message-content";
    content_div.textContent = content;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content_div);

    chatMessages.appendChild(messageDiv);
    if (!options.skipScroll) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function addLoadingIndicator() {
    const chatMessages = document.getElementById("chatMessages");
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message assistant";
    loadingDiv.id = "loadingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = `
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <circle cx="12" cy="5" r="2"/>
        <path d="M12 7v4"/>
        <line x1="8" y1="16" x2="8" y2="16"/>
        <line x1="16" y1="16" x2="16" y2="16"/>
      </svg>
    `;

    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = `
      <div class="loading-indicator">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    `;

    loadingDiv.appendChild(avatar);
    loadingDiv.appendChild(content);

    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeLoadingIndicator() {
    const loadingDiv = document.getElementById("loadingIndicator");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  if (typeof window !== "undefined") {
    window.flushChatSession = saveSessionToDatabase;
    window.clearLocalChatSession = clearSessionMessages;
    window.renderStoredChatMessages = renderStoredMessages;
  }

  // Initialize khi DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createFloatingChat);
  } else {
    createFloatingChat();
  }
})();
