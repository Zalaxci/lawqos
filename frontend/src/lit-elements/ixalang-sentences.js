export default (
	{ LitElement, css, html, unsafeHTML, until }, // Pass Lit Element as parameter so as to not repeatedely import when not using a bundler
	getSentencesAsXML, // Pass in the function that returns the sentences as parameter, since it differs between app and website
) => customElements.define('ixalang-sentences', class IxalangSentences extends LitElement {
	#parser = new DOMParser()
	#serializer = new XMLSerializer()
	#xsltProcessor = new XSLTProcessor()
	#xsltString = `<?xml version="1.0"?>
					<xsl:stylesheet version="1.0"
					xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

					<xsl:template match="results/sentences">
						<div class="sentences-column">
							<xsl:for-each select="sentence">
								<div class="sentence">
									<h3><xsl:value-of select="text"/></h3>
									<ul>
										<xsl:for-each select="translations/translation">
											<li><xsl:value-of select="text"/></li>
										</xsl:for-each>
									</ul>
								</div>
							</xsl:for-each>
						</div>
					</xsl:template>
					</xsl:stylesheet>`
	static properties = {
		word: {
			type: String
		},
		languagePair: {
			type: String
		}
	}
	static styles = css`
		.sentences-row {
			display: flex;
		}
		* {
			text-align: left;
		}
		.right-spacing, .sentences-info {
			flex-grow: 1;
		}
		.sentences-info {
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			color: rgb(55, 55, 65);
			font-size: 4rem;
		}
		.sentence {
			background: rgb(35, 35, 40);
		}
		.sentence h3 {
			display: inline;
		}
		span::before {
			content: '  ';
		}
	`
	constructor() {
		super()
		this.#xsltProcessor.importStylesheet(
			this.#parser.parseFromString(this.#xsltString, 'application/xml')
		)
	}
	async fetchTatoebaSentences() {
		const xmlString = await getSentencesAsXML(this.languagePair, this.word)
		const xmlDocument = this.#parser.parseFromString(xmlString, 'application/xml')
		const htmlDocument = this.#xsltProcessor.transformToDocument(xmlDocument)
		const htmlString = this.#serializer.serializeToString(htmlDocument)	
		const htmlTemplate = unsafeHTML(htmlString)
		return htmlTemplate
	}
	render() {
		return html`
			<h2>Example sentences:</h2>
			${until(this.fetchTatoebaSentences(), "Loading...")}
		`
	}
})
