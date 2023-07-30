package freedict

import (
	"log"
	"sort"
	"strings"

	"github.com/beevik/etree"
)

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
		if matchingElement != nil {
			matchingText := matchingElement.Text()
			lengthDifference := len(matchingText) - len(query)
			key := 100*lengthDifference + len(mapKeys)
			elementMap[key] = element
			mapKeys = append(mapKeys, key)
			continue
		}
		reverseMatch := elementThatContains(
			element.FindElements("sense/cit/quote"),
			query,
		)
		if reverseMatch != nil {
			matchingText := reverseMatch.Text()
			lengthDifference := len(matchingText) - len(query)
			key := 100*lengthDifference + len(mapKeys)
			elementMap[key] = reverseTranslation(element, matchingText)
			mapKeys = append(mapKeys, key)
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
