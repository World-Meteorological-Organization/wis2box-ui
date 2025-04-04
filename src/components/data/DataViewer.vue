<!-- Dataviewer is a popup window which contains variables and their associated tables / plots of data -->

<template id="data-viewer">
  <v-layout>
    <v-app-bar color="#EEEEEE" flat>
      <template v-slot:prepend v-if="$vuetify.display.smAndDown">
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      </template>
      <v-toolbar-title v-show="$vuetify.display.mdAndUp" class="pa-2 text-h6">
        {{ verboseTopicName || $t("chart.collection") }}
      </v-toolbar-title>
      <v-tabs v-model="tab" end color="#014e9e">
        <v-tab v-for="(item, i) in tabs" class="text-center pa-2" :value="i" :key="i">
          {{ $t(item) }}
        </v-tab>
      </v-tabs>
    </v-app-bar>
    <DataNavigation :datastreams="datastreams" :station="selectedStation" />
    <v-main style="height: 100vh">
      <v-window v-model="tab" style="height: 100%">
        <v-window-item :value="0" v-if="selectedDatastream">
          <DataPlotter :selected-datastream="selectedDatastream" :selected-station="selectedStation" :topic="topic"
            :items-response="itemsResponsePaginated" :items-response-url="itemsResponseUrl" :loading="loading" />
        </v-window-item>
        <v-window-item :value="1" v-if="selectedDatastream">
          <DataTable :selected-datastream="selectedDatastream" :selected-station="selectedStation" :topic="topic"
            :items-response="itemsResponsePaginated" :items-response-url="itemsResponseUrl" :loading="loading" />
        </v-window-item>
        <v-container style="padding-top: 0px;">
          <v-row no-gutter align="center" justify="space-between">
            <v-col cols="1">
              <div className="chunkInput">
                <label for="observations">
                  Observations
                </label>
                <input type="number" id="observations" :disabled="!chunkSize" :value="chunkSize" @input="debouncedHandleChunkSizeChange" :min="1"
                  :max="itemsResponse.numberMatched" title="Number of observations per request and page" />
              </div>
            </v-col>
            <v-col cols="10">
              <v-pagination v-if="totalPages > 1" v-model="page" :length="totalPages" />
            </v-col>
          </v-row>
        </v-container>
      </v-window>
    </v-main>
  </v-layout>
</template>

<script lang="ts">
import DataPlotter from "@/components/data/DataPlotter.vue";
import DataNavigation from "@/components/data/DataNavigation.vue";
import DataTable from "@/components/data/DataTable.vue";
import { defineComponent, type PropType } from "vue";
import type { CollectionsResponse, Datastreams, Feature, ItemsResponse } from "@/lib/types";
import { useGlobalStateStore } from "@/stores/global";
import { addParam, fetchOAFFeatures, fetchTotalFeatures, fetchWithToken, isLocalhost, replaceHostname, replaceParam } from "@/lib/helpers";
import { catchAndDisplayError } from "@/lib/errors";
import debounce from 'lodash.debounce';
import type { DebouncedFunc } from "lodash";

export interface DataViewerData {
  drawer: boolean;
  tab: number;
  tabs: string[];
  verboseTopicName: string;
  itemsResponse: ItemsResponse;
  itemsResponsePaginated: ItemsResponse;
  itemsResponseUrl: string;
  totalPages: number;
  page: number;
  chunkSize: number | null;
  loading: boolean;
  debouncedHandleChunkSizeChange: DebouncedFunc<(event: Event) => void>;
}

