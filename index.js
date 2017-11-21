'use strict';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const redisClient = require('redis').createClient();

let shortUrl = require('node-url-shortener');

shortUrl.short('https://google.com', function(err, url) {
  //  console.log(url);
});

app.use(
  '/socket.io',
  express.static(__dirname + 'node_modules/socket.io-client/dist/')
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
    //  console.log(body);
  });
  req.on('end', data => {
    //url = body['long-url'];
    let urlArray = body.split('=');
    shortUrl.short(urlArray[1], (err, shorturl) => {
      redisClient.set(urlArray[1], shorturl, (err, reply) => {
        io.emit('urlevent', shorturl);
      });
      res.redirect('/');
    });
  });
});

io.on('connection', client => {
  /*
  let info = {}
  // redisClient.setnx(info, {})
  redisClient.keys('*', (err, replies) => {
    replies.forEach((reply) => {
      info[reply] = redisClient.get(reply, (err, value) => {
        console.log(info)
        return Promise.resolve(value);
      })
    })
    Promise.all(info).then((resInfo) => {
      console.log(resInfo)
    }).catch((err) => {
      console.error(err);
    })
    client.emit("emit_event", info)
  })
*/
  redisClient.keys('*', (err, keys) => {
    let results = [];
    keys.forEach(key => {
      redisClient.get(key, (err, value) => {
        const obj = {};
        obj[key] = value;
        results.push(obj);
      });
    });
    client.emit('initial_results', results);
  });

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
