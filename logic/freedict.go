package logic

import (
	"log"
	"sort"
	"strings"

	"github.com/beevik/etree"
)

func FreeDictFile(language string) *etree.Document {
	xmlDocument := etree.NewDocument()
	fileErr := xmlDocument.ReadFromFile("./dictionaries/freedict/" + language + "/" + language + ".tei")
	if fileErr != nil {
		log.Fatal(fileErr)
	}
	return xmlDocument
}
func FreeDictSearch(xmlDocument *etree.Document, query string) *etree.Document {
	elementMap := make(map[int]*etree.Element)
	mapKeys := make([]int, 0)
	for _, element := range xmlDocument.FindElements(`//entry`) {
		if orthElement := element.FindElement("form/orth"); orthElement != nil && strings.Contains(orthElement.Text(), query) {
			orthography := orthElement.Text()
			lengthDifference := len(orthography) - len(query)
			key := 100*lengthDifference + len(elementMap)
			elementMap[key] = element
			mapKeys = append(mapKeys, key)
			continue
		}
		if pronElement := element.FindElement("form/pron"); pronElement != nil && strings.Contains(pronElement.Text(), query) {
			pronounciation := pronElement.Text()
			lengthDifference := len(pronounciation) - len(query)
			key := 100*lengthDifference + len(elementMap)
			elementMap[key] = element
			mapKeys = append(mapKeys, key)
			continue
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
