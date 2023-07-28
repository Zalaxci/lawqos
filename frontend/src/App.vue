<script setup>
import { computed, reactive, ref, watchEffect } from 'vue'
import searchXSLT from './xslt/search.xsl?raw'

function parseXML(str) {
	return new DOMParser().parseFromString(str, "application/xml")
}
function createXSLTProcessor(xsltString) {
	const xsltDocument = parseXML(xsltString)
	const xsltProcessor = new XSLTProcessor();
	xsltProcessor.importStylesheet(xsltDocument)
	return xsltProcessor
}
async function fetchAPI(query) {
	const response = await fetch('/search/' + query)
	const xmlString = await response.text()
	return parseXML(xmlString)
}

const userInput = ref('')
const apiData = reactive({
	query: '',
	xml: parseXML('<dictionary></dictionary>')
})
const filteredHTML = computed(
	() => {
		const filteredXML = document.evaluate(
			`//entry[
				form/orth[contains(text(), "${userInput.value}")] | sense/cit/quote[contains(text(), "${userInput.value}")]
			]`,
			apiData.xml,
			null,
			4,
			null,
		)
		let htmlNode = null
		let htmlNodes = []
		while (htmlNode = filteredXML.iterateNext()) {
			htmlNodes.push(htmlNode)
		}
		const dictionaryElement = document.createElement('dictionary')
		dictionaryElement.append(...htmlNodes)
		console.log(dictionaryElement)
		const xsltProcessor = createXSLTProcessor(searchXSLT)
		return xsltProcessor.transformToDocument(dictionaryElement)
	}
)

fetchAPI('γλώσσα').then(
	(xmlDocument) => {
		apiData.query = 'γλώσσα'
		apiData.xml = xmlDocument
	}
)
watchEffect(
	() => console.log(filteredHTML.value)
)
</script>

<template>
  <dictionary></dictionary>
</template>
