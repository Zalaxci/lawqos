package logic

import (
	"log"
	"os"

	"github.com/antchfx/xmlquery"
)

func ParseXML(filePath string) (*xmlquery.Node, func() error) {
	xmlFile, fileErr := os.Open(filePath)
	if fileErr != nil {
		log.Fatal(fileErr)
	}
	xmlDocument, parseErr := xmlquery.Parse(xmlFile)
	if parseErr != nil {
		log.Fatal(parseErr)
	}
	return xmlDocument, xmlFile.Close
}
