// console.log(fetch('http://www.waterconnect.sa.gov.au/Content/Downloads/DEWNR/FIREMGT_LastFire_geojson.zip', { mode: "no-cors" }));
// import vueSlider from 'vue-slider-component';

var vm = new Vue({
    el: '#app',
    components: {
        // vueSlider,
        'vueSlider': window[ 'vue-slider-component'  ],    
    },
    data: {
        // vue manages loading state and messages
        // and also manages filters

        // if waiting for user initiation
        initiation: true,
        // if downloading and processing data
        loading: false, 
        loadingMessage: '',
        // fire type filter
        showBushfires: true,
        showPrescribedBurns: true,
        // seasonal filters
        showSummer: true,
        showAutumn: true,
        showWinter: true,
        showSpring: true,
        // timeslider filter fire events
        fireYearRange: [1930, 2020],
        yearsDisplay: 'slider',
        maxFireYear: 0,
        minFireYear: 0,
        // decade filters (set timeline slider)
        // fire sizes
        maxFireSize: 10000000,
        minFireSize: 0,
        fireSizeRange: [0, 100000000],
        animation: false,
    },
    mounted: function () {
        $("#the-welcome-modal").modal('show');
        this.initMap();
        // function style()
        function style(properties, zoom) {
            // 6 classes jenks natural breaks calculated by qgis
            fillColor = (
                properties.percentage_burnt > 28 ? '#993404' :
                properties.percentage_burnt > 17 ? '#d95f0e' :
                properties.percentage_burnt > 13 ? '#fe9929' :
                properties.percentage_burnt > 5.83 ? '#fec44f' :
                properties.percentage_burnt > 3.33 ? '#fee391' :
                                                     '#ffffd4' 
            );
            var style = {
                stroke: true,
                weight: 1,
                color: 'rgba(244, 95, 66, 1)',
                fillColor: fillColor,
                fillOpacity: 0.3,
                fill: true,
            }
            return style;
        };
        mapState.addClusterOverlay("Fire Centres", {url: "./data/tracked/fire_history_centroids.geojson"});
        mapState.addVectorOverlay("Fire Ban Districts", {url: "./data/tracked/fire_ban_districts_counts_percentages.geojson", style: style, interactive: true}).then(() => {
            // no popup implementation function in mapState due to details required (content calculation)
            mapState.overlays["Fire Ban Districts"].on('click', (feature) => {
                var properties = feature.layer.properties;
                var content = 
                    "<h5>" + properties.Name + "</h5>"
                    + "<p>" + properties.count + " fires have burn in this region, burning "
                    + (Number(properties.sum/10000).toFixed(2)) + " ha, " + Number(properties.percentage_burnt).toFixed(2) + "% of the regions " + (Number(properties.area/10000).toFixed()) + " ha. </p>"
                ;
                L.popup()
                    .setLatLng(feature.latlng)
                    .setContent(content)
                    .openOn(mapState.map);
            });
        });
    },
    methods: {
        initMap () {
            // set bounds to South Australia (though little effect as zoom greater than state extent)
            var topLeftCorner = [-38.139687,140.982056];
            var bottomRightCorner = [-25.772069, 128.814697];
            // init map state (map layers, basic controls etc. set in map script)
            mapState.initMap('map', {
                center: [-34.3514, 138.9606],
                zoom: 9,
                minZoom: 7,
                maxZoom: 18,
                bounds: [topLeftCorner, bottomRightCorner],
            });
        },
        // load data into map state and map
        // function called by interface on button click
        addFireData (name, url=false) {
            this.loading = true;
            this.initiation = false;
            this.loadingStateMessage = "downloading and processing data...";
            // name = "Fire Areas";
            // mapState.addVectorOverlay(name, mapState.data);
            var state = this;
            // listener to track initial adding of vector data
            function style(properties, zoom) {
                var style = {
                    stroke: true,
                    weight: 1,
                    color: 'rgba(244, 95, 66, 1)',
                    fillColor: 'rgba(244, 95, 66, 0.5)',
                    fillOpacity: 1,
                    fill: true,
                }
                if ((zoom >= 12) || (properties.SHAPE_Area > 100000 && zoom < 12) || (properties.SHAPE_Area > 1000000 && zoom < 8)) {
                    if (properties.INCIDENTTYPE == "Bushfire") {
                        style.fillColor = 'rgba(230, 46, 0, 0.5)';
                        style.color = 'rgba(230, 46, 0, 1)';
                    }
                    else {
                        style.fillColor = 'rgba(204, 102, 0, 0.5)';
                        style.color = 'rgba(204, 102, 0, 1)';
                    }
                }
                else {
                    style = {
                        stroke: false,
                        fill: false,
                    };
                }
                return style;
            };
            mapState.addVectorOverlay(name, {url: url, style: style, interactive: true, id: "OBJECTID"}).then(() => {
                // no popup implementation function in mapState due to details required (content calculation)
                mapState.overlays[name].on('mouseover', (feature) => {
                    var properties = feature.layer.properties;
                    var content = 
                        "<h5>" + (properties.INCIDENTNAME ? properties.INCIDENTNAME : "No Name") + "</h5>"
                        + (properties.INCIDENTNUMBER ? "<p><i>Incident Number: " + properties.INCIDENTNUMBER + "</i></p>" : "")
                        + "<p>" + properties.INCIDENTTYPE + " on "
                        + properties.FIREDATE.slice(6,8) + "/" + properties.FIREDATE.slice(4,6) + "/" + properties.FIREDATE.slice(0,4)
                        + " (" + properties.SEASON.toLowerCase() + ")</p>"
                        + "<p>Burnt " + (Number(properties.SHAPE_Area/10000).toFixed(2)) + " ha</p>"
                    ;
                    L.popup()
                        .setLatLng(feature.latlng)
                        .setContent(content)
                        .openOn(mapState.map);
                });

                function initialLoad () {
                    state.loading = false;
                    mapState.overlays[name].off('load', initialLoad);
                }

                mapState.overlays[name].on('load', initialLoad);
                // state.loading = false;

                // fire type filter
                mapState.newIndex({source: "Fire Areas", property: "INCIDENTTYPE", value: "Bushfire", name: "Bushfires"});
                mapState.newIndex({source: "Fire Areas", property: "INCIDENTTYPE", value: "Prescribed Burn", name: "Prescribed Burns"});

                // seasonal filter
                mapState.newIndex({source: "Fire Areas", property: "SEASON", value: "SUMMER", name: "Summer"});
                mapState.newIndex({source: "Fire Areas", property: "SEASON", value: "AUTUMN", name: "Autumn"});
                mapState.newIndex({source: "Fire Areas", property: "SEASON", value: "WINTER", name: "Winter"});
                mapState.newIndex({source: "Fire Areas", property: "SEASON", value: "SPRING", name: "Spring"});

                // timeslider filter fire events
                // decade filters (set timeline slider)
                this.maxFireYear = mapState.max('Fire Areas', 'FIREYEAR');
                // fire sizes
                var maxFireSize = mapState.max('Fire Areas', 'SHAPE_Area');
                this.maxFireSize = maxFireSize;
                this.fireSizeRange[1] = maxFireSize;
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
            });
        },
    },
    computed: {
        showTheWelcomeModal: function () {
            // hide the modal if this property becomes false
            // else doesnt work with this statement thus modal will not show again if property becomes true
            if (!this.initiation && !this.loading) {
                $("#the-welcome-modal").modal('hide');
            }
            return (this.initiation || this.loading);
        },
        featuresToHide: function () {
            var featuresToHide = [];
            if (!this.initiation && !this.loading) {
                console.log("Building Index");
                var indices = [];
                if (!this.showBushfires) {
                    indices.push(mapState.data["Fire Areas"].indices.Bushfires);
                }
                if (!this.showPrescribedBurns) {
                    indices.push(mapState.data["Fire Areas"].indices["Prescribed Burns"]);
                }
                if (!this.showSummer) {
                    indices.push(mapState.data["Fire Areas"].indices.Summer);
                }
                if (!this.showAutumn) {
                    indices.push(mapState.data["Fire Areas"].indices.Autumn);
                }
                if (!this.showWinter) {
                    indices.push(mapState.data["Fire Areas"].indices.Winter);
                }
                if (!this.showSpring) {
                    indices.push(mapState.data["Fire Areas"].indices.Spring);
                }
                // calculate difference between years that should be visible and years that are not 
                var years = mapState.difference([mapState.data["Fire Areas"].indices.all, mapState.newIndex({ property: "FIREYEAR", source: "Fire Areas", value: this.fireYearRange[0], endValue: this.fireYearRange[1]})]);
                indices.push(years);

                // calculate difference between sizes that should be visible and sizes that are not 
                var sizes = mapState.difference([mapState.data["Fire Areas"].indices.all, mapState.newIndex({ property: "SHAPE_Area", source: "Fire Areas", value: this.fireSizeRange[0], endValue: this.fireSizeRange[1]})]);
                indices.push(sizes);
                // indices.push(mapState.newIndex({ property: "FIREYEAR", source: "Fire Area", value: this.fireYearRange[0], endValue: this.fireYearRange[1], }));
                style = {
                    stroke: false,
                    fillOpacity: 0,
                };
                featuresToHide = mapState.union(indices);
            }
            return featuresToHide;
        },
        /*
        fireSizeRange: function() {
            return [this.minFireSize, this.maxFireSize];
        },
        */
    },
    watch: {
        featuresToHide: function () {
            if (!this.initiation && !this.loading) {
                mapState.setNotVisible({name: "Fire Areas", type: 'tile'}, this.featuresToHide);
                // mapState.setNotVisible({name: "Fire Centres", type: 'geoJson', indices: "Fire Areas"}, this.featuresToHide);
                mapState.setNotVisible({name: "Fire Centres", type: 'geoJson'}, this.featuresToHide);
            };
        },
        animation: function () {
            // this.fireYearRange[1] = minFireYear;
            if (this.yearsDisplay == 'slider' && this.animation) {
                this.$set(this.fireYearRange, 1, 1930);
                console.log("running animation: " + this.animation);
                var loop = setInterval(() => {
                    if (this.animation != true || this.yearsDisplay != 'slider') {
                        // years display changed then animation stopped
                        this.animation = false;
                        clearInterval(loop);
                    }
                    var temp = this.fireYearRange[1] + 2;
                    this.$set(this.fireYearRange, 1, temp);
                    if (this.fireYearRange[1] > 2020) {
                        this.$set(this.fireYearRange, 1, 1930);
                    }
                }, 200);
            }
        },
    },
});
