(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

var plan = L.Routing.plan(
    [
        L.latLng(14.6539, 121.0685),
        L.latLng(14.574 , 121.052)
    ],{
    geocoder: L.Control.Geocoder.nominatim(),
    waypointNameFallback: function(latLng) {
        function zeroPad(n) {
            n = Math.round(n);
            return n < 10 ? '0' + n : n;
        }
        function sexagesimal(p, pos, neg) {
            var n = Math.abs(p),
                degs = Math.floor(n),
                mins = (n - degs) * 60,
                secs = (mins - Math.floor(mins)) * 60,
                frac = Math.round((secs - Math.floor(secs)) * 100);
            return (n >= 0 ? pos : neg) + degs + '°' +
                zeroPad(mins) + '\'' +
                zeroPad(secs) + '.' + zeroPad(frac) + '"';
        }

        return sexagesimal(latLng.lat, 'N', 'S') + ' ' + sexagesimal(latLng.lng, 'E', 'W');
    }
    });

var maxAQI = 100;
var threshold = 100;
var aqiPolygons;
var info;
var legend;
var threshold_slider;
var geojsonPolygon;
var aqi_tiles;
// var osmb = new OSMBuildings(map).load('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json');
var layerControl = L.control.layers(null,null,{collapsed:false}).addTo(map);

// layerControl.addOverlay(osmb, "OSM buildings");
// osmb.addTo(map);

var waypoints = [
    L.latLng(14.6539, 121.0685),
    L.latLng(14.574 , 121.052)
];

var router = L.Routing.control({
    waypoints: [
        L.latLng(14.6539, 121.0685),
        L.latLng(14.574 , 121.052)
    ],
    // router: L.Routing.graphHopper(apiKey='a8a55b5c-5382-407e-9301-a0d86d7f9a02'),
    router: L.Routing.graphHopper(undefined /* no api key */, {
        serviceUrl: 'http://localhost:9098/routing'
    }),
    routeWhileDragging: false,
    fitSelectedRoutes: false,
    plan: plan
}).addTo(map);

// var excludePoly = ''
// var router = L.Routing.control({
//     router: L.Routing.valhalla('','pedestrian',excludePoly,''),
//     formatter: new L.Routing.Valhalla.Formatter(),
//     routeWhileDragging: false,
//     fitSelectedRoutes: false,
//     plan: plan
// }).addTo(map);

// function fasterUnion(allGeometries) {
//     const mid = Math.floor(allGeometries.length / 2);
//     let group1 = allGeometries.slice(0, mid);
//     let group2 = allGeometries.slice(mid);
  
//     while (group1.length > 1) {
//       group1 = unionGroup(group1);
//     }
//     while (group2.length > 1) {
//       group2 = unionGroup(group2);
//     }
  
//     let result;
//     if (group1.length === 1 && group2.length === 1) {
//       result = turf.union(group1[0], group2[0]);
//     } else if (group1.length === 1) {
//       result = group1[0];
//     } else {
//       result = group2[0];
//     }
  
//     return result;
//   }
  
//   function unionGroup(group) {
//     let newGroup = [];
//     for (let i = 0; i < group.length; i += 2) {
//       let a = group[i];
//       let b = i + 1 < group.length ? group[i + 1] : null;
//       if (b) {
//         newGroup.push(turf.union(a, b));
//       } else {
//         newGroup.push(a);
//       }
//     }
//     return newGroup;
//   }

function refreshLayers(){
    // threshold = geojsonPolygon.threshold;
    maxAQI = 200;
    // var polygon_AQI = 0;

    // // var excludePoly2 = [];
    // var excludePoly3 = [];
    // for(var i=0; i < geojsonPolygon.features.length; i++){
    //     polygon_AQI = geojsonPolygon.features[i].properties.AQI;
    //     maxAQI = polygon_AQI != 32767 && polygon_AQI > maxAQI ? polygon_AQI : maxAQI;
    //     if(geojsonPolygon.features[i].properties.AQI >= threshold){
    //         // excludePoly2.push(geojsonPolygon["features"][i]["geometry"]["coordinates"][0])
    //         excludePoly3.push(geojsonPolygon["features"][i])
    //     }
    // };

    // // excludePoly = excludePoly2;
    // excludePoly3 = fasterUnion(excludePoly3);
    // if(excludePoly3==null){
    //     excludePoly = "";
    // }
    // else if(typeof(excludePoly3["geometry"]["coordinates"][0][0][0]) == "number"){
    //     excludePoly = excludePoly3["geometry"]["coordinates"];
    // }
    // else{
    //     excludePoly = [];
    //     for(var i=0; i < excludePoly3["geometry"]["coordinates"].length; i++){
    //         excludePoly.push(excludePoly3["geometry"]["coordinates"][i][0]);
    //     }
    // }
    router.route(waypoints);

    function getColor(d) {
        // // US AQI absolute scale
        // if (d <= 50) return "#02e400";
        // if (d <= 100) return "#ffff02";
        // if (d <= 150) return "#ff7e00";
        // if (d <= 200) return "#ff0000";
        // if (d <= 300) return "#8f3f97";
        // return "#7e0023"

        // relative scale
        redval = (d > maxAQI/2) ? 1 : redval = 2*d/maxAQI;
        var hexred = (Math.floor(redval*255)).toString(16);
        hexred = hexred.length == 1 ? '0'.concat(hexred) : hexred;
        greval = (d < maxAQI/2) ? 1 : 2*(1-(d/maxAQI));
        var hexgre = Math.floor((greval*255)).toString(16);
        hexgre = hexgre.length == 1 ? '0'.concat(hexgre) : hexgre;
        var hex = "#".concat(hexred,hexgre,'00');
        // alert(hex)
        return hex;
    }
    function layer_style(feature) {
        return {            // highlight black if >= threshold
            fillColor: feature.properties.AQI >= threshold ? '#000000' : getColor(feature.properties.AQI),
            weight: 0,
            opacity: 1,
            color: 'white',
            dashArray: '2',
            fillOpacity: 0.5
        };
    }
    function line_style(feature) {
        return {
            fillColor: "white",
            weight: 1,
            opacity: 1,            // highlight black if >= threshold
            color: getColor(feature.properties.AQI),
            fillOpacity: 1
        };
    }
    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 1,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
        layer.bringToFront();
        info.update(layer.feature.properties.AQI.toString());
    }
    function resetHighlight(e) {
        var layer = e.target;
        aqiPolygons.resetStyle(layer);
        info.update();
    }
    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    // if(aqiPolygons){
    //     layerControl.removeLayer(aqiPolygons);
    //     map.removeLayer(aqiPolygons);
    // }
    // aqiPolygons = L.geoJson(geojsonPolygon, {
    //     style: layer_style,
    //     onEachFeature: onEachFeature
    // });
    // layerControl.addOverlay(aqiPolygons, "AQI Map");
    // aqiPolygons.addTo(map);

    //////////////////////////////////////
    
    if(aqi_tiles){
        layerControl.removeLayer(aqi_tiles);
        map.removeLayer(aqi_tiles);
    }

    // var date_time = geojsonPolygon["properties"]["date_time"];
    // var date_time = 'latest';
    var vectorServer = "http://localhost:7800/";
    var vectorLayerId = 'public.aqi_filter';
    var vectorUrl = vectorServer + vectorLayerId + `/{z}/{x}/{y}.pbf?properties=aqi&threshold=${threshold}`;
    console.log(vectorUrl);
    var vectorTileStyling = {
        'default' : function(properties) {
            return {
                weight: 2,
                opacity: 0.5,
                color: getColor(properties.aqi),
                fillOpacity: 0
            }
        } 
    };
    var vectorTileOptions = {
        // interactive: true, pane: 'OverlayPane',
        vectorTileLayerStyles: vectorTileStyling,
        rendererFactory: L.canvas.tile,
        attribution: "&copy; AQI Tile Map served by <a href='https://github.com/CrunchyData/pg_tileserv'>pg_tileserv</a>",
        interactive: true,
    };
    L.DomEvent.fakeStop = function () {
        return true;
      }
    aqi_tiles = L.vectorGrid.protobuf(vectorUrl, vectorTileOptions).on('click',function(e) {
        alert(e.layer.properties.aqi);
        L.DomEvent.stop(e);
    });

    layerControl.addOverlay(aqi_tiles, "AQI tilemap");
    aqi_tiles.addTo(map);



    // Function to choose color based on the data source
    function getSourceColor(source) {
        switch (source) {
        case 'IQAir':
            return '#ff0000'; // Red
        case 'UPCARE':
            return '#008000'; // Green
        case 'WAQI':
            return '#0000ff'; // Blue
        default:
            return '#ffff00'; // Default color (yellow)
        }
    }

    // Function to parse the CSV and add station markers to the map
    function loadAQIData(csvData) {
        Papa.parse(csvData, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            var data = results.data;
    
            // Loop through each row in the CSV and add a marker for each station
            data.forEach(function(station) {
            var lat = station.X; // Latitude (X)
            var lon = station.Y; // Longitude (Y)
            var name = station['Sensor Name']; // Sensor Name
            var aqi = station['US AQI']; // US AQI
            var source = station['source']; // Source of data
    
            var color = getSourceColor(source);

            // Create a CircleMarker (dot) at the specified location
            var circleMarker = L.circleMarker([lon, lat], {
                color: '#000000',    // Black border color
                weight: 2,           // Thickness of the border
                fillColor: color,
                fillOpacity: 0.8,
                radius: 6 // Size of the dot
            }).addTo(map);
    
            // Bind a tooltip to the marker with the station's info
            circleMarker.bindPopup(`
                <b>Station Name:</b> ${name}<br>
                <b>Current AQI:</b> ${aqi}<br>
                <b>Location:</b> ${lat.toFixed(4)}, ${lon.toFixed(4)}<br>
                <b>Source:</b> ${source}
            `);
            });
        },
        error: function(error) {
            console.error("Error parsing CSV:", error.message);
        }
        });
    }
    
    var csvUrl = '/aqi.csv';
    loadAQIData(csvUrl);

    ////////////////////////////////////////

    if(info){
        map.removeControl(info);
    }
    info = L.control({position: 'bottomright'});
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };
    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
        this._div.innerHTML = '<h4>US AQI Levels</h4>' +  (props ?
            '<b>' + props + '</b> US AQI'
            : 'Hover over an area');
    };
    info.addTo(map);

    if(legend){
        map.removeControl(legend);
    }
    legend = L.control({position: 'bottomleft'});
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0*maxAQI/7, 1*maxAQI/7, 2*maxAQI/7, 3*maxAQI/7, 4*maxAQI/7, 5*maxAQI/7, 6*maxAQI/7];
            // grades = [50,100,150,200,300];
        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                Math.round(grades[i]) + (grades[i + 1] ? '&ndash;' + Math.round(grades[i + 1]) + '<br>' : '+ <br>');
        }
        div.innerHTML +=
            '<i style="background:' + '#000000' + '"></i> ' + threshold + '+' + ' (threshold)'; // black legend for threshold
        return div;
    };
    legend.addTo(map);
}

async function LoadData(){
    const r1 = await fetch('../polygonized.json')
        .then(function (response) {
            console.log(response);
            return response.json();
        })
        .then(function (data) {
            geojsonPolygon = data;
            refreshLayers();
        })
        .catch(function (err) {
            console.log('error: ' + err);
        });
    console.log(r1);

    threshold_slider = L.control.slider(function(value) {
        threshold = value;
        refreshLayers();
    }, {
    max: 200,
    min: 0,
    value: threshold,
    step: 1,
    size: '250px',
    collapsed: false,
    logo: 'threshold',
    position: 'topleft',
    id: 'threshold_slider'
    }).addTo(map);

    setInterval(function(){refreshLayers();},1 * 60 * 1000);
}

LoadData();
// setInterval(function(){LoadData();},1 * 30 * 1000);
},{}]},{},[1]);