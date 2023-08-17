package freedict_test

import (
	"IxaLang/logic/freedict"
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFromFile(t *testing.T) {
	assert.Panics(
		t,
		func() {
			freedict.FromFile("nonexistantlanguage", "./")
		},
		"FromFile function doesn't panic when told to read a non existant dictionary file",
	)
	assert.Len(
		t,
		freedict.FromFile("dummy_data", "./").FindElements("//entry"),
		3,
		"Dictionary interface doesn't have as many entries as the actual file",
	)
}
func TestFromFileOrOnline(t *testing.T) {
	assert.Panics(
		t,
		func() {
			freedict.FromFileOrOnline("nonexistantlanguage", "./", func(a, b string) {
				fmt.Println("This doesn't download anything", a, b)
			})
		},
		"FromFileOrOnline doesn't panic when told to open non existant dictionary and given no option to download it",
	)
}
func TestSearchString(t *testing.T) {
	assert.Panics(
		t,
		func() {
			freedict.SearchString(`
			<entry>
				<form>
					<orth>Dummy Data</orth>
				</form>
				<gramGrp>
					<pos>n</pos>
				</gramGrp>
				<sense>
					<cit type="trans">
						<quote>Dummy Translation</quote>
					</cit>
				</sense>
			</entry>
			<entry>
				<form>
					<orth>Lorem Ipsum</orth>
				</form>
				<gramGrp>
					<pos>n</pos>
				</gramGrp>
				<sense>
					<cit type="trans">
						<quote>Lorem Ipsum Translation</quote>
					</cit>
				</sense>
			`, "Dummy")
		},
		"SearchString doesn't panic when given invalid XML document (no closing tag for entry)",
	)
	assert.PanicsWithError(
		t,
		"User error at dictionary search: search query is smaller than the minimum of 3 bytes",
		func() {
			freedict.SearchString("<dictionary></dictionary>", "ab")
		},
		"SearchString doesn't panic when searching a word with a length less than the minimum",
	)
	assert.Equal(
		t,
		func() string {
			str, err := freedict.Search(freedict.FromFile("dummy_data", "./"), "Dummy Trans").WriteToString()
			if err != nil {
				t.Errorf("Error when stringyifing XML document returned from search function")
			}
			return strings.ReplaceAll(
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							str,
							" ",
							"",
						),
						"\n",
						"",
					),
					"\t",
					"",
				),
				"\r",
				"",
			)
		}(),
		`<dictionary><entry><form><orth>DummyTranslation</orth></form><gramGrp><pos>n</pos></gramGrp><sense><cit><quote>DummyData</quote></cit></sense></entry></dictionary>`,
	)
}
