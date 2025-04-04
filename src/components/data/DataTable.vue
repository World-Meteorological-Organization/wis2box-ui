<!-- This component represents the table which displays all the data for
 a specific station
-->

<template id="data-table">
  <v-card min-height="470px" max-height="470px" class="ma-4">
    <v-progress-linear striped indeterminate color="primary" v-if="loading" />
    <div>
      <v-container>
        <v-row justify="center" align="end">
          <div id="plotly-table" />
        </v-row>
      </v-container>

      <v-table v-show="title !== ''" fixed-header height="438px">
        <thead>
          <tr>
            <th class="text-center">
              {{ t('table.phenomenon_time') }}
            </th>
            <th class="text-center">
              {{ title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(_, i) in data.time" :key="i">
            <td>
              {{ data.phenomenonTime[i] }}
            </td>
            <td>
              {{ data.value[i] }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-card>
</template>

<script lang="ts">
// have to ignore the dist-min import since it doesn't have ts types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Plotly from "plotly.js-cartesian-dist-min";
import { defineComponent, type PropType } from "vue";
import { mdiDownload } from "@mdi/js";
import { catchAndDisplayError } from "@/lib/errors";
import type { Datastreams, Feature, ItemsResponse } from "@/lib/types";
import { clean, getColumnFromKey } from "@/lib/helpers";
import { t } from "@/locales/i18n";



export default defineComponent({
  props: {
    topic: {
      type: String,
      required: true,
    },
    selectedStation: {
      type: Object as PropType<Feature>,
      required: true,
    },
    selectedDatastream: {
      type: Object as PropType<Datastreams[0]>,
      required: true,
    },
    itemsResponse: {
      type: Object as PropType<ItemsResponse>,
      required: true
    },
    itemsResponseUrl: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    }
  },
  computed: {
    combinedProps() {
      return {
        selectedDatastream: this.selectedDatastream,
        itemsResponse: this.itemsResponse,
        itemsResponseUrl: this.itemsResponseUrl,
      };
    },
    features() {
      return this.itemsResponse.features
    }
  },
  watch: {
    combinedProps: function () {
      this.generateTable();
    },
    features: function () {
      this.generateTable();
    },
  },
  mounted: function () {
    this.generateTable();
  },
  data() {
    return {
      data: {} as {
        time: string[],
        phenomenonTime: string[],
        value: number[] | string[], // value can be either categorical or numerical
      },
      title: "",
      headerOverflow: 0,
      alert_: this.alert,
      layout: {
        height: 24,
        yaxis: {
          showgrid: false,
          zeroline: false,
          showline: false,
          ticks: "",
          showticklabels: false,
        },
        xaxis: {
          showgrid: false,
          zeroline: false,
          showline: false,
          ticks: "",
          showticklabels: false,
        },
      },
      config: {
        editable: false,
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToAdd: [] as {
          name: string,
          icon: {
            path: string
            height: number
            width: number
          },
          click: () => void
        }[],
        modeBarButtonsToRemove: [
          "toImage",
          "resetScale2d",
          "zoom2d",
          "pan2d",
          "select2d",
          "lasso2d",
          "zoomIn2d",
          "zoomOut2d",
          "autoScale2d",
        ],
      },
    };
  },
  methods: {
    onScroll(e: { target: { scrollTop: number; }; }) {
      this.headerOverflow = e.target.scrollTop;
    },
    t,
    getColumnFromKey,
    generateTable() {
      if (!Object.keys(this.itemsResponse).length || !this.itemsResponseUrl.length) {
        return;
      }
      
      try {
        this.plot(this.itemsResponseUrl);
        if (this.selectedDatastream.units === "CODE TABLE") {
          this.title = clean(`${this.selectedDatastream.name}`);
          this.data.value = this.getColumnFromKey(this.itemsResponse.features, "description") as string[];
        } else {
          this.title = `${clean(this.selectedDatastream.name)} (${this.selectedDatastream.units})`;
          this.data.value = this.getColumnFromKey(this.itemsResponse.features, "value") as number[];
        }
        this.data.time = this.getColumnFromKey(this.itemsResponse.features, "reportTime") as string[];
        this.data.phenomenonTime = this.getColumnFromKey(this.itemsResponse.features, "phenomenonTime") as string[];
      } catch (error) {
        catchAndDisplayError(String(error));
      }
    },
    plot(url: string) {
      const plot = document.getElementById("plotly-table");
      if (plot !== null) {
        Plotly.purge(plot);
      }
      this.config.modeBarButtonsToAdd = [
        {
          name: t("chart.download"),
          icon: {
            width: 24,
            height: 24,
            path: mdiDownload,
          },
          click: () => {
            window.location.href = url.replace("f=json", "f=csv");
          },
        },
      ];
      Plotly.newPlot(plot, [], this.layout, this.config);
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
  text-align: center;
}
</style>
