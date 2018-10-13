// state
// load data
// split data
fireAreaNonReactive = {};
var vm = new Vue({
    el: '#app',
    data: {
        fireArea: {},
        fireAreaIndex: {},
        firePoint: {},
        firePointIndex: {},
        map: null,
        mapAreaLayer: null,
        layers: [],
        baseMaps: {},
        loadingStateMessage: '',
    },
    mounted: function () {
        this.initBaseMaps();
        this.initMap();
        $("#the-welcome-modal").modal('show');
        // Load GeoJSON
        // this.loadData().then(result => {
            // this.addData();
        // });
    },
    methods: {
        initBaseMaps() {

            // creates 4 to 5 base map layers as requested and adds to object for control/map

            // road map
            var mapboxStreets = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox.streets',
                accessToken: 'pk.eyJ1Ijoiam9zaGciLCJhIjoiTFBBaE1JOCJ9.-BaGpeSYz4yPrpxh1eqT2A',
            });

            // terrain map
            var openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                maxZoom: 17,
                attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            });

            // satellite image map
            var mapboxSatellite = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 17,
                id: 'mapbox.satellite',
                accessToken: 'pk.eyJ1Ijoiam9zaGciLCJhIjoiTFBBaE1JOCJ9.-BaGpeSYz4yPrpxh1eqT2A',
            });

            // light gray map with labels
            var cartoPositron = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19
            });

            // dark gray map without labels
            var cartoDarkMatterNoLabels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19
            });

            // add maps to basemaps object
            this.baseMaps = {
                "Roads": mapboxStreets,
                "Topography": openTopoMap,
                "Satellite": mapboxSatellite,
                "Light Map": cartoPositron,
                "Dark Background Map": cartoDarkMatterNoLabels
            };
        },
        initMap () {
            // center: [-34.3514, 138.9606],
            // var topLeftCorner = [-25.9856, 128.9658];
            var topLeftCorner = [-38.139687,140.982056];
            // var topLeftCorner = [128.965857, -25.985669];
            // var bottomRightCorner = [-38.1310, 141.0025];
            var bottomRightCorner = [-25.772069, 128.814697]
            // var bottomRightCorner = [141.002503, -38.131046];
            // this.map = L.map('map').fitBounds(topLeftCorner, bottomRightCorner);
            // this.map = L.map('map');
            this.map = L.map('map', {
                center: [-34.3514, 138.9606],
                zoom: 9,
                minZoom: 7,
                maxZoom: 18,
            });
            // this.map = L.map('map').fitBounds([128.965857, -25.985669, ],[141.002503, -38.131046, ]);
            // this.map = L.map('map').fitBounds([-25.985669, 128.965857], [-38.131046, 141.002503]);

            // add streets layer (thus default)
            this.baseMaps.Roads.addTo(this.map);

            // add layer control
            this.layerControl = L.control.layers(this.baseMaps).addTo(this.map);

            // add scale
            L.control.scale().addTo(this.map);

            // add UniSA watermark control class
            L.Control.Watermark = L.Control.extend({
                onAdd: function(map) {
                    var img = L.DomUtil.create('img');
                    img.src = './data/images/logo_unisa_rgb-blue_h.png';
                    img.style.width = '200px';
                    return img;
                },
            });

            L.control.watermark = function(opts) {
                return new L.Control.Watermark(opts);
            }

            // add watermark to map
            L.control.watermark({ position: 'bottomright' }).addTo(this.map);
        },
        addDataFrom (url) {
            $("#the-loading-modal").modal('show');
            this.loadData(url).then(result => this.addData());
        },
        loadData (url) {
            var t0 = performance.now();
            console.log("loading...");
            this.loadingStateMessage = "downloading data...";
            return fetch(url)
                .then (response => response.json())
                .then(json => {
                    fireAreaNonReactive = json;
                    var t1 = performance.now();
                    var statusMessage = "loading took " + (t1 - t0) + " milliseconds.";  
                    console.log(statusMessage);
                    this.loadingStateMessage = statusMessage;
                });
        },
        /*
        tileData () {
            var t0 = performance.now();
            console.log("tiling data...");
            this.loadingStateMessage = "tiling data..."
            // console.log(fireAreaNonReactive);
            this.fireArea = geojsonvt(fireAreaNonReactive);
            // delete(fireAreaNonReactive);
            // fireAreaNonReactive = null;
            var t1 = performance.now();
            var statusMessage = "tiling took " + (t1 - t0) + " milliseconds.";  
            console.log(statusMessage);
            this.loadingStateMessage = statusMessage;
        },
        */
        addData () {

            this.loadingStateMessage = "tiling data...";
            console.log("tiling data...");
            var t0 = performance.now();
            // var vectorLayer = null;

            setTimeout( () => {
                vectorLayer = new L.VectorGrid.Slicer(fireAreaNonReactive, {
                    vectorTileLayerStyles: {
                        sliced: {
                            weight: 0,
                            fillColour: '#9bc2c4',
                            fillOpacity: 1,
                            fill: true,
                        }
                    },
                    minZoom: 7,
                    maxZoom: 18,
                    tolerance: 10,
                });
                vectorLayer.addTo(this.map);
                this.layerControl.addOverlay(vectorLayer, "Fire Areas");
            })

            var t1 = performance.now();
            var statusMessage = "tiling took " + (t1 - t0) + " milliseconds.";  
            this.loadingStateMessage = statusMessage;
            console.log(statusMessage);

            var t0 = performance.now();
            var statusMessage = "adding to map"
            this.loadingStateMessage = statusMessage;
            console.log(statusMessage);

            // vectorLayer.addTo(this.map);
            // this.layerControl.addOverlay(vectorLayer, "Fire Areas");

            var t1 = performance.now();
            var statusMessage = "adding took " + (t1 - t0) + " milliseconds.";  
            console.log(statusMessage);
            this.loadingStateMessage = statusMessage;

            $("#the-loading-modal").modal('hide');
        },
    }
});
