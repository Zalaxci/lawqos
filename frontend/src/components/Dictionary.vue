<template>
	<input v-model="userInput" type="text" name="search" value="" placeholder="Search a word">
	<div id="dictionary" v-html="filteredHTML"></div>
</template>

<style>
#dictionary:not(:empty) {
	width: 100%;
	flex-grow: 1;
}
.flex-wrap {
	display: flex;
	flex-wrap: wrap;
	place-content: center;
}
.entry {
	width: min(100%, 400px);
	margin: 1rem;
	padding: 0.5rem;
	border-radius: 1rem;
	background: linear-gradient(to bottom right, rgba(169, 148, 141, 0.5), rgba(215, 135, 105, 0.5));
}
.entry h2 {
	text-transform: capitalize;
}
.entry ol {
	padding: 0;
	margin: 0;
	list-style-position: inside;
}
.entry li {
	width: 100%;
}
rt {
	font-size: small;
}
.word + .word::before {
	content: ', '
}
</style>

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
	beforeFetch(ctx) {
		if (inputByteLength.value < minimumBytes) {
			console.log('User input too small, cancelling API request')
			ctx.cancel()
			clearAPI()
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

// Set data and error to null when the request is cancelled
function clearAPI() {
	data.value = null
	error.value = null
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