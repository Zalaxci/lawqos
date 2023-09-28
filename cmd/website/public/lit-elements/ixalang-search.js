export class IxalangSearch extends LitElement {
	#selectedTargetLang = ''
	#getReadableLangName = new Intl.DisplayNames(['en'], {type: 'language'})
	static properties = {
		onInput: {
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
		this.onInput({ selectedLanguagePair })
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
			<input
				type="text"
				name="search"
				placeholder="Type here"
				@input=${(e) => this.onInput({ userInput: e.target.value })}
			/>
		`
	}
}