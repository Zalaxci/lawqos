const PARSER = new DOMParser()
const SERIALIZER = new XMLSerializer()

const ENTRIES_XSLT_PROCESSOR = new XSLTProcessor()
const ENTRIES_XSLT = PARSER.parseFromString(`<?xml version="1.0"?>
	<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template match="results/entries">
		<div id="entries-container">
			<xsl:for-each select="entry">
				<div class="entry">
					<ruby><h2><xsl:value-of select="form/orth"/>:</h2> <rt><xsl:value-of select="form/pron"/></rt></ruby>
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
				</div>
			</xsl:for-each>
		</div>
	</xsl:template>
	</xsl:stylesheet>`, 'application/xml')
ENTRIES_XSLT_PROCESSOR.importStylesheet(ENTRIES_XSLT)

const SENTENCES_XSLT_PROCESSOR = new XSLTProcessor()
const SENTENCES_XSLT = PARSER.parseFromString(`<?xml version="1.0"?>
	<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template match="results/sentences">
		<div class="sentences-container">
			<xsl:for-each select="sentence">
				<div class="sentence">
					<h3><xsl:value-of select="text"/></h3>
					<xsl:for-each select="translations/translation">
						<span><xsl:value-of select="text"/></span>
					</xsl:for-each>
				</div>
			</xsl:for-each>
		</div>
	</xsl:template>
	</xsl:stylesheet>`, 'application/xml')
SENTENCES_XSLT_PROCESSOR.importStylesheet(SENTENCES_XSLT)

customElements.define('word-details', class WordDetails extends LitElement {
	static properties = {
		word: {
			type: String
		},
		languagePair: {
			type: String
		}
	}
	static styles = css`
		.sentences-container {
			text-align: left;
		}
		.sentence h3 {
			display: inline;
		}
		span::before {
			content: '  ';
		}
	`
	async fetchTatoebaSentences() {
		const apiResponse = await fetch(apiInfo.getSentencesUrl(this.languagePair, this.word, 1))
		const xmlString = await apiResponse.text()
		const xmlDocument = PARSER.parseFromString(xmlString, 'application/xml')
		const htmlDocument = SENTENCES_XSLT_PROCESSOR.transformToDocument(xmlDocument)
		const htmlString = SERIALIZER.serializeToString(htmlDocument)	
		const htmlTemplate = unsafeHTML(htmlString)
		return htmlTemplate
	}
	render() {
		return until(this.fetchTatoebaSentences(), "Loading...")
	}
})
customElements.define('dictionary-entries', class DictionaryEntries extends LitElement {
	static properties = {
		languagePair: {
			type: String
		},
		xmlString: {
			type: String
		}
	}
	static styles = css`
		#entries-container {
			display: flex;
			flex-wrap: wrap;
			place-content: center;
		}

		.entry {
			width: min(90%, 400px);
			margin: 1rem;
			padding: 0.5rem;
			border-radius: 1rem;
			background: linear-gradient(to bottom right, rgba(169, 148, 141, 0.5), rgba(215, 135, 105, 0.5));
			cursor: pointer;
			transition: width 1s, height 1s;
			white-space: normal !important;
			word-wrap: break-word !important;
			word-break:break-all !important;
		}
		.entry h2, .entry rt, .entry span {
			cursor: text !important;
		}

		.entry.opened {
			width: 100%;
		}
		.entry.opened ruby {
			float: left;
			margin-right: 1.5rem;
		}

		.entry h2 {
			text-transform: capitalize;
		}
		.entry rt {
			font-size: small;
		}
		.entry ol {
			padding: 0;
			margin: 0;
			list-style-position: inside;
		}
		.entry.opened ol {
			height: 5rem;
			display: flex;
			gap: 1rem;
			place-content: center flex-start;
			align-items: center;
		}
		.entry:not(.opened) li {
			width: 100%;
		}

		.word + .word::before {
			content: ', '
		}
	`
	#handleClickEvent(e) {
		const clickedElement = e.target
		const illegalTagNames = ['H2', 'RT', 'SPAN']
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
		// Create word details element if it doesn't exist
		let entryWordDetails = clickedEntry.querySelector('word-details')
		if (entryWordDetails === null) {
			entryWordDetails = document.createElement('word-details')
			entryWordDetails.word = clickedEntry.querySelector('h2').innerHTML
			entryWordDetails.languagePair = this.languagePair
			clickedEntry.appendChild(entryWordDetails)
		}
		// Hide/show details
		entryWordDetails.style.display = entryWasOpen? 'none' : 'block'
	}
	render() {
		const xmlDocument = PARSER.parseFromString(this.xmlString, 'application/xml')
		const htmlDocument = ENTRIES_XSLT_PROCESSOR.transformToDocument(xmlDocument)
		const htmlString = SERIALIZER.serializeToString(htmlDocument)		
		return html`
			${unsafeHTML(htmlString)}
		`
	}
	updated() {
		this.renderRoot.querySelector('#entries-container').onclick = this.#handleClickEvent.bind(this)
	}
})