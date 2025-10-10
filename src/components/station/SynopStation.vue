<template id="wis-station">
  <div class="wis-station" style="display: none"></div>
</template>

<script lang="ts">
import { LegendColors, type Feature, type ItemsResponse } from "@/lib/types";
import { useGlobalStateStore } from "@/stores/global";
import { circleMarker, geoJSON, Layer, type LatLngExpression, type Map } from "leaflet";
// @ts-expect-error no types
import { MarkerClusterGroup } from "leaflet.markercluster/dist/leaflet.markercluster-src.js";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { computed, defineComponent, type PropType } from "vue";

export default defineComponent({
  data: function () {
    return {
      geojsonOptions: {
        onEachFeature: this.onEachFeature as () => void,
        pointToLayer: this.pointToLayer as () => Layer,
      },
      layer: null as Layer | null,
      clusterLayer: null as Layer | null,
      renderAsCluster: computed(() => useGlobalStateStore().cluster)
    };
  },
  props: {
    features: {
      type: Object as PropType<ItemsResponse>,
      required: true
    },
    map: {
      type: Object as PropType<Map>,
      required: true
    }
  },
  mounted: function () {
    this.$nextTick(() => {
      this.onReady()
    })
  },
  watch: {
    renderAsCluster: function () {
      this.renderLayer();
    }
  },
  methods: {
    onReady() {
      if (!this.features.features || !this.features.features.length) {
        return
      }

      this.layer = geoJSON(this.features, this.geojsonOptions);
      this.clusterLayer = new MarkerClusterGroup({
        disableClusteringAtZoom: 9,
        chunkedLoading: true,
        chunkInterval: 500,
      });
      if (this.clusterLayer) {
        //@ts-expect-error no types for this
        this.clusterLayer.addLayer(this.layer);
      }
      this.renderLayer();
    },
    renderLayer() {
      if (this.renderAsCluster) {
        if (!this.layer) {
          return
        }
        this.layer.removeFrom(this.map);
        if (this.clusterLayer) {
          if (this.clusterLayer) {
            this.clusterLayer.addTo(this.map);
          }
        }
      } else {
        if (!this.clusterLayer) {
          return
        }
        this.clusterLayer.removeFrom(this.map)
        if (this.layer) {
          this.map.addLayer(this.layer as L.Layer);
        }
      }
    },
    mapClick(e: { target: { feature: Feature; }; originalEvent: { stopPropagation: () => void; }; }) {
      const store = useGlobalStateStore();
      store.setSelectedStation(e.target.feature);
      e.originalEvent.stopPropagation();
    },
    onEachFeature(feature: Feature, layer: L.Layer) {
      const store = useGlobalStateStore();
      layer.on("mouseover", (e: L.LeafletMouseEvent) => {
        store.setSelectedStation(feature);
        layer.bindPopup(feature.properties.name!).openPopup(e.latlng);
      });
      layer.on({
        click: this.mapClick
      });
    },
    pointToLayer(feature: Feature, latLng: LatLngExpression) {
      let fillColor;
      let color;
      const hits = feature.properties.num_obs;
      if (hits === 0 || hits === undefined) {
        fillColor = LegendColors.Gray;
        color = "#2E343B";
      } else if (hits <= 7) {
        fillColor = LegendColors.Red;
        color = "#801A00";
      } else if (hits <= 19) {
        fillColor = LegendColors.Yellow;
        color = "#804D00";
      } else {
        fillColor = LegendColors.Green;
        color = "#004D00";
      }
      const markerStyle = {
        radius: 4,
        fillColor: fillColor,
        color: color,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      };
      return circleMarker(latLng, markerStyle);
    },
  },
});
</script>
