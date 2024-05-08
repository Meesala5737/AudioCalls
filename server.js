const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clients = {};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'register':
                clients[data.id] = ws;
                console.log(`Client ${data.id} connected.`);
                break;
            case 'offer':
            case 'answer':
            case 'candidate':
                const recipient = clients[data.to];
                if (recipient) {
                    recipient.send(message);
                } else {
                    console.error(`Recipient ${data.to} not found.`);
                }
                break;
            default:
                console.error('Invalid message type:', data.type);
        }
    });
});
