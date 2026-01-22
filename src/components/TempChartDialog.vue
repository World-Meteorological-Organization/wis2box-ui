<!-- TempChartDialog will display a list of stations and displays the TempChart
data for the selected datatime
-->

<template id="chart-dialog">
  <v-overlay class="align-center justify-center" v-model="open">
    <v-card :width="$vuetify.display.width" :max-height="$vuetify.display.height * 0.95" max-width="1100"
      class="pa-4 scroll">

      <v-row justify="end">
        <v-btn variant="text" color="pink" icon @click="open = !open">
          <v-icon icon="mdi-close"> </v-icon>
        </v-btn>
      </v-row>

      <v-card-title class="text-h4">
        {{ selectedStation.properties.name }}
      </v-card-title>
      <v-spacer />

      <v-card-subtitle>
        Upper-Air observations for WIGOS-station-id={{ selectedStation.properties.id }} at lat,lon={{ getLatLon(selectedStation.geometry) }} 
      </v-card-subtitle>

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-responsive height="720">
        <TempDataViewer :metadata_id="metadata_id" :selected-station="selectedStation" :messages="messages" />
      </v-responsive>
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import type { Feature, ItemsResponse } from "@/lib/types";
import TempDataViewer from "./data/TempDataViewer.vue";

import { defineComponent, type PropType } from "vue";
import { catchAndDisplayError } from "@/lib/errors";
import { fetchWithToken } from "@/lib/helpers";
import { t } from "@/locales/i18n";

export default defineComponent({
  components: {
    TempDataViewer,
  },
  data() {
    return {
      loading: false,
      open: true,
      messages: [] as Feature[],
    };
  },
  props: {
    metadata_id: {
      type: String,
      required: true
    },
    selectedStation: {
      type: Object as PropType<Feature>,
      required: true
    }
  },
  methods: {
    getLatLon(geometry: Feature["geometry"]) {
      if (geometry && geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
        const [lon, lat] = geometry.coordinates;
        return `${lat.toFixed(4)},${lon.toFixed(4)}`;
      }
      return "N/A";
    },
    async fetchMessages() {
      // fetch the last 10 messages for the selected station
      this.loading = true;
      try {
        const url = `${window.VUE_APP_OAPI}/collections/messages/items?` + new URLSearchParams({
          metadata_id: this.metadata_id.replace("urn:wmo:md:", ""),
          q: "canonical",
          wigos_station_identifier: this.selectedStation.id,
          limit: "10",
          sortby: "-datetime"
        });
        const response = await fetchWithToken(url);

        if (!response.ok) {
          const errMsg = `messages ${t("messages")}`;
          this.messages = [];
          return catchAndDisplayError(errMsg, url, response.status);
        }

        const data: ItemsResponse = await response.json();
        if (!data.features || data.numberMatched === 0) {
          this.messages = [];
          return catchAndDisplayError(t("chart.station") + t("messages.no_messages"));
        }
        this.messages = data.features;
      } catch (error) {
        catchAndDisplayError(String(error));
      } finally {
        this.loading = false;
      }
    },
  },
  async mounted() {
    await this.fetchMessages();
  },
});
</script>

<style scoped>
.scroll {
  overflow-y: scroll;
}
</style>
