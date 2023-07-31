<template>
	<h1>IxaLang Dictionary</h1>
	<Suspense>
		<Dictionary/>
		<template #fallback>
      <h2>Loading...</h2>
    </template>
	</Suspense>
</template>

<script setup>
import Dictionary from './components/Dictionary.vue'
</script>