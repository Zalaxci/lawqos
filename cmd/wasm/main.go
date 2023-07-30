package main

import (
	"IxaLang/logic/freedict"
	"syscall/js"
)

func main() {
	wait := make(chan struct{}, 0)
	js.Global().Set("searchXMLString", js.FuncOf(searchXMLString))
	<-wait
}

func searchXMLString(this js.Value, args []js.Value) interface{} {
	return freedict.SearchString(args[0].String(), args[1].String())
}
