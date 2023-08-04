<template>
	<h1>IxaLang Dictionary</h1>
	<Suspense>
		<Dictionary/>
		<template #fallback>
      <h2>Loading...</h2>
    </template>
	</Suspense>
</template>

<style>
#app {
	min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
	display: flex;
	flex-direction: column;
	place-content: center;
	place-items: center;
  text-align: center;
}
</style>

<script setup>
import Dictionary from './components/Dictionary.vue'
</script>