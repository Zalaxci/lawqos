const PARSER = new DOMParser()
const SERIALIZER = new XMLSerializer()

const ENTRIES_XSLT_PROCESSOR = new XSLTProcessor()
const ENTRIES_XSLT = PARSER.parseFromString(`<?xml version="1.0"?>
	<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template match="dictionary">
		<div class="entries-container">
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

const ERROR_XSLT_PROCESSOR = new XSLTProcessor()
const ERROR_XSLT = PARSER.parseFromString(`<?xml version="1.0"?>
	<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template match="error">
		<div class="error">
			<h3><xsl:value-of select="current()"/></h3>
		</div>
	</xsl:template>
	</xsl:stylesheet>`, 'application/xml')
ERROR_XSLT_PROCESSOR.importStylesheet(ERROR_XSLT)

customElements.define('dictionary-entries', class DictionaryEntries extends LitElement {
	static properties = {
		xmlString: {
			type: String
		}
	}
	static styles = css`
		.entries-container {
			display: flex;
			flex-wrap: wrap;
			place-content: center;
		}
		.entry {
			width: min(100%, 400px);
			margin: 1rem;
			padding: 0.5rem;
			border-radius: 1rem;
			background: linear-gradient(to bottom right, rgba(169, 148, 141, 0.5), rgba(215, 135, 105, 0.5));
		}
		.entry h2 {
			text-transform: capitalize;
		}
		.entry ol {
			padding: 0;
			margin: 0;
			list-style-position: inside;
		}
		.entry li {
			width: 100%;
		}
		rt {
			font-size: small;
		}
		.word + .word::before {
			content: ', '
		}
	`
	render() {
		const xmlDocument = PARSER.parseFromString(this.xmlString, 'application/xml')
		const htmlDocument = ENTRIES_XSLT_PROCESSOR.transformToDocument(xmlDocument)
		const htmlString = SERIALIZER.serializeToString(htmlDocument)
		return html`
			${unsafeHTML(htmlString)}
		`
	}
})