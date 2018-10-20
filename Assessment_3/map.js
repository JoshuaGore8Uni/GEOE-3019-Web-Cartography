// global variable to set level of simplification
simplificationLevel = 20;
// console.log(flame);

// global map variables - prevents unnecessary reactivity with associated potential overhead
mapState = {
    // layers: {},
    layerControl: {},
    map: null,
    baseMaps: {},
    overlays: {},
    data: {},
    // indices: {},
    areaLayer: {},
    addBaseLayer: function(layerName, url, options) {
        this.baseMaps[layerName] = L.tileLayer(url, options);
    },

    // init map with optional options
    initMap: function(mapElement, options={}) {

        // init map
        this.map = L.map(mapElement, options);

        // if bounds specified fit to bounds
        if (options.bounds) {
            this.map.fitBounds(options.bounds);
        }

        // add first basemaps layer (thus default)
        this.baseMaps[Object.keys(this.baseMaps)[0]].addTo(this.map);

        // add layer control
        this.layerControl = L.control.layers(mapState.baseMaps).addTo(mapState.map);

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

    // load url linking map data - linked in addVectorOverlay
    loadURL: function(url, name) {
        return fetch(url, { mode: "no-cors", headers:{'X-Requested-With': 'XMLHttpRequest'} })
            .then (response => response.json())
            // may need to be in function format?
            .then((json) => {this.data[name] = json});
    },
    addClusterOverlay: function (name, options={}) {
        function runAdd(parentThis, name, options) {
            // parse options
            if (!options.hasOwnProperty("interactive")) {
                options.interactive = false;
            }
            if (!options.hasOwnProperty("id")) {
                options.id = "id";
            }
            // dodgy icon stuff
            // var flameIcon = L.icon({iconUrl: flame});
            var flameIcon = L.icon({
                iconUrl: flame,
                iconSize:     [31, 39], // size of the icon
                //iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
                //popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            });
            var matchIcon = L.icon({
                iconUrl: match,
                iconSize:     [31, 39], // size of the icon
                //iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
                //popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            });
            // L.marker([-36.455927, 148.264550], {icon: flameIcon}).addTo(parentThis.map);
            // L.marker([-36.455000, 148.264550], {icon: matchIcon}).addTo(parentThis.map);
            parentThis.overlays[name] = L.markerClusterGroup();
            // parentThis.overlays[name] = L.geoJson(parentThis.data[name]);
            var geoJsonLayer = L.geoJson(parentThis.data[name], {
                pointToLayer: function (feature, latlng) {
                    if (feature.properties.INCIDENTTYPE == 'Bushfire') {
                        icon = L.icon({
                            iconUrl: flame,
                            iconSize:     [31, 39], // size of the icon
                            //iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
                            //popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
                        });
                    }
                    else {
                        icon = L.icon({
                            iconUrl: match,
                            iconSize:     [31, 39], // size of the icon
                            //iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
                            //popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
                        });
                    }
                    return L.marker(latlng, {icon: icon});
                }
            });
            parentThis.overlays[name].addLayer(geoJsonLayer);
            parentThis.map.addLayer(parentThis.overlays[name]);

            // create index of all features in layer
            parentThis.data[name].indices = {};
            parentThis.data[name].indices.all = parentThis.data[name].features.map(feature => feature.properties.OBJECTID);
            // initiate state of visible features
            parentThis.overlays[name].visible = parentThis.data[name].indices.all;

            // dodgy original state storage as leaflet requires adding and removing layers rather than just hiding
            parentThis.overlays[name].original = [];
            parentThis.overlays[name].eachLayer(layer => {
                parentThis.overlays[name].original.push(layer);
            });
            // parentThis.overlays[name].original = Object.assign({}, parentThis.overlays[name]);
            // console.log(this.overlays[overlay.name].original);
            parentThis.layerControl.addOverlay(parentThis.overlays[name], name);
        };
        // all contained in promise as url loads async
        var promise = new Promise((resolve, reject) => {
            if (options.hasOwnProperty("url")) {
                console.log("loading from " + options.url);
                this.loadURL(options.url, name).then(() => { 
                    runAdd(this, name, options);
                    resolve("Stuff Worked");
                });
            }
            else {
                console.log("just adding ");
                console.log(options);
                runAdd(this, name, options);
                resolve("Stuff Worked");
            }
        });
    },
    addVectorOverlay: function(name, options={}) {
        function runAdd(parentThis, name, options) {
            // parse options
            if (!options.hasOwnProperty("interactive")) {
                options.interactive = false;
            }
            if (!options.hasOwnProperty("id")) {
                options.id = "id";
            }
            parentThis.overlays[name] = new L.VectorGrid.Slicer(parentThis.data[name], {
                // potentially better performance for complex objects
                renderFactory: L.canvas.tile,
                interactive: options.interactive,
                // vectorTileLayerName: name,
                minZoom: 7,
                maxZoom: 18,
                indexMaxZoom: 16,
                tolerance: simplificationLevel,
                vectorTileLayerStyles: {
                    sliced: options.style,
                },
                getFeatureId: function(f) {
                    return f.properties[options.id];
                },
            });
            
            // create index of all features in layer
            parentThis.data[name].indices = {};
            parentThis.data[name].indices.all = parentThis.data[name].features.map(feature => feature.properties.OBJECTID);
            // initiate state of visible features
            parentThis.overlays[name].visible = parentThis.data[name].indices.all;

            // some status messaging stuff
            var t1 = performance.now();
            console.log("tiling took " + (t1 - t0) + " milliseconds.");
            var t0 = performance.now();
            console.log("adding to map");

            // add the layer to the map
            parentThis.overlays[name].addTo(parentThis.map);

            parentThis.layerControl.addOverlay(parentThis.overlays[name], name);
            // that = parentThis;
            function logMapAdd () {
                var t1 = performance.now();
                console.log("adding took " + (t1 - t0) + " milliseconds.");
                parentThis.overlays[name].off('load', logMapAdd);
            }
            parentThis.overlays[name].on('load', logMapAdd);
        };
        // all contained in promise as url loads async
        var promise = new Promise((resolve, reject) => {
            if (options.hasOwnProperty("url")) {
                console.log("loading from " + options.url);
                this.loadURL(options.url, name).then(() => { 
                    runAdd(this, name, options);
                    resolve("Stuff Worked");
                });
            }
            else {
                console.log("just adding ");
                console.log(options);
                runAdd(this, name, options);
                resolve("Stuff Worked");
            }
            // console.log("tiling data...");
            // var t0 = performance.now();
        });
        return promise;
    },
    max: function(dataName, propertyName) {
        t0 = performance.now()
        console.log ("finding max of " + propertyName + " in " + dataName);
        max = Math.max(...this.data[dataName].features.map(feature => feature.properties[propertyName]));
        console.log("finding max took " + (performance.now() - t0) + " milliseconds");
        return max;
    },
    newIndex: function(options) {
        // { property: , name: , value: , endValue: , source:  }
        //dataSource, optionspropertyName, indexValue, indexName = false
        t0 = performance.now();
        console.log("creating index: " + options.name + " from " + options.source);
        var indexFeatures = this.data[options.source].features.filter(feature => 
            (options.hasOwnProperty("endValue") ? options.value <= feature.properties[options.property] : options.value == feature.properties[options.property]) 
            && 
            (options.hasOwnProperty("endValue") ? feature.properties[options.property] <= options.endValue : true)
        );
        index = indexFeatures.map(feature => feature.properties.OBJECTID);
        console.log("Index " + options.name + " took " + (performance.now() - t0) + " milliseconds, with " + index.length + " elements.");
        if (options.hasOwnProperty("name")) {
            this.data[options.source].indices[options.name] = index;
        }
        else {
            return index;
        }
    },
    intersect: function(indices, intersectName = false) {
        t0 = performance.now();
        console.log("Performing Intersect");
        // indices = indices.map(index => typeof(index) === 'string' ? this.indices[index] : index);
        // indices.map(index => new Set(index));
        // intersect = indices.shift();
        // indices.forEach(index => intersect = intersect.filter(id => index.includes(id)));
        var intersect = indices.shift();
        indices = indices.map(index => new Set(index));
        indices.forEach((index) => {
            intersect = intersect.filter(id => index.has(id));
        });
        console.log("Intersect took " + (performance.now() - t0) + " milliseconds, array is: " + intersect.length + " elements long");
        if (intersectName) {
            this.indices[intersectName] = intersect;
        }
        else {
            return intersect;
        }
    },
    union: function(indices, unionName = false) {
        // check if string (existing index) otherwise assume created index
        t0 = performance.now();
        console.log("Performing Union");
        // indices = indices.map(index => typeof(index) === 'string' ? this.indices[index] : index);
        union = [...new Set([].concat(...indices))];
        console.log("Union took " + (performance.now() - t0) + " milliseconds, array is: " + union.length + " elements long");
        if (unionName) {
            this.indices[unionName] = union;
        }
        else {
            return union;
        }
    },
    difference: function(indices, differenceName = false) {
        t0 = performance.now();
        console.log("Running Difference");
        // indices = indices.map(index => typeof(index) === 'string' ? this.indices[index] : index);
        // let difference = indices.shift();
        // console.log(indices.length);
        // indices.forEach(index => difference = difference.filter(id => !index.includes(id)));
        // difference = indices[0].filter(id => !indices[1].includes(id));
        // difference = indices[0].filter(id => indices[1].indexOf(id) >= 0);
        // var a = new Set(indices[0]);
        // using a set improves this function by an order of magnitude (200 milliseconds to 10 milliseconds)
        var b = new Set(indices[1]);
        var difference = indices[0].filter(id => !b.has(id));
        console.log("Difference Took " + (performance.now() - t0) + " milliseconds");
        if (differenceName) {
            this.indices[differenceName] = difference;
        }
        else {
            return difference;
        }
    },
    /* removed as overlay properties need standardisation
    setStyle: function(overlay, index, style) {
        t0 = performance.now();
        console.log("Running Set Style");
        index.forEach(id => mapState.overlays[overlay].setFeatureStyle(id, style));
        console.log("Set Style took " + (performance.now() - t0) + " milliseconds");
    },
    */ 
    setNotVisible: function(overlay, index) {
        // overlay.name, overlay.type (tile, geoJson), overlay.indices
        t0 = performance.now();
        console.log("Hiding " + index.length + "elements");

        // parse options
        if (!overlay.hasOwnProperty("type")) {
            overlay.type = 'geoJson';
        }
        if (!overlay.hasOwnProperty("indices")) {
            overlay.indices = overlay.name;
        }

        // calculate hidden features that should be showing
        // var notVisible = this.difference([this.data[overlay.indices].indices.all, this.overlays[overlay.name].visible]);
        var notVisible = this.difference([this.data[overlay.indices].indices.all, this.overlays[overlay.indices].visible]);
        // var shouldBeVisible = this.difference([this.data[overlay.indices].indices.all, index]);
        var shouldBeVisible = this.difference([this.data[overlay.indices].indices.all, index]);
        var showFeatures = this.intersect([notVisible, shouldBeVisible]);

        // calculated shown features that should be hid
        // intersect between features to set not visible and visible
        var hideFeatures = this.intersect([index, this.overlays[overlay.name].visible]);

        // and update should be visible
        this.overlays[overlay.name].visible = shouldBeVisible;
        
        // style setting which hides a feature
        style = {
            stroke: false,
            fill: false,
        };

        // apply visible and hide
        if (overlay.type == 'tile') {
            showFeatures.forEach(id => mapState.overlays[overlay.name].resetFeatureStyle(id));
            hideFeatures.forEach(id => mapState.overlays[overlay.name].setFeatureStyle(id, style));
        }
        else {
            // var indexSet = new Set(showFeatures);
            /*
             * some general notes on how to implement this:
             * removeLayer can take internal id: how to set?
             * addLayer adds given layer to the group: may have to add and remove instead of hiding
             *
             */
            /*
            mapState.overlays[overlay.name].eachLayer(featureLayer => {
                var properties = featureLayer.feature.properties;
                console.log("featureLayer is");
                console.log(featureLayer);
                if (indexSet.has(properties.OBJECTID)) {
                    featureLayer.resetStyle();
                }
            });
            */
            var hideFeaturesSet = new Set(hideFeatures);
            var showFeaturesSet = new Set(showFeatures);
            // var indexSet = new Set(shouldBeVisible);
            // console.log("hide features is: ")
            // console.log(indexSet);
            var layersToShow = [];
            var layersToHide = [];
            console.log(this.overlays[overlay.name]);
            console.log(this.overlays[overlay.name].original);
            // this.overlays[overlay.name].original.eachLayer(featureLayer => {
            this.overlays[overlay.name].original.forEach(featureLayer => {
                var properties = featureLayer.feature.properties;
                if (hideFeaturesSet.has(properties.OBJECTID)) {
                    layersToHide.push(featureLayer);
                }
            });
            this.overlays[overlay.name].original.forEach(featureLayer => {
                var properties = featureLayer.feature.properties;
                if (showFeaturesSet.has(properties.OBJECTID)) {
                    layersToShow.push(featureLayer);
                }
            });
            // this.overlays[overlay.name].clearLayers();
            // this.overlays[overlay.name].removeLayers(layersToRemove);
            // this.overlays[overlay.name].addLayers(layersToShow);
            this.overlays[overlay.name].removeLayers(layersToHide);
            this.overlays[overlay.name].addLayers(layersToShow);
            this.overlays[overlay.name].refreshClusters();
        }
        console.log(hideFeatures.length + " elements hidden, " + showFeatures.length + " elements re-shown, took " + (performance.now() - t0) + " milliseconds");
    },
}

// creates 4 to 5 base map layers as requested and adds to object for control/map
// road map
mapState.addBaseLayer("Roads", 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    // minZoom: 7,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoiam9zaGciLCJhIjoiTFBBaE1JOCJ9.-BaGpeSYz4yPrpxh1eqT2A',
});

// terrain map
/*
mapState.addBaseLayer("Topographic", 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
*/

mapState.addBaseLayer("Topographic", 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
});

// satellite image map
mapState.addBaseLayer("Satellite", 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 17,
    id: 'mapbox.satellite',
    accessToken: 'pk.eyJ1Ijoiam9zaGciLCJhIjoiTFBBaE1JOCJ9.-BaGpeSYz4yPrpxh1eqT2A',
});

// light gray map with labels
mapState.addBaseLayer("Light Map", 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

// dark gray map without labels
mapState.addBaseLayer("Dark Background Map", 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
});