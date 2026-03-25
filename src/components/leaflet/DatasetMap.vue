<script setup lang="ts">
import { defineProps, ref, onMounted, nextTick, watch } from "vue";
import type { Dataset } from "@/lib/types";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet";
import L, { type PointTuple } from "leaflet";

const props = defineProps<{ dataset: Dataset }>();
const mapRef = ref<L.Map | null>(null);
const loading = ref(true);
const url = window.VUE_APP_BASEMAP_URL;
const zoom = 1; 

onMounted(async () => {
  loading.value = true;
  await nextTick();
  loading.value = false;
});

const updateMapBounds = () => {
  if (!mapRef.value || !props.dataset?.geometry) return;

  const geoJsonLayer = L.geoJSON(props.dataset.geometry);
  const bounds = geoJsonLayer.getBounds();

  if (bounds.isValid()) {
    const padding: PointTuple = [3, 3];
    mapRef.value.fitBounds(bounds, { padding });
  }

  if (mapRef.value.attributionControl) {
    mapRef.value.attributionControl.remove();
  }
  if (mapRef.value.zoomControl) {
    mapRef.value.zoomControl.remove();
  }
  mapRef.value.invalidateSize();
  mapRef.value.dragging.disable();
  mapRef.value.touchZoom.disable();
  mapRef.value.doubleClickZoom.disable();
  mapRef.value.scrollWheelZoom.disable();
  mapRef.value.setMaxBounds([
    [-90, -180],
    [90, 180]
  ]);
};

const onMapReady = (map: L.Map) => {
  mapRef.value = map;
  updateMapBounds();
};

watch(
  () => props.dataset?.geometry,
  async () => {
    await nextTick();
    updateMapBounds();
  },
  { deep: true }
);

</script>

<template>
  <div v-if="loading">
    <v-progress-linear striped indeterminate color="primary" />
  </div>
  
  <LMap 
    :zoom="zoom" 
    :maxZoom="16" 
    style="height: 160px; width: 256px" 
    @ready="onMapReady"
  >
    <LTileLayer :url="url" />
    
    <LGeoJson :geojson="props.dataset.geometry" />
  </LMap>
</template>
