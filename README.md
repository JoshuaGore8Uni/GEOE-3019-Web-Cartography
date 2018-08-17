# GEOE-3019-Web-Cartography
*Software Repo for code written by Joshua Gore*
*Do not plagarise!*
## Carto Map of Emotions
## Mapbox Custom Overlay Map
## Leaflet Practical - Final 6 published leaflet web maps from Practical together wtih a short text explanation 
### Map 1: Basemap - selector
Your first Leaflet web map should contain different basemaps and a basemap layer control. You
have to incorporate altogether five different tiled maps:
- satellite image
- road map
- terrain map
- grey map without labels
- dark map.
The choice for each of them is up to you. The basemap layer control should allow the user to switch
between them. The tile-layer source will usually be displayed automatically. The map should
initially display the extend of South Australia.
You can use this resource for Leaflet tilemaps providers: http://leaflet-extras.github.io/leaflet-providers/preview/index.html.
### Map 2: Place Of Interest map / add markers
Your second map shall include at least 3 marker points  indicating your favourite worldwide travel
destinations. Moreover, you are asked to implement an interactive marker function: Whenever
the user hovers or/and clicks on a marker, an Info-Window should popup showing an embedded
image together with further descriptive information (text, URL, etc.). Choose customized marker
symbol(s) and adapt symbol size and colour based on your personal ranking (e.g. big symbol with
bright colour = favourite destination, slightly smaller and a less intensive colour = destination no.
2, …). Allow only 3 appropriate zoom levels and include an Inset map (mini map).

### Map 3: Image overlay with transparency slider tool
Within the provided geodata you find an .png image file named
“historical_TopoMap_Adelaide_1898.png”. Please embed this historical raster map in your web
map. Apply a slider tool to change image opacity from 100% to 0%. The image extend is:
```
Lat Lng of the image extend (top left and bottom right):
-34.857826 138.450236 Decimal Degrees
-34.985246 138.749692 Decimal Degrees
```
### Map 4: Marker Clustering
Use the burnsidetreeswgs84.geojson point file and create a marker clustering map.
Add an appropriate map title using an info window on the upper right corner.
Limit the map window size to 600 x 400 px.

### Map 5: Heat map
Use the same data set (burnsidetreeswgs84.geojson) and create an heat map. When designing the
heat map carefully choose radius and blur parameters.
Apply title approach and map window size as above (Map 4).

### Map 6: Choropleth map with geojson data
Use the LGA_Adelaide.geojson polygon file to create a choropleth map. LGAs are Land government
areas (council areas). Explore the geojson file. One attribute field contains the number of parks in
each council area. That’s the one you need to use for your choropleth map.
Explore the data distribution using a histogram:
![image of data in arcgis histogram][LGA_Histo]
[LGA_Histo]: ../data/LGA_Histo.png

Which classification method to use: Natural breaks would be one option.
How many classes: Usually between 3 and 7.
The colour-scheme should be sequential.
You can use class-borders (10-30-70-120-209) of 5 classes as suggested in the figure above.
*Helpful to use is this online colour-advise-tool for choropleth maps: http://colorbrewer2.org
Additional reading about choropleth maps and their cartography: http://axismaps.github.io/thematic-cartography/articles/choropleth.html
Optional: Create and include a legend. Think about an appropriate classification and colour scheme*
## Assignment 3 - Presentation of fire scar data
