<template>
	<div class="flex-wrap colored-box">
		<h2 class="row">Select Dictionary</h2>
		<div class="column">
			<h3>From:</h3>
			<select name="base-lang" id="base-lang" v-model="selectedBaseLang">
				<option v-for="languageName in Object.keys(languages)" :value="languageName">{{ languageName }}</option>
			</select>
		</div>
		<div class="column">
			<h3>To:</h3>
			<select name="target-lang" id="target-lang" v-model="selectedTargetLang">
				<option v-for="languageName in availableTargets" :value="languageName">{{ languageName }}</option>
			</select>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedBaseLang = ref('')
const selectedTargetLang = ref('')
defineExpose({
	selectedBaseLang,
	selectedTargetLang,
})

const apiEndpoint = 'https://freedict.org/freedict-database.json'
const response = await fetch(apiEndpoint)
const dictionaryArray = await response.json()
const languagePairList = dictionaryArray.map(dictionary => dictionary.name).filter(languagePair => typeof languagePair === 'string')
const languages = {}
for (const languagePair of languagePairList) {
	const [baseLang, targetLang] = languagePair.split('-')
	if (baseLang in languages) {
		languages[baseLang].push(targetLang)
	} else {
		languages[baseLang] = [targetLang]
	}
}
const availableTargets = computed(
	() => selectedBaseLang.value in languages? languages[selectedBaseLang.value] : []
)
</script>

<style scoped>
.row {
	width: 100%;
}
.column {
	display: flex;
	flex-direction: column;
}
</style>