document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    let currentAudio = null;

    // Press to Talk logic
    const pressToTalkBtn = document.getElementById('press-to-talk');
    let mediaRecorder = null;
    let audioChunks = [];
    let holdTimeout = null;

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function linkify(text) {
        // Convert URLs to clickable links
        return text.replace(/(https?:\/\/[^\s]+|\/documents\/[^\s]+)/g, function(url) {
            let displayUrl = url;
            if (url.startsWith('/documents/')) {
                displayUrl = 'Download Document';
            }
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
        });
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, true);
        userInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            if (data.error) {
                addMessage('Error: ' + data.error);
                return;
            }

            // Add assistant's response
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant';
            
            const messageText = document.createElement('span');
            messageText.innerHTML = linkify(data.response);
            messageDiv.appendChild(messageText);

            // Add audio player if audio URL is provided
            if (data.audio_url) {
                const audio = document.createElement('audio');
                audio.src = data.audio_url;
                audio.style.display = 'none'; // Hide the player
                document.body.appendChild(audio); // Attach to DOM so it can play
                audio.play();

                // Stop previous audio if needed
                if (currentAudio && currentAudio !== audio) {
                    currentAudio.pause();
                    currentAudio.remove();
                }
                currentAudio = audio;

                // Remove audio element after playback
                audio.addEventListener('ended', () => {
                    audio.remove();
                });
            }

            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            addMessage('Error: Could not send message. Please try again.');
            console.error('Error:', error);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Pre-question buttons logic
    document.querySelectorAll('.pre-question').forEach(btn => {
        btn.addEventListener('click', () => {
            userInput.value = btn.textContent;
            sendMessage();
        });
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    if (pressToTalkBtn) {
        pressToTalkBtn.addEventListener('mousedown', async () => {
            pressToTalkBtn.classList.add('active');
            holdTimeout = setTimeout(() => {
                pressToTalkBtn.classList.add('ready');
            }, 1000);
            if (!mediaRecorder) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) audioChunks.push(e.data);
                    };
                    mediaRecorder.onstop = async () => {
                        pressToTalkBtn.classList.remove('active', 'ready');
                        clearTimeout(holdTimeout);
                        if (audioChunks.length > 0) {
                            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                            audioChunks = [];
                            // Send audio to backend for transcription
                            const formData = new FormData();
                            formData.append('audio', audioBlob, 'input.webm');
                            const resp = await fetch('/api/transcribe', {
                                method: 'POST',
                                body: formData
                            });
                            const data = await resp.json();
                            if (data.text) {
                                userInput.value = data.text;
                                sendMessage();
                            }
                        }
                    };
                } catch (err) {
                    alert('Microphone access denied or not available.');
                    pressToTalkBtn.classList.remove('active', 'ready');
                    clearTimeout(holdTimeout);
                    return;
                }
            }
            audioChunks = [];
            mediaRecorder.start();
        });
        ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
            pressToTalkBtn.addEventListener(evt, () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                pressToTalkBtn.classList.remove('active', 'ready');
                clearTimeout(holdTimeout);
            });
        });
    }
}); 