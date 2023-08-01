<template>
	<input v-model="userInput" type="text" name="search" value="" placeholder="Search a word">
	<div v-html="filteredHTML"></div>
</template>

<script setup>
import { computed, ref, reactive, watch } from 'vue'
import tinygoWASM from '../logic/wasm_exec.js'
import entriesXSLT from './Entries.xsl?raw'

// Load WASM
tinygoWASM()
const go = new Go();
const wasmObject = await WebAssembly.instantiateStreaming(fetch('xmlParser.wasm'), go.importObject)
const wasmInstance = wasmObject.instance
go.run(wasmInstance)

// Now create VUE variables
const userInput = ref('')
const apiData = reactive({
	query: '',
	xml: '<dictionary></dictionary>'
})
const filteredHTML = computed(
	() => transformXML(
		searchXMLString(apiData.xml, userInput.value),
		entriesXSLT
	)
)

watch(userInput, async (newValue) => {
	// If API has already been fetched and the new input contains the old one just filter present data
	if (getByteLength(apiData.query) > 2 && newValue.includes(apiData.query)) {
		return null
	}
	// If user input is long enough but does not contain the old one, fetch API
	if (getByteLength(newValue) > 2) {
		console.log('Fetching API...')
		const apiResponse = await fetch('/search/' + newValue)
		if (apiResponse.ok) {
			apiData.xml = await apiResponse.text()
			apiData.query = newValue
			return null
		}
	}
	// If user input is too small or there is an API error just empty the page
	apiData.xml = '<dictionary></dictionary>'
	apiData.query = ''
})

// Return the ammount of bytes a string takes up; useful cause there's more bytes per character for languages with many characters
function getByteLength(str) {
	return new Blob([str]).size
}
// Transform XML string to HTML string using XSLT
function transformXML(xmlString, xsltString) {
	const parser = new DOMParser()
	const xmlDocument = parser.parseFromString(xmlString, "application/xml")
	const xsltDocument = parser.parseFromString(xsltString, "application/xml")
	const xsltProcessor = new XSLTProcessor();
	xsltProcessor.importStylesheet(xsltDocument)
	const htmlDocument = xsltProcessor.transformToDocument(xmlDocument)
	return new XMLSerializer().serializeToString(htmlDocument)
}
</script>