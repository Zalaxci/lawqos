<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="dictionary">
	<div class="flex-wrap">
		<xsl:for-each select="entry">
			<div class="entry">
				<ruby><h2><xsl:value-of select="form/orth"/></h2> <rt><xsl:value-of select="form/pron"/></rt></ruby>:
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
</xsl:stylesheet>
