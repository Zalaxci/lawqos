package freedict

import (
	"bytes"
	"encoding/xml"
	"os"
	"strconv"
	"sync"
)

type XmlElement struct {
	InnerXML []byte `xml:",innerxml"`
}

func SearchXmlFile(filePath string, tagOfElementsToQuery string, queryInBytes []byte, addResult func(result []byte)) {
	xmlFile, err := os.Open(filePath)
	if err != nil {
		panic(ProgramError{
			Reason: err.Error(),
			Place:  "function that searches xml files as a stream",
		})
	}
	defer xmlFile.Close()

	xmlDecoder := xml.NewDecoder(xmlFile)
	for xmlToken, err := xmlDecoder.Token(); xmlToken != nil; xmlToken, err = xmlDecoder.Token() {
		if err != nil {
			panic(ProgramError{
				Reason: err.Error(),
				Place:  "function that searches xml files as a stream",
			})
		}
		switch typedToken := xmlToken.(type) {
		case xml.StartElement:
			if typedToken.Name.Local == tagOfElementsToQuery {
				var xmlElement XmlElement
				xmlDecoder.DecodeElement(&xmlElement, &typedToken)
				if bytes.Contains(xmlElement.InnerXML, queryInBytes) {
					addResult(xmlElement.InnerXML)
				}
			}
		}
	}
}
func SearchFreedictDictionary(languagePair string, numberOfFragments int, query string) string {
	var wg sync.WaitGroup
	queryInBytes := []byte(query)
	xmlResultsInBytes := []byte{}
	addResult := func(result []byte) {
		xmlResultsInBytes = append(xmlResultsInBytes, result...)
	}
	wg.Add(numberOfFragments)
	for i := 1; i <= numberOfFragments; i++ {
		go func(fragmentId int) {
			dictionaryPath := "./dictionaries/" + languagePair + "/" + strconv.Itoa(fragmentId) + ".tei"
			SearchXmlFile(dictionaryPath, "entry", queryInBytes, addResult)
			wg.Done()
		}(i)
	}
	wg.Wait()
	return "<dictionary>" + string(xmlResultsInBytes) + "</dictionary>"
}
