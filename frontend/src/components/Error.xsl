<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="error">
	<div class="error">
		<h3><xsl:value-of select="current()"/></h3>
	</div>
</xsl:template>
</xsl:stylesheet>