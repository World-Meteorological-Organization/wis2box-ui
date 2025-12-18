<template id="datasets">
  <v-progress-linear v-if="loading" indeterminate color="primary" />

  <v-card flat v-if="!loading" class="pa-2 w-100">

    <v-alert class="py-1 mb-1 text-center" border="start" variant="text" color="#014e9e">
      <v-row>
        <v-col cols="6">
          <h2>{{ $t("messages.welcome") }}</h2>
        </v-col>
        <v-col cols="6">
          <v-text-field
          v-model="filterQuery"
          label="Filter datasets by"
          outlined
          clearable
          />
        </v-col>
      </v-row>
    </v-alert>
    <v-row v-for="(dataset, index) in datasets_shown" :key="index">
      <v-col sm="12" md="3">
        <v-container>
          <v-row justify="center" fill-height>
            <template v-if="dataset.mapType != 'unknown'">
              <v-card class="pa-0 ma-0" @click="loadMap(dataset.id, dataset.mapType)" @keydown.enter="loadMap(dataset.id, dataset.mapType)"
                aria-label="Dataset map">
                <v-overlay open-on-hover contained activator="parent" class="align-center justify-center">
                  <v-btn flat>
                    {{ $t("datasets.map") }}
                  </v-btn>
                </v-overlay>
                <dataset-map :dataset="dataset" />
              </v-card>
            </template>
            <template v-else>
              <!-- TODO we could call out that there are no observations;
                     However, this could be done by using either feature.properties["wmo:topicHierarchy"].includes("surface-based-observations"); 
                     or the length of the features inside the collection. Would need to check both and it may be confusing the user
                     that there are different ways to check
                  -->
              <!-- <i>{{ $t("messages.no_observations_in_collection") }}</i> -->
              <v-card class="pa-0 ma-0">
                <dataset-map :dataset="dataset" />
              </v-card>
            </template>
          </v-row>
        </v-container>
      </v-col>
      <v-col sm="12" md="9" class="text-center">
        <v-col class="pb-0">
          <h2>{{ dataset.properties.title }}</h2>
        </v-col>
        <v-col>
          <span>
            <strong>{{ $t("datasets.topic") + ": " }}</strong>
            <code v-if="dataset.properties['wmo:topicHierarchy']">{{ dataset.properties['wmo:topicHierarchy'] }}</code>
            <code v-else>---</code>
            <br>
            <strong>{{ $t("datasets.metadata_id") + ": " }}</strong>
            <code>{{ dataset.properties.id }}</code>
          </span>
        </v-col>
        <v-col class="pt-0">
          <v-btn-group v-show="$vuetify.display.mdAndUp" variant="outlined" divided>
            <v-btn v-for="(link, linkIndex) in dataset.uiLinks" :key="linkIndex" :title="link.type" :href="link.href"
              :to="link.target" :target="`_window_${link.type}`">
              {{ $t(`datasets.${link.msg}`) }}
              <v-icon end :icon="link.icon" />
            </v-btn>
          </v-btn-group>
          <v-row v-show="$vuetify.display.smAndDown" v-for="(link, linkIndex) in dataset.uiLinks" :key="linkIndex"
            justify="center" class="my-1">
            <v-btn block variant="outlined" :title="link.type" :href="link.href" :to="link.target"
              :target="`_window_${link.type}`">
              {{ $t(`datasets.${link.msg}`) }}
              <v-icon end :icon="link.icon" />
            </v-btn>
          </v-row>
        </v-col>
      </v-col>
      <v-divider v-if="index + 1 < datasets.length" />
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DatasetMap from "../components/leaflet/DatasetMap.vue";
import type { Dataset, MetadataResponse } from "@/lib/types";
import { catchAndDisplayError } from "@/lib/errors";
import { fetchWithToken } from "@/lib/helpers";
import { t } from "@/locales/i18n"

