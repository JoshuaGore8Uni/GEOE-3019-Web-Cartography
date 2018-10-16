// console.log(fetch('http://www.waterconnect.sa.gov.au/Content/Downloads/DEWNR/FIREMGT_LastFire_geojson.zip', { mode: "no-cors" }));

var vm = new Vue({
    el: '#app',
    data: {
        loadingStateMessage: '',
    },
    mounted: function () {
        $("#the-welcome-modal").modal('show');
        this.initMap();
    },
    methods: {
        initMap () {
            var topLeftCorner = [-38.139687,140.982056];
            var bottomRightCorner = [-25.772069, 128.814697];
            mapState.initMap('map', {
                center: [-34.3514, 138.9606],
                zoom: 9,
                minZoom: 7,
                maxZoom: 18,
                bounds: [topLeftCorner, bottomRightCorner],
            });
        },
        // function called by interface on button click
        addDataFrom (url) {
            $("#the-loading-modal").modal('show');
            var t0 = performance.now();
            console.log("downloading data...");
            this.loadingStateMessage = "downloading data...";
            mapState.loadData(url).then(result => {
                this.addData();
            });
        },
        addData () {
            this.loadingStateMessage = "processing data...";
            name = "Fire Areas";
            mapState.addVectorOverlay(name, mapState.data);
            function initialLoad () {
                $("#the-loading-modal").modal('hide');
                mapState.overlays[name].off('load', initialLoad);
            }
            mapState.overlays[name].on('load', initialLoad);
            // mapState.newIndex("INCIDENTTYPE", "Bushfire", "Bushfires");
            mapState.newIndex("FIREYEAR", 1930, "1930-1939", 1939);
            mapState.newIndex("FIREYEAR", 1940, "1940-1949", 1949);
            mapState.newIndex("FIREYEAR", 1950, "1950-1959", 1959);
            mapState.newIndex("FIREYEAR", 1960, "1960-1969", 1969);
            mapState.newIndex("FIREYEAR", 1970, "1970-1979", 1979);
            mapState.newIndex("FIREYEAR", 1980, "1980-1989", 1989);
            mapState.newIndex("FIREYEAR", 1990, "1990-1999", 1999);
            mapState.newIndex("FIREYEAR", 2000, "2000-2009", 2009);
            mapState.newIndex("FIREYEAR", 2010, "2010-2019", 2019);

            /*
            style = {
                stroke: true,
                weight: 1,
                color: 'rgba(244, 95, 66, 1)',
                fillColor: 'rgba(244, 241, 66, 0.5)',
                fillOpacity: 1,
                fill: true,
            };
            */
            style = {
                stroke: false,
                fillOpacity: 0,
            };
            function setStyleLoop() {
                var indices = Object.keys(mapState.indices);
                indices.forEach(index => {
                    setTimeout(() => {
                        setStyle(index)
                    }, 2000);
                })
            };

            function setStyle(index) {
                t0 = performance.now();
                mapState.indices[index].forEach(id => mapState.overlays[name].setFeatureStyle(id, style));
                console.log("Set Style took " + (performance.now() - t0) + " milliseconds");
            };

            mapState.overlays[name].on('load', setStyleLoop);
        },
    }
});
