<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/dictionary">
	<div class="column">
		<xsl:for-each select="entry">
			<div class="box row space-between horizontal-padding">
				<h3><xsl:value-of select="form/orth"/></h3>
				<h3><xsl:for-each select="sense"><xsl:value-of select="cit/quote"/></xsl:for-each></h3>
			</div>
		</xsl:for-each>
	</div>
</xsl:template>

</xsl:stylesheet>
