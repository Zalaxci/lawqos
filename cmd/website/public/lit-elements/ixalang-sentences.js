const PARSER = new DOMParser()
const SERIALIZER = new XMLSerializer()

const SENTENCES_XSLT_PROCESSOR = new XSLTProcessor()
const SENTENCES_XSLT = PARSER.parseFromString(`<?xml version="1.0"?>
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
	</xsl:stylesheet>`, 'application/xml')
SENTENCES_XSLT_PROCESSOR.importStylesheet(SENTENCES_XSLT)

export class IxalangSentences extends LitElement {
	#getSentencesUrl(languagePair, word, page) {
		return `/get/sentences/${languagePair}/${word}/${page}`
	}
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
	async fetchTatoebaSentences() {
		const apiResponse = await fetch(this.#getSentencesUrl(this.languagePair, this.word, 1))
		const xmlString = await apiResponse.text()
		const xmlDocument = PARSER.parseFromString(xmlString, 'application/xml')
		const htmlDocument = SENTENCES_XSLT_PROCESSOR.transformToDocument(xmlDocument)
		const htmlString = SERIALIZER.serializeToString(htmlDocument)	
		const htmlTemplate = unsafeHTML(htmlString)
		return htmlTemplate
	}
	render() {
		return html`
			<h2>Example sentences:</h2>
			${until(this.fetchTatoebaSentences(), "Loading...")}
		`
	}
}