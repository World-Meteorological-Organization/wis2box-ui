<!-- StationLatest displays a table of variables and their most recent value for a specific station -->

<template id="station-status">
  <div class="station-status">
    <h5 class="text-left">
      {{ $t("messages.latest")}}
    </h5>
  <v-progress-linear v-if="loading" indeterminate color="#014e9e"/>
    <v-table>
      <table>
        <tr>
          <th width="50%">Publication timestamp</th>
          <td width="50%">{{ latest_pubtime }}</td>
        </tr>
        <tr>
          <th width="50%">Data timestamp</th>
          <td width="50%">{{ latest_datetime }}</td>
        </tr>
        <tr>
          <th width="50%">Type</th>
          <td width="50%">{{ latest_type }}</td>
        </tr>
        <tr>
          <th width="50%">File-size</th>
          <td width="50%">{{ latest_size_kb }}</td>
        </tr>
      </table>
    </v-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { getNameTime, clean, hasLinks, fetchWithToken } from "@/lib/helpers.js";
import type { ItemsResponse, Feature } from "@/lib/types";
import { catchAndDisplayError } from "@/lib/errors";
import { t } from "@/locales/i18n"


export default defineComponent({
  data() {
    return {
      latest_datetime: null as string | null,
      latest_pubtime: null as string | null,
      latest_size_kb: null as string | null,
      latest_type: null as string | null,
      loading: false,
    };
  },
  props: {
    selectedStation: {
      type: Object as PropType<Feature>,
      required: true,
    },
    metadata_id: {
      type: String,
      required: true, 
    }
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
        this.loadMessages(this.selectedStation);
      } else if (this.selectedStation !== null) {
        catchAndDisplayError(`
          ${clean(this.selectedStation.properties.name)} ${t(
          "messages.no_messages"
        )}, ${t("messages.how_to_link_station")}`);
        this.loading = false;
      }
    },
    async loadMessages(station: Feature) {
      this.loading = true;
      try {
        const url = `${window.VUE_APP_OAPI}/collections/messages/items?` + new URLSearchParams({
          q: this.metadata_id.replace("urn:wmo:md:", ""),
          wigos_station_identifier: this.selectedStation.id,
          limit: "1",
          sortby: "-datetime"
        });
        const response = await fetchWithToken(url);
        const data: ItemsResponse = await response.json();
        if (data.features.length > 0) {
          const latest = data.features[0];
          console.log("Latest message for station", station.id, latest);
          this.latest_datetime = latest.properties.datetime || null;
          this.latest_pubtime = latest.properties.pubtime || null;
          // get the first link with rel="canonical" or rel="update"
          const link = latest.links.find((l: any) =>
            l.rel === "canonical" || l.rel === "update"
          );
          if (link) {
            this.latest_size_kb = `${Math.round((link.length || 0) / 1024)} kB`;
            this.latest_type = link.type || "N/A";
          } else {
            console.warn("No canonical or update link found for latest message");
            this.latest_size_kb = null;
            this.latest_type = null;
          }
        } else {
          console.info("No messages found for station", station.id);
          this.latest_datetime = null;
          this.latest_pubtime = null;
          this.latest_size_kb = null;
          this.latest_type = null;
          catchAndDisplayError(`
            ${clean(station.properties.name)} ${t(
            "messages.no_messages"
          )}, ${t("messages.how_to_link_station")}`);
        }
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
