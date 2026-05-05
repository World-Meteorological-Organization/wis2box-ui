<template id="station-list">
  <div>
    <v-text-field
      v-model="searchQuery"
      :label="$t('station.search')"
      :hint="$t('station.search_hint')"
      append-icon="mdi-magnify"
      variant="underlined"
      class="px-4 pt-3"
      clearable
    ></v-text-field>

    <v-list>
      <v-hover v-slot="{ isHovering, props }">
        <template v-for="(s, i) in filteredStations" :key="i">
          <v-list-item v-bind="props" :class="{ 'on-hover': isHovering }" @click="onClick(s)" @mouseover="onHover(s)">
            <template v-slot:prepend>
              <i class="dot" :style="`background: ${getColor(s)}`" />
            </template>
            <h4 class="ml-1 text-left" v-text="clean(s.properties.name)" />
            <template v-slot:append v-if="s.properties.url">
              <v-list-item-action>
              <v-btn variant="outlined" size="small" color="#014e9e" :target="s.id" :title="s.id"
                :href="s.properties.url">
                OSCAR
                <v-icon end icon="mdi-open-in-new" />
              </v-btn>
              </v-list-item-action>
            </template>
          </v-list-item>
          <v-divider v-if="i + 1 < filteredStations.length" />
        </template>
      </v-hover>
    </v-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";


import { clean } from "@/lib/helpers";

import { LegendColors, type Feature } from "@/lib/types";
import type { ItemsResponse } from "@/lib/types";
import { useGlobalStateStore } from "@/stores/global";

export default defineComponent({
  props: {
    map: Object,
    features: {
      type: Object as PropType<ItemsResponse>,
      required: true,
    },
  },
  data() {
    return {
      searchQuery: "",
    };
  },
  computed: {
    stationsSortedByName: function () {
      if (!this.features || !this.features.features) {
        return [];
      } else {
        const stns = [...this.features.features].sort((a, b) => {
          if (a.properties.name === undefined || b.properties.name === undefined) {
            return 0;
          }
          const nameA = a.properties.name.toUpperCase();
          const nameB = b.properties.name.toUpperCase();
          if (nameA < nameB) {
            return -1;
          } else if (nameA > nameB) {
            return 1;
          } else {
            return 0;
          }
        });
        return stns;
      }
    },
    filteredStations() {
      const query = this.searchQuery.toLowerCase();
      return this.stationsSortedByName.filter(station => 
        (station.properties.name?.toLowerCase().includes(query) ?? false) ||
        (station.id?.toLowerCase().includes(query) ?? false)
      );
    }
  },
  methods: {
    clean,
    onClick(station: Feature) {
      const latlng = [
        station.geometry.coordinates[1],
        station.geometry.coordinates[0],
      ];
      const store = useGlobalStateStore();
      store.setSelectedStation(station);
      if (this.map) {
        this.map.flyTo(latlng);
      }
    },
    onHover(station: Feature) {
      const latlng = [
        station.geometry.coordinates[1],
        station.geometry.coordinates[0],
      ];
      if (this.map) {
        this.map.openPopup(station.properties.name, latlng);
      }
    },
    getColor(station: Feature) {
      const hits = station.properties.num_obs;
      if (hits === 0 || hits === undefined) {
        return LegendColors.Gray;
      } else if (hits <= 7) {
        return LegendColors.Red;
      } else if (hits <= 19) {
        return LegendColors.Yellow;
      } else {
        return LegendColors.Green;
      }
    },
  },
});
</script>

<style scoped>
.dot {
  height: 16px;
  width: 16px;
  display: inline-block;
  border-radius: 50%;
  opacity: 0.8;
}
</style>
