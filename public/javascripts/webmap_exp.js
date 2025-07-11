(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

// console.log(window.ROUTING_SERVER_URL);
// console.log(window.TILESERV_URL);

var maxAQI = 100;
var threshold = 200;
var aqiPolygons, aqi_tiles, sensorLayer, info, legend;
// var threshold_slider;
var geojsonPolygon;
var first_run = true;
var layerControl = L.control.layers(null,null,{collapsed:false}).addTo(map);

var plan = L.Routing.plan(
    [
        L.latLng(14.64956, 121.06837),
        L.latLng(14.64489 , 121.07427)
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

var router = L.Routing.control({
    router: L.Routing.graphHopper(undefined /* no api key */, {
        serviceUrl: '/api/route',
        RouteType: "all",
        Vehicle: "car",
        alternatives: 3
    }),
    routeWhileDragging: false,
    fitSelectedRoutes: false,
    plan: plan,
    alternatives: true
}).addTo(map);

// Create custom control for selecting RouteType
var routeTypes = ['fastest', 'shortest', 'greenest', 'balanced', 'all'];
var routeTypeControl = L.Control.extend({
    options: {
        position: 'topleft' // Position of the button
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar2 route-type-control');
        routeTypes.forEach(function(routeType) {
            var button = L.DomUtil.create('a', '', container);
            button.href = '#';
            button.innerHTML = routeType.charAt(0).toUpperCase() + routeType.slice(1); // Capitalize the first letter
            button.onclick = function(e) {
                e.preventDefault();
                updateActiveState(button, '.route-type-control');

                router.getRouter().options.RouteType = routeType;
                router.route();
            };
        });
        return container;
    }
});

var transportation = ['car', 'foot', 'bike', 'motorcycle'];
var transportationControl = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar2 transpo-type-control');
        transportation.forEach(function(transport) {
            var button = L.DomUtil.create('a', '', container);
            button.href = '#';
            button.innerHTML = transport.charAt(0).toUpperCase() + transport.slice(1); // Capitalize the first letter
            button.onclick = function(e) {
                e.preventDefault();
                updateActiveState(button, '.transpo-type-control');

                router.getRouter().options.Vehicle = transport;
                router.route();
            };
        });
        return container;
    }
});

function updateActiveState(clickedButton, containerSelector) {
    // Reset active state for all buttons within the specified container
    var buttons = document.querySelectorAll(containerSelector + ' a');
    buttons.forEach(function(button) {
        button.classList.remove('active'); // Remove active class from all buttons
    });
    // Add active class to the clicked button
    clickedButton.classList.add('active');
}

map.addControl(new routeTypeControl());
map.addControl(new transportationControl());

function setDefaultSelections() {
    // RouteType default to 'fastest'
    var defaultRouteTypeButton = document.querySelector('.route-type-control a:nth-child(3)');
    if (defaultRouteTypeButton) {
        updateActiveState(defaultRouteTypeButton, '.route-type-control');
    }

    // TranspoType default to 'foot'
    var defaultTransportButton = document.querySelector('.transpo-type-control a:nth-child(2)');
    if (defaultTransportButton) {
        updateActiveState(defaultTransportButton, '.transpo-type-control');
    }
}

window.onload = setDefaultSelections;

function refreshLayers(){
    
    function getColor(d) {
        maxAQI = 100;
        
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
            fillColor: feature.properties.aqi >= threshold ? '#000000' : getColor(feature.properties.aqi),
            weight: 0,
            opacity: 1,
            color: 'white',
            dashArray: '2',
            fillOpacity: 0.3
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
            color: '#999',
            dashArray: '',
            fillOpacity: 0.3
        });
        // layer.bringToFront();
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

    fetch("/api/polygonized")
    .then(res => res.json())
    .then(geojsonPolygon => {
        console.log(geojsonPolygon);

        if(aqiPolygons){
            layerControl.removeLayer(aqiPolygons);
            map.removeLayer(aqiPolygons);
        }
        aqiPolygons = L.geoJson(geojsonPolygon["features"], {
        style: layer_style,
        onEachFeature: onEachFeature
        });
        layerControl.addOverlay(aqiPolygons, "AQI Map");
        aqiPolygons.addTo(map);
    })
    .catch(function (err) {
        console.log('error: ' + err);
    });

    //////////////////////////////////////

    // Function to parse the CSV and add station markers to the map
    function loadAQIData(data) {
        console.log(data);
        data.forEach(function(station) {
            var lat = station.X;
            var lon = station.Y;
            var name = station['Sensor Name'];
            var aqi = station['US AQI'];
            var source = station['source'];

            var color = getSourceColor(source);

            var circleMarker = L.circleMarker([lat, lon], {
            color: '#000000',
            weight: 2,
            fillColor: color,
            fillOpacity: 0.8,
            radius: 6
            }).addTo(map);

            circleMarker.bindPopup(`
            <b>Station Name:</b> ${name}<br>
            <b>Current AQI:</b> ${aqi}<br>
            <b>Location:</b> ${lat.toFixed(4)}, ${lon.toFixed(4)}<br>
            <b>Source:</b> ${source}
            `);
        });
        }
    
    fetch("/api/aqi")
    .then((res) => res.json())
    .then((data) => loadAQIData(data))
    .catch(function (err) {
        console.log('error: ' + err);
    });

    //////////////////////////////////////

    if(first_run){
        var vectorServer = '/api/tiles/';
        // var vectorLayerId = 'public.aqi_filter';
        // var vectorUrl = vectorServer + vectorLayerId + `/{z}/{x}/{y}.pbf?properties=aqi&threshold=${threshold}`;
        var vectorLayerId = 'public.street_aqi';
        var vectorUrl = vectorServer + vectorLayerId + '/{z}/{x}/{y}.pbf?properties=aqi';
        console.log(vectorUrl);
        var vectorTileStyling = {
            'public.street_aqi' : function(properties) { // use 'default' if using aqi_timestamp
                return {
                    weight: 3,
                    opacity: 1,
                    color: getColor(properties.aqi),
                    fillOpacity: 0
                }
            } 
        };
        var vectorTileOptions = {
            // interactive: true, pane: 'OverlayPane',
            vectorTileLayerStyles: vectorTileStyling,
            onEachFeature: onEachFeature,
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
    };

    /////////////////////////////

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

    first_run = false;

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
        this._div.innerHTML = '<h4>US AQI Level</h4>' +  (props ?
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

    aqiPolygons.setZIndex(1); // Polygons at the bottom
    aqi_tiles.setZIndex(100);
    router.setZIndex(101);
    circleMarker.setZIndex(1000); // Circle marker always on top
    info.setZIndex(10000); // Info control on top
    legend.setZIndex(10001); // Legend on top
}

refreshLayers();
setInterval(function(){refreshLayers();},1 * 60 * 1000);
},{}]},{},[1]);