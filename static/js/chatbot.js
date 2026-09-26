/**
 * KalaSetu Sahayak - AI Chatbot Module
 * Powered by Google Gemini API & Web Speech API (STT / TTS)
 * Smart India Hackathon 2026 - SIH26090
 * Ministry of Social Justice & Empowerment (MoSJE)
 */

(function () {
  'use strict';

  // State
  let isChatOpen = false;
  let isRecording = false;
  let isGenerating = false;
  let speechRecognizer = null;
  let chatLanguage = (typeof currentLanguage !== 'undefined' && currentLanguage) ? currentLanguage : (localStorage.getItem('kalakriti_language') || 'en');
  let chatHistory = [];
  let currentlySpeakingUtterance = null;

  // BCP-47 locale map for speech recognition & TTS
  const LANG_LOCALE_MAP = {
    en: 'en-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ta: 'ta-IN',
    te: 'te-IN'
  };
  const LANG_LABEL_MAP = {
    en: '🇬🇧 EN — English',
    hi: '🇮🇳 HI — Hindi',
    kn: '🇮🇳 KN — Kannada',
    ta: '🇮🇳 TA — Tamil',
    te: '🇮🇳 TE — Telugu'
  };

  const STORAGE_KEY = 'kalasetu_chat_history_orange_v2';

  // Initial greeting matching KalaSetu branding
  const INITIAL_GREETING = {
    role: 'model',
    content: "Welcome to KalaSetu AI Assistant! 🙏\nFor a personalized craft and business experience, we request you to please login or proceed as guest.",
    timestamp: "Just now",
    quickOptions: [
      { text: "I would like to proceed with the login.", action: "login" },
      { text: "Proceed without logging in.", action: "guest" }
    ]
  };

  // Helper: Escape HTML to prevent XSS
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Simple Markdown parser for chatbot responses
  function parseMarkdown(text) {
    if (!text) return '';
    let parsed = escapeHTML(text);

    // Bold: **text**
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    parsed = parsed.replace(/(^|[^*])\*(?!\*)(.*?)\*/g, '$1<em>$2</em>');

    // Inline code: `code`
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Split into lines for list processing
    const lines = parsed.split('\n');
    let inList = false;
    let listType = null;
    const processedLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();

      // Bullet list items (• or - or *)
      if (/^[•\-*]\s+/.test(trimmed)) {
        if (!inList || listType !== 'ul') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ul class="list-disc pl-5 my-1.5 space-y-1">');
          inList = true;
          listType = 'ul';
        }
        processedLines.push(`<li>${trimmed.replace(/^[•\-*]\s+/, '')}</li>`);
      }
      // Numbered list items (1. 2.)
      else if (/^\d+\.\s+/.test(trimmed)) {
        if (!inList || listType !== 'ol') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ol class="list-decimal pl-5 my-1.5 space-y-1">');
          inList = true;
          listType = 'ol';
        }
        processedLines.push(`<li>${trimmed.replace(/^\d+\.\s+/, '')}</li>`);
      } else {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        if (trimmed.length > 0) {
          processedLines.push(`<p class="my-1 leading-relaxed">${trimmed}</p>`);
        } else {
          processedLines.push('<div class="h-1.5"></div>');
        }
      }
    });

    if (inList) {
      processedLines.push(`</${listType}>`);
    }

    return processedLines.join('');
  }

  // Strip markdown formatting for Text-To-Speech
  function cleanTextForSpeech(mdText) {
    return mdText
      .replace(/[*#_`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[•\-]\s+/g, ', ')
      .replace(/\n+/g, '. ')
      .trim();
  }

  // Load chat history from localStorage
  function loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        chatHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[Chatbot] Failed to load history:', e);
    }
    if (!chatHistory || chatHistory.length === 0) {
      chatHistory = [{ ...INITIAL_GREETING }];
    }
  }

  // Save history to localStorage
  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-30))); // Keep last 30 turns
    } catch (e) {
      console.warn('[Chatbot] Failed to save history:', e);
    }
  }

  // Initialize Speech Recognition
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Chatbot] SpeechRecognition API not supported on this browser.');
      return null;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.maxAlternatives = 1;

      recognizer.onstart = function () {
        isRecording = true;
        updateMicUI(true);
      };

      recognizer.onresult = function (event) {
        const transcript = Array.from(event.results)
          .map(r => r[0])
          .map(r => r.transcript)
          .join('');

        const input = document.getElementById('chatInput');
        if (input) {
          input.value = transcript;
          input.focus();
        }
      };

      recognizer.onerror = function (event) {
        console.warn('[Chatbot] Speech recognition error:', event.error);
        isRecording = false;
        updateMicUI(false);
        if (event.error === 'not-allowed') {
          showChatToast('Microphone access was denied. Please allow mic permissions in your browser.', 'warning');
        }
      };

      recognizer.onend = function () {
        isRecording = false;
        updateMicUI(false);
      };

      return recognizer;
    } catch (err) {
      console.error('[Chatbot] Error initializing SpeechRecognition:', err);
      return null;
    }
  }

  // Toggle voice recognition
  function toggleVoiceInput() {
    if (!speechRecognizer) {
      speechRecognizer = setupSpeechRecognition();
      if (!speechRecognizer) {
        showChatToast('Voice recognition is not supported in this browser. Please use Chrome, Edge, or a modern mobile browser.', 'warning');
        return;
      }
    }

    if (isRecording) {
      try {
        speechRecognizer.stop();
      } catch (e) {}
      isRecording = false;
      updateMicUI(false);
    } else {
      // BCP-47 locale from language map
      speechRecognizer.lang = LANG_LOCALE_MAP[chatLanguage] || 'en-IN';
      try {
        speechRecognizer.start();
      } catch (err) {
        console.warn('[Chatbot] Failed to start speech recognizer:', err);
        isRecording = false;
        updateMicUI(false);
      }
    }
  }

  // Update UI when mic is recording
  function updateMicUI(active) {
    const micBtn = document.getElementById('chatMicBtn');
    const listeningBadge = document.getElementById('chatListeningBanner');
    if (!micBtn) return;

    if (active) {
      micBtn.classList.add('mic-recording-pulse');
      micBtn.title = 'Listening... Click to stop';
      if (listeningBadge) {
        listeningBadge.classList.remove('hidden');
        listeningBadge.classList.add('active');
        listeningBadge.style.setProperty('display', 'flex', 'important');
      }
    } else {
      micBtn.classList.remove('mic-recording-pulse');
      micBtn.title = 'Speak using microphone';
      if (listeningBadge) {
        listeningBadge.classList.add('hidden');
        listeningBadge.classList.remove('active');
        listeningBadge.style.setProperty('display', 'none', 'important');
      }
    }
  }

  // Text-To-Speech for assistant responses
  function speakMessage(text, buttonEl) {
    if (!('speechSynthesis' in window)) {
      showChatToast('Text-to-Speech is not supported in your browser.', 'info');
      return;
    }

    // If currently speaking, stop
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      document.querySelectorAll('.chat-speak-btn').forEach(btn => btn.classList.remove('text-orange-600', 'font-black'));
      if (currentlySpeakingUtterance && currentlySpeakingUtterance._targetBtn === buttonEl) {
        currentlySpeakingUtterance = null;
        return;
      }
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    // Use correct TTS locale from map
    const locale = LANG_LOCALE_MAP[chatLanguage] || 'en-IN';
    utterance.lang = /[\u0900-\u097F]/.test(cleanText) ? 'hi-IN'
                   : /[\u0C80-\u0CFF]/.test(cleanText) ? 'kn-IN'
                   : /[\u0B80-\u0BFF]/.test(cleanText) ? 'ta-IN'
                   : /[\u0C00-\u0C7F]/.test(cleanText) ? 'te-IN'
                   : locale;
    utterance.rate = 0.95;
    utterance._targetBtn = buttonEl;

    if (buttonEl) {
      buttonEl.classList.add('text-orange-600', 'font-black');
    }

    utterance.onend = function () {
      if (buttonEl) buttonEl.classList.remove('text-orange-600', 'font-black');
      currentlySpeakingUtterance = null;
    };

    utterance.onerror = function () {
      if (buttonEl) buttonEl.classList.remove('text-orange-600', 'font-black');
      currentlySpeakingUtterance = null;
    };

    currentlySpeakingUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Render chat messages into DOM
  // Render chat messages into DOM matching Nykaa customer support UI
  function renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    container.innerHTML = '';

    // Centered timestamp matching Nykaa (e.g. 19:45)
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeDivider = document.createElement('div');
    timeDivider.className = 'nykaa-time-divider';
    timeDivider.innerHTML = `<span>${nowTime}</span>`;
    container.appendChild(timeDivider);

    chatHistory.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const msgDiv = document.createElement('div');

      if (isUser) {
        msgDiv.className = 'nykaa-user-wrapper';
        msgDiv.innerHTML = `
          <div class="nykaa-user-bubble">
            <p class="text-sm leading-relaxed whitespace-pre-wrap">${escapeHTML(msg.content)}</p>
          </div>
          <span class="nykaa-user-time">${msg.timestamp || 'Just now'} <span class="chat-read-tick" title="Delivered">✓✓</span></span>
        `;
      } else {
        msgDiv.className = 'nykaa-bot-wrapper';
        const parsedContent = parseMarkdown(msg.content);
        const isLatestBot = idx === chatHistory.length - 1 && msg._isNew;

        let pillsHtml = '';
        if (msg.quickOptions && Array.isArray(msg.quickOptions) && msg.quickOptions.length > 0) {
          pillsHtml = `
            <div class="flex flex-col items-end w-full mt-2 space-y-1.5">
              ${msg.quickOptions.map(opt => `
                <button type="button" class="nykaa-action-pill" data-action="${escapeHTML(opt.action || '')}" data-text="${escapeHTML(opt.text)}">
                  ${escapeHTML(opt.text)}
                </button>
              `).join('')}
            </div>
          `;
        }

        msgDiv.innerHTML = `
          <span class="nykaa-sender-label">KalaSetu AI</span>
          <div class="nykaa-bot-row">
            <div class="nykaa-bot-avatar">क</div>
            <div class="nykaa-bot-bubble chat-bot-content${isLatestBot ? ' msg-new' : ''}">
              ${parsedContent}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="nykaa-timestamp">${msg.timestamp || 'Just now'}</span>
            <button type="button" class="chat-speak-btn text-[11px] text-slate-400 hover:text-[#ea580c] flex items-center gap-0.5 transition-colors cursor-pointer ml-1" data-idx="${idx}" title="Listen to response">
              <span>🔊</span>
            </button>
          </div>
          ${pillsHtml}
        `;
      }

      container.appendChild(msgDiv);
    });

    // Attach speak button click events
    container.querySelectorAll('.chat-speak-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-idx'), 10);
        if (chatHistory[idx]) {
          speakMessage(chatHistory[idx].content, this);
        }
      });
    });

    // Attach Nykaa quick reply action pill click events
    container.querySelectorAll('.nykaa-action-pill').forEach(btn => {
      btn.addEventListener('click', function () {
        const action = this.getAttribute('data-action');
        const text = this.getAttribute('data-text') || this.innerText.trim();
        handlePillAction(action, text);
      });
    });

    scrollChatToBottom();
  }

  // Handle Nykaa interactive quick reply clicks
  function handlePillAction(action, text) {
    if (action === 'login') {
      chatHistory.push({
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderMessages();
      saveHistory();

      setTimeout(() => {
        chatHistory.push({
          role: 'model',
          content: "Please select how you would like to proceed with login:",
          timestamp: "Just now",
          quickOptions: [
            { text: "👤 Sign In as Artisan Partner", action: "do_login_artisan" },
            { text: "🏢 Institutional Buyer / Bulk RFQ", action: "do_login_buyer" },
            { text: "🛍️ Consumer / Shopper Login", action: "do_login_user" }
          ]
        });
        renderMessages();
        saveHistory();
      }, 400);
    } else if (action === 'guest') {
      chatHistory.push({
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderMessages();
      saveHistory();

      setTimeout(() => {
        chatHistory.push({
          role: 'model',
          content: "Welcome, guest! 🙏 How can KalaSetu Support assist you today?\n\nYou can ask about fair craft pricing, government welfare schemes, or institutional orders.",
          timestamp: "Just now",
          quickOptions: [
            { text: "🏷️ Fair Pricing Formula for Crafts", action: "ask_pricing" },
            { text: "🏛️ PM Vishwakarma Welfare Scheme", action: "ask_scheme" },
            { text: "📸 Smart Catalog Photography Tips", action: "ask_photo" },
            { text: "📦 Institutional Bulk RFQ Procurement", action: "ask_rfq" }
          ]
        });
        renderMessages();
        saveHistory();
      }, 400);
    } else if (action && action.startsWith('do_login')) {
      chatHistory.push({
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      chatHistory.push({
        role: 'model',
        content: "Opening the Account & Login page now... 🚀\n\nYou can sign in using your registered phone number, email address, or Google account.",
        timestamp: "Just now"
      });
      renderMessages();
      saveHistory();
      // Close chatbot and navigate to Account tab
      setTimeout(() => {
        toggleChatbot(false);
        if (typeof window.switchTab === 'function') {
          window.switchTab('account');
        } else {
          // Fallback: click Account nav button
          const accountBtn = document.querySelector('[data-tab-target="account"]');
          if (accountBtn) accountBtn.click();
        }
      }, 600);
    } else if (action === 'ask_pricing') {
      sendMessage("How do I calculate a fair selling price for my handmade craft using KalaSetu's formula?");
    } else if (action === 'ask_scheme') {
      sendMessage("What are the benefits, toolkits, and collateral-free loan provisions of the PM Vishwakarma Scheme?");
    } else if (action === 'ask_photo') {
      sendMessage("What are the best tips to photograph my handicrafts for online cataloging?");
    } else if (action === 'ask_rfq') {
      sendMessage("How can government and corporate institutions place bulk RFQ orders directly with artisan clusters?");
    } else {
      sendMessage(text);
    }
  }

  // Scroll messages container to bottom
  function scrollChatToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  // Display or hide loading typing indicator
  function setTyping(isTyping) {
    isGenerating = isTyping;
    const typingIndicator = document.getElementById('chatTypingIndicator');
    const sendBtn = document.getElementById('chatSendBtn');
    const input = document.getElementById('chatInput');

    if (typingIndicator) {
      if (isTyping) {
        typingIndicator.classList.remove('hidden');
        typingIndicator.classList.add('active');
        typingIndicator.style.setProperty('display', 'flex', 'important');
      } else {
        typingIndicator.classList.add('hidden');
        typingIndicator.classList.remove('active');
        typingIndicator.style.setProperty('display', 'none', 'important');
      }
    }

    if (sendBtn) {
      sendBtn.disabled = isTyping;
      if (isTyping) {
        sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    if (!isTyping && input) {
      input.focus();
    }
    scrollChatToBottom();
  }

  // Send message to Gemini API
  async function sendMessage(textToSend) {
    const input = document.getElementById('chatInput');
    const text = (textToSend || (input ? input.value : '')).trim();

    if (!text || isGenerating) return;

    if (input) {
      input.value = '';
    }

    // Stop recording if active
    if (isRecording && speechRecognizer) {
      try {
        speechRecognizer.stop();
      } catch (e) {}
      isRecording = false;
      updateMicUI(false);
    }

    // Add user message to state
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    chatHistory.push(userMsg);
    renderMessages();
    saveHistory();

    setTyping(true);

    // Animate send button
    const sendBtnAnim = document.getElementById('chatSendBtn');
    if (sendBtnAnim) {
      sendBtnAnim.classList.add('sending');
      setTimeout(() => sendBtnAnim.classList.remove('sending'), 450);
    }

    try {
      // Build conversation payload for backend
      const apiMessages = chatHistory.slice(-10).map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          language: chatLanguage
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || "Namaste! I am here to help you. Could you please rephrase your craft question?";

      chatHistory.push({
        role: 'model',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: data.engine,
        _isNew: true
      });

      renderMessages();
      // Remove shimmer flag after animation
      setTimeout(() => {
        const latestMsg = chatHistory[chatHistory.length - 1];
        if (latestMsg) delete latestMsg._isNew;
      }, 1200);
      saveHistory();

    } catch (err) {
      console.error('[Chatbot] Error communicating with AI endpoint:', err);
      // Fallback response so user always gets an answer
      chatHistory.push({
        role: 'model',
        content: "⚠️ *I experienced a temporary connection hiccup with the AI server, but I am still here to assist you.*\n\nYou can ask about:\n• **Fair price calculation**\n• **PM Vishwakarma scheme registration**\n• **Craft photography tips**\n• **Institutional bulk orders (RFQ)**",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderMessages();
      saveHistory();
    } finally {
      setTyping(false);
    }
  }

  // Toggle open/close of chat modal
  // Toggle open/close of Nykaa chat modal
  function toggleChatbot(forceState) {
    const chatWindow = document.getElementById('chatbotWindow');
    const launcher = document.getElementById('chatbotFloatingContainer');
    const minimizeBtn = document.getElementById('chatMinimizeBtn');

    if (!chatWindow) return;

    if (typeof forceState === 'boolean') {
      isChatOpen = forceState;
    } else {
      isChatOpen = !isChatOpen;
    }

    if (isChatOpen) {
      chatWindow.classList.remove('chat-hidden');
      chatWindow.classList.add('chat-visible');
      if (launcher) launcher.classList.add('hidden');
      if (minimizeBtn) minimizeBtn.classList.remove('hidden');

      const dropdown = document.getElementById('chatDropdownMenu');
      if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.style.setProperty('display', 'none', 'important');
      }

      const input = document.getElementById('chatInput');
      if (input) {
        setTimeout(() => input.focus(), 150);
      }
      scrollChatToBottom();
    } else {
      chatWindow.classList.remove('chat-visible');
      chatWindow.classList.add('chat-hidden');
      if (launcher) launcher.classList.remove('hidden');
      if (minimizeBtn) minimizeBtn.classList.add('hidden');

      const dropdown = document.getElementById('chatDropdownMenu');
      if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.style.setProperty('display', 'none', 'important');
      }

      // Stop speech if speaking
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (isRecording && speechRecognizer) {
        try {
          speechRecognizer.stop();
        } catch (e) {}
        isRecording = false;
        updateMicUI(false);
      }
    }
  }

  // Clear chat history
  function clearChatHistory() {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (speechRecognizer && isRecording) {
      try { speechRecognizer.stop(); } catch (e) {}
      isRecording = false;
      updateMicUI(false);
    }
    chatHistory = [{ ...INITIAL_GREETING }];
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (e) {
      console.warn('[Chatbot] Failed to save cleared history:', e);
    }
    renderMessages();
    const input = document.getElementById('chatInput');
    if (input) input.value = '';
    const fileInput = document.getElementById('chatFileInput');
    if (fileInput) fileInput.value = '';
    showChatToast("Conversation cleared", "info");
  }

  // Toast notification inside chat
  function showChatToast(msg, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
      return;
    }
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    if (toast && toastMsg) {
      toastMsg.innerText = msg;
      toast.classList.remove('-translate-y-10', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => {
        toast.classList.add('-translate-y-10', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
      }, 3000);
    }
  }

  // Toggle chat language — now supports EN, HI, KN, TA, TE
  function toggleLanguage(lang) {
    if (lang && LANG_LOCALE_MAP[lang]) {
      chatLanguage = lang;
    } else {
      // Cycle through languages
      const langs = Object.keys(LANG_LOCALE_MAP);
      const idx = langs.indexOf(chatLanguage);
      chatLanguage = langs[(idx + 1) % langs.length];
    }
    // Update chip active state
    document.querySelectorAll('.chat-lang-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-lang') === chatLanguage);
    });
    const label = LANG_LABEL_MAP[chatLanguage] || chatLanguage.toUpperCase();
    showChatToast(`Language set: ${label}`, 'info');
  }

  // Setup DOM listeners once document is ready
  // Setup DOM listeners once document is ready
  function initChatbot() {
    loadHistory();
    renderMessages();

    // Ensure listening banner and typing indicator are strictly hidden at initialization
    const listeningBadge = document.getElementById('chatListeningBanner');
    if (listeningBadge) {
      listeningBadge.classList.add('hidden');
      listeningBadge.classList.remove('active');
      listeningBadge.style.setProperty('display', 'none', 'important');
    }
    const typingIndicator = document.getElementById('chatTypingIndicator');
    if (typingIndicator) {
      typingIndicator.classList.add('hidden');
      typingIndicator.classList.remove('active');
      typingIndicator.style.setProperty('display', 'none', 'important');
    }

    // Ensure dropdown menu is strictly hidden at initialization
    const dropdownMenu = document.getElementById('chatDropdownMenu');
    if (dropdownMenu) {
      dropdownMenu.classList.add('hidden');
      dropdownMenu.style.setProperty('display', 'none', 'important');
    }

    // Floating Pill Launcher ("How may we help you")
    const launcher = document.getElementById('chatbotFloatingContainer');
    if (launcher) {
      launcher.addEventListener('click', () => toggleChatbot(true));
      launcher.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleChatbot(true);
        }
      });
    }

    // Minimize Down-Chevron Button
    const minimizeBtn = document.getElementById('chatMinimizeBtn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => toggleChatbot(false));
    }

    // Kebab 3-Dots Menu Button & Dropdown
    const menuBtn = document.getElementById('chatMenuBtn');
    const dropdown = document.getElementById('chatDropdownMenu');
    if (menuBtn && dropdown) {
      function openDropdown() {
        dropdown.classList.remove('hidden');
        dropdown.style.display = 'flex';
      }

      function closeDropdown() {
        dropdown.classList.add('hidden');
        dropdown.style.display = 'none';
      }

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = dropdown.classList.contains('hidden') || dropdown.style.display === 'none';
        if (isHidden) {
          openDropdown();
        } else {
          closeDropdown();
        }
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
          closeDropdown();
        }
      });

      // Re-export close function so other handlers can use it
      window._closeChatDropdown = closeDropdown;
    }

    // Close button inside dropdown
    const closeBtn = document.getElementById('chatCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (typeof window._closeChatDropdown === 'function') window._closeChatDropdown();
        toggleChatbot(false);
      });
    }

    // Clear history button inside dropdown
    const clearBtn = document.getElementById('chatClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (typeof window._closeChatDropdown === 'function') window._closeChatDropdown();
        clearChatHistory();
      });
    }

    // Language chip click handlers
    const langChipsContainer = document.getElementById('chat-lang-chips');
    if (langChipsContainer) {
      langChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.chat-lang-chip');
        if (!chip) return;
        const lang = chip.getAttribute('data-lang');
        if (lang) {
          toggleLanguage(lang);
          // Don't close dropdown so user can see the chip change
        }
      });
    }

    // Legacy language button support (if any still in DOM)
    const langBtn = document.getElementById('chatLangBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        toggleLanguage();
        if (dropdown) {
          dropdown.classList.add('hidden');
          dropdown.style.setProperty('display', 'none', 'important');
        }
      });
    }

    // Attachment Paperclip Button & File Input
    const attachBtn = document.getElementById('chatAttachBtn');
    const fileInput = document.getElementById('chatFileInput');
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          const file = this.files[0];
          showChatToast(`Attached: ${file.name}`, 'info');
          sendMessage(`[Attached Photo: ${file.name}] Please assess this craft item.`);
          this.value = '';
        }
      });
    }

    // Mic Voice STT Button
    const micBtn = document.getElementById('chatMicBtn');
    if (micBtn) {
      micBtn.addEventListener('click', toggleVoiceInput);
    }

    // Stop listening button in banner
    const stopListenBtn = document.getElementById('chatListeningStopBtn');
    if (stopListenBtn) {
      stopListenBtn.addEventListener('click', toggleVoiceInput);
    }

    // Send Button
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => sendMessage());
    }

    // Input Keydown: Enter sends message (Shift+Enter adds newline)
    const input = document.getElementById('chatInput');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Expose toggleChatbot globally
    window.toggleKalaSetuChatbot = toggleChatbot;
    window.toggleVoiceInput = toggleVoiceInput;

    console.log('[KalaSetu] AI Chatbot v8 — Multi-language voice, enhanced UI, 21-product catalog initialized.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
