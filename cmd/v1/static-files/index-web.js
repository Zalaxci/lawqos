// Helper functions
const apiHelper = {
	getWordsUrl(languagePair, query) {
		return `../get/words/${languagePair}/${query}`
	},
	async getLanguagesAsObject() {
		const languagesUrl = '../get/dictionary-languages'
		const apiResponse = await fetch(languagesUrl)
		const availableTargetLangs = await apiResponse.json()
		return availableTargetLangs
	},
	async getSentencesAsXML(languagePair, word) {
		const sentencesUrl = `../get/sentences/${languagePair}/${word}/1`
		const apiResponse = await fetch(sentencesUrl)
		const xmlString = await apiResponse.text()
		console.log(xmlString, sentencesUrl)
		return xmlString
	},
}
function howManyBytesIn(str) {
	return new TextEncoder().encode(str).length
}
// Fetch Lit.js (object of exports) and available languages (array of target languages for each base language) in parallel
const [litJS, availableTargetLangs] = await Promise.all([
	import('https://cdn.jsdelivr.net/gh/lit/dist@2.8.0/all/lit-all.min.js'),
	apiHelper.getLanguagesAsObject(),
])
// Fetch dictionary entries as xml and display in entries element
const entriesContainer = document.querySelector('ixalang-entries')

const minimumInputBytes = 3
let selectedLanguagePair = ''
let userInput = ''

let xmlPromise = {}

async function renderXmlEntries(xmlEntryList) {
	if (customElements.get('ixalang-entries') === undefined) {
		console.log('Importing ixalang entries lit element...')
		const { default: loadIxalangEntries } = await import('./lit-elements/ixalang-entries.js')
		loadIxalangEntries(litJS, apiHelper.getSentencesAsXML)
	}
	entriesContainer.languagePair = selectedLanguagePair
	entriesContainer.userInput = userInput
	entriesContainer.xmlEntryList = xmlEntryList
}
function queueXmlPromise(params) {
	if (typeof params.selectedLanguagePair === 'string') selectedLanguagePair = params.selectedLanguagePair
	if (typeof params.userInput === 'string') userInput = params.userInput
	if (howManyBytesIn(userInput) < minimumInputBytes) return
	if (xmlPromise.abort !== undefined) xmlPromise.abort()
	const abortController = new AbortController()
	xmlPromise = fetch(apiHelper.getWordsUrl(selectedLanguagePair, userInput), {
		signal: abortController.signal
	})
	.then(apiResponse => apiResponse.json())
	.then(apiData => {
		console.log(apiData)
		renderXmlEntries(
			apiData.Entries instanceof Array? apiData.Entries : []
		)
	})
	// This is a loophole to allow abortion of a promise by calling its abort method
	xmlPromise.abort = () => {
		abortController.abort()
	}
	xmlPromise.then(() => {
		xmlPromise.abort = undefined
	})
}
// Import and define search lit element
const searchContainer = document.querySelector('ixalang-search')
searchContainer.onInput = queueXmlPromise
const { default: loadIxalangSearch } = await import('./lit-elements/ixalang-search.js')
loadIxalangSearch(litJS, availableTargetLangs)
