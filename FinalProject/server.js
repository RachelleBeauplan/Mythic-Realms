
const WebSocket = require('ws');
const express = require('express');
const app = express();
const path = require('path');

// Configure app to use static file. 
app.use(express.static(path.join(__dirname)));

// Start the HTTP server using Express 
const server = app.listen(8080, () => {
  console.log('Server running on http:'externalIP':8080'); // Change external IP
});

// Connect WebSocket server to HTTP server
const wss = new WebSocket.Server({ server });
console.log('WebSocket server is running on ws://0.0.0.0:8080');

let secretNumber = null; // The number to guess
let currentClient = null; // Track which client is playing the game
const clients = new Set(); // Keep track of all connected clients

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    message = message.toString();

    // Logic for Guessing game messages
    if (message === 'start-guess-game') {
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
      // For chat messages, broadcast to all connected clients
      console.log(`Received: ${message}`);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
    if (ws === currentClient) {
      secretNumber = null;
      currentClient = null;
    }
  });
});
