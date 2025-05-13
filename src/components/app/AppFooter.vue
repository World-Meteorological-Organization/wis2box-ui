<template id="app-footer">
  <v-app-bar flat height="90" class="pa-0 ma-0" location="bottom">
    <template v-slot:image>
      <!-- in order to have no padding on the top image
        you need to set padding and margin to be 0 and then 
        set fluid to true specifically in that order. Appears to
        be a vuetify quirk 
      -->
      <v-container class="pa-0 ma-0" fluid>
        <v-img v-if="!disableSeparator" :src="footerImage" :lazy-src="footerImage" />
        <div 
          v-if="customFooterColor" 
          :style="{ backgroundColor: customFooterColor, height: '110px' }">
        </div>
      </v-container>
    </template>

    <v-row justify="center">
      <v-col class="primary text-center" cols="12">
        <p :style="{ color: contrastColor }">
          {{ $t("footer.powered_by") }}
          <a :title="name" :href="homepage" :style="{ color: contrastColor }">
            {{ name }}
          </a>
          {{ version }}
          <br/>
          <a title="name" :href="documentation" :style="{ color: contrastColor }">
            wis2box {{ $t("navigation.documentation") }}
          </a>
        </p>
      </v-col>
    </v-row>
  </v-app-bar>
</template>

<script lang="ts">
import footerImage from "@/assets/img/wmo-foot.png";
import { name, version, homepage } from "../../../package.json";
import { defineComponent } from "vue";

export default defineComponent({
  data: () => ({
    version,
    name,
    homepage,
    documentation: "https://docs.wis2box.wis.wmo.int/",
    footerImage,
    customFooterColor:
      window.VUE_APP_CUSTOM_BACKGROUND_COLOR !== undefined && window.VUE_APP_CUSTOM_BACKGROUND_COLOR !== ""
        ? window.VUE_APP_CUSTOM_BACKGROUND_COLOR
        : null,
    disableSeparator: window.VUE_APP_DISABLE_SEPARATOR_IMAGE,
    contrastColor: "",
  }),
  watch: {
    customFooterColor: {
      immediate: true,
      handler(color) {
        this.contrastColor = this.getContrastColor(color || "#ffffff");
      },
    },
  },
  methods: {
    // If the user specifies a custom background color, use that color to calculate the contrast color
    // so the description is still visible even if the background color is dark
    getContrastColor(hex: string): string {
      const rgb = parseInt(hex.replace("#", ""), 16); // Convert hex to integer
      const r = (rgb >> 16) & 0xff; // Extract red
      const g = (rgb >> 8) & 0xff;  // Extract green
      const b = rgb & 0xff;         // Extract blue

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Return black or white based on luminance
      return luminance > 186 ? "#000000" : "#ffffff"; // Threshold based on luminance
    },
  },
});
</script>
