// License: GPL3.0 or later
import L from "./entry.js";
import { Task } from 'https://cdn.jsdelivr.net/npm/@lit/task@1/+esm'
import { DictionaryResultRenderer, DictionarySelectorAndSearcher } from "../../util/dict.js";
import { createAsyncWorker } from "../../util/workers.js";

class LitDictionaryRenderer extends DictionaryResultRenderer {
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
    renderDictionaryDownloader(downloadDictionary, triggerAppRerender) {
        // TODO: Improve this
        async function downloadAndRerender() {
            const success = await downloadDictionary();
            if (success) triggerAppRerender();
        }
        return L.html`<div id="downloader"><button @click=${downloadAndRerender}>Download!</button></div>`;
    }
    renderCombined(autoCompleteHTML, downloaderOrSearchResultsHTML) {
        return L.html`
            <div id="entries-container">
                <div id="autocomplete">${autoCompleteHTML}</div>
                ${downloaderOrSearchResultsHTML}
            </div>
        `;
    }
}
const RENDERER = new LitDictionaryRenderer();
class WikdictSelectorAndSearcher extends DictionarySelectorAndSearcher {
    SCRAPER_URL = "https://wikdict.zalaxci.workers.dev/";
    postMsgAndAwaitResponse;
    getDownloadURL(langCodeOrPair = "") {
        return this.SCRAPER_URL + langCodeOrPair + ".sqlite3";
    }
    async getTargetLangsForEachBaseLang() {
        if (!this.postMsgAndAwaitResponse) this.postMsgAndAwaitResponse = await createAsyncWorker("../../util/workers/sqlite.js");
        return fetch(this.SCRAPER_URL).then(resp => resp.json());
    }
    async listDownloaded() {
        return this.postMsgAndAwaitResponse("l", "/wikdict").then(
            files => files.map(
                fileStr => fileStr.replace(".sqlite3", "").replace("/", "")
            )
        );
    }
    async saveDictionary(lang, buff) {
        return await this.postMsgAndAwaitResponse("s", [`/${lang}.sqlite3`, buff]) > 0;
    }
    async openDictionary(lang) {
        await this.postMsgAndAwaitResponse("o", `/${lang}.sqlite3`);
    }
    async searchDictionary(wordOrPhrase = "") {
        const dbResults = await this.postMsgAndAwaitResponse("q", [
            "select * from simple_translation where written_rep like '%' || ? || '%' or trans_list like '%' || ? || '%';",
            wordOrPhrase,
            wordOrPhrase,
        ]);
        return dbResults.map(
            ({ written_rep, trans_list, rel_importance }) => ({
                word: written_rep,
                translations: trans_list.split(" | "),
                significance: rel_importance,
            })
        ).sort(({ word: wordA, significance: significanceA }, { word: wordB, significance: significanceB}) => {
            if (wordA.length < wordB.length) return -1;
            if (wordA.length > wordB.length) return 1;
            if (significanceA < significanceB) return 1;
            if (significanceA > significanceB) return -1;
            return 0;
        });
    }
}
const WD = new WikdictSelectorAndSearcher();
export class LawcosWikdict extends L.LitElement {
    __databaseTask = new Task(this, ([ userInput ]) => WD.query(userInput), () => [ this.userInput ]);
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
    render() {
        return this.__databaseTask.render({
            pending: () => L.html`<h2>Loading...</h2>`,
            error: err => L.html`<h3 class="error">Error(s): ${err}</h3>`,
            complete: queryResults => RENDERER.renderDictionary(queryResults, () => this.__databaseTask.run([ this.userInput ])),
        });
    }
}

customElements.define('lawcos-wikdict', LawcosWikdict);

export * from './entry.js';
export default L;