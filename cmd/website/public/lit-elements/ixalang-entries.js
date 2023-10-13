export class IxalangEntries extends LitElement {
	#parser = new DOMParser()
	#serializer = new XMLSerializer()
	#xsltProcessor = new XSLTProcessor()
	#xsltString = `<?xml version="1.0"?>
					<xsl:stylesheet version="1.0"
					xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

					<xsl:template match="entries">
						<div id="entries-container">
							<xsl:for-each select="entry">
								<xsl:sort select="form/orth"/>
								<div class="entry">
									<div class="header">
										<ruby>
											<h2><xsl:value-of select="form/orth"/></h2> <rt><xsl:value-of select="form/pron"/></rt>
										</ruby>
									</div>
									<ol>
										<xsl:for-each select="sense">
											<li>
												<xsl:for-each select="cit/quote">
													<span class="word"><xsl:value-of select="current()"/></span>
												</xsl:for-each>
												<xsl:for-each select="sense/def">
													<span> (<xsl:value-of select="current()"/>)</span>
												</xsl:for-each>
											</li>
										</xsl:for-each>
									</ol>
									<div class="additional-info">Coming soon</div>
								</div>
							</xsl:for-each>
						</div>
					</xsl:template>
					</xsl:stylesheet>`
	#sortingSelector = null
	#entries = null
	static properties = {
		languagePair: {
			type: String
		},
		userInput: {
			type: String
		},
		xmlEntryList: {
			type: Array
		}
	}
	static styles = css`
		#entries-container {
			max-width: 1350px;
			margin-left: auto;
			margin-right: auto;
			display: flex;
			flex-wrap: wrap;
			place-content: center;
		}
		/* Entry & entry contents */
		.entry {
			position: relative;
			width: min(90%, 400px);
			margin: 1em;
			padding: 0.5rem;
			border-radius: 1rem;
			background: rgb(35, 35, 40);
			cursor: pointer;
			transition: transform 0.2s, height 0.5s, width 0.5s, background 0.5s;
			white-space: normal !important;
			word-wrap: break-word !important;
			word-break:break-all !important;
			overflow: hidden !important;
		}
		.entry h2, .entry rt, .entry span, .entry ixalang-sentences {
			cursor: text !important;
		}
		.entry ruby {
			background: rgb(95, 80, 40);
		}
		.entry h2 {
			text-transform: capitalize;
		}
		.entry h2::after {
			content: ':';
		}
		.entry rt {
			font-size: small;
		}
		.entry ol {
			padding: 0;
			margin: 0;
			list-style-position: inside;
		}
		.entry:not(.opened) li {
			width: 100%;
		}
		.word + .word::before {
			content: ', ';
		}
		.entry:not(.opened) .additional-info {
			display: none;
		}
		/* Hover effects (zoom and gradient) */
		.entry:not(.opened):hover {
			transform: scale(1.1);
		}
		.entry::before {
			--size: 0;
			content: '';
			position: absolute;
			left: var(--hoverX);
			top: var(--hoverY);
			width: var(--size);
			height: var(--size);
			background: radial-gradient(circle closest-side, rgb(37, 33, 45), transparent);
			transform: translate(-50%, -50%);
			transition: width 0.2s ease, height 0.2s ease;
		}
		.entry:not(.opened):hover::before {
			--size: 180px;
		}
		/* Restyle opened entries */
		.entry.opened {
			margin: 1rem 0;
			min-height: 80vh;
			width: 96%;
			background: rgb(37, 33, 45);
			display: flex;
			flex-wrap: wrap;
		}
		.entry.opened .header {
			flex-grow: 1;
			width: 100%;
		}
		.entry.opened ol, .entry.opened .additional-info {
			flex-grow: 1;
		}
	`
	constructor() {
		super()
		this.#xsltProcessor.importStylesheet(
			this.#parser.parseFromString(this.#xsltString, 'application/xml')
		)
	}
	#sortEntries() {
		if (!this.#entries instanceof HTMLCollection) return
		if (!this.#sortingSelector instanceof HTMLElement) return
		switch (this.#sortingSelector.value) {
			case 'by-length':
				console.log('Sorting entries by length...')
				const xpathToSearchForInput = `.//*[text()[contains(., '${this.userInput}')]]`
				const elementIsWordExplanation = (el) => el.tagName === 'SPAN' && !el.classList.contains('word')
				for (const entryElement of this.#entries) {
					const elementContainingInput = document.evaluate(xpathToSearchForInput, entryElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
					entryElement.style.order = elementIsWordExplanation(elementContainingInput)?  2147483647 : (elementContainingInput.innerHTML.length - this.userInput.length)
				}
				break
			default:
				console.log('Sorting entries alphabetically (default sorting)...')
				for (const entryElement of this.#entries) {
					entryElement.style.removeProperty('order')
				}
		}
	}
	async #handleClickEvent(e) {
		const clickedElement = e.target
		const illegalTagNames = ['H1', 'H2', 'H3', 'RT', 'SPAN', 'IXALANG-SENTENCES', 'UL', 'LI']
		if (clickedElement.id == 'entries-container') return
		if (illegalTagNames.includes(clickedElement.tagName)) return
		let clickedEntry = clickedElement
		while (!clickedEntry.classList.contains('entry')) {
			clickedEntry = clickedEntry.parentElement
		}
		// Shrink/grow entry
		const entryWasOpen = clickedEntry.classList.contains('opened')
		if (entryWasOpen) {
			clickedEntry.classList.remove('opened')
		} else {
			clickedEntry.classList.add('opened')
		}
		// Import word details if not defined
		if (customElements.get('ixalang-sentences') === undefined) {
			console.log('Importing ixalang sentences lit element...')
			const { IxalangSentences } = await import('./ixalang-sentences.js')
			customElements.define('ixalang-sentences', IxalangSentences)
		}
		// Create word details element if it doesn't exist
		let entryExampleSentences = clickedEntry.querySelector('ixalang-sentences')
		if (entryExampleSentences === null) {
			entryExampleSentences = document.createElement('ixalang-sentences')
			entryExampleSentences.word = clickedEntry.querySelector('h2').innerHTML
			entryExampleSentences.languagePair = this.languagePair
			clickedEntry.insertBefore(entryExampleSentences, clickedElement.querySelector('.additional-info'))
		}
		// Hide/show details
		entryExampleSentences.style.display = entryWasOpen? 'none' : 'block'
	}
	render() {
		if (this.xmlEntryList.length > 0) {
			const xmlString = `<entries>${this.xmlEntryList.join('')}</entries>`
			const xmlDocument = this.#parser.parseFromString(xmlString, 'application/xml')
			const htmlDocument = this.#xsltProcessor.transformToDocument(xmlDocument)
			const htmlString = this.#serializer.serializeToString(htmlDocument)
			return html`
				<h3>Sort:</h3>
				<select name="sorting-selector" id="sorting-selector" @input=${this.#sortEntries.bind(this)}>
					<option value="alphabetically">Alphabetically</option>
					<option value="by-length">By Length</option>
				</select>
				${unsafeHTML(htmlString)}
			`
		}
		return html`
			<div>
				<p>No results found</p>
				<h1>:(</h1>
			</div>
		`
	}
	updated() {
		const entriesContainer = this.renderRoot.querySelector('#entries-container')
		this.#entries = entriesContainer.children
		this.#sortingSelector = this.renderRoot.querySelector('#sorting-selector')
		this.#sortEntries()
		entriesContainer.onclick = this.#handleClickEvent.bind(this)
		entriesContainer.onmousemove = (e) => {
			let rect = e.target.getBoundingClientRect();
			const hoverX = e.clientX - rect.left;
			const hoverY = e.clientY - rect.top;
			entriesContainer.style.setProperty('--hoverX', `${hoverX}px`)
			entriesContainer.style.setProperty('--hoverY', `${hoverY}px`)
		}
	}
}
