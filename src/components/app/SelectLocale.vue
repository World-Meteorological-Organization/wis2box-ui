<!-- A Component for selecting the language used in the application -->

<template id="select-locale">
  <div class="select-locale">
    <v-menu location="start">
      <template v-slot:activator="{ props }">
        <v-btn block variant="text" :color="color" class="font-weight-bold" v-bind="props">
          <v-icon icon="mdi-web" />&nbsp;{{ $t('code') }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-for="language in Object.keys(languages)" :key="`lang-${language}`"
          :active="$i18n.locale === language" color="#014e9e" @click="$i18n.locale = String(language)">
          <v-list-item-title>{{ languages[(language as keyof typeof languages)].language }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { loadLocale } from "@/locales/i18n";
import { defineComponent } from "vue";

export default defineComponent({
  name: "SelectLocale",
  props: ["header"],
  computed: {
    languages: () => {
      return loadLocale()
    },
    color: function () {
      if (this.header) {
        return "#FFFFFF"
      } else {
        return "#014e9e"
      }
    }
  },
  watch: {
    "$i18n.locale": {
      handler: function (locale: string) {

        // If the locale is switched to arabic, don't switch the direction of the page and disrupt the layout
        if (locale === 'ar') {
          const invertDirectionClass = 'v-locale--is-rtl';
          const elements = document.querySelectorAll(`.${invertDirectionClass}`);
          elements.forEach(element => {
            element.classList.remove(invertDirectionClass);
          });
        }
        
       
      },
      immediate: true
    }
  },
});
</script>

