// global variable to set level of simplification
simplificationLevel = 10;

// global map variables - prevents unnecessary reactivity with associated potential overhead
mapState = {
    // layers: {},
    layerControl: {},
    map: null,
    baseMaps: {},
    overlays: {},
    data: {},
    indices: {},
    areaLayer: {},
    addBaseLayer: function(layerName, url, options) {
        this.baseMaps[layerName] = L.tileLayer(url, options);
    },
    initMap: function(mapElement, options) {
        this.map = L.map(mapElement, options);
        if (options.bounds) {
            this.map.fitBounds(options.bounds);
        }

        // add streets layer (thus default)
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
        // L.control.watermark({ position: 'bottomright' }).addTo(this.map);
        L.control.watermark({ position: 'bottomright' }).addTo(this.map);
    },
    loadData: function(url) {
        return fetch(url)
            .then (response => response.json())
            .then(json => {
                this.data = json;
            });
    },
    addVectorOverlay: function(name, data) {
        console.log("tiling data...");
        var t0 = performance.now();
        this.overlays[name] = new L.VectorGrid.Slicer(mapState.data, {
            renderFactory: L.canvas.tile,
            // vectorTileLayerName: name,
            vectorTileLayerStyles: {
                sliced: function (properties, zoom) {
                    return {
                        stroke: true,
                        weight: 1,
                        color: 'rgba(244, 95, 66, 1)',
                        fillColor: 'rgba(244, 95, 66, 0.5)',
                        fillOpacity: 1,
                        fill: true,
                    }
                },
            },
            getFeatureId: function(f) {
                return f.properties.OBJECTID;
            },
            minZoom: 7,
            maxZoom: 18,
            tolerance: simplificationLevel,
        });

        var t1 = performance.now();
        console.log("tiling took " + (t1 - t0) + " milliseconds.");
        var t0 = performance.now();
        console.log("adding to map");

        this.overlays[name].addTo(this.map);
        this.layerControl.addOverlay(this.overlays[name], name);
        that = this;
        function logMapAdd () {
            var t1 = performance.now();
            console.log("adding took " + (t1 - t0) + " milliseconds.");
            that.overlays[name].off('load', logMapAdd);
        }
        this.overlays[name].on('load', logMapAdd);
    },
    newIndex: function(propertyName, indexValue, indexName = false, indexEndValue = false) {
        t0 = performance.now();
        console.log("creating index: " + indexName);
        var indexFeatures = this.data.features.filter(feature => 
            (indexEndValue ? indexValue <= feature.properties[propertyName] : indexValue == feature.properties[propertyName]) 
            && 
            (indexEndValue ? feature.properties[propertyName] <= indexEndValue : true)
        );
        index = indexFeatures.map(feature => feature.properties.OBJECTID);
        console.log("Index \"" + indexName + "\" took " + (performance.now() - t0) + " milliseconds, with " + index.length + " elements.");
        if (indexName) {
            this.indices[indexName] = index;
        }
        else {
            return index;
        }
    },
    intersect: function(indices, intersectName = false) {
        intersect = this[indices.shift()];
        indices.forEach(index => intersect = intersect.filter(id => this[index].includes(id)));
        if (intersectName) {
            this[intersectName] = intersect;
        }
        else {
            return intersect;
        }
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
mapState.addBaseLayer("Topographic", 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
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
