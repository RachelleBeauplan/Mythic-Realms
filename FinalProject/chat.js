
document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const rollDiceButton = document.getElementById('roll-dice-button'); 

  const ws = new WebSocket('ws://127.0.0.1:8080'); 

  let isPlayingGuessGame = false; // track if the guessing game is active

  // Function to add a new message to the chat
  const addMessage = (text, sender) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender;

    const iconDiv = document.createElement('div');
    iconDiv.className = `icon ${sender}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message';
    messageContent.textContent = text;

    messageDiv.appendChild(iconDiv);
    messageDiv.appendChild(messageContent);

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; 
  };

  // WebSocket connection 
  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event) => {
    const message = event.data;

    // Handle messages related to the guessing game
    if (isPlayingGuessGame) {
      if (message === 'correct') {
        addMessage('🎉 Correct! You guessed the number!', 'person-b');
        isPlayingGuessGame = false; 
      } else if (message === 'too high') {
        addMessage('Your guess is too high! Try again.', 'person-b');
      } else if (message === 'too low') {
        addMessage('Your guess is too low! Try again.', 'person-b');
      } else if (message === 'You quit the game.') {
        addMessage('You have quit the game.', 'person-b');
        isPlayingGuessGame = false; 
      }
    } else {
      addMessage(message, 'person-b'); 
    }
  };

  // Event listener for sending messages
  sendButton.addEventListener('click', () => {
    const text = messageInput.value.trim();
    if (text) {
      if (isPlayingGuessGame) {
        if (text.toLowerCase() === "quit") {
          ws.send('quit-game'); 
          isPlayingGuessGame = false; 
          addMessage('You quit the game.', 'person-a'); 
        } else if (!isNaN(text)) {
          ws.send(`guess:${text}`); // Send the guess to the server
          addMessage(`You guessed: ${text}`, 'person-a'); // Add the user guess to chat
        } else {
          addMessage('Please enter a valid number.', 'person-b'); // Handle invalid input
        }
      } else {
        ws.send(text); 
        addMessage(text, 'person-a');
      }
      messageInput.value = ''; 
    }
  });

  // Allow Enter key to send messages
  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      sendButton.click();
    }
  });

  // Event listener for rolling dice
  rollDiceButton.addEventListener('click', () => {
    const diceMessage = rollDice(); 
    addMessage(diceMessage, 'person-a'); 
    ws.send(diceMessage); 
  });

  // Create and add a button for the number guessing game
  const startGuessGameButton = document.createElement('button');
  startGuessGameButton.textContent = 'Start Number Guessing Game';
  startGuessGameButton.id = 'start-guess-game-button';
  document.querySelector('.input-container').appendChild(startGuessGameButton);

  // Create and add a button for quitting the guessing game
  const quitGameButton = document.createElement('button');
  quitGameButton.textContent = 'Quit Game';
  quitGameButton.id = 'quit-game-button';
  document.querySelector('.input-container').appendChild(quitGameButton);

  // Event listener for starting the guessing game
  startGuessGameButton.addEventListener('click', () => {
    ws.send('start-guess-game'); // Notify server to start the game
    isPlayingGuessGame = true; // Set game state to active
    addMessage('I’m thinking of a number between 1 and 100. Try to guess it!', 'person-b');
  });

  // Event listener for quitting the guessing game
  quitGameButton.addEventListener('click', () => {
    ws.send('quit-game'); // Notify server to quit the game
    isPlayingGuessGame = false; // Set game state to inactive
    addMessage('You quit the game.', 'person-a');
  });
});
