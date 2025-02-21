// License: GPL3.0 or later
import L from "./entry.js";
import { Task } from 'https://cdn.jsdelivr.net/npm/@lit/task@1/+esm'
import { DictionaryResultRenderer, DictionarySelectorAndSearcher } from "../../util/dict.js";
import { createAsyncWorker } from "../../util/workers.js";

class LitDictionaryRenderer extends DictionaryResultRenderer {
    renderAutocomplete(suggestionsTitle, getSuggestions) {
        // TODO: Create suggestion element
        // return suggestions.map(suggestion => L.html`<lawcos-textbox .text=${suggestion}></lawcos-textbox>`);
        return L.html`
            <div id="autocomplete">
                <h2>${suggestionsTitle}</h2>
                ${getSuggestions().map(suggestion => L.html`<button>${suggestion}</button>`)}
            </div>
        `;
    }
    renderSearchResults(searchResults = []) {
        return L.html`
            <div id="entries">
                ${searchResults.map(searchResult => L.html`
                    <lawcos-entry .word=${searchResult.word} .translations=${searchResult.translations}></lawcos-entry>
                `)}
            </div>
        `;
    }
    renderDictionaryDownloader(getDownloadInfo, downloadDictionary, triggerAppRerender) {
        async function downloadAndRerender() {
            const success = await downloadDictionary();
            if (success) triggerAppRerender();
        }
        const [ title, description ] = getDownloadInfo();
        return L.html`
            <div id="downloader">
                <h2>${title}</h2>
                <p>${description}</p>
                <button @click=${downloadAndRerender}>Download!</button>
            </div>
        `;
    }
    renderCombined(autoCompleteHTML, searchResultsOrDefaultWidget) {
        return L.html`${autoCompleteHTML}${searchResultsOrDefaultWidget}`;
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
        if (!this.postMsgAndAwaitResponse) {
            let basePageURL = new URL(location.href).origin;
            if (basePageURL.includes("github.io")) basePageURL += "/lawqos";
            this.postMsgAndAwaitResponse = await createAsyncWorker(basePageURL + "/util/workers/sqlite.js");
        }
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
        button {
            background-color: steelblue;
            color: white;
            padding: 0.2rem;
            margin: 0.2rem;
            border: 0;
            border-radius: 1rem;
            font-size: 1.2rem;
            font-weight: bold;
        }
        #error {
            color: orange;
        }
        #downloader, #autocomlete, #entries {
            margin-top: 10px;
        }
        #autocomplete {
            line-height: 2.0rem;
        }
        #entries {
			max-width: 1350px;
			margin-left: auto;
			margin-right: auto;
			display: flex;
			flex-wrap: wrap;
			place-content: center;
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
            error: err => L.html`<h3 id="error">Error(s): ${err}</h3>`,
            complete: queryResults => RENDERER.renderDictionary(
                queryResults,
                () => this.__databaseTask.run([ this.userInput ]),
                L.html`<slot></slot>`,
            ),
        });
    }
}

customElements.define('lawcos-wikdict', LawcosWikdict);

export * from './entry.js';
export default L;