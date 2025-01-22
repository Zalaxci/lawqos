package tatoeba

import (
	"encoding/json"
	"net/http"

	"github.com/beevik/etree"
)

type TatoebaData struct {
	Paging struct {
		Sentences map[string]any `json:"Sentences"`
	} `json:"paging"`
	Results []map[string]any `json:"results"`
}

func GetObject(baseLang string, targetLang string, query string, page string) (tatoebaData TatoebaData, apiErr error) {
	apiUrl := "https://tatoeba.org/en/api_v0/search?from=" + baseLang + "&to=" + targetLang + "&query=" + query + "&page=" + page
	apiResponse, apiErr := http.Get(apiUrl)
	if apiErr != nil {
		return
	}
	defer apiResponse.Body.Close()
	tatoebaData = TatoebaData{}
	json.NewDecoder(apiResponse.Body).Decode(&tatoebaData)
	return
}

func GetXmlOrErr(baseLang string, targetLang string, query string, page string) (xmlInBytes []byte, err error) {
	etreeDocument := etree.NewDocument()
	resultsEl := etreeDocument.CreateElement("results")
	sentencesEl := resultsEl.CreateElement("sentences")
	tatoebaData, err := GetObject(baseLang, targetLang, query, page)
	if err != nil {
		return
	}
	for _, result := range tatoebaData.Results {
		sentenceEl := sentencesEl.CreateElement("sentence")
		textEl := sentenceEl.CreateElement("text")
		textEl.CreateText(result["text"].(string))
		textEl.CreateAttr("xml:lang", result["lang"].(string))
		translationsEl := sentenceEl.CreateElement("translations")
		translationData := result["translations"].([]any)
		for _, translations := range translationData {
			switch typeSafeTranslations := translations.(type) {
			case []any:
				for _, translation := range typeSafeTranslations {
					typeSafeTranslation := translation.(map[string]any)
					translationEl := translationsEl.CreateElement("translation")
					textEl := translationEl.CreateElement("text")
					textEl.CreateText(typeSafeTranslation["text"].(string))
					textEl.CreateAttr("xml:lang", typeSafeTranslation["lang"].(string))
					for _, transcription := range typeSafeTranslation["transcriptions"].([]any) {
						switch typeSafeTranscription := transcription.(type) {
						case map[string]any:
							transcriptionEl := translationEl.CreateElement("transcription")
							transcriptionEl.CreateText(typeSafeTranscription["html"].(string))
						}
					}
				}
			}
		}
	}
	xmlInBytes, err = etreeDocument.WriteToBytes()
	return
}
func GetXmlIncludingErrors(baseLang string, targetLang string, query string, page string) []byte {
	xmlInBytes, err := GetXmlOrErr(baseLang, targetLang, query, page)
	if err != nil {
		return []byte("<results>\n<errors>\n" + err.Error() + "\n</errors>\n</results")
	}
	return xmlInBytes
}
