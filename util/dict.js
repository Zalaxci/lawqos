// License: GPL3.0 or later
// This file creates some JavaScript functions to simplify listing, downloading & querying dictionaries independent of their source (wikdict or freedict) & JS runtime
// It also allows allows you to render the results (list of languages or words) to html or native widgets

export class DownloadedDictionaryTracker {
    // ! IMPLEMENTED BY THE CLASS INHERENTING THIS !
    MONOLINGUAL_DICTIONARIES_AVAILABLE = true;
    // The URL to download dictionaries from, with "%s" as the placeholder for the language code or pair
    DOWNLOAD_URL_FORMAT = "";
    // API / Scraper method to retrieve an object with language codes as keys and arrays of language codes as values
    async getTargetLangsForEachBaseLang() {
        return ({});
    }
    // Method to list language codes or language pairs (strings) corresponding to downloaded dictionaries
    async listDownloaded() {
        return [];
    }

    __dictionaryIsDownloaded = {}
    constructor() {
        this.__dictionaryIsDownloaded = {}
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
    listLanguagePairs(baseLang = "") {
        if (!this.MONOLINGUAL_DICTIONARIES_AVAILABLE)
            return this.listTargetLanguages(baseLang).map(targetLang => `${baseLang}-${targetLang}`);
        return [ baseLang, ...this.listTargetLanguages(baseLang).map(targetLang => `${baseLang}-${targetLang}`) ];
    }
    getDictionaryInfo(langQuery = "") {
        const downloadURL = this.DOWNLOAD_URL_FORMAT.replace("%s", langQuery);
        // If the provided string is present as a key in this.__dictionaryIsDownloaded, it's a lang code corresponding to a (monolingual) dictionary
        if (langQuery.length > 0 && this.__dictionaryIsDownloaded.hasOwnProperty(langQuery)) {
            if (this.MONOLINGUAL_DICTIONARIES_AVAILABLE)
                return {
                    dictionaryExists: true,
                    isBilingual: false,
                    suggestLanguages: () => this.listLanguagePairs(langQuery),
                    isDownloaded: () => this.__dictionaryIsDownloaded[langQuery].isDownloaded === true,
                    download: async (saveBufferToFS = (buff = new ArrayBuffer()) => false) => {
                        this.__dictionaryIsDownloaded[langQuery].isDownloaded = await fetch(downloadURL).then(resp => resp.arrayBuffer()).then(saveBufferToFS);
                    },
                };
            return {
                dictionaryExists: false,
                suggestLanguages: () => this.listLanguagePairs(langQuery),
            };
        }
        // Otherwise, if it's not a lang pair (contains no dash), there's no such dictionary - suggestions are dictionaries' lang codes which start from provided lang code
        if (!langQuery.includes("-")) return {
            dictionaryExists: false,
            suggestLanguages: this.listBaseLanguages.bind(this, langQuery),
        };
        // If it can be split up to a base & target lang & this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded[targetLang] exists it's a bilingual dictionary's lang pair
        const [ baseLang, targetLang ] = langQuery.split("-");
        if (this.__dictionaryIsDownloaded.hasOwnProperty(baseLang) && this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded.hasOwnProperty(targetLang))
            return {
                dictionaryExists: true,
                isBilingual: true,
                suggestLanguages: () => [ langQuery ],
                isDownloaded: () => this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded[targetLang] === true,
                download: async (saveBufferToFS = (buff = new ArrayBuffer()) => false) => {
                    this.__dictionaryIsDownloaded[baseLang].targetLangIsDownloaded[targetLang] = await fetch(downloadURL).then(resp => resp.arrayBuffer()).then(saveBufferToFS);
                }
            };
        // If the base lang has a corresponding dictionary but the provided language pair doesn't, suggest target languages
        if (this.__dictionaryIsDownloaded.hasOwnProperty(baseLang)) return {
            dictionaryExists: false,
            suggestLanguages: () => this.listLanguagePairs(baseLang).filter(langPair => langPair.startsWith(langQuery)),
        };
        // Otherwise, there's no suggestions - just return false :(
        return { dictionaryExists: false };
    }
}
export class DictionarySelectorAndSearcher extends DownloadedDictionaryTracker {
    // ! IMPLEMENTED BY THE CLASS INHERENTING THIS !
    MINIMUM_WORD_BYTES = 3;
    // Filesystem / DB implementation and dictionary format dependent methods to list downloaded dictionaries, save a dictionary (array buffer) & search a word or phrase to get results
    async saveDictionary(lang = "", buff = new ArrayBuffer()) {
        return false;
    }
    async openDictionary(lang = "", isBilingual = true) {}
    async searchDictionary(wordOrPhrase = "", isBilingual = true) {
        return [];
    }

    __selectedLang = "";
    __prevSearchResults = {};
    async query(userInput = "") {
        // Ensure dictionary list is created
        let availableBaseLangs = this.listBaseLanguages();
        if (availableBaseLangs.length === 0) {
            await this.createDictionaryList()
            availableBaseLangs = this.listBaseLanguages();
        }
        // Remove whitespaces from the start and end
        const trimmedUserInput = userInput.trim();
        // If user typed no space, user input is a language code - return dictionary info (dictionaryExists & suggestions)
        if (!trimmedUserInput.includes(" ")) {
            const { dictionaryExists, suggestLanguages } = this.getDictionaryInfo(trimmedUserInput);
            return {
                dictionaryExists,
                suggestions: suggestLanguages instanceof Function? suggestLanguages() : [],
            };
        };
        const [ selectedLanguage, ...wordsToSearch ] = trimmedUserInput.split(" ");
        const wordOrPhrase = wordsToSearch.join(" ");
        const { dictionaryExists, isBilingual, isDownloaded, download } = this.getDictionaryInfo(selectedLanguage);
        if (!dictionaryExists)
            throw new Error(`dictionary for language code or language pair ${selectedLanguage} does not exist`);
        if (!(isDownloaded instanceof Function) || !(download instanceof Function))
            throw new TypeError("the functions to check if dictionary is downloaded & download it if not are not present - this is probably a programming error")
        if (!isDownloaded()) return {
            dictionaryExists,
            suggestions: [],
            downloadDictionary: () => download((buff) => this.saveDictionary(selectedLanguage, buff)),
        };
        if (wordOrPhrase.length < this.MINIMUM_WORD_BYTES)
            throw new Error(`expected a word to search that is at least ${this.MINIMUM_WORD_BYTES} long`);
        if (selectedLanguage !== this.__selectedLang) {
            await this.openDictionary(selectedLanguage, isBilingual);
            this.__prevSearchResults = {};
            this.__selectedLang = selectedLanguage;
        }
        return {
            dictionaryExists,
            suggestions: Object.keys(this.__prevSearchResults).filter(
                previouslySearchedWord => previouslySearchedWord.startsWith(wordOrPhrase)
            ),
            searchResults: this.__prevSearchResults[wordOrPhrase] || (this.__prevSearchResults[wordOrPhrase] = await this.searchDictionary(wordOrPhrase, isBilingual)),
        };
    }
}
export class DictionaryResultRenderer {
    // ! IMPLEMENTED BY THE CLASS INHERENTING THIS !
    renderAutocomplete(suggestions = []) {}
    renderSearchResults(searchResults = []) {}
    renderDictionaryDownloader(downloadDictionary = async () => {}) {}
    renderCombined(autoCompleteWidget, downloaderOrSearchResultsWidget) {}

    renderDictionary(queryResults) {
        console.log(queryResults);
        if (queryResults.hasOwnProperty("searchResults")) return this.renderCombined(
            this.renderAutocomplete(queryResults.suggestions),
            this.renderSearchResults(queryResults.searchResults),
        )
        if (queryResults.hasOwnProperty("downloadDictionary")) return this.renderCombined(
            this.renderAutocomplete(queryResults.suggestions),
            this.renderDictionaryDownloader(queryResults.downloadDictionary),
        )
        return this.renderAutocomplete(queryResults.suggestions);
    }
}