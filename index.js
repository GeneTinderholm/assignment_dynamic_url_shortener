'use strict';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const redisClient = require('redis').createClient();

var shortUrl = require('node-url-shortener');

shortUrl.short('https://google.com', function(err, url) {
  console.log(url);
});

app.use(
  '/socket.io',
  express.static(__dirname + 'node_modules/socket.io-client/dist/'),
);

redisClient.setnx('count', 0);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/', (req, res) => {
  const url = req.body.long-url;
  shortUrl.short(url, (err, shorturl) => {
    redisClient.setnx(url, shorturl);
    res.redirect('/');
  }) 
})

io.on('connection', client => {
  redisClient.get('count', (err, count) => {
    client.emit('new count', count);
  });

  client.on('increment', () => {
    redisClient.incr('count', (err, count) => {
      io.emit('new count', count);
    });
  });

  client.on('decrement', () => {
    redisClient.decr('count', (err, count) => {
      io.emit('new count', count);
    });
  });
});

server.listen(3002);
