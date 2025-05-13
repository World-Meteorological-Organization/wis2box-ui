<!-- App represents the main tree of the application UI -->

<template>
  <v-app id="v-app" class="ma-0 pa-0">
    <app-header app />
    <v-main>
      <v-container class="py-2" max-width="1200">
        <v-row>
          <!-- <app-nav /> -->
          <router-view />
        </v-row>
      </v-container>
    </v-main>
    <app-msg app class="pb-4" :error="errorState" />
    <app-footer app />
  </v-app>
</template>

<script lang="ts">
import '@mdi/font/css/materialdesignicons.css'

import { defineComponent, computed } from 'vue';
import { useGlobalStateStore } from '@/stores/global';
import AppFooter from "@/components/app/AppFooter.vue";
import AppHeader from "@/components/app/AppHeader.vue";
import AppMsg from "@/components/app/AppMsg.vue";
// import AppNav from "@/components/app/AppNav.vue";

export default defineComponent({
  components: {
    AppFooter,
    AppHeader,
    // AppNav,
    AppMsg
  },
  // watch for any global errors that we may want to pass to AppMsg component and present to the user
  setup() {
    const globalStateStore = useGlobalStateStore();
    const errorState = computed(() => ({
      msg: globalStateStore.error.message,
      status: globalStateStore.error.status_code,
      url: globalStateStore.error.url
    }));
    return {
      errorState
    };
  }
});
</script>
