package main

import (
	"IxaLang/logic"

	"github.com/labstack/echo/v4"
)

func search(c echo.Context) error {
	freeDictFile := logic.FreeDictFile("ell-jpn")
	finalDocument := logic.FreeDictSearch(freeDictFile, c.Param("query"))
	xmlString, error := finalDocument.WriteToString()
	if error != nil {
		return error
	}
	return c.XMLBlob(200, []byte(xmlString))
}
func main() {
	echoInstance := echo.New()
	echoInstance.GET("/search/:query", search)
	echoInstance.Static("/", "./frontend/dist")
	echoInstance.Logger.Fatal(echoInstance.Start(":8080"))
}
