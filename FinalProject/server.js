const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running on ws://127.0.0.1:8080');

let secretNumber = null; // The number to guess
let currentClient = null; // Track which client is playing the game
const clients = new Set(); // Keep track of all connected clients

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    // Ensure message is a string
    message = message.toString();

    if (message === 'start-guess-game') {
      // Initialize the guessing game
      secretNumber = Math.floor(Math.random() * 100) + 1;
      currentClient = ws;
      ws.send('I’m thinking of a number between 1 and 100. Try to guess it!');
    } else if (message.startsWith('guess:') && ws === currentClient) {
      
      const guess = parseInt(message.split(':')[1], 10);

      if (isNaN(guess)) {
        ws.send('Please send a valid number.');
      } else if (guess < secretNumber) {
        ws.send('too low');
      } else if (guess > secretNumber) {
        ws.send('too high');
      } else {
        ws.send('correct');
        secretNumber = null; // Reset the game
        currentClient = null;
      }
    } else if (message === 'quit-game' && ws === currentClient) {
      
      ws.send('You quit the game.');
      secretNumber = null; // Reset the game
      currentClient = null;
    } else {
      // Handle general messages and broadcast them
      console.log(`Received: ${message}`);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          // Echo the message to all clients, including the sender
          client.send(message);
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);

    if (ws === currentClient) {
      // Reset the game if the player disconnects
      secretNumber = null;
      currentClient = null;
    }
  });
});
