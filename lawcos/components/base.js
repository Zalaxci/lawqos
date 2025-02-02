import { LitElement, css, html, repeat } from "https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js";

const globalStyling = css`
    * {
        box-sizing: border-box;

        font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        font-weight: 400;

        color-scheme: light dark;
        color: rgba(255, 255, 255, 0.87);
        background-color: rgb(16, 15, 17);

        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-text-size-adjust: 100%;
    }
`;
// User input components
class LawcosSearch extends LitElement {
    static styles = [
        globalStyling,
        css`
            input {
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
        return html`
            <input
                type="text"
                name="${this.whatToSearch}-search"
                placeholder="Input the ${this.whatToSearch} to search.."
                @input=${(e) => this.onInput(e.target.value)}
            />
        `
    }
}
class LawcosDropdown extends LitElement {
    static styles = [
        globalStyling,
        css`
            select {
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
            return html`
                <select
                    name="${this.whatToSelect}-selector"
                    id="${this.whatToSelect}-selector"
                    @input=${(e) => this.onSelect(e.target.value)}
                ></select>
            `;
        return html`
            <select
                name="${this.whatToSelect}-selector"
                id="${this.whatToSelect}-selector"
                @input=${(e) => this.onSelect(e.target.value)}
            >
                ${repeat(
                    this.listToSelectFrom,
                    selectableString => selectableString,
                    selectableString => html`
                        <option value=${selectableString}>
                            ${this.getReadableSelectionName(selectableString)}
                        </option>
                    `
                )}
            </select>
        `
    }
}
// Container components
class LawcosPage extends LitElement {
    static styles = [
        globalStyling,
        css`
            .page-container {
                width: 100vw;
                min-height: 100vh;
                height: max(100vh, auto);
                display: flex;
                flex-direction: column;
                place-items: center;
                text-align: center;
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
        return html`
            <div class="page-container">
                <slot name="top"></slot>
                <slot name="main"></slot>
                <slot name="bottom"></slot>
            </div>
        `
    }
}
class LawcosCard extends LitElement {
    static styles = [
        globalStyling,
        css`
            #clickable-container {
			    position: relative;
				width: min(90%, 400px);
				margin: 1em;
				padding: 0.5rem;
				border-radius: 1rem;
				background: rgb(35, 35, 40);
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
        return html`
            <div id="clickable-container">
                <slot></slot>
            </div>
        `;
    }
    updated() {
        this.renderRoot.querySelector('#clickable-container').onmousemove = (e) => {
            let rect = e.target.getBoundingClientRect();
            const hoverX = e.clientX - rect.left;
            const hoverY = e.clientY - rect.top;
            e.target.style.setProperty('--hoverX', `${hoverX}px`)
            e.target.style.setProperty('--hoverY', `${hoverY}px`)
        }
    }
}

customElements.define('lawcos-search', LawcosSearch);
customElements.define('lawcos-dropdown', LawcosDropdown);
customElements.define('lawcos-page', LawcosPage);
customElements.define('lawcos-card', LawcosCard);

export { LitElement, css, html, repeat };