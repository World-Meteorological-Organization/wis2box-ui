<template id="datasets">
  <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-card flat v-if="!loading" class="pa-2">

    <v-alert class="py-2 mb-2 text-center" border="start" variant="text" color="#014e9e">
      <h2>{{ $t("messages.welcome") }}</h2>
    </v-alert>

    <v-row v-for="(dataset, index) in datasets" :key="index">
      <v-col sm="12" md="3">
        <v-container>
          <v-row justify="center" fill-height>
            <template v-if="dataset.hasSynop">
              <v-card class="pa-0 ma-0" @click="loadMap(dataset.id)">
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
            <code>{{ dataset.properties.id}}</code>
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
      datasets: [] as Dataset[],
      loading: true,
    };
  },
  mounted() {
    this.loadDatasets();
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
          let hasSynop = false;
          let hasTopic = false;
          if (feature.properties["wmo:topicHierarchy"]) {
            hasTopic = true;
            hasSynop = feature.properties["wmo:topicHierarchy"].includes("surface-based-observations/synop");
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
            } else if (link.rel === "data") {
              uiLinks.push({
                href: link.href,
                target: undefined,
                type: "data",
                msg: "data",
                icon: "mdi-file-document"
              });
            }
          }

          if(hasTopic) {
            uiLinks.push({
              target: undefined,
              href: `${window.VUE_APP_OAPI}/collections/messages/items?metadata_id=${feature.id}`,
              type: "Info",
              msg: "messages",
              icon: "mdi-message-text-outline",
            });
          }
          const bbox = feature.geometry.coordinates[0].flat(2);

          this.datasets.push({
            hasSynop,
            bbox,
            uiLinks,
            ...feature,
          });
        }
      } catch (error) {
        catchAndDisplayError(String(error));
      } finally {
        this.loading = false;
      }
    },
    loadMap(topic: string) {
      this.$router.push(`/fixed-land-station-map/${topic}`);
    },
  },
});
</script>
