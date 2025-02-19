// License: GPL3.0 or later
import L, * as Base from "./base.js";

export class LawcosEntry extends Base.LawcosCard {
    static get styles() {
        return [
            ...super.styles,
            L.css`
                #clickable-container ruby {
                    cursor: text !important;
                }
                #clickable-container h2 {
                    background: rgb(95, 80, 40);
                    text-transform: capitalize;
                }
                #clickable-container h2::after {
                    content: ':';
                }
                #clickable-container ol {
                    padding: 0;
                    margin: 0;
                    list-style-position: inside;
                }
            `
        ];
    }
    static properties = {
        word: {
            type: String,
            attribute: "word"
        },
        getPronounciation: {
            type: Function, // Get the pronounciation of the word or any of the translations
        },
        translations: {
            type: Array, // An array of words as strings
            attribute: "translations"
        },
    };
    constructor() {
        super();
        this.getPronounciation = () => "";
    }
    render() {
        return L.html`
            <div id="clickable-container">
                <div class="header">
                    <ruby>
                        <h2>${this.word}</h2><rt>${this.getPronounciation(this.word) || ''}</rt>
                    </ruby>
                </div>
                <ol>
                    ${this.translations.map(translation => L.html`
                        <li>
                            <ruby>${translation}<rt>${this.getPronounciation(translation) || ""}</rt></ruby>
                        </li>
                    `)}
                </ol>
            </div>
        `;
    }
}

customElements.define('lawcos-entry', LawcosEntry);

export * from './base.js';
export default L;