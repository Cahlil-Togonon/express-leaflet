var express = require('express');
var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/api/polygonized', (req, res) => {
  const filePath = path.join('/shared-data/express-leaflet/public/polygonized.json');
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Failed to read polygonized.json:", err);
      return res.status(500).json({ error: 'Failed to read data' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    window.ROUTING_SERVER_URL = ${JSON.stringify(process.env.ROUTING_SERVER_URL || 'http://localhost:9098/routing')};
    window.TILESERV_URL = ${JSON.stringify(process.env.TILESERV_URL || 'http://localhost:7800/')};
  `);
});


// Serve the CSV file through an explicit route
app.get('/api/aqi', (req, res) => {
  const filePath = path.join('/shared-data/express-leaflet/public/aqi.csv');
  res.sendFile(filePath, function(err) {
    if (err) {
      console.error("Error sending aqi.csv:", err);
      res.status(500).send('Could not load AQI data.');
    }
  });
});

app.use('/shared', express.static('/shared-data/express-leaflet/public'));

module.exports = app;
