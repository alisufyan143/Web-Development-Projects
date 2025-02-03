document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chat-window');
  const chatIcon = document.getElementById('chat-icon');
  const closeChat = document.getElementById('close-chat');
  const backButton = document.getElementById('back-button');
  const chatBody = document.getElementById('chat-body');
  const chatInput = document.getElementById('chat-input');
  let currentStep = 0;
  const responses = {};
  // Store each Q/A container for clean "Back" navigation.
  const messageContainers = [];

  // Revised Questions Array with logical grouping.
  // Group 1: Service Request & Urgency (indices 0-2)
  // Group 2: Issue Description (indices 3-4)
  // Group 3: Patient Status & History (indices 5-9)
  // Group 4: Insurance Information (indices 10-11)
  // Group 5: Dental Question Specifics (indices 12-14)
  // Group 6: Appointment Preferences & Additional Services (indices 15-19)
  // Group 7: Contact Information (indices 20-24)
  const questions = [
    {
      type: 'checkbox',
      question: 'This request is for? (Select all)',
      options: [
        'Find a dentist (Free)',
        'Ask a dental question (Free)',
        '15-min Video consult ($59)',
        'Video consult + Rx ($69)'
      ],
      required: true
    },
    {
      type: 'radio',
      question: 'Emergency?',
      options: ['Yes', 'No'],
      required: true
    },
    {
      type: 'select',
      question: 'Pain Level?',
      options: ['Low', 'Medium', 'High'],
      required: true
    },
    {
      type: 'text',
      question: 'Briefly explain your issue:',
      placeholder: 'E.g., tooth pain when chewing...',
      required: true
    },
    {
      type: 'text',
      question: 'What is the reason for your appointment?',
      placeholder: 'Describe your reason...',
      required: true
    },
    {
      type: 'radio',
      question: 'Are you a new patient or an existing patient?',
      options: ['New', 'Existing'],
      required: true
    },
    {
      type: 'radio',
      question: 'When was the last time you visited a dental office?',
      options: ['Less than 6 months ago', '6-12 months ago', 'More than 1 year ago'],
      required: true
    },
    {
      type: 'radio',
      question: 'Are you currently a patient at our office?',
      options: ['Yes', 'No'],
      required: true
    },
    {
      type: 'radio',
      question: 'When was your last dental x-ray?',
      options: ['Within 6 months', 'Within 1 year', 'Over 1 year ago'],
      required: true
    },
    {
      type: 'radio',
      question: 'When was your last prophylaxis cleaning?',
      options: ['Within 6 months', 'Within 1 year', 'Over 1 year ago'],
      required: true
    },
    {
      type: 'radio',
      question: 'Do you have dental insurance?',
      options: ['Yes', 'No'],
      required: true
    },
    {
      type: 'text',
      question: 'If yes, which company?',
      placeholder: 'Insurance provider name...',
      required: false
    },
    {
      type: 'select',
      question: 'Which best describes your dental question?',
      options: [
        'Seeking dental information',
        'Dental pain / Toothache',
        'Cosmetic dental',
        'Gum care',
        'Dental implant',
        'Children’s dental care',
        'Orthodontics / Braces / Aligners',
        'Root Canal',
        'Other'
      ],
      required: true
    },
    {
      type: 'text',
      question: 'Please briefly describe your dental question:',
      placeholder: 'Enter your question...',
      required: true
    },
    {
      type: 'text',
      question: 'Please briefly explain your question:',
      placeholder: 'Enter details here...',
      required: true
    },
    {
      type: 'radio',
      question: 'When would you like to be seen?',
      options: ['As soon as possible', 'When convenient'],
      required: true
    },
    {
      type: 'radio',
      question: 'Would you like a Teledental Video Consultation?',
      options: ['Yes', 'No'],
      required: true
    },
    {
      type: 'text',
      question: 'If yes, provide time zone and location:',
      placeholder: 'Time zone and city/state...',
      required: false
    },
    {
      type: 'radio',
      question: 'Do you want to use our Dental AI Answering system?',
      options: ['Yes', 'No'],
      required: true
    },
    {
      type: 'text',
      question: 'If yes, what dental information would you like to know?',
      placeholder: 'Enter your query...',
      required: false
    },
    {
      type: 'text',
      question: 'What is your name?',
      placeholder: 'Enter your name...',
      required: true
    },
    {
      type: 'email',
      question: 'What is your email address?',
      placeholder: 'Enter your email...',
      required: true
    },
    {
      type: 'email',
      question: 'Confirm your email address:',
      placeholder: 'Re-enter your email...',
      required: true
    },
    {
      type: 'text',
      question: 'What is your phone number? (Optional)',
      placeholder: 'Enter phone number...',
      required: false
    },
    {
      type: 'text',
      question: 'What is your location? (City, State, or ZIP code)',
      placeholder: 'Enter location...',
      required: true
    }
  ];

  // Helper: Add a message container for a Q/A pair
  function addMessageContainer(messageHTML, type = 'bot') {
    const container = document.createElement('div');
    container.className = 'message-container';
    container.innerHTML = `<div class="chat-message ${type === 'bot' ? 'bot-message' : 'user-message'}">${messageHTML}</div>`;
    chatBody.appendChild(container);
    chatBody.scrollTop = chatBody.scrollHeight;
    messageContainers.push(container);
  }

  // Helper: Display a typing indicator, then call a callback
  function showTypingIndicator(callback) {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    setTimeout(() => {
      typingDiv.remove();
      callback();
    }, 600);
  }

  // Render the current question with a progress indicator and input
  function showQuestion() {
    chatInput.innerHTML = '';

    // Progress Indicator
    const progress = document.createElement('div');
    progress.className = 'progress-indicator';
    progress.textContent = `Question ${currentStep + 1} of ${questions.length}`;
    chatInput.appendChild(progress);

    // Show current question as a bot message in a container
    const question = questions[currentStep];
    addMessageContainer(`<span>${question.question}</span>`, 'bot');

    let inputHTML = '';
    switch (question.type) {
      case 'checkbox':
        inputHTML = question.options
          .map(
            option => `<label class="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input type="checkbox" value="${option}" class="chat-input-field"> ${option}
                        </label>`
          )
          .join('');
        break;
      case 'radio':
        inputHTML = question.options
          .map(
            option => `<label class="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input type="radio" name="q${currentStep}" value="${option}" class="chat-input-field"> ${option}
                        </label>`
          )
          .join('');
        break;
      case 'select':
        inputHTML = `<select class="chat-input-field w-full">
                      <option value="" disabled selected>Select an option</option>
                      ${question.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                     </select>`;
        break;
      case 'text':
      case 'email':
        inputHTML = `<input type="${question.type}" class="chat-input-field w-full" placeholder="${question.placeholder}">`;
        break;
    }

    const inputContainer = document.createElement('div');
    inputContainer.innerHTML = inputHTML;
    chatInput.appendChild(inputContainer);

    // Error container for validation messages
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.setAttribute('role', 'alert');
    chatInput.appendChild(errorContainer);

    // Buttons container: Back (if applicable) and Next/Submit
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex justify-between mt-2';

    // Back Button if not the first question
    if (currentStep > 0) {
      backButton.classList.remove('hidden');
      const backBtn = document.createElement('button');
      backBtn.className = 'w-1/3 bg-gray-400 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-500';
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', handleBack);
      buttonsContainer.appendChild(backBtn);
    } else {
      backButton.classList.add('hidden');
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'w-full bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700';
    nextBtn.textContent = currentStep === questions.length - 1 ? 'Submit' : 'Next';
    nextBtn.addEventListener('click', handleNext);
    buttonsContainer.appendChild(nextBtn);

    chatInput.appendChild(buttonsContainer);

    // Set focus to first input field for keyboard accessibility
    const firstInput = chatInput.querySelector('.chat-input-field');
    if (firstInput) firstInput.focus();
  }

  // Validate input, store response, and transition to the next question
  function handleNext() {
    const question = questions[currentStep];
    let response;
    let isValid = true;
    let errorMessage = '';

    if (question.type === 'checkbox') {
      const inputs = chatInput.querySelectorAll('input[type="checkbox"]');
      const checked = Array.from(inputs).filter(input => input.checked).map(input => input.value);
      if (question.required && checked.length === 0) {
        isValid = false;
        errorMessage = 'Please select at least one option';
      }
      response = checked;
    } else if (question.type === 'radio') {
      const inputs = chatInput.querySelectorAll('input[type="radio"]');
      const checked = Array.from(inputs).find(input => input.checked);
      if (question.required && !checked) {
        isValid = false;
        errorMessage = 'Please select an option';
      }
      response = checked ? checked.value : '';
    } else if (question.type === 'select') {
      const select = chatInput.querySelector('select');
      if (question.required && (!select.value || select.value === '')) {
        isValid = false;
        errorMessage = 'Please select an option';
      }
      response = select.value;
    } else if (question.type === 'text' || question.type === 'email') {
      const input = chatInput.querySelector(`input[type="${question.type}"]`);
      if (question.required && (!input.value || input.value.trim() === '')) {
        isValid = false;
        errorMessage = 'Please provide an answer';
      }
      response = input.value;
    }

    const errorDiv = chatInput.querySelector('.error-message');
    errorDiv.textContent = errorMessage;
    if (!isValid) return;

    // Save response and display user's answer
    responses[`q${currentStep}`] = { question: question.question, response };
    if (Array.isArray(response)) {
      response.forEach(answer => addMessageContainer(answer, 'user'));
    } else {
      addMessageContainer(response, 'user');
    }

    // Branching Logic:
    // After finishing Group 1 (questions 0-2), if "Emergency?" is Yes or "Pain Level?" is High,
    // skip the additional detailed questions (Groups 2-6) and jump to Group 7 (Contact Information)
    if (currentStep === 2) {
      const emergencyResponse = responses.q1.response;
      const painResponse = responses.q2.response;
      if (emergencyResponse === "Yes" || painResponse === "High") {
        // Jump directly to Contact Information (question index 20)
        currentStep = 20;
        chatInput.classList.add('fade-out');
        setTimeout(() => {
          chatInput.classList.remove('fade-out');
          showTypingIndicator(showQuestion);
        }, 300);
        return;
      }
    }

    // Fade out input area, then proceed
    chatInput.classList.add('fade-out');
    setTimeout(() => {
      chatInput.classList.remove('fade-out');
      if (currentStep < questions.length - 1) {
        currentStep++;
        showTypingIndicator(showQuestion);
      } else {
        chatInput.innerHTML = '<div class="text-center text-green-600 py-2">Thank you! Your response has been submitted.</div>';
        console.log('Final responses:', responses);
      }
    }, 300);
  }

  // Handle Back: remove last Q/A container and revert to previous question
  function handleBack() {
    if (currentStep > 0) {
      const lastContainer = messageContainers.pop();
      if (lastContainer) lastContainer.remove();
      delete responses[`q${currentStep}`];
      currentStep--;
      chatInput.classList.add('fade-out');
      setTimeout(() => {
        chatInput.classList.remove('fade-out');
        showQuestion();
      }, 300);
    }
  }

  // Toggle chat panel open/close
  function openChat() {
    chatWindow.classList.add('open');
    chatIcon.style.display = 'none';
    if (chatBody.childElementCount === 0) {
      showTypingIndicator(showQuestion);
    }
  }

  function closeChatPanel() {
    chatWindow.classList.remove('open');
    chatIcon.style.display = 'flex';
  }

  // Event Listeners
  chatIcon.addEventListener('click', openChat);
  closeChat.addEventListener('click', closeChatPanel);
});
