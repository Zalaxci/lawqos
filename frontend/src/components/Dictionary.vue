<template>
	<input v-model="userInput" type="text" name="search" value="" placeholder="Search a word">
	<div v-html="filteredHTML"></div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
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