// License: GPL3.0 or later
import L from "./entry.js";
import { Task } from 'https://cdn.jsdelivr.net/npm/@lit/task@1/+esm'
import { DictionaryResultRenderer, DictionarySelectorAndSearcher } from "../../util/dict.js";
import { createAsyncWorker } from "../../util/workers.js";

class WikdictSelectorAndSearcher extends DictionarySelectorAndSearcher {
    LIST_URL = "https://wikdict.zalaxci.workers.dev";
    DOWNLOAD_URL_FORMAT = "https://wikdict.zalaxci.workers.dev/%s.sqlite3";
    postMsgAndAwaitResponse;
    async getTargetLangsForEachBaseLang() {
        if (!this.postMsgAndAwaitResponse) this.postMsgAndAwaitResponse = await createAsyncWorker("../../util/workers/sqlite.js");
        return fetch(this.LIST_URL).then(resp => resp.json());
    }
    async listDownloaded() {
        return await this.postMsgAndAwaitResponse("list", "/wikdict").then(
            files => files.map(
                fileStr => fileStr.replace(".sqlite3", "").replace("/", "")
            )
        );
    }
    async saveDictionary(lang, buff) {
        await this.postMsgAndAwaitResponse("download", [`/${lang}.sqlite3`, buff]);
    }
    async openDictionary(lang, isBilingual) {
        await this.postMsgAndAwaitResponse("open", `/${lang}.sqlite3`);
    }
    async searchDictionary(wordOrPhrase = "") {
        await this.postMsgAndAwaitResponse("prepare", "select * from simple_translation where written_rep like '%' || ? || '%' or trans_list like '%' || ? || '%';");
        return this.postMsgAndAwaitResponse("query", [wordOrPhrase, wordOrPhrase]).then(results => results.map(
            ({ written_rep, trans_list, rel_importance }) => ({
                word: written_rep,
                translations: trans_list.split(" | "),
                significance: rel_importance,
            })
        ));
    }
}
class WikdictRenderer extends DictionaryResultRenderer {
    renderAutocomplete(suggestions = []) {
        // TODO: Create suggestion element
        // return suggestions.map(suggestion => L.html`<lawcos-textbox .text=${suggestion}></lawcos-textbox>`);
        return suggestions.map(suggestion => L.html`<span>${suggestion}</span>`);
    }
    renderSearchResults(searchResults = []) {
        return searchResults.map(searchResult => L.html`
            <lawcos-entry .word=${searchResult.word} .translations=${searchResult.translations}></lawcos-entry>
        `);
    }
    renderDictionaryDownloader(downloadDictionary) {
        // TODO: Improve this
        return L.html`<button @click=${downloadDictionary}>Download!</button>`;
    }
    renderCombined(autoCompleteWidget, downloaderOrSearchResultsWidget) {
        return L.html`
            <div id="entries-container">
                ${autoCompleteWidget}
                ${downloaderOrSearchResultsWidget}
            </div>
        `;
    }
}
export class LawcosWikdict extends L.LitElement {
    __searcher;
    __renderer;
    __databaseTask;
    static styles = L.css`
        #entries-container {
			max-width: 1350px;
			margin-left: auto;
			margin-right: auto;
			display: flex;
			flex-wrap: wrap;
			place-content: center;
		}
        span {
            background-color: darkslategrey;
            padding: 0.2em;
            margin: 0.3em;
            border-radius: 0.5em;
        }
        .error {
            color: orange;
        }
    `;
    static properties = {
        userInput: {
            type: String,
            attribute: "user-input"
        },
    }
    constructor() {
        super();
        this.__searcher = new WikdictSelectorAndSearcher();
        this.__renderer = new WikdictRenderer();
        this.__databaseTask = new Task(this, ([ userInput ]) => this.__searcher.query(userInput), () => [ this.userInput ]);
    }
    render() {
        return this.__databaseTask.render({
            pending: () => L.html`<h2>Loading...</h2>`,
            error: err => L.html`<h3 class="error">Error(s): ${err}</h3>`,
            complete: (queryResults) => this.__renderer.renderDictionary(queryResults)
        })
    }
}

customElements.define('lawcos-wikdict', LawcosWikdict);

export * from './entry.js';
export default L;