customElements.define('language-picker', class LanguagePicker extends LitElement {
	#selectedTargetLang = ''
	static properties = {
		selectLanguagePair: {
			type: Function
		},
		_selectedBaseLang: {
			type: String,
			state: true
		}
	}
	constructor() {
		super()
		this._selectedBaseLang = 'ell'
	}
	#selectTargetLang(targetLang) {
		this.#selectedTargetLang = targetLang
		const selectedLanguagePair = `${this._selectedBaseLang}-${targetLang}`
		this.selectLanguagePair(selectedLanguagePair)
	}
	render() {
		const targetLangsForSelectedBaseLang = availableTargetLangs[this._selectedBaseLang]
		if (!targetLangsForSelectedBaseLang.includes(this.#selectedTargetLang)) {
			this.#selectTargetLang(targetLangsForSelectedBaseLang[0])
		}
		return html`
			<div class="colored-box">
				Look up a word from
				<select name="base-lang" id="base-lang" @input=${(e) => this._selectedBaseLang = e.target.value}>
					${Object.keys(availableTargetLangs).map(baseLang => html`
						<option value=${baseLang}>${baseLang}</option>
					`)}
				</select>
				to
				<select name="target-lang" id="target-lang" @input=${(e) => this.#selectTargetLang(e.target.value)}>
					${targetLangsForSelectedBaseLang.map(targetLang => html`
						<option value=${targetLang}>${targetLang}</option>
					`)}
				</select>
			</div>
		`
	}
})
customElements.define('ixalang-dictionary', class IxaLangDictionary extends LitElement {
	#selectedLanguagePair = ''
	#userInput = ''
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
		if (typeof params.selectedLanguagePair === 'string') this.#selectedLanguagePair = params.selectedLanguagePair
		if (typeof params.userInput === 'string') this.#userInput = params.userInput
		if (howManyBytesIn(this.#userInput) < this.minimumInputBytes) return console.log('User input is too small :(')
		const apiUrl = `/search/${this.#selectedLanguagePair}/${this.#userInput}`
		console.log(`Fetching api at ${apiUrl}...`)
		const apiResponse = await fetch(apiUrl)
		this._xmlString = await apiResponse.text()
	}
	render() {
		console.log('Rendering the dictionary...')
		return html`
			<div>
				<language-picker
					.selectLanguagePair=${(selectedLanguagePair) => this.#updateXmlEntries({ selectedLanguagePair })}
				></language-picker>
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