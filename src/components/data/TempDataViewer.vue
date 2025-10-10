<!-- Dataviewer is a popup window which contains variables and their associated tables / plots of data -->

<template id="data-viewer">
  <v-layout>
    <v-container>
      <v-row>
      <v-col cols="12">
        <v-table>
        <tbody>
          <tr>
            <th><b>data time UTC</b></th>
            <th><b>file size</b></th>
          </tr>
          <tr 
          v-for="(message, index) in messages" 
          :key="index" style="cursor: pointer;" @click="updateSelectedMessage(message)" 
          :class="{'bg-blue lighten-4': message.id === selected_id }" 
          >
            <td>{{ message.properties.datetime }}</td>
            <td>{{ file_size(message) }}</td>
          </tr>
        </tbody>
        </v-table>
      </v-col>
      </v-row>
    </v-container>
    <v-main style="height: 100vh;">
      <div v-if="internalDataURL">
        <TempDataPlotter :data_url="internalDataURL" :selected-station="selectedStation" />
      </div>
    </v-main>
  </v-layout>
</template>

<script lang="ts">

import TempDataPlotter from "./TempDataPlotter.vue";
import { defineComponent, type PropType } from "vue";
import type { CollectionsResponse, Feature } from "@/lib/types";
import { useGlobalStateStore } from "@/stores/global";
import { fetchWithToken } from "@/lib/helpers";

export default defineComponent({
  components: {
    TempDataPlotter
  },
  props: {
    selectedStation: {
      type: Object as PropType<Feature>,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    messages: {
      type: Array as PropType<Feature[]>,
      required: true,
    },
  },
  computed: {
    selectedDatastream() {
      const store = useGlobalStateStore();
      return store.selectedDatastream;
    }
  },
  watch: {
    selectedStation: {
      handler() {
        // Reset state when station changes
        this.internalDataURL = null;
        this.selected_id = "";
      },
      immediate: false
    },
    messages: {
      handler() {
        // Always reset state first
        this.internalDataURL = null;
        this.selected_id = "";
        if (this.messages.length > 0) {
          this.updateSelectedMessage(this.messages[0]);
        } else {
          console.log("No messages available");
        }
      },
      immediate: true
    }
  },
  async mounted() {
    // TODO I should fetch the title from discovery-metadata instead
    const request = await fetchWithToken(`${window.VUE_APP_OAPI}/collections/messages`);
    if (request.ok) {
      const json: CollectionsResponse["collections"][0] = await request.json();
      this.verboseTopicName = json.title;
    }
    this.internalDataURL = null;
    this.selected_id = "";
  },
  data() {
    return {
      verboseTopicName: "",
      selected_id: "",
      internalDataURL: null as string | null,
    };
  },
  methods: {
    file_size(message: Feature) {
      // get the first link with rel="canonical" or rel="update"
      const link = message.links.find((l: any) =>
        l.rel === "canonical" || l.rel === "update"
      );
      if (link) {
        return `${Math.round((link.length || 0) / 1024)} kB`;
      } else {
        return "N/A";
      }
    },
    updateSelectedMessage(message: Feature) {
      this.internalDataURL = null;
      this.selected_id = message.id;
      console.log("Selected message ID:", this.selected_id);
      // loop over links in message to find the one with rel="canonical" or rel="update"
      const dataLink = message.links.find(link => link.rel === "canonical" || link.rel === "update");
      if (dataLink) {
        this.internalDataURL = dataLink.href;
      } else {
        this.internalDataURL = null;  
        console.warn("No data link found in message:", message);
      }
      console.log("Data URL set to:", this.internalDataURL);
    },  
  },
});
</script>