export default defineComponent({
  components: {
    DatasetMap,
  },
  data() {
    return {
      filterQuery: '',
      datasets_shown: [] as Dataset[],
      datasets: [] as Dataset[],
      loading: true,
    };
  },
  mounted() {
    this.loadDatasets();
  },
  watch: {
    filterQuery() {
      // filter the datasets based on filterQuery
      const query = this.filterQuery.toLowerCase();
      if (query === '' || query === '%') {
        this.datasets_shown = this.datasets;
      } else {
        this.datasets_shown = this.datasets.filter(dataset => {
          return dataset.properties.title.toLowerCase().includes(query) ||
                 dataset.properties.id.toLowerCase().includes(query) ||
                 (dataset.properties['wmo:topicHierarchy'] && dataset.properties['wmo:topicHierarchy'].toLowerCase().includes(query));
        });
      }
    },
  },
  methods: {
    async loadDatasets() {
      this.loading = true;
      const url = `${window.VUE_APP_OAPI}/collections/discovery-metadata/items`;
      let response;
      try {
        response = await fetchWithToken(url);
        if (!response.ok) {
          return catchAndDisplayError('', url, response.status);
        }
      } catch (error) {
        // if fetch fails, and try to show the error code as well otherwise, just show the error
        return catchAndDisplayError(String(error), undefined, response ? response.status : undefined);
      }

      try {
        const data: MetadataResponse = await response.json();
        if (data.numberMatched === 0) {
          const errMsg = `${t("messages.no_discovery_datasets")}`;
          return catchAndDisplayError(errMsg);
        }

        for (const feature of data.features) {
          // if "wmo:topicHierarchy" not is available in the properties hasSynop should be false
          let mapType = "unknown";
          let hasSynop = false;
          let hasTemp = false;
          let hasTopic = false;
          if (feature.properties["wmo:topicHierarchy"]) {
            hasTopic = true;
            hasSynop = feature.properties["wmo:topicHierarchy"].includes("surface-based-observations/synop");
            hasTemp = feature.properties["wmo:topicHierarchy"].includes("surface-based-observations/temp");
            if (hasSynop) {
              mapType = "synop";
            } else if (hasTemp) {
              mapType = "temp";
            }
          }
          const uiLinks = [];

          if (hasSynop) {
            uiLinks.push({
              href: undefined,
              target: `/fixed-land-station-map/${feature.id}`,
              type: "Map",
              msg: "explore",
              icon: "mdi-map-marker-circle",
            });
          }
          if (hasTemp) {
            uiLinks.push({
              href: undefined,
              target: `/fixed-upper-air-map/${feature.id}`,
              type: "Map",
              msg: "explore",
              icon: "mdi-map-marker-circle",
            });
          }
          for (const link of feature.links) {
            if (link.rel === "canonical") {
              uiLinks.push({
                href: link.href,
                target: undefined,
                type: "OARec",
                msg: "oarec",
                icon: "mdi-book-search",
              });
            } else if (link.rel === "collection") {
              uiLinks.push({
                href: link.href,
                target: undefined,
                type: "OAFeat",
                msg: "oafeat",
                icon: "mdi-database-search",
              });
            } else if (["data", "archives", "service-desc"].includes(link.rel)) {
              uiLinks.push({
                href: link.href,
                target: undefined,
                type: "external-data-link",
                msg: "external-data-link",
                icon: "mdi-file-document"
              });
            } else if (link.rel === "license") {
              uiLinks.push({
                href: link.href,
                target: undefined,
                type: "license",
                msg: "license",
                icon: "mdi-license"
              });
            }
          }

          if(hasTopic) {
            uiLinks.push({
              target: undefined,
              href: `${window.VUE_APP_OAPI}/collections/messages/items?metadata_id=${feature.id}&sortby=-datetime`,
              type: "Info",
              msg: "messages",
              icon: "mdi-message-text-outline",
            });
          }
          const bbox = feature.geometry.coordinates[0].flat(2);

          this.datasets.push({
            mapType,
            bbox,
            uiLinks,
            ...feature,
          });
          this.datasets_shown = this.datasets;
        }
      } catch (error) {
        catchAndDisplayError(String(error));
      } finally {
        this.loading = false;
      }
    },
    loadMap(topic: string, mapType: string) {
      if (mapType === "synop") {
        this.$router.push(`/fixed-land-station-map/${topic}`);
      } else if (mapType === "temp") {
        this.$router.push(`/fixed-upper-air-map/${topic}`);
      }
    },
  },
});
</script>
