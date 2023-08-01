package freedict

import (
	"log"
	"sort"
	"strings"

	"github.com/beevik/etree"
)

func createXMLError(errorText string) *etree.Document {
	document := etree.NewDocument()
	errorElement := document.CreateElement("error")
	errorElement.CreateText(errorText)
	return document
}
func elementThatContains(elements []*etree.Element, query string) *etree.Element {
	for _, element := range elements {
		if element != nil && strings.Contains(element.Text(), query) {
			return element
		}
	}
	return nil
}
func reverseTranslation(element *etree.Element, word string) *etree.Element {
	newElement := etree.NewElement("entry")
	orthography := newElement.CreateElement("form").CreateElement("orth")
	orthography.CreateText(word)
	grammarGroup := element.FindElement("gramGrp")
	if grammarGroup != nil {
		newElement.AddChild(grammarGroup)
	}
	translation := newElement.CreateElement("sense").CreateElement("cit").CreateElement("quote")
	translation.CreateText(element.FindElement("form/orth").Text())
	return newElement
}
func FromFile(language string) *etree.Document {
	xmlDocument := etree.NewDocument()
	fileErr := xmlDocument.ReadFromFile("./dictionaries/freedict/" + language + "/" + language + ".tei")
	if fileErr != nil {
		log.Fatal(fileErr)
	}
	return xmlDocument
}
func Search(xmlDocument *etree.Document, query string) *etree.Document {
	elementMap := make(map[int]*etree.Element)
	mapKeys := make([]int, 0)
	for _, element := range xmlDocument.FindElements(`//entry`) {
		matchingElement := elementThatContains(
			[]*etree.Element{element.FindElement("form/orth"), element.FindElement("form/pron")},
			query,
		)
		matchesTargetLang := false
		if matchingElement == nil {
			matchingElement = elementThatContains(
				element.FindElements("sense/cit/quote"),
				query,
			)
			matchesTargetLang = true
		}
		if matchingElement == nil {
			continue
		}
		matchingText := matchingElement.Text()
		lengthDifference := len(matchingText) - len(query)
		key := 100*lengthDifference + len(mapKeys)
		if matchesTargetLang {
			elementMap[key] = reverseTranslation(element, matchingText)
		} else {
			elementMap[key] = element
		}
		mapKeys = append(mapKeys, key)
		if len(mapKeys) >= 50 {
			return createXMLError("Amount of entries exceeded the maximum of 50!")
		}
	}
	sort.Ints(mapKeys)
	finalDocument := etree.NewDocument()
	dictionary := finalDocument.CreateElement("dictionary")
	for _, key := range mapKeys {
		dictionary.AddChild(elementMap[key])
	}
	return finalDocument
}
func SearchFile(language string, query string) *etree.Document {
	if len(query) <= 2 {
		return createXMLError("Search query is smaller than the minimum of 3 bytes")
	}
	return Search(FromFile(language), query)
}
func SearchString(xmlString string, query string) string {
	if len(query) <= 2 {
		return "<error>Search query is smaller than the minimum of 3 bytes</error>"
	}
	xmlDocument := etree.NewDocument()
	fileErr := xmlDocument.ReadFromString(xmlString)
	if fileErr != nil {
		return "<error>" + fileErr.Error() + "</error>"
	}
	resultString, searchErr := Search(xmlDocument, query).WriteToString()
	if searchErr != nil {
		return "<error>" + searchErr.Error() + "</error>"
	}
	return resultString
}
