<!-- StationStatus is a tabbed component that contains both
  the latest data as well as a history of how many observations have been coming in
-->

<template id="station-status">
  <div class="station-status">
    <v-tabs grow v-model="tab" color="#014e9e">
      <v-tab v-for="(item, i) in tabs" :value="i" :key="i">
        {{ $t(item) }}
      </v-tab>
    </v-tabs>
    <v-divider />
    <v-window v-model="tab">
      <v-window-item :value="0" eager v-if="selectedStation">
        <MsgStationLatest :selectedStation="selectedStation" :metadata_id="metadata_id"/>
      </v-window-item>
    </v-window>
    <div class="text-center ma-2">
      <v-snackbar v-model="snackbar">
        {{ msg }}
        <template v-slot:actions>
          <v-btn color="pink" @click="snackbar = false">
            <v-icon icon="mdi-close"></v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import MsgStationLatest from "./MsgStationLatest.vue";
import { type ItemsResponse } from "@/lib/types";
import { useGlobalStateStore } from "@/stores/global";

export default defineComponent({
  components: { MsgStationLatest },
  data() {
    return {
      snackbar: false,
      msg: "",
      tab: null,
      data: [],
      layout: {
        height: 300,
        width: 450,
        showlegend: false,
        xaxis: {
          type: "date",
        },
        yaxis: {
          dtick: 1,
        },
      },
      config: {
        displayModeBar: false,
        responsive: true,
      },
      tabs: ["station.latest" ],
      selectedStation: computed(() => useGlobalStateStore().selectedStation)
    };
  },
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
      required: true, 
    }
  }
});
</script>