export default defineComponent({
  components: {
    DataPlotter,
    DataNavigation,
    DataTable,
  },
  props: {
    selectedStation: {
      type: Object as PropType<Feature>,
      required: true,
    },
    datastreams: {
      type: Object as PropType<Datastreams>,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    }
  },
  computed: {
    selectedDatastream() {
      const store = useGlobalStateStore();

      return store.selectedDatastream;
    },
    numberReturned() {
      return this.itemsResponse.numberReturned;
    }
  },
  watch: {
    selectedDatastream: function () {
      // Reset variables to original state when changing datastream
      this.resetVariables();
      // Fetch new total and observations
      this.loadData();
    },
    page: function () {
      if (this.chunkSize) {
        const startIndex = (this.page - 1) * this.chunkSize;
        const endIndex = startIndex + this.chunkSize;
        this.itemsResponsePaginated.features = this.itemsResponse.features.slice(startIndex, endIndex);
      }
    },
    chunkSize: function (newChunkSize) {
      // Check if newChunkSize is null
      if (typeof newChunkSize === 'number' && !isNaN(newChunkSize)) {
        // Dont allow exceeding the min or max
        if (newChunkSize < 1) {
            this.chunkSize = 1;
        } else if (newChunkSize > this.itemsResponse.numberMatched) {
            this.chunkSize = this.itemsResponse.numberMatched;
        } else {
          this.page = 1;
          this.totalPages = Math.ceil(this.itemsResponse.numberReturned / newChunkSize);
          
          const startIndex = (this.page - 1) * newChunkSize;
          const endIndex = startIndex + newChunkSize;
          this.itemsResponsePaginated.features = this.itemsResponse.features.slice(startIndex, endIndex);
        }

      }
    },
    numberReturned: function () {
      if (this.chunkSize) {
        this.totalPages = Math.ceil(this.itemsResponse.numberReturned / this.chunkSize);
      }
    }
  },
  async mounted() {
    this.$t('$vuetify.pagination.ariaLabel.root');
    this.$t('$vuetify.pagination.ariaLabel.page');
    this.$t('$vuetify.pagination.ariaLabel.currentPage');
    this.$t('$vuetify.pagination.ariaLabel.next');
    this.$t('$vuetify.pagination.ariaLabel.previous');

    const request = await fetchWithToken(`${window.VUE_APP_OAPI}/collections/${this.topic}`);
    if (request.ok) {
      const json: CollectionsResponse["collections"][0] = await request.json();
      this.verboseTopicName = json.title;
    }

    this.loadData();

  },
  created() {
    // Cancel the existing debounced function from instantiation
    this.debouncedHandleChunkSizeChange.cancel();
    this.debouncedHandleChunkSizeChange = debounce(this.handleChunkSizeChange, 300);
  },
  methods: {
    handleChunkSizeChange(event: Event) {
      if (event.target) {
        const target = event.target as HTMLInputElement
        const chunkSize = Number(target.value);
 
        this.chunkSize = chunkSize;
      }
    },
    async loadData() {
      this.loading = true;
      try {
        // Get the total number of features
        await this.loadTotal();

        if (!this.selectedDatastream || !this.chunkSize) {
          return;
        }

        // If the total is under 500, fetch all
        if (this.itemsResponse.numberMatched <= this.chunkSize) {
          await this.loadObservations();
          // Else get in groups of 500 or the user requested chunk size
        } else {
          await this.loadObservationsByChunk();
        }
      } catch (error) {
        catchAndDisplayError(String(error));
      } finally {
        this.loading = false;
        console.log("done");
      }
    },
    async loadTotal() {
      const url = this.getUrl();
      const total = await fetchTotalFeatures(url);
      this.chunkSize = Math.min(total, 500);
      this.itemsResponseUrl = addParam(url, 'limit', total.toString());
      this.itemsResponse.numberMatched = total;
    },
    async loadObservationsByChunk() {
      if (!this.chunkSize) {
        return;
      }

      // Nested in loadData try catch
      let hasNextUrl = true;
      let nextUrl = this.getObservationsUrl();
      while (hasNextUrl) {
        const response = await fetchOAFFeatures(nextUrl);
        const data: ItemsResponse = await response.json();

        if (this.itemsResponsePaginated.features.length === 0) {
          this.itemsResponsePaginated.features = data.features
        }
        this.itemsResponse.features = this.itemsResponse.features.concat(JSON.parse(JSON.stringify(data.features)))
        this.itemsResponse.numberReturned += data.features.length;
        hasNextUrl = this.hasNextUrl(data);
        if (hasNextUrl) {
          let _nextUrl = this.getNextUrl(data);

          // If developing on localhost, replace hostname with proxy
          if (isLocalhost()) {
            _nextUrl = replaceHostname(_nextUrl, window.VUE_APP_OAPI);
          }
          // If chunksize has changed, reflect this in the next request
          _nextUrl = replaceParam(_nextUrl, 'limit', this.chunkSize.toString());
          if (_nextUrl === nextUrl) {
            throw new Error('Next url matches previous, aborting request');
          }
          nextUrl = _nextUrl;
        }
      }
    },
    async loadObservations() {
      if (!this.chunkSize) {
        return;
      }

      // Nested in loadData try catch
      const url = this.getObservationsUrl();
      const response = await fetchOAFFeatures(url);
      const data: ItemsResponse = await response.json();
      this.itemsResponse = JSON.parse(JSON.stringify(data));
      this.itemsResponsePaginated = JSON.parse(JSON.stringify(data));
    },
    getUrl() {
      const params = new URLSearchParams({
        f: 'json',
        name: this.selectedDatastream?.name ?? '',
        reportId: this.selectedDatastream?.reportId ?? '',
        wigos_station_identifier: this.selectedStation.id,
        sortby: 'reportTime',
      });

      return `${window.VUE_APP_OAPI}/collections/${this.topic}/items?${params.toString()}`;
    },
    getObservationsUrl() {
      if (!this.chunkSize) {
        return '';
      }

      const url = this.getUrl();
      return addParam(url, 'limit', this.chunkSize.toString());
    },
    hasNextUrl(data: ItemsResponse) {
      return data.links && data.links.length > 0 && data.links.some(link => link.rel === "next");
    },
    getNextUrl(data: ItemsResponse) {
      return data.links.find(link => link.rel === "next")?.href ?? '';
    },
    resetVariables() {
      this.chunkSize = null;
      this.page = 1;
      this.totalPages = 0;
      this.itemsResponse = { type: 'FeatureCollection', features: [], numberMatched: 0, numberReturned: 0, links: [] } as ItemsResponse;
      this.itemsResponsePaginated = { type: 'FeatureCollection', features: [], numberMatched: 0, numberReturned: 0, links: [] } as ItemsResponse;
      this.itemsResponseUrl = "";
    }
  },
  data(): DataViewerData {
    return {
      drawer: true,
      tab: 0,
      tabs: ["chart.chart", "table.table"],
      verboseTopicName: "",
      itemsResponse: { type: 'FeatureCollection', features: [], numberMatched: 0, numberReturned: 0, links: [] } as ItemsResponse,
      itemsResponsePaginated: { type: 'FeatureCollection', features: [], numberMatched: 0, numberReturned: 0, links: [] } as ItemsResponse,
      itemsResponseUrl: "",
      totalPages: 0,
      page: 1,
      chunkSize: null,
      loading: false,
      debouncedHandleChunkSizeChange: debounce(() => { }, 500) as DebouncedFunc<(event: Event) => void>
    };
  },
  beforeUnmount() {
    this.debouncedHandleChunkSizeChange.cancel();
  }
});
</script>

<style scoped>
.chunkInput {
  display: flex;
  flex-direction: column;
  min-width: 80px;
  min-height: 60px;
}

.chunkInput>label {
  font-size: small;
}

.chunkInput>input {
  border: 1px solid;
  border-radius: 3px;
  padding-left: 2px;
}
</style>
