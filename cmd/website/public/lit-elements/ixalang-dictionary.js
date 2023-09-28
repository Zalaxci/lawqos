customElements.define('language-picker', class LanguagePicker extends LitElement {
	#selectedTargetLang = ''
	#getReadableLangName = new Intl.DisplayNames(['en'], {type: 'language'})
	static properties = {
		selectLanguagePair: {
			type: Function
		},
		_selectedBaseLang: {
			type: String,
			state: true
		}
	}
	static styles = css`
		#language-picker {
			width: min(auto, 95%);
			font-size: 1.2em;
		}
		select {
			background: rgb(95, 80, 40);
			border: 0;
			border-radius: 0.3rem;
		}
		option {
			font-size: 1.2em !important;
		}
	`
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
			<div id="language-picker" class="colored-box">
				Look up a word from
				<select name="base-lang" id="base-lang" @input=${(e) => this._selectedBaseLang = e.target.value}>
					${Object.keys(availableTargetLangs).map(baseLang => html`
						<option value=${baseLang}>${this.#getReadableLangName.of(baseLang)}</option>
					`)}
				</select>
				to
				<select name="target-lang" id="target-lang" @input=${(e) => this.#selectTargetLang(e.target.value)}>
					${targetLangsForSelectedBaseLang.map(targetLang => html`
						<option value=${targetLang}>${this.#getReadableLangName.of(targetLang)}</option>
					`)}
				</select>
				or in reverse:
			</div>
			<br>
		`
	}
})
customElements.define('ixalang-dictionary', class IxaLangDictionary extends LitElement {
	#selectedLanguagePair = ''
	#userInput = ''
	#xmlPromises = [
		'<results><entries></entries></results>'
	]
	get minimumInputBytes() {
		return 3
	}
	get maximumInputCharacters() {
		return 4
	}
	get #newestXmlPromises() {
		const promiseCount = this.#xmlPromises.length
		return this.#xmlPromises.map((_, index) => this.#xmlPromises[promiseCount - index - 1])
	}
	static properties = {}
	static styles = css`
		#dictionary-container {
			width: 100%;
			min-height: 100vh !important;
			height: max(100vh, auto);
			display: flex;
			flex-direction: column-reverse;
			place-items: center;
			text-align: center;
		}
		input {
			width: min(95%, 200px);
		}
		#top-spacing {
			flex-grow: 1;
		}
		language-picker {
			margin-top: 1.5rem;
		}
		input:not(:placeholder-shown) ~ *:not(language-picker) {
			display: none;
		}
		dictionary-entries {
			flex-grow: 1;
			width: 100%;
		}
	`
	#trimXmlPromises() {
		const promiseCount = this.#xmlPromises.length
		for (let i = 0; i < promiseCount; i++) {
			if (this.#xmlPromises[i].abort !== undefined && this.#xmlPromises[i].abort()) {
				this.#xmlPromises.splice(i, 1)
			}
		}
	}
	#queueXmlPromise(params) {
		this.#trimXmlPromises()
		if (typeof params.selectedLanguagePair === 'string') this.#selectedLanguagePair = params.selectedLanguagePair
		if (typeof params.userInput === 'string') this.#userInput = params.userInput
		if (howManyBytesIn(this.#userInput) < this.minimumInputBytes) return
		// This is a loophole to allow abortion of fetch requests
		// Each promise has an abort method which returns true and aborts the promise if not resolved, or returns false if resolved
		const abortController = new AbortController()
		const xmlPromise = fetch(apiInfo.getWordsUrl(this.#selectedLanguagePair, this.#userInput), {
			signal: abortController.signal
		}).then(res => res.text())
		xmlPromise.abort = () => {
			abortController.abort()
			return true
		}
		this.#xmlPromises.push(xmlPromise)
		this.requestUpdate()
		xmlPromise.then(
			() => {
				xmlPromise.abort = () => false
			}
		)
	}
	#importUndefinedElements(...elementTags) {}
	render() {
		console.log('Rendering the dictionary...')
		return html`
			<div id="dictionary-container">
				<dictionary-entries languagePair=${this.#selectedLanguagePair} xmlString=${until(...this.#newestXmlPromises)}></dictionary-entries>
				<input
					type="text"
					name="search"
					placeholder="Type here"
					@input=${(e) => this.#queueXmlPromise({ userInput: e.target.value })}
				/>
				<language-picker
					.selectLanguagePair=${(selectedLanguagePair) => this.#queueXmlPromise({ selectedLanguagePair })}
				></language-picker>
				<h1 class="no-margin-top">IxaLang</h1>
				<p>Ixalaz + Languages =</p>
				<div id="top-spacing"></div>
			</div>
		`
	}
})