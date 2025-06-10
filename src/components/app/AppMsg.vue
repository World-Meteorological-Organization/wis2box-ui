<template id="app-msg">
  <v-overlay v-model="snackbar" class="align-center justify-center">
    <v-card 
      flat 
      width="100%" 
      max-width="1130" 
      class="text-center" 
      aria-live="assertive" 
      aria-atomic="true" 
      role="alertdialog"
      v-if="error.msg"
    >
      <v-card-text>
        <template v-if="error.msg">
          <template v-for="(line, index) in splitMessage" :key="index">
            <p>{{ line }}</p>
            <br />
          </template>
        </template>
        <template v-if="error.url">
          <a :href="error.url">
            {{ error.url }}
          </a>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-row justify="center">
          <token-auth v-if="error.status === 401" :header="false" />
          <v-btn color="pink" class="font-weight-bold" @click="close()">
            {{ $t('util.close') }}
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

import TokenAuth from "./TokenAuth.vue";

export default defineComponent({
  props: {
    error: {
      type: Object as PropType<{
        msg: string | null,
        url: string | null,
        status: number | null,
      }>,
      required: true
    }
  },
  components: {
    TokenAuth,
  },
  data: function () {
    return {
      snackbar: false,
    }
  },
  computed: {
    // If the user supplies \n in the error message, split it into multiple lines for display
    splitMessage(): string[] {
      if (!this.error || typeof this.error.msg !== 'string') return [];
      return this.error.msg ? this.error.msg.split('\n') : [];
    }
  },
  watch: {
    "error": function () {
      this.open();
    }
  },
  methods: {
    close() {
      this.snackbar = false;
    },
    open() {
      if (this.error.msg !== '') {
        this.snackbar = true;
      } else {
        this.close();
      }
    }
  }
})
</script>
