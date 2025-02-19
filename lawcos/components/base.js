// License: GPL3.0 or later
import * as L from "https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js";

// CSS used for all elements
const GLOBAL_CSS = L.css`
    * {
        box-sizing: border-box;

        font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        font-weight: 400;

        color: rgba(255, 255, 255, 0.87);

        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-text-size-adjust: 100%;
    }
`;
// User input components
export class LawcosSearch extends L.LitElement {
    static styles = [
        GLOBAL_CSS,
        L.css`
            input {
				background-color: rgb(35, 35, 40);
                margin: 1rem;
            }
        `
    ];
    static properties = {
        whatToSearch: {
            type: String, // What to search, e.g. "word" or "sentence"
            attribute: "what-to-search"
        },
        onInput: {
            type: Function // A function that takes in a string corresponding to the user input
        },
    };
    render() {
        return L.html`
            <input
                type="text"
                name="${this.whatToSearch}-search"
                placeholder="Input the ${this.whatToSearch} to search.."
                @input=${(e) => this.onInput(e.target.value)}
            />
        `
    }
}
export class LawcosDropdown extends L.LitElement {
    static styles = [
        GLOBAL_CSS,
        L.css`
            select {
				background-color: rgb(35, 35, 40);
                border-radius: 0.3rem;
            }
        `
    ];
    static properties = {
        whatToSelect: {
            type: String, // e.g. base-language or target-language
            attribute: "what-to-select"
        },
        listToSelectFrom: {
            type: Array // A list of unique IDs corresponding to each item which can be selected
        },
        getReadableSelectionName: {
            type: Function // A function to convert the unique ID of a selection to a user-readable string
        },
        onSelect: {
            type: Function // A function to inform the creator of the selector selection with the provided unique ID has been selected
        },
    };
    render() {
        if (!Array.isArray(this.listToSelectFrom) || this.listToSelectFrom.length === 0)
            return L.html`
                <select
                    name="${this.whatToSelect}-selector"
                    id="${this.whatToSelect}-selector"
                    @input=${(e) => this.onSelect(e.target.value)}
                ></select>
            `;
        return L.html`
            <select
                name="${this.whatToSelect}-selector"
                id="${this.whatToSelect}-selector"
                @input=${(e) => this.onSelect(e.target.value)}
            >
                ${L.repeat(
                    this.listToSelectFrom,
                    selectableString => selectableString,
                    selectableString => L.html`
                        <option value=${selectableString}>
                            ${this.getReadableSelectionName(selectableString)}
                        </option>
                    `
                )}
            </select>
        `;
    }
}
// Container components
export class LawcosPage extends L.LitElement {
    static styles = [
        GLOBAL_CSS,
        L.css`
            #page-container {
                width: 100vw;
                min-height: 100vh;
                height: max(100vh, auto);
                display: flex;
                flex-direction: column;
                place-items: center;
                text-align: center;
                background-color: rgb(16, 15, 17);
            }
            ::slotted(*) {
                width: 100vw;
                max-width: 100vw;
            }
            ::slotted( *[slot="main"] ) {
                flex-grow: 1;
            }
        `
    ];
    render() {
        return L.html`
            <div id="page-container">
                <slot name="top"></slot>
                <slot name="main"></slot>
                <slot name="bottom"></slot>
            </div>
        `
    }
}
export class LawcosCard extends L.LitElement {
    static styles = [
        GLOBAL_CSS,
        L.css`
            #clickable-container {
			    position: relative;
				width: min(90%, 400px);
				margin: 1em;
				padding: 0.5rem;
				border-radius: 1rem;
				background-color: rgb(35, 35, 40);
				cursor: pointer;
				transition: transform 0.2s, height 0.5s, width 0.5s, background 0.5s;
                /* Word wrap */
				white-space: normal !important;
				word-wrap: break-word !important;
				word-break:break-all !important;
				overflow: hidden !important;
            }
			/* Hover effects (zoom and gradient) */
			#clickable-container:not(.opened):hover {
				transform: scale(1.1);
			}
			#clickable-container::before {
				--size: 0;
				content: '';
				position: absolute;
				left: var(--hoverX);
				top: var(--hoverY);
				width: var(--size);
				height: var(--size);
				background: radial-gradient(circle closest-side, rgb(37, 33, 45), transparent);
				transform: translate(-50%, -50%);
				transition: width 0.2s ease, height 0.2s ease;
			}
        `
    ];
    render() {
        return L.html`
            <div id="clickable-container">
                <slot></slot>
            </div>
        `;
    }
    updated() {
        const clickableContainer = this.renderRoot.querySelector('#clickable-container');
        clickableContainer.onmousemove = (e) => {
            let rect = e.target.getBoundingClientRect();
            const hoverX = e.clientX - rect.left;
            const hoverY = e.clientY - rect.top;
            clickableContainer.style.setProperty('--hoverX', `${hoverX}px`)
            clickableContainer.style.setProperty('--hoverY', `${hoverY}px`)
        };
    }
}

customElements.define('lawcos-search', LawcosSearch);
customElements.define('lawcos-dropdown', LawcosDropdown);
customElements.define('lawcos-page', LawcosPage);
customElements.define('lawcos-card', LawcosCard);

export default L;