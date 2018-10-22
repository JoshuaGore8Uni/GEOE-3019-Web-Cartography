new Vue({

    el: '#app',

    data: {

        // data and map
        map: null,
        baseMaps: null,
        layerControl: null,
        layers: [],
        lastFireAreaSimplified: {},
        fireAreaLayer: null,

        // ui variables
        workingUI: true,

        // filters
        showFire: true,
        showSummer: true,
        showAutumn: true,
        showWinter: true,
        showSpring: true,
        showPrescribedBurns: true,
        showBushfires: true,
        show1950s: true,
        show1960s: true,
        show1970s: true,
        show1980s: true,
        show1990s: true,
        show2000s: true,
        show2010s: true,
    },

    mounted() {

        // initiate base map layers, main map, load and display fire data
        this.initBaseMaps();
        this.initMap();
        this.initOverlayLayers();
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

        initMap() {
            this.map = L.map('map', {
                center: [-34.3514, 138.9606],
                zoom: 9,
                minZoom: 7,
                maxZoom: 18,
            });

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

        loadData() {

            // load geojson files using jQuery (simplifies)
            parent = this;
            return jQuery.getJSON("./data/provided/LastFire_areas_simplified.json", function(data) {
                parent.lastFireAreaSimplified = data;
            });
        },

        initOverlayLayers() {

            // loads data and then adds to map
            this.workingUI = true;
            parent = this;
            this.loadData().then(function() {
                parent.workingUI = false;
                parent.fireAreaLayer = L.geoJSON(false, {
                    onEachFeature: function(feature, layer) {
                        var popupContent = '';
                        Object.entries(feature.properties).forEach(
                            ([key, value]) => popupContent = popupContent + '<div>' + key + ': ' + value + '</div>'
                        );
                        layer.bindPopup(popupContent);
                    }
                });
                parent.fireAreaLayer.addData(parent.filteredAreas);
                parent.layerControl.addOverlay(parent.fireAreaLayer, "fire areas simplified");
                parent.fireAreaLayer.addTo(parent.map);
            });
        },
    },

    computed: {

        filteredAreas: function() {
            t01 = performance.now();

            // clone fire data
            let fireAreas = Object.assign({}, this.lastFireAreaSimplified);

            // remove all items which are not to be included
            if (this.showPrescribedBurns != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return area.properties.INCIDENTTY != 'Prescribed Burn';
                });
            }
            if (this.showBushfires != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return area.properties.INCIDENTTY != 'Bushfire';
                });
            }
            if (this.showSummer != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return area.properties.SEASON != 'SUMMER';
                });
            }
            if (this.showAutumn != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return area.properties.SEASON != 'AUTUMN';
                });
            }
            if (this.showWinter != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return area.properties.SEASON != 'WINTER';
                });
            }
            if (this.showSpring != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return area.properties.SEASON != 'SPRING';
                });
            }
            if (this.show1950s != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return (area.properties.FIREYEAR > 1959 || area.properties.FIREYEAR < 1950);
                });
            }
            if (this.show1960s != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return (area.properties.FIREYEAR > 1969 || area.properties.FIREYEAR < 1960);
                });
            }
            if (this.show1970s != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return (area.properties.FIREYEAR > 1979 || area.properties.FIREYEAR < 1970);
                });
            }
            if (this.show1980s != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return (area.properties.FIREYEAR > 1989 || area.properties.FIREYEAR < 1980);
                });
            }
            if (this.show1990s != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return (area.properties.FIREYEAR > 1999 || area.properties.FIREYEAR < 1990);
                });
            }
            if (this.show2000s != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return (area.properties.FIREYEAR > 2009 || area.properties.FIREYEAR < 2000);
                });
            }
            if (this.show2010s != true) {
                fireAreas.features = fireAreas.features.filter(area => {
                    return (area.properties.FIREYEAR > 2019 || area.properties.FIREYEAR < 2010);
                });
            }
            t02 = performance.now();
            console.log("filter time taken: " + (t02 - t01) + " milliseconds");

            // return filtered data
            return fireAreas;
        }
    },
    watch: {
        filteredAreas() {
            /*
            parent = this;
            this.map.removeLayer(this.fireAreaLayer);
            parent.fireAreaLayer = L.geoJSON(false, {
                onEachFeature: function(feature, layer) {
                    var popupContent = '';
                    Object.entries(feature.properties).forEach(
                        ([key, value]) => popupContent = popupContent + '<div>' + key + ': ' + value + '</div>'
                    );
                    layer.bindPopup(popupContent);
                }
            });
            parent.fireAreaLayer.addData(parent.filteredAreas);
            parent.layerControl.addOverlay(parent.fireAreaLayer, "fire areas simplified");
            parent.fireAreaLayer.addTo(parent.map);
            */
            t01 = performance.now();
            this.fireAreaLayer.clearLayers();
            this.fireAreaLayer.addData(this.filteredAreas);
            t02 = performance.now();
            console.log("re-add data time taken: " + (t02 - t01) + " milliseconds");
        }
    }
});
