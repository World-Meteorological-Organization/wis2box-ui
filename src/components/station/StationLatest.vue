<!-- StationLatest displays a table of variables and their most recent value for a specific station -->

<template id="station-status">
  <div class="station-status">
    <h5 class="text-left" v-if="latestreportTime">
      {{ $t("messages.from") + " " + latestreportTime }}
    </h5>
  <v-progress-linear v-if="loading" indeterminate color="#014e9e"/>

    <v-table>
      <table>
        <tr v-for="(item, i) in recentObservations" :key="i">
          <th width="50%">{{ getNameTime(item.name ? item.name : "", item.phenomenonTime ? item.phenomenonTime : "") }}
          </th>
          <td v-if="item.units !== 'CODE TABLE'" width="50%">
            {{ item.value + " " + item.units }}
          </td>
          <td v-else-if="item.units === 'CODE TABLE'" width="50%">
            {{ item.description }}
          </td>
        </tr>
      </table>
    </v-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { getNameTime, clean, hasLinks, fetchWithToken } from "@/lib/helpers.js";
import type { Feature, ItemsResponse } from "@/lib/types";
import { catchAndDisplayError } from "@/lib/errors";
import { t } from "@/locales/i18n"


export default defineComponent({
  data() {
    return {
      recentObservations: [] as Feature["properties"][],
      latestreportTime: null as string | null,
      loading: false,
    };
  },
  props: {
    selectedStation: {
      type: Object as PropType<Feature>,
      required: true,
    },
  },
  mounted() {
    this.fetchData();
  },
  watch: {
    selectedStation() {
      this.fetchData();
    },
  },
  methods: {
    getNameTime,
    async fetchData() {
      if (hasLinks(this.selectedStation)) {
        this.loadObservations(this.selectedStation);
      } else if (this.selectedStation !== null) {
        catchAndDisplayError(`
          ${clean(this.selectedStation.properties.name)} ${t(
          "messages.no_linked_collections"
        )}, ${t("messages.how_to_link_station")}`);
        this.loading = false;
      }
    },
    async loadObservations(station: Feature) {
      this.loading = true;
      this.recentObservations = [];
      try {
        const response = await fetchWithToken(
          `${window.VUE_APP_OAPI}/collections/${station.properties.topic}/items?f=json&sortby=-reportTime&wigos_station_identifier=${station.id}&limit=1`
        );
        if (response.status == 401) {
          throw new Error(t("messages.not_authorized"));
        }
        const data: ItemsResponse = await response.json();

        const hasFeatures = data.features && data.features.length > 0;

        if (hasFeatures && data.features[0].properties && data.features[0].properties.reportTime) {
          this.latestreportTime = data.features[0].properties.reportTime;
          this.loadRecentObservations(station, data.numberMatched);
        } else {
          throw new Error(
            t("chart.station") + ` ${station.properties.name}` + t("messages.no_observations_in_collection")
          );
        }
      } catch (error) {
        catchAndDisplayError(String(error));
      } finally {
        this.loading = false;
      }
    },
    async loadRecentObservations(station: Feature, limit: number) {
      this.loading = true;
      try {
        const response = await fetchWithToken(
          `${window.VUE_APP_OAPI}/collections/${station.properties.topic}/items?f=json&datetime=${this.latestreportTime}/..&wigos_station_identifier=${station.id}&limit=${limit}`
        );
        const data = await response.json();
        const features: Feature[] = data.features;
        this.recentObservations = features.map((obs: Feature) => obs.properties);
      } catch (error) {
        catchAndDisplayError(String(error));
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
tr:nth-child(odd) {
  background-color: #eeeeee;
}

th,
td {
  padding: 8px;
}
</style>
