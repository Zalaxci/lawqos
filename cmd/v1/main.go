package main

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"github.com/zalaxci/ixalang/pkg/freedict"
	"github.com/zalaxci/ixalang/pkg/storj"
	"github.com/zalaxci/ixalang/pkg/tatoeba"

	"github.com/labstack/echo/v4"
)

// Run some commands at build time to bundle the JavaScript inside the go binary
// Don't use a javascript bundler so we don't need NodeJS installed in the backend
//go:generate sh update-static.sh
//go:embed static-files
var embeddedFolders embed.FS

func words(c echo.Context) error {
	results := freedict.SearchFreedictDictionary(c.Param("lang"), 5, c.Param("query"))
	if len(results.Errors) > 0 {
		return c.JSONPretty(500, results, "\t")
	}
	return c.JSONPretty(200, results, "\t")
}
func sentences(c echo.Context) (serverError error) {
	languagePair := strings.Split(c.Param("lang"), "-")
	baseLang, targetLang := languagePair[0], languagePair[1]
	return c.XMLBlob(200, tatoeba.GetXmlIncludingErrors(baseLang, targetLang, c.Param("query"), c.Param("page")))
}
func dictionaryLanguages(c echo.Context, storj storj.StorjWrapper) (serverError error) {
	languages := make(map[string][]string)
	languages["ell"] = []string{
		"eng",
		"jpn",
	}
	// storj.ForEachObject(
	// 	func(obj *uplink.Object) {
	// 		dictonaryName := obj.Key
	// 		languagePair := strings.Split(
	// 			strings.Split(dictonaryName, ".")[0],
	// 			"-",
	// 		)
	// 		baseLang, targetLang := languagePair[0], languagePair[1]
	// 		if targetLangsList, baseLangRegistered := languages[baseLang]; baseLangRegistered {
	// 			languages[baseLang] = append(targetLangsList, targetLang)
	// 		} else {
	// 			languages[baseLang] = []string{targetLang}
	// 		}
	// 	},
	// )
	return c.JSONPretty(200, languages, "\t")
}

func main() {
	storj := storj.OpenProject("ixalang")

	// Create echo server
	echoInstance := echo.New()

	// Go API
	echoInstance.GET("/get/words/:lang/:query", func(c echo.Context) error {
		return words(c)
	})
	echoInstance.GET("/get/sentences/:lang/:query/:page", func(c echo.Context) error {
		return sentences(c)
	})
	echoInstance.GET("/get/dictionary-languages", func(c echo.Context) error {
		return dictionaryLanguages(c, storj)
	})

	// Change root directory to static-files directory
	staticFilesFolder, err := fs.Sub(embeddedFolders, "static-files")
	if err != nil {
		panic(err)
	}

	// Serve index.html & static files
	staticFileHandler := http.FileServer(
		http.FS(staticFilesFolder),
	)
	echoInstance.GET("/", echo.WrapHandler(
		staticFileHandler,
	))
	echoInstance.GET("/static/*", echo.WrapHandler(
		http.StripPrefix("/static/", staticFileHandler),
	))

	// Start server & log errors
	echoInstance.Logger.Fatal(echoInstance.Start(":8080"))
}
