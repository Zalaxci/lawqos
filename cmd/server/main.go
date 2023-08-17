package main

import (
	"IxaLang/logic/freedict"
	"IxaLang/logic/storj"

	"github.com/labstack/echo/v4"
)

const dictionaryDir = "./dictionaries"

func search(c echo.Context, storj storj.StorjWrapper) (serverError error) {
	defer func() {
		if r := recover(); r != nil {
			dictionaryError := r.(freedict.DictionaryError)
			if dictionaryError.UserError {
				serverError = c.XMLBlob(422, []byte("<error>"+dictionaryError.Error()+"</error>"))
			} else {
				serverError = c.XMLBlob(500, []byte("<error>"+dictionaryError.Error()+"</error>"))
			}
		}
	}()
	xmlDocument := freedict.FromFileOrOnline("ell-jpn", dictionaryDir, storj.DownloadFile)
	finalDocument := freedict.Search(xmlDocument, c.Param("query"))
	if len(finalDocument.ChildElements()) == 0 {
		panic(freedict.DictionaryError{
			UserError: false,
			Reason:    "the dictionary search function returned a blank document",
			Place:     "dictionary search",
		})
	}
	xmlString, serializationErr := finalDocument.WriteToString()
	if serializationErr != nil {
		panic(freedict.DictionaryError{
			UserError: false,
			Reason:    serializationErr.Error(),
			Place:     "xml serialization to string",
		})
	}
	serverError = c.XMLBlob(200, []byte(xmlString))
	return
}
func main() {
	storj := storj.OpenProject("ixalang", "")
	echoInstance := echo.New()
	echoInstance.GET("/search/:query", func(c echo.Context) error {
		return search(c, storj)
	})
	echoInstance.Static("/", "./frontend/dist")
	echoInstance.Logger.Fatal(echoInstance.Start(":8080"))
}
