document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages-container');
    const quickReplies = document.getElementById('quick-replies');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    
    // Tab switching elements
    const chatTabBtn = document.getElementById('chat-tab-btn');
    const leadsTabBtn = document.getElementById('leads-tab-btn');
    const chatPanel = document.getElementById('chat-panel');
    const leadsPanel = document.getElementById('leads-panel');
    const refreshLeadsBtn = document.getElementById('refresh-leads-btn');
    const leadsTableBody = document.getElementById('leads-table-body');
    const leadsCountBadge = document.getElementById('leads-count');
    
    // Quick nav buttons in sidebar
    const quickNavButtons = document.querySelectorAll('.quick-nav-btn');

    // Check if admin mode is enabled via URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';
    
    // Hide leads tab by default unless in admin mode
    if (isAdmin) {
        leadsTabBtn.style.display = 'flex';
    } else {
        leadsTabBtn.style.display = 'none';
    }

    // Speech Recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            voiceInputBtn.classList.add('recording');
            userInput.placeholder = "Listening...";
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            stopRecording();
        };

        recognition.onend = () => {
            stopRecording();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            chatForm.dispatchEvent(new Event('submit'));
        };
    } else {
        voiceInputBtn.style.display = 'none'; // Hide if not supported by browser
    }

    function stopRecording() {
        isRecording = false;
        voiceInputBtn.classList.remove('recording');
        userInput.placeholder = "Ask about AI services, products, marketing, or scheduling...";
    }

    if (voiceInputBtn && recognition) {
        voiceInputBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    }

    // Theme Toggle Functionality
    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    document.body.className = savedTheme;
    updateThemeToggleUI();

    themeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.className = 'light-theme';
            localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.className = 'dark-theme';
            localStorage.setItem('theme', 'dark-theme');
        }
        updateThemeToggleUI();
    });

    function updateThemeToggleUI() {
        const isDark = document.body.classList.contains('dark-theme');
        const icon = themeToggle.querySelector('i');
        const span = themeToggle.querySelector('span');
        
        if (isDark) {
            icon.className = 'fa-solid fa-sun';
            span.textContent = 'Light Theme';
        } else {
            icon.className = 'fa-solid fa-moon';
            span.textContent = 'Dark Theme';
        }
    }

    // Scroll to bottom helper
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Formatting date helper
    const defFormatTime = (dateStr) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Render a single message bubble
    function appendMessage(sender, text, timestamp = null) {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', `${sender}-row`);

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message');

        // Apply markdown formatting for bot responses using marked.js
        if (sender === 'bot') {
            messageBubble.innerHTML = marked.parse(text);
        } else {
            messageBubble.textContent = text;
        }

        const meta = document.createElement('div');
        meta.classList.add('message-meta');
        meta.textContent = defFormatTime(timestamp);
        messageBubble.appendChild(meta);

        // Add TTS and copy options to Bot responses
        if (sender === 'bot') {
            const controls = document.createElement('div');
            controls.classList.add('message-controls');
            
            // Speak Button
            const speakBtn = document.createElement('button');
            speakBtn.className = 'msg-action-btn';
            speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            speakBtn.title = "Read aloud";
            speakBtn.addEventListener('click', () => {
                speakText(text);
            });
            
            // Copy Button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'msg-action-btn';
            copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
            copyBtn.title = "Copy message";
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
                    }, 2000);
                });
            });

            controls.appendChild(speakBtn);
            controls.appendChild(copyBtn);
            messageBubble.appendChild(controls);
        }

        messageRow.appendChild(messageBubble);
        chatMessages.appendChild(messageRow);
        scrollToBottom();
    }

    // Text to Speech logic
    function speakText(text) {
        // Strip markdown and HTML tags for speech synthesis
        const cleanedText = text.replace(/<[^>]*>/g, '').replace(/[\*#_\-`\[\]]/g, '');
        
        // Stop current speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        // Find a professional-sounding english voice if possible
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices.find(v => v.lang.includes('en'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        window.speechSynthesis.speak(utterance);
    }

    // Bouncing typing indicator
    let typingIndicatorElement = null;

    function showTypingIndicator() {
        if (typingIndicatorElement) return;

        const row = document.createElement('div');
        row.classList.add('message-row', 'bot-row', 'typing-row');

        const bubble = document.createElement('div');
        bubble.classList.add('message');
        
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.classList.add('typing-dot');
            indicator.appendChild(dot);
        }

        bubble.appendChild(indicator);
        row.appendChild(bubble);
        chatMessages.appendChild(row);
        typingIndicatorElement = row;
        scrollToBottom();
    }

    function removeTypingIndicator() {
        if (typingIndicatorElement) {
            typingIndicatorElement.remove();
            typingIndicatorElement = null;
        }
    }

    // Load Chat History
    async function loadChatHistory() {
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            
            chatMessages.innerHTML = '';
            
            if (data.history && data.history.length > 0) {
                data.history.forEach(msg => {
                    appendMessage(msg.sender, msg.message, msg.timestamp);
                });
            } else {
                // Prepopulate welcome message if history is empty
                const welcomeText = "Hello! Welcome to **SAIntellect Solutions**.\nI am **IntellectAI**, your digital consulting assistant. How can I help you today?\n\nWe are an award-winning, STPI-recognized IT galaxy helping businesses grow with AI-driven innovation and custom products.\n\nHere are some things you can ask me:\n1. 🌐 **Our IT & AI Services**\n2. 📦 **Our Software Products**\n3. 📈 **Digital Transformation & Marketing**\n4. 👩‍💻 **Pratibhabatee Initiative**\n5. 📅 **Schedule a Consultation**\n6. 📍 **Company Contact & Locations**";
                appendMessage('bot', welcomeText);
            }
        } catch (e) {
            console.error("Error loading chat history:", e);
        }
    }

    // Submit user message
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.strip ? userInput.value.strip() : userInput.value.trim();
        if (!message) return;

        // Append user bubble
        appendMessage('user', message);
        userInput.value = '';

        // Show bot typing
        showTypingIndicator();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await res.json();
            removeTypingIndicator();

            if (data.status === 'success') {
                appendMessage('bot', data.response);
                // Refresh lead count if it was a schedule confirmation and user is admin
                if (isAdmin && (data.response.includes('Success!') || data.response.toLowerCase().includes('consultation has been recorded'))) {
                    fetchLeads();
                }
            } else {
                appendMessage('bot', "Sorry, I ran into an error processing your query. Please try again.");
            }
        } catch (err) {
            console.error(err);
            removeTypingIndicator();
            appendMessage('bot', "Network error. Please check your backend server and connection.");
        }
    });

    // Clear Chat
    clearChatBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear this conversation?")) {
            try {
                await fetch('/api/clear', { method: 'POST' });
                chatMessages.innerHTML = '';
                const welcomeText = "Hello! Welcome to **SAIntellect Solutions**.\nI am **IntellectAI**, your digital consulting assistant. How can I help you today?\n\nWe are an award-winning, STPI-recognized IT galaxy helping businesses grow with AI-driven innovation and custom products.\n\nHere are some things you can ask me:\n1. 🌐 **Our IT & AI Services**\n2. 📦 **Our Software Products**\n3. 📈 **Digital Transformation & Marketing**\n4. 👩‍💻 **Pratibhabatee Initiative**\n5. 📅 **Schedule a Consultation**\n6. 📍 **Company Contact & Locations**";
                appendMessage('bot', welcomeText);
            } catch (err) {
                console.error("Error clearing chat:", err);
            }
        }
    });

    // Quick reply pill click event
    quickReplies.addEventListener('click', (e) => {
        if (e.target.classList.contains('reply-chip')) {
            const query = e.target.getAttribute('data-msg');
            userInput.value = query;
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Quick sidebar actions
    quickNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            let textToSend = "";
            switch (query) {
                case 'about': textToSend = "Tell me about SAIntellect Solutions."; break;
                case 'services': textToSend = "What IT & AI services do you offer?"; break;
                case 'products': textToSend = "What enterprise software products do you offer?"; break;
                case 'marketing': textToSend = "Tell me about digital marketing & transformation."; break;
                case 'pratibhabatee': textToSend = "What is the Pratibhabatee Initiative?"; break;
                case 'schedule': textToSend = "I want to schedule a consultation."; break;
                case 'contact': textToSend = "Where are your office locations and contact info?"; break;
            }
            if (textToSend) {
                // Switch tab back to chat
                chatTabBtn.click();
                userInput.value = textToSend;
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Tab switcher logic
    chatTabBtn.addEventListener('click', () => {
        chatTabBtn.classList.add('active');
        leadsTabBtn.classList.remove('active');
        chatPanel.classList.add('active');
        leadsPanel.classList.remove('active');
    });

    leadsTabBtn.addEventListener('click', () => {
        leadsTabBtn.classList.add('active');
        chatTabBtn.classList.remove('active');
        leadsPanel.classList.add('active');
        chatPanel.classList.remove('active');
        fetchLeads();
    });

    // Fetch Leads from Backend
    async function fetchLeads() {
        try {
            const res = await fetch('/api/leads');
            const data = await res.json();
            
            leadsTableBody.innerHTML = '';
            
            if (data.leads && data.leads.length > 0) {
                leadsCountBadge.textContent = data.leads.length;
                leadsCountBadge.style.display = 'inline-block';
                
                data.leads.forEach(lead => {
                    const row = document.createElement('tr');
                    
                    const idCol = document.createElement('td');
                    idCol.textContent = `#${lead.id}`;
                    
                    const nameCol = document.createElement('td');
                    nameCol.innerHTML = `<strong>${lead.name}</strong>`;
                    
                    const emailCol = document.createElement('td');
                    emailCol.textContent = lead.email;
                    
                    const serviceCol = document.createElement('td');
                    serviceCol.innerHTML = `<span class="client-badge">${lead.service_needed || 'General Consultation'}</span>`;
                    
                    const msgCol = document.createElement('td');
                    msgCol.textContent = lead.message || '-';
                    
                    const dateCol = document.createElement('td');
                    const date = new Date(lead.timestamp);
                    dateCol.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    row.appendChild(idCol);
                    row.appendChild(nameCol);
                    row.appendChild(emailCol);
                    row.appendChild(serviceCol);
                    row.appendChild(msgCol);
                    row.appendChild(dateCol);
                    
                    leadsTableBody.appendChild(row);
                });
            } else {
                leadsCountBadge.textContent = '0';
                leadsCountBadge.style.display = 'none';
                leadsTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="no-data">No consultation leads generated yet. Try typing "schedule" in the chat!</td>
                    </tr>
                `;
            }
        } catch (e) {
            console.error("Error fetching leads:", e);
        }
    }

    refreshLeadsBtn.addEventListener('click', fetchLeads);

    // Initial setups
    loadChatHistory();
    if (isAdmin) {
        fetchLeads(); // run once to get initial badge counts for admin
    }
});
