// console.log(fetch('http://www.waterconnect.sa.gov.au/Content/Downloads/DEWNR/FIREMGT_LastFire_geojson.zip', { mode: "no-cors" }));
// import vueSlider from 'vue-slider-component';

var vm = new Vue({
    el: '#app',
    components: {
        // vueSlider,
        'vueSlider': window[ 'vue-slider-component'  ],    
    },
    data: {
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
        maxFireSize: 1000000000,
        minFireSize: 0,
        fireSizeRange: [0, 1000000000],
        // run animation?
        animation: false,
    },
    mounted: function () {
        $("#the-welcome-modal").modal('show');
        this.initMap();
        // function style()
        function getColor(percentage_burnt) {
            color = 
                /*
                properties.percentage_burnt > 50 ? '#ED795A' :
                properties.percentage_burnt > 20 ? '#C07A34' :
                properties.percentage_burnt > 10 ? '#8F7822' :
                properties.percentage_burnt > 5 ? '#5F7127' :
                properties.percentage_burnt > 3 ? '#336634' :
                                                     '#055741' 
                */
                // percentage_burnt > 50 ? '#41202B' :
                // percentage_burnt > 50 ? '#6d0d2d' :
                percentage_burnt > 50 ? '#a50036' :
                percentage_burnt > 20 ? '#574763' :
                percentage_burnt > 10 ? '#467994' :
                percentage_burnt > 5 ? '#25ADA5' :
                percentage_burnt > 3 ? '#71DC90' :
                                        '#E7FE6F';
                return color;
        }
        // var values = [100, 50, 20, 10, 5, 3, 0];
        var values = [0, 3, 5, 10, 20, 50, 100];
        mapState.addLegend(getColor, values);
        function style(properties, zoom) {
            var style = {
                stroke: true,
                weight: 1,
                color: 'grey',
                fillColor: getColor(properties.percentage_burnt),
                fillOpacity: 0.3,
                fill: true,
            }
            return style;
        };
        // simple function to simplify date formating when building popup
        function formatDate(date) {
            return (date.slice(6,8) + "/" + date.slice(4,6) + "/" + date.slice(0,4))
        }
        mapState.addClusterOverlay("Fire Centres", {url: "./data/tracked/fire_history_centroids.geojson"}).then(() => {
            mapState.overlays["Fire Centres"].on('click', (featureLayer) => {
                var properties = featureLayer.layer.feature.properties;
                var content = 
                    "<h5>" + (properties.INCIDENTNAME ? properties.INCIDENTNAME : properties.INCIDENTTYPE + " on " + formatDate(properties.FIREDATE)) + "</h5>"
                    + (properties.INCIDENTNUMBER ? "<p><i>Incident Number: " + properties.INCIDENTNUMBER + "</i></p>" : "")
                    + "<p>This " + properties.INCIDENTTYPE + " ignited in " + properties.SEASON.toLowerCase()
                    + " on the " + formatDate(properties.FIREDATE) + " and burnt " 
                    + (Number(properties.SHAPE_Area/10000).toFixed(2)) + " ha</p>"
                ;
                var popup = L.popup().setLatLng(featureLayer.latlng).setContent(content);
                mapState.toggleHighlight("Fire Areas", properties.OBJECTID);
                popup.openOn(mapState.map);
                popup.on('remove', () => mapState.toggleHighlight("Fire Areas", properties.OBJECTID));
            })
        });
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
            this.loadingStateMessage = "downloading and processing data, might take a while...";
            // name = "Fire Areas";
            // mapState.addVectorOverlay(name, mapState.data);
            var state = this;
            // listener to track initial adding of vector data
            function style(properties, zoom) {
                var style = {
                    stroke: true,
                    weight: 1,
                    fillOpacity: 0.2,
                    fill: true,
                }
                if (properties.INCIDENTTYPE == "Bushfire") {
                    // style.color = '#98533A';
                    // style.fillColor = '#98533A';
                    style.color = '#F73127';
                    style.fillColor = '#F73127';
                }
                else {
                    // style.color = '#294A28';
                    // style.fillColor = '#294A28';
                    style.color = '#0a6819';
                    style.fillColor = '#05971D';
                }
                // function to prevent display of small polygons at large scales, shows some performance improvement
                if (!((zoom >= 12) || (properties.SHAPE_Area > 100000 && zoom < 12) || (properties.SHAPE_Area > 1000000 && zoom < 8))) {
                    style = {
                        stroke: false,
                        fill: false,
                    };
                }
                return style;
            };
            mapState.addVectorOverlay(name, {url: url, style: style, interactive: true, id: "OBJECTID"}).then(() => {
                // no popup implementation function in mapState due to details required (content calculation)
                mapState.overlays[name].on('click', (feature) => {
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
                // console.log("Building Index");
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
                var filterMaxSize = 0;
                this.fireSizeRange[1] == 1000000000 ? filterMaxSize = this.maxFireSize : filterMaxSize = this.fireSizeRange[1];
                var sizes = mapState.difference([mapState.data["Fire Areas"].indices.all, mapState.newIndex({ property: "SHAPE_Area", source: "Fire Areas", value: this.fireSizeRange[0], endValue: filterMaxSize})]);
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
                if (mapState.map.hasLayer(mapState.overlays["Fire Areas"])) {
                    mapState.setNotVisible({name: "Fire Areas", type: 'tile'}, this.featuresToHide);
                }
                if (mapState.map.hasLayer(mapState.overlays["Fire Centres"])) {
                    mapState.setNotVisible({name: "Fire Centres", type: 'geoJson'}, this.featuresToHide);
                }
                // mapState.setNotVisible({name: "Fire Centres", type: 'geoJson', indices: "Fire Areas"}, this.featuresToHide);
            };
        },
        animation: function () {
            // this.fireYearRange[1] = minFireYear;
            if (this.yearsDisplay == 'slider' && this.animation) {
                this.$set(this.fireYearRange, 0, 1930);
                this.$set(this.fireYearRange, 1, 1930);
                // console.log("running animation: " + this.animation);
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
