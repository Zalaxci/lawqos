package logic

import (
	"fmt"
	"log"
	"strings"

	"github.com/antchfx/xmlquery"
	"github.com/samber/lo"
)

func removeCharacters(input string, characters string) string {
	filter := func(r rune) rune {
		if !strings.ContainsRune(characters, r) {
			return r
		}
		return -1
	}
	return strings.Map(filter, input)
}
func FreeDictSearch(xmlDocument *xmlquery.Node, query string) []*xmlquery.Node {
	cleanQuery := removeCharacters(query, `"/\()[]{}`)
	return xmlquery.Find(
		xmlDocument,
		fmt.Sprintf(`
			//entry[
				form/orth[contains(text(), "%[1]s")] | sense/cit/quote[contains(text(), "%[1]s")]
			]
		`, cleanQuery),
	)
}
func FreeDictLoadAndSearch(language string, query string) string {
	xmlDocument, closeFile := ParseXML("./dictionaries/freedict/" + language + "/" + language + ".tei")
	xmlData := FreeDictSearch(xmlDocument, query)
	xmlString := lo.Reduce(xmlData, func(aggregator string, xmlEntry *xmlquery.Node, _ int) string {
		return aggregator + xmlEntry.OutputXML(true)
	}, "")
	closeErr := closeFile()
	if closeErr != nil {
		log.Fatal(closeErr)
	}
	return "<dictionary>" + xmlString + "</dictionary>"
}
