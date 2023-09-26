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

func SearchXmlFile(filePath string, tagOfElementsToQuery string, queryInBytes []byte, addResult func(result []byte)) error {
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
				if bytes.Contains(xmlElement.InnerXML, queryInBytes) {
					addResult(xmlElement.InnerXML)
				}
			}
		}
	}
	return nil
}
func SearchFreedictDictionary(languagePair string, numberOfFragments int, query string, includeErrors bool) (xmlResults string, errors []error) {
	var wg sync.WaitGroup
	queryInBytes := []byte(query)
	xmlResultsInBytes := []byte{}
	entryOpeningTag := []byte("<entry>")
	entryClosingTag := []byte("</entry>\n")
	addResult := func(result []byte) {
		xmlResultsInBytes = append(xmlResultsInBytes, entryOpeningTag...)
		xmlResultsInBytes = append(xmlResultsInBytes, result...)
		xmlResultsInBytes = append(xmlResultsInBytes, entryClosingTag...)
	}
	wg.Add(numberOfFragments)
	for i := 1; i <= numberOfFragments; i++ {
		go func(fragmentId int) {
			dictionaryPath := "./dictionaries/" + languagePair + "/" + strconv.Itoa(fragmentId) + ".tei"
			searchFileError := SearchXmlFile(dictionaryPath, "entry", queryInBytes, addResult)
			if searchFileError != nil {
				errors = append(errors, searchFileError)
			}
			wg.Done()
		}(i)
	}
	wg.Wait()
	if !includeErrors {
		xmlResults = "<results>\n<entries>" + string(xmlResultsInBytes) + "</entries>\n</results>"
		return
	}
	errorsAsXml := ""
	for _, err := range errors {
		errorsAsXml += "<error>" + err.Error() + "</error>\n"
	}
	xmlResults = "<results>\n<errors>\n" + errorsAsXml + "</errors>\n<entries>\n" + string(xmlResultsInBytes) + "</entries>\n</results>"
	return
}
