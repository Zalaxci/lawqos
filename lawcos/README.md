<h2 style="display: inline">
<b style="color: LightBlue">l</b>
<b style="color: LightCoral">a</b>
<b style="color: LightSalmon">w</b>
<b style="color: LightSlateGrey">c</b>
<b style="color: SteelBlue">o</b>
<b style="color: DimGrey">s:</b>
</h2>
<span style="margin-left: 0.5em; font-size: 1.1em"><b style="color: LightBlue">l</b>anguage <b style="color: LightCoral">a</b>cquisition <b style="color: LightSalmon">w</b>eb <b style="color: LightSlateGrey">c</b>omponents, <b style="color: SteelBlue">o</b>pen <b style="color: DimGrey">s</b>ource</span>

#### This is a set of LitJS web components that allow you to use lawqos' functionality in your own app. They are defined in the "components" folder, according to the following hierarchy:

1. **base.js**: This JS file contain the stylings, html & (only if necessary) minimal JavaScript needed to create elements like buttons, search boxes & containers that match the look & feel as well as the design philosophy of ***lawqos***.
    - e.g. the lawcos-search web component creates a search bar // html input with the appropriate styling & oninput event listener
2. **entry.js**: A LitJS component named "lawcos-entry" to display a dictionary entry (a word with a list of translationsm, stored as a JS object) with the ability to display wiktionary information & tatoeba example sentences by clicking it to expand it. Unlike *"base.js"*, this contains mostly JS functionality, while also implementing the API handler to get example sentences & wiktionary info.
3. **wikdict.js**: A LitJS component named "lawcos-wikdict" which takes in a word & selected language and displays a list of dictionary entries by querying an SQLite database stored *in-browser* using the modern Object Private FileSystem (OPFS) API. This uses the "lawcos-entry" component to display each entry, but adds functionality that also depends on access to a filesystem & modern browser APIs.
4. **wordstudy.js**: On top of the wikdict component, the "lawcos-wordstudy" component also displays a list of *Spaced Repetition* decks when no word is searched. It imlements SRS functionality using FreeSRS, card storage using SQLite & extends lawcos-wikdict to allow adding cards to the decks.

Finally, the *data/sqlite.js* file implements a generic way to open, download from a 3rd party API & query an in-browser SQLite database using @sqlite.org/sqlite-wasm.