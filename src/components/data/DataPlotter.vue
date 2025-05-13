<!-- Plot values for a datastream of a station within a collection -->

<template id="data-plotter">
  <div class="data-plotter">
    <v-card min-height="500px" class="ma-4">
      <v-progress-linear striped indeterminate color="primary" v-if="loading" />
      <div :style="{ visibility: !loading ? 'visible' : 'hidden' }">
        <v-card class="mx-auto" flat>
          <div :id="'plotly-chart-' + selectedStation.id" />
        </v-card>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">
//@ts-expect-error no types
import Plotly from "plotly.js-cartesian-dist-min";
import { defineComponent, type PropType } from "vue";
import { mdiOpenInNew } from "@mdi/js";
import { catchAndDisplayError } from "@/lib/errors";
import type { Trace, Datastreams, Feature, ItemsResponse } from "@/lib/types";
import { clean, fetchAllOAFFeatures, getColumnFromKey } from "@/lib/helpers";
import { t } from "@/locales/i18n"

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
    }
  },
  mounted: function () {
    this.loadObservations();
  },
  watch: {
    selectedDatastream: function () {
      this.loadObservations();
    }
  },
  data: function () {
    return {
      trace: {
        type: "scatter",
        mode: "lines",
        x: [],
        y: [],
        line: {
          color: "#014e9e",
        },
        name: "",
      },
      scatter: {
        type: "scatter",
        mode: "markers",
        x: [],
        y: [],
        marker: {
          size: 5,
          color: "#014e9e",
        },
        name: "",
      },
      data: [] as Trace[],
      loading: false,
      layout: {
        title: "",
        xaxis: {
          autorange: true,
          type: "date",
          range: [null, null] as [number | null, number | null],
          rangeslider: { range: [null, null] as [number | null, number | null] },
        },
        yaxis: {
          type: "linear",
          autorange: true,
          title: "",
        },
      },
      config: {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToAdd: [] as {
          name: string;
          icon: {
            width: number;
            height: number;
            path: string;
          };
          click: () => void;
        }[],
        modeBarButtonsToRemove: [
          "zoom2d",
          "pan2d",
          "select2d",
          "lasso2d",
          "zoomIn2d",
          "zoomOut2d",
          "autoScale2d",
        ],
      },
      font: { size: 14 },
    };
  },
  methods: {
    plot() {
      this.loading = true;
      const plot = document.getElementById(
        "plotly-chart-" + this.selectedStation.id
      );
      if (plot !== null) {
        Plotly.purge(plot);
      }
      Plotly.newPlot(plot, this.data, this.layout, this.config);
      this.loading = false;
    },
    getColumnFromKey,
    newTrace(features: Feature[], xAxis: keyof Feature["properties"], yAxis: keyof Feature["properties"]) {

      const Trace: Trace = JSON.parse(JSON.stringify(this.trace));
      Trace.x = this.getColumnFromKey(features, xAxis) as string[];
      Trace.y = this.getColumnFromKey(features, yAxis) as number[];
      this.data.push(Trace);

      const Scatter = JSON.parse(JSON.stringify(this.scatter));
      Scatter.x = this.getColumnFromKey(features, xAxis);
      Scatter.y = this.getColumnFromKey(features, yAxis);
      this.data.push(Scatter);
      const lastFeature = features.slice(-1)[0];
      const lastreportTime = lastFeature?.properties.reportTime;
      this.setDateLayout(lastreportTime || '');
    },
    async loadObservations() {
      this.data = [];
      this.loading = true;
      try {
        const url = `${window.VUE_APP_OAPI}/collections/${this.topic}/items?f=json&name=${this.selectedDatastream.name}&reportId=${this.selectedDatastream.reportId}&wigos_station_identifier=${this.selectedStation.id}&sortby=reportTime`;

        let response
        try {
          response = await fetchAllOAFFeatures(url);
        }
        catch (error) {
          catchAndDisplayError(String(error), undefined, response?.status);
          return;
        }

        const data: ItemsResponse = await response.json();
        const dataURL = response.url;
        this.config.modeBarButtonsToAdd = [{
          name: t("chart.data_source"),
          icon: {
            width: 24,
            height: 24,
            path: mdiOpenInNew,
          },
          click: () => {
            const [start, end] = this.layout.xaxis.range;
            const timeExtent = `${new Date(start + "Z").toISOString()}/${new Date(end + "Z").toISOString()}`;
            window.location.href = `${dataURL}&datetime=${timeExtent}`;
          },
        }];
        const xAxis = "reportTime";
        const yAxis = "value";
        this.newTrace(data.features, xAxis, yAxis);
        this.layout.yaxis.title = this.selectedDatastream.units || '';
        this.layout.title = clean(this.selectedDatastream.name || '');
        this.plot();
      } catch (error) {
        catchAndDisplayError(String(error));
      } finally {
        this.loading = false;
      }
    },
    setDateLayout(reportTime: string) {
      const startTime = new Date(
        new Date(reportTime).setUTCHours(0, 0, 0, 0)
      ).getTime();
      const endTime = new Date(
        new Date().setUTCHours(23, 59, 59, 999)
      ).getTime();
      this.layout.xaxis.range = [startTime, endTime];
      this.layout.xaxis.rangeslider.range = [startTime, endTime];
    },
  },
});
</script>
