// Helper functions
const apiInfo = {
	getWordsUrl: (languagePair, word) => `/get/words/${languagePair}/${word}`,
	languagesUrl: '/get/dictionary-languages',
}
function howManyBytesIn(str) {
	return new TextEncoder().encode(str).length
}
// Fetch Lit.js (object of exports) and available languages (array of target languages for each base language) in parallel
const [litJS, availableTargetLangs] = await Promise.all([
	import('https://cdn.jsdelivr.net/gh/lit/dist@2.8.0/all/lit-all.min.js'),
	fetch(apiInfo.languagesUrl).then(res => res.json()),
])
// Make them available globally across all scripts
Object.assign(window, litJS, { availableTargetLangs })
// Fetch dictionary entries as xml and display in entries element
const entriesContainer = document.querySelector('ixalang-entries')

const minimumInputBytes = 3
let selectedLanguagePair = ''
let userInput = ''

let xmlPromise = {}

async function renderXmlEntries(xmlString) {
	if (customElements.get('ixalang-entries') === undefined) {
		console.log('Importing ixalang entries lit element...')
		const { IxalangEntries } = await import('./lit-elements/ixalang-entries.js')
		customElements.define('ixalang-entries', IxalangEntries)
	}
	entriesContainer.languagePair = selectedLanguagePair
	entriesContainer.userInput = userInput
	entriesContainer.xmlString = xmlString
}
function queueXmlPromise(params) {
	if (xmlPromise.abort !== undefined) xmlPromise.abort()
	if (typeof params.selectedLanguagePair === 'string') selectedLanguagePair = params.selectedLanguagePair
	if (typeof params.userInput === 'string') userInput = params.userInput
	if (howManyBytesIn(userInput) < minimumInputBytes) return
	const abortController = new AbortController()
	xmlPromise = fetch(apiInfo.getWordsUrl(selectedLanguagePair, userInput), {
		signal: abortController.signal
	})
	.then(apiResponse => apiResponse.json())
	.then(apiData => {
		if (apiData.Entries instanceof Array && apiData.Entries.length > 0) {
			renderXmlEntries(
				`<entries>${apiData.Entries.join('')}</entries>`
			)
		}
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
import('./lit-elements/ixalang-search.js')
.then(({ IxalangSearch }) => customElements.define('ixalang-search', IxalangSearch))