// License: GPL3.0 or later
// This file creates some JavaScript functions to simplify listing, downloading & querying dictionaries independent of their source (wikdict or freedict) & JS runtime
// It also allows allows you to render the results (list of languages or words) to html or native widgets
export class DownloadedDictionaryTracker {
    MONOLINGUAL_DICTIONARIES_AVAILABLE = true;
    LANG_NAME_API = new Intl.DisplayNames(['en'], { type: 'language' });
    // VIRTUAL METHODS TO OVERRIDE:
    // API / Scraper methods
    // getDownloadURL(langCodeOrPair: String): String
    // getTargetLangsForEachBaseLang(): Promise<Object<String, Array<String>>>
    // Filesystem methods
    // listDownloaded(): Promise<Array<String>>
    // saveDictionary(langCodeOrPair: String, buff: ArrayBuffer): Promise<Bool>
    __dictionaryIsDownloaded;
    constructor() {
        this.__dictionaryIsDownloaded = {};
    }
    async createDictionaryList() {
        const targetLangsForEachBaseLang = await this.getTargetLangsForEachBaseLang();
        const downloadedDictionaries = await this.listDownloaded();
        for (let [baseLang, targetLangs] of Object.entries(targetLangsForEachBaseLang)) {
            if (
                !(typeof baseLang === "string") ||
                !(targetLangs instanceof Array) ||
                !targetLangs.every(targetLang => typeof targetLang === "string")
            ) throw new TypeError("expected an object with language codes as keys and arrays of language codes as values as the response of getTargetLangsForEachBaseLang's promise");
            // Each member of the class' ____dictionaryIsDownloaded property has the dictionary (base) language as the key with 2 properties:
            this.__dictionaryIsDownloaded[baseLang] = {
                // a boolean (is the monolingual dictionary corresponding to this language downloaded?)
                isDownloaded: downloadedDictionaries.includes(baseLang),
                // and an object with boolean values (is the bilingual dictionary with translations from base to target language downloaded?)
                targetLangIsDownloaded: {},
            };
            // For each available target language, consider the corresponding dictionary is downloaded if the "downloaded dictionary" lists includes the {base}-{target} lang. pair
            for (let targetLang of targetLangs)
                this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded[targetLang] = downloadedDictionaries.includes(`${baseLang}-${targetLang}`);
        }
    }
    listBaseLanguages(startingWith = "") {
        if (startingWith.length > 0)
            return Object.keys(this.__dictionaryIsDownloaded).filter(baseLang => baseLang.startsWith(startingWith));
        return Object.keys(this.__dictionaryIsDownloaded);
    }
    listTargetLanguages(baseLang = "") {
        return Object.keys(this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded);
    }
    getReadableLangName(lang = "") {
        return `${this.LANG_NAME_API.of(lang)} (${lang})`;
    }
    suggestLanguagePairs(baseLang = "", targetLangStartsWith = "") {
        if (targetLangStartsWith.length > 0)
                return this.listTargetLanguages(baseLang).filter(tl => tl.startsWith(targetLangStartsWith)).map(tl => `...to ${this.LANG_NAME_API.of(tl)} (${baseLang}-${tl})`);
        if (this.MONOLINGUAL_DICTIONARIES_AVAILABLE)
                return [
                    `${this.getReadableLangName(baseLang)} (Monolingual dictionary)`,
                    ...this.listTargetLanguages(baseLang).map(tl => `...to ${this.LANG_NAME_API.of(tl)} (${baseLang}-${tl})`)
                ];
        return this.listTargetLanguages(baseLang).map(tl => `...to ${this.LANG_NAME_API.of(tl)} (${baseLang}-${tl})`);
    }
    getDownloadInfo(baseLang = "", targetLang = "") {
        return [
            this.getReadableLangName(baseLang) + (targetLang.length === 0? "" : ` to ${this.getReadableLangName(targetLang)}`) + " Dictionary",
            "No description is available. To download & automatically search the dictionary, click the following button, and wait. DO NOT TERMINATE THE APP OR BROWSER!",
        ];
    }
    getDictionaryInfo(langQuery = "") {
        // If the provided string is present as a key in this.__dictionaryIsDownloaded, it's a lang code corresponding to a (monolingual) dictionary
        if (langQuery.length > 0 && this.__dictionaryIsDownloaded.hasOwnProperty(langQuery)) {
            if (this.MONOLINGUAL_DICTIONARIES_AVAILABLE)
                return {
                    dictionaryExists: true,
                    isBilingual: false,
                    suggestionsTitle: `Translate from ${this.getReadableLangName(langQuery)} to...`,
                    getSuggestions: () => this.suggestLanguagePairs(langQuery),
                    getDownloadInfo: () => this.getDownloadInfo(langQuery),
                    isDownloaded: () => this.__dictionaryIsDownloaded[langQuery].isDownloaded === true,
                    download: async () => {
                        const resp = await fetch(this.getDownloadURL(langQuery));
                        const buff = await resp.arrayBuffer();
                        return this.__dictionaryIsDownloaded[langQuery].isDownloaded = await this.saveDictionary(langQuery, buff);
                    }
                };
            return {
                dictionaryExists: false,
                suggestionsTitle: `Translate from ${this.getReadableLangName(langQuery)} to...`,
                getSuggestions: () => this.suggestLanguagePairs(langQuery),
            };
        }
        // Otherwise, if it's not a lang pair (contains no dash), there's no such dictionary - suggestions are dictionaries' lang codes which start from provided lang code
        if (!langQuery.includes("-")) return {
            dictionaryExists: false,
            suggestionsTitle: "Translate from...",
            getSuggestions: () => this.listBaseLanguages(langQuery).map((baseLang) => this.getReadableLangName(baseLang)),
        };
        // If it can be split up to a base & target lang & this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded[targetLang] exists it's a bilingual dictionary's lang pair
        const [ baseLang, targetLang ] = langQuery.split("-");
        if (this.__dictionaryIsDownloaded.hasOwnProperty(baseLang) && this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded.hasOwnProperty(targetLang))
            return {
                dictionaryExists: true,
                isBilingual: true,
                suggestionsTitle: "Dictionary selected:",
                getSuggestions: () => [
                    `${this.getReadableLangName(baseLang)} to ${this.getReadableLangName(targetLang)}`
                ],
                getDownloadInfo: () => this.getDownloadInfo(baseLang, targetLang),
                isDownloaded: () => this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded[targetLang] === true,
                download: async () => {
                    const resp = await fetch(this.getDownloadURL(langQuery));
                    const buff = await resp.arrayBuffer();
                    return this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded[targetLang] = await this.saveDictionary(langQuery, buff);
                }
            };
        // If the base lang has a corresponding dictionary but the provided language pair doesn't, suggest target languages
        if (this.__dictionaryIsDownloaded.hasOwnProperty(baseLang)) return {
            dictionaryExists: false,
            suggestionsTitle: `Translate from ${this.getReadableLangName(baseLang)} to...`,
            getSuggestions: () => this.suggestLanguagePairs(baseLang, targetLang),
        };
        // Otherwise, there's no suggestions - just return false :(
        return {
            dictionaryExists: false,
            suggestionsTitle: `No dictionary has identifying language code that's equal to or starts with: ${langQuery}`
        };
    }
}
export class DictionarySelectorAndSearcher extends DownloadedDictionaryTracker {
    ENCODER = new TextEncoder();
    MIN_WORD_BYTES = 3;
    // VIRTUAL METHODS TO OVERRIDE:
    // openDictionary(lang: String): Promise
    // searchDictionary(wordOrPhrase: String, isBilingual: bool): Promise<Array>
    __selectedLang = "";
    __prevSearchResults = {};
    async searchAndSaveResults(wordOrPhrase = "") {
        this.__prevSearchResults[wordOrPhrase] = await this.searchDictionary(wordOrPhrase);
        return this.__prevSearchResults[wordOrPhrase];
    }
    async query(userInput = "") {
        // Ensure dictionary list is created
        let availableBaseLangs = this.listBaseLanguages();
        if (availableBaseLangs.length === 0) {
            await this.createDictionaryList();
            availableBaseLangs = this.listBaseLanguages();
        }
        // Remove whitespaces from the start
        const trimmedUserInput = userInput.trimStart();
        // If user typed no space, user input is a language code - return dictionary info (dictionaryExists & suggestions)
        if (!trimmedUserInput.includes(" ")) {
            const { suggestionsTitle, getSuggestions } = this.getDictionaryInfo(trimmedUserInput);
            return { suggestionsTitle, getSuggestions: getSuggestions instanceof Function? getSuggestions : () => [] };
        };
        const [ selectedLanguage, ...wordsToSearch ] = trimmedUserInput.split(" ");
        const wordOrPhrase = wordsToSearch.join(" ");
        const { dictionaryExists, isBilingual, getDownloadInfo, isDownloaded, download } = this.getDictionaryInfo(selectedLanguage);
        if (!dictionaryExists)
            throw new Error(`dictionary for language code or language pair ${selectedLanguage} does not exist`);
        if (!(getDownloadInfo instanceof Function) || !(isDownloaded instanceof Function) || !(download instanceof Function))
            throw new TypeError("the function to get dictionary download info, check if dictionary is downloaded or download it if not are not present - this is probably a programming error");
        if (!isDownloaded()) return { getDownloadInfo, download };
        if (this.ENCODER.encode(wordOrPhrase).byteLength < this.MIN_WORD_BYTES)
            throw new Error(`expected a word to search that is at least ${this.MIN_WORD_BYTES} bytes long`);
        if (selectedLanguage !== this.__selectedLang) {
            await this.openDictionary(selectedLanguage, isBilingual);
            this.__prevSearchResults = {};
            this.__selectedLang = selectedLanguage;
        }
        return {
            suggestionsTitle: "Previously searched words:",
            getSuggestions: () => Object.keys(this.__prevSearchResults).filter(
                previouslySearchedWord => previouslySearchedWord.startsWith(wordOrPhrase)
            ),
            searchResults: this.__prevSearchResults[wordOrPhrase] || await this.searchAndSaveResults(wordOrPhrase),
        };
    }
}
export class DictionaryResultRenderer {
    // VIRTUAL METHODS TO OVERRIDE:
    // renderAutocomplete(suggestions: Array): NativeWidgetOrHTML
    // renderSearchResults(suggestions: Array): NativeWidgetOrHTML
    // renderDictionaryDownloader(getDownloadInfo: Function<[ Title: String, Description: String ]>, download: Function<Promise<bool>>, triggerAppRerender: Function): NativeWidgetOrHTML
    // renderCombined(autoCompleteWidget: NativeWidgetOrHTML, searchResultsOrDefaultWidget: NativeWidgetOrHTML): NativeWidgetOrHTML
    renderDictionary(queryResults = {}, triggerAppRerender = () => {}, defaultWidget = null) {
        if (queryResults.hasOwnProperty("download"))
            return this.renderDictionaryDownloader(queryResults.getDownloadInfo, queryResults.download, triggerAppRerender);
        return this.renderCombined(
            this.renderAutocomplete(queryResults.suggestionsTitle, queryResults.getSuggestions),
            queryResults.hasOwnProperty("searchResults")? this.renderSearchResults(queryResults.searchResults) : defaultWidget,
        );
    }
}