package main

import (
	"IxaLang/logic/freedict"

	"github.com/labstack/echo/v4"
)

func search(c echo.Context) error {
	finalDocument := freedict.SearchFile("ell-jpn", c.Param("query"))
	if len(finalDocument.ChildElements()) == 0 {
		return c.XMLBlob(500, []byte("<error>The dictionary search function returned a blank document</error>"))
	}
	xmlString, error := finalDocument.WriteToString()
	if error != nil {
		return c.XMLBlob(500, []byte("<error>"+error.Error()+"</error>"))
	}
	if finalDocument.ChildElements()[0].Tag == "error" {
		return c.XMLBlob(422, []byte(xmlString))
	}
	return c.XMLBlob(200, []byte(xmlString))
}
func main() {
	echoInstance := echo.New()
	echoInstance.GET("/search/:query", search)
	echoInstance.Static("/", "./frontend/dist")
	echoInstance.Logger.Fatal(echoInstance.Start(":8080"))
}
