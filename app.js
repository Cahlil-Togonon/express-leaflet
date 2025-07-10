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

app.use('/', indexRouter);
app.use('/users', usersRouter);

// app.listen(3000, () => {
//   console.log(`Express server listening on port 3000`);
// });

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

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/manila_osm"
});

app.get("/api/polygonized_aqi.geojson", async (req, res) => {
  try {
    const query = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geometry)::jsonb,
            'properties', to_jsonb(row) - 'geometry'
          )
        )
      ) AS geojson
      FROM (SELECT * FROM polygonized_aqi) row;
    `;
    const result = await pool.query(query);
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching GeoJSON");
  }
});

app.get('/config.js', (req, res) => {
  console.log("GET /config.js called");
  res.type('application/javascript');
  res.send(`
    window.ROUTING_SERVER_URL = ${JSON.stringify(process.env.ROUTING_SERVER_URL || 'http://localhost:9098/routing')};
    window.TILESERV_URL = ${JSON.stringify(process.env.TILESERV_URL || 'http://localhost:7800/')};
  `);
});


// Serve the CSV file through an explicit route
app.get('/api/aqi', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sensor_name AS "Sensor Name",
        source,
        aqi AS "US AQI",
        ST_Y(geom) AS "X",
        ST_X(geom) AS "Y"
      FROM sensor_aqi
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch AQI data:", err);
    res.status(500).send("Internal server error");
  }
});
// app.get('/api/aqi', (req, res) => {
//   const filePath = path.join('/shared-data/express-leaflet/public/aqi.csv');
//   res.sendFile(filePath, function(err) {
//     if (err) {
//       console.error("Error sending aqi.csv:", err);
//       res.status(500).send('Could not load AQI data.');
//     }
//   });
// });

app.use('/shared', express.static('/shared-data/express-leaflet/public'));

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
