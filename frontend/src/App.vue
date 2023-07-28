<script setup>
import { ref } from 'vue'

const xmlString = ref('')
const query = "γλώσσα"
fetch('/search/' + query).then(response => response.text()).then(text => xmlString.value = text)
</script>

<template>
  <dictionary v-html="xmlString"></dictionary>
</template>
