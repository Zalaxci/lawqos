package main

import (
	"IxaLang/logic/freedict"
	"IxaLang/logic/storj"
	"strings"

	"github.com/labstack/echo/v4"
	"storj.io/uplink"
)

func search(c echo.Context) (serverError error) {
	defer func() {
		if r := recover(); r != nil {
			switch err := r.(type) {
			case freedict.UserError:
				serverError = c.XMLBlob(422, []byte("<error> User error: "+err.Error()+"</error>"))
			case error:
				serverError = c.XMLBlob(500, []byte("<error> Program error: "+err.Error()+"</error>"))
			default:
				serverError = c.XMLBlob(500, []byte("<error>Unknown error :(</error>"))
			}
		}
	}()
	xmlString := freedict.SearchFreedictDictionary(c.Param("lang"), 6, c.Param("query"))
	serverError = c.XMLBlob(200, []byte(xmlString))
	return
}
func list(c echo.Context, storj storj.StorjWrapper) (serverError error) {
	languages := make(map[string][]string)
	storj.ForEachObject(
		func(obj *uplink.Object) {
			println(obj.Key)
			dictonaryName := obj.Key
			languagePair := strings.Split(
				strings.Split(dictonaryName, ".")[0],
				"-",
			)
			baseLang, targetLang := languagePair[0], languagePair[1]
			if targetLangsList, baseLangRegistered := languages[baseLang]; baseLangRegistered {
				languages[baseLang] = append(targetLangsList, targetLang)
			} else {
				languages[baseLang] = []string{targetLang}
			}
		},
	)
	return c.JSONPretty(200, languages, "\t")
}

func main() {
	storj := storj.OpenProject("ixalang")
	echoInstance := echo.New()
	echoInstance.GET("/search/:lang/:query", func(c echo.Context) error {
		return search(c)
	})
	echoInstance.GET("/list", func(c echo.Context) error {
		return list(c, storj)
	})
	echoInstance.Static("/", "./public")
	echoInstance.Logger.Fatal(echoInstance.Start(":8080"))
}
