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
  let body = '';
  let url;
  req.on('data', data => {
    body += data;
    console.log(body);
  });
  req.on('end', data => {
    //url = body['long-url'];
    let urlArray = body.split('=');
    shortUrl.short(urlArray[1], (err, shorturl) => {
      redisClient.setnx(urlArray[1], shorturl);
      res.redirect('/');
    });
  });
});

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
