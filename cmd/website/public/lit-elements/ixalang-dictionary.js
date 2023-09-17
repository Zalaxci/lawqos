customElements.define('ixalang-dictionary', class IxaLangDictionary extends LitElement {
	#selectedLanguage = ''
	#userInput = ''
	get availableLanguagePairs() {
		return [
			'ell-jpn'
		]
	}
	get minimumInputBytes() {
		return 3
	}
	get maximumInputCharacters() {
		return 4
	}
	static properties = {
		_xmlString: {
			type: String,
			state: true
		}
	}
	static styles = css`
		dictionary-entries:not(:empty) {
			flex-grow: 1;
			width: 100%;
		}
	`
	constructor() {
		super()
		this._xmlString = '<dictionary></dictionary>'
	}
	async #updateXmlEntries(params) {
		if (typeof params.selectedLanguage === 'string') this.#selectedLanguage = params.selectedLanguage
		if (typeof params.userInput === 'string') this.#userInput = params.userInput
		if (!this.availableLanguagePairs.includes(this.#selectedLanguage)) return console.log('The selected language is not available :(')
		if (howManyBytesIn(this.#userInput) < this.minimumInputBytes) return console.log('User input is too small :(')
		const apiUrl = `/search/${this.#selectedLanguage}/${this.#userInput}`
		console.log(`Fetching api at ${apiUrl}...`)
		const apiResponse = await fetch(apiUrl)
		this._xmlString = await apiResponse.text()
	}
	render() {
		console.log('Rendering the dictionary...')
		return html`
			<div>
				<input
					type="text"
					name="select-language"
					placeholder="Type a language"
					@input=${(e) => this.#updateXmlEntries({ selectedLanguage: e.target.value })}
				/>
				<input
					type="text"
					name="search"
					placeholder="Search a word"
					@input=${(e) => this.#updateXmlEntries({ userInput: e.target.value })}
				/>
				<dictionary-entries xmlString=${this._xmlString}></dictionary-entries>
			</div>
		`
	}
})