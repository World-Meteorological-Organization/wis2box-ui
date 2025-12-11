<template id="wis-map">
  <v-progress-linear v-if="loading" striped indeterminate color="primary" />
  <div class="text-center">
    <v-row justify="center" fill-height no-gutters>
      <v-col :cols="smAndDown ? 12 : 4" :order="smAndDown ? 'last' : 'start'" v-if="map !== undefined">
        <TempStationInfo :metadata_id="metadata_id" :features="features" :map="map" class="ma-1" />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 8">
        <v-card class="ma-1" :height="$vuetify.display.height - 232">
          <l-map ref="wisMap" :zoom="zoom" :center="center" :maxZoom="16" :minZoom="2"
            @ready="onReady()">
            <template v-if="!loading && map && features">
              <TempStation :features="features" :map="map" />
            </template>
            <l-tile-layer :url="url" :attribution="attribution" />
            <l-control position="bottomleft">
              <v-card width="124px" class="legend pa-2" border="1">
                <strong>{{ $t("messages.no_of_files_published") }}</strong>
                <v-divider class="my-2" />
                <v-row no-gutters justify="center" v-for="(item, i) in legend" :key="i">
                  <v-col cols="3">
                    <i class="dot" :style="`background: ${item.color}`" />
                  </v-col>
                  <v-col>{{ item.range }}</v-col>
                </v-row>
              </v-card>
            </l-control>
          </l-map>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick } from "vue";
import { type PropType } from "vue";
import "leaflet/dist/leaflet.css";
import { geoJSON, type Map } from "leaflet";
import { LControl, LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import TempStation from "../station/TempStation.vue";
import TempStationInfo from "../station/TempStationInfo.vue";
import { LegendColors, type ItemsResponse } from "@/lib/types";
import { catchAndDisplayError } from "@/lib/errors";
import {t } from "@/locales/i18n"

export default defineComponent({
  components: {
    LControl,
    LMap,
    LTileLayer,
    TempStation,
    TempStationInfo,
  },
  data() {
    return {
      loading: true,
      center: [0, 0] as [number, number],
      zoom: 1,
      attribution: window.VUE_APP_BASEMAP_ATTRIBUTION,
      url: window.VUE_APP_BASEMAP_URL,
      legend: [
        { color: LegendColors.Green, range: "2 or more" },
        { color: LegendColors.Yellow, range: "1" },
        { color: LegendColors.Gray, range: "0" }
      ],
    };
  },
  props: {
    features: {
      type: Object as PropType<ItemsResponse>,
      required: true
    },
    metadata_id: {
      type: String,
      required: true
    }
  },
  computed: {
    smAndDown() {
      return this.$vuetify.display.smAndDown;
    },
  },
  mounted() {
    if (!this.features || !this.features.features) {
      console.error("Features prop is not properly set:", this.features);
    }
  },
  methods: {
    async onReady() {
      const wisMap = this.$refs.wisMap as { leafletObject?: Map };
      if (!wisMap?.leafletObject) return;

      this.map = wisMap.leafletObject;
      this.map.attributionControl.setPrefix("");
      this.map.zoomControl.setPosition("topright");

      if (!this.features.features || !this.features.features.length) {
          this.loading = false;
          return catchAndDisplayError(`${this.metadata_id} ${t("messages.no_observations_in_collection")}\n${t("messages.how_to_link_station")}`);
        }

      await nextTick();


      const bounds_ = geoJSON(this.features).getBounds();
      if (!bounds_.isValid()) {
        console.error("Invalid bounds inside feature", this.features);
        catchAndDisplayError("Error: invalid bounds for map");
        return;
      }

      try {
        this.map.fitBounds(bounds_);
      } catch (error) {
        catchAndDisplayError(String(error));
      }
      this.loading = false;
    },
  },
  setup() {
    const map = ref<Map | undefined>();
    return { map };
  },
});
</script>

<style scoped>
.legend .dot {
  height: 16px;
  width: 16px;
  display: inline-block;
  border-radius: 50%;
  opacity: 0.8;
}
</style>
