<template>
	<input v-model="userInput" type="text" name="search" value="" placeholder="Search a word">
	<div v-html="filteredHTML"></div>
</template>

<script setup>
import { ref } from 'vue'
import { computedEager, useFetch } from '@vueuse/core'
import tinygoWASM from '../logic/wasm_exec.js'
import entriesXSLT from './Entries.xsl?raw'
import errorXSLT from './Error.xsl?raw'

// Load WASM
tinygoWASM()
const go = new Go();
const wasmObject = await WebAssembly.instantiateStreaming(fetch('xmlParser.wasm'), go.importObject)
const wasmInstance = wasmObject.instance
go.run(wasmInstance)

// Define global constants
const apiEndpoint = "/search"
const minimumBytes = 3
const maximumChars = 4

// Now create VUE variables
const userInput = ref('')
const inputByteLength = computedEager(
	() => new TextEncoder().encode(userInput.value).length
)
const apiURL = computedEager(
	() => apiEndpoint + '/' + userInput.value.substring(0, maximumChars)
)
const { data, error } = useFetch(apiURL, {
	refetch: true,
	beforeFetch({ cancel }) {
		if (inputByteLength.value < minimumBytes) {
			console.log('User input too small, cancelling API request')
			cancel()
		} else {
			console.log('Fetching API...')
		}
	},
	onFetchError(ctx) {
		ctx.error = ctx.data
		return ctx
	}
})
const filteredHTML = computedEager(
	() => {
		if (data.value) {
			return transformXML(searchXMLString(data.value, userInput.value), entriesXSLT)
		}
		if (error.value) {
			return transformXML(error.value, errorXSLT)
		}
		return ''
	}
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