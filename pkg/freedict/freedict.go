package freedict

import (
	"encoding/xml"
	"os"
	"strconv"
	"strings"
	"sync"
)

type XmlElement struct {
	InnerXML string `xml:",innerxml"`
}
type FreedictResults struct {
	Errors  []error
	Entries []string
}

func SearchXmlFile(filePath string, tagOfElementsToQuery string, query string, addResult func(resultXml string)) error {
	xmlFile, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer xmlFile.Close()

	xmlDecoder := xml.NewDecoder(xmlFile)
	for xmlToken, err := xmlDecoder.Token(); xmlToken != nil; xmlToken, err = xmlDecoder.Token() {
		if err != nil {
			return err
		}
		switch typedToken := xmlToken.(type) {
		case xml.StartElement:
			if typedToken.Name.Local == tagOfElementsToQuery {
				var xmlElement XmlElement
				xmlDecoder.DecodeElement(&xmlElement, &typedToken)
				if strings.Contains(xmlElement.InnerXML, query) {
					addResult("<" + tagOfElementsToQuery + ">" + xmlElement.InnerXML + "</" + tagOfElementsToQuery + ">")
				}
			}
		}
	}
	return nil
}
func SearchFreedictDictionary(languagePair string, numberOfFragments int, query string) (results FreedictResults) {
	addEntry := func(entryXml string) {
		results.Entries = append(
			results.Entries,
			strings.ReplaceAll(entryXml, "\n", ""),
		)
	}
	var wg sync.WaitGroup
	wg.Add(numberOfFragments)
	for i := 1; i <= numberOfFragments; i++ {
		go func(fragmentId int) {
			dictionaryPath := "./assets/dictionaries/" + languagePair + "/" + strconv.Itoa(fragmentId) + ".tei"
			searchFileError := SearchXmlFile(dictionaryPath, "entry", query, addEntry)
			if searchFileError != nil {
				results.Errors = append(results.Errors, searchFileError)
			}
			wg.Done()
		}(i)
	}
	wg.Wait()
	return
}
