<!-- If a station is not selected, StationInfo displays a list of stations with their names. If one is selected,
    the it displays the latest values and history
-->

<template id="station-info">
  <v-card flat :height="$vuetify.display.height - 232" class="scroll">
    <v-toolbar>
      <v-toolbar-title :class="selectedStation?.properties.name ? 'mx-auto' : 'ml-n12'">
        {{ selectedStation?.properties.name || $t("chart.station") }}
      </v-toolbar-title>

      <template v-slot:prepend>
        <v-btn icon @click="selectedStation ? store.clearSelectedStation() : $router.push('/')">
          <v-icon icon="mdi-arrow-left"></v-icon>
        </v-btn>
      </template>

    </v-toolbar>
    <TempChartDialog :metadata_id="metadata_id" :selected-station="selectedStation" v-if="showDataset && selectedStation" />

    <v-card flat class="text-center" v-if="!selectedStation">
      <StationList :features="features" :map="map" />
    </v-card>
    <v-card flat class="text-center" v-else>
      <MsgStationStatus :features="features" :map="map" :metadata_id="metadata_id"/>
      <v-btn variant="outlined" size="small" color="#014e9e" @click.stop="toggleDataset" class="my-auto">
          {{ $t("navigation.data") }}
          <v-icon end icon="mdi-chart-scatter-plot" />
      </v-btn>
    </v-card>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import StationList from "./StationList.vue";
import MsgStationStatus from "./MsgStationStatus.vue";
import type { ItemsResponse } from "@/lib/types";
import TempChartDialog from '../TempChartDialog.vue';
import { useGlobalStateStore } from "@/stores/global";

export default defineComponent({
  components: { StationList, MsgStationStatus, TempChartDialog },
  props: {
    features: {
      type: Object as PropType<ItemsResponse>,
      required: true,
    },
    map: {
      type: Object,
      required: true,
    },
    metadata_id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showDataset: false,
      selectedStation: computed(() => useGlobalStateStore().selectedStation),
      store: useGlobalStateStore()
    }
  },
  methods: {
    toggleDataset() {
      this.showDataset = !this.showDataset;
    }
  },
  computed: {
    smAndDown() {
      return this.$vuetify.display.smAndDown;
    },
  },
});
</script>

<style scoped>
.scroll {
  overflow-y: scroll;
}
</style>
