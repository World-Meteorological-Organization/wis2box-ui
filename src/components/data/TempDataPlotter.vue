<!-- TempDataPlotter.vue -->

<template id="temp-data-plotter">
  <div class="temp-data-plotter">
    <v-card min-height="500px" class="ma-4">
      <v-progress-linear striped indeterminate color="primary" v-if="loading" />
      <div v-if="loading">Please wait, decoding BUFR data...</div>
      <div :style="{ visibility: !loading ? 'visible' : 'hidden' }">
        <v-card class="mx-auto" flat >
          <div :id="'temp-chart-' + selectedStation.id" style="width: 502px;"/>
        </v-card>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">

import { catchAndDisplayError } from "@/lib/errors";
import { defineComponent, type PropType } from "vue";
import type { Feature } from "@/lib/types";

export default defineComponent({
  components: {},
  props: {
    data_url: {
      type: String,
      required: true,
    },
    selectedStation: {
      type: Object as PropType<Feature>,
      required: true,
    }
  },
  data() {
    return {
      loading: true,
    };
  },
  watch: {
    data_url: function () {
      if (!this.data_url) {
        const container = document.getElementById("temp-chart-" + this.selectedStation.id);
        if (container) {
          container.innerHTML = "";
        }
        return;
      }
      this.loadChart();
    }
  },
  mounted() {
    this.loadChart();
  },
  methods: {
    async loadChart() {
      // load data from the provided URL
      let url: string = "";
      this.loading = true;
      try {
          console.log("Decoding BUFR data from URL:", this.data_url);
          url = this.data_url;
          const response = await fetch(`${window.VUE_APP_OAPI}/processes/bufr2UpperAirChart/execution`, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: {
                data_url: this.data_url
              }
            })
          });

          if (!response.ok) {
            return catchAndDisplayError('', this.data_url, response.status);
          }
          const data = await response.json();

          if (data.base64_png) {
            const img = document.createElement("img");
            img.src = "data:image/png;base64," + data.base64_png;
            const container = document.getElementById("temp-chart-" + this.selectedStation.id);
            if (container) {
                container.innerHTML = "";
                container.appendChild(img);
            }   
          } else {
            throw new Error("No attribute base64_png in response");
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
