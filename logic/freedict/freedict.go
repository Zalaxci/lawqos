package freedict

import (
	"path/filepath"
	"sort"
	"strings"

	"github.com/beevik/etree"
)

type ProgramError struct {
	Reason string
	Place  string
}

func (err ProgramError) Error() string {
	return err.Reason + " at " + err.Place
}

type UserError struct {
	Input string
	Rule  string
}

func (err UserError) Error() string {
	return "got " + err.Input + " when " + err.Rule
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
func FromFile(language, folderPath string) (xmlDocument *etree.Document) {
	xmlDocument = etree.NewDocument()
	fileErr := xmlDocument.ReadFromFile(filepath.Join(folderPath, language+".tei"))
	if fileErr != nil {
		panic(ProgramError{
			Reason: fileErr.Error(),
			Place:  "dictionary file loader",
		})
	}
	return
}
func FromFileOrOnline(language, folderPath string, downloadFile func(language, folderPath string)) (xmlDocument *etree.Document) {
	defer func() {
		if r := recover(); r != nil {
			downloadFile(language, folderPath)
			xmlDocument = FromFile(language, folderPath)
		}
	}()
	xmlDocument = FromFile(language, folderPath)
	return
}
func Search(xmlDocument *etree.Document, query string) *etree.Document {
	if len(query) < 3 {
		panic(UserError{
			Input: "search query " + query,
			Rule:  "only search queries of 3 bytes or more (3 english characters) are allowed",
		})
	}
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
			panic(ProgramError{
				Reason: "amount of entries exceeded the maximum of 50",
				Place:  "dictionary search",
			})
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
func SearchString(xmlString string, query string) string {
	xmlDocument := etree.NewDocument()
	parseErr := xmlDocument.ReadFromString(xmlString)
	if parseErr != nil {
		panic(ProgramError{
			Reason: parseErr.Error(),
			Place:  "xml parser from string",
		})
	}
	resultString, serializeErr := Search(xmlDocument, query).WriteToString()
	if serializeErr != nil {
		panic(ProgramError{
			Reason: serializeErr.Error(),
			Place:  "xml parser from string",
		})
	}
	return resultString
}
