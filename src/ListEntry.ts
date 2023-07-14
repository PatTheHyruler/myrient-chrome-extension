import { getRsyncPath } from './rsyncFunctions';

class ListEntry {
    linkElement: HTMLAnchorElement;
    linkCellElement: HTMLTableCellElement;
    sizeElement: HTMLTableCellElement;

    customCellElement: HTMLTableCellElement;
    checkbox: HTMLInputElement;

    private basePath: string;

    title: string;

    constructor(
        rowElement: HTMLTableRowElement,
        basePath: string,
        customCellElement: HTMLTableCellElement,
        refreshFunc: () => void,
    ) {
        if (!basePath.endsWith('/')) {
            basePath += '/';
        }
        this.basePath = basePath;

        this.customCellElement = customCellElement;

        const linkElement = rowElement.querySelector<HTMLAnchorElement>('td a');
        if (!linkElement) {
            throw new Error('Invalid link element');
        }
        if (linkElement.innerText === 'Parent directory/') {
            throw new Error('Invalid entry - parent directory navigation');
        }
        this.linkElement = linkElement;

        if (!linkElement.innerText) {
            throw new Error('No title for entry');
        }
        this.title = linkElement.innerText;

        const linkCellElement = linkElement.parentElement;
        if (!(linkCellElement instanceof HTMLTableCellElement)) {
            throw new Error('Invalid link cell element');
        }
        this.linkCellElement = linkCellElement;

        const sizeElement = linkCellElement.nextElementSibling;
        if (!(sizeElement instanceof HTMLTableCellElement)) {
            throw new Error('No size element');
        }
        this.sizeElement = sizeElement;

        const checkBox = document.createElement('input');
        checkBox.style.width = '2em';
        checkBox.setAttribute('type', 'checkbox');
        checkBox.checked = this.selected;
        checkBox.addEventListener('click', () => {
            this.toggleSelected();
            refreshFunc();
        });
        this.customCellElement.appendChild(checkBox);
        this.checkbox = checkBox;
    }

    private _selected: boolean = true;

    public get selected(): boolean {
        return this._selected;
    }

    public set selected(value: boolean) {
        this._selected = value;
        this.checkbox.checked = this._selected;
    }

    public get path(): string {
        return this.basePath + this.title;
    }

    public get rsyncPath(): string {
        return getRsyncPath(this.path);
    }

    toggleSelected(): void {
        this.selected = !this.selected;
    }

    public get sizeKiB(): number | null {
        try {
            const pattern = /(?<SIZE>(?:\d+(?:\.\d+)?)+) (?<UNIT>KiB|MiB|GiB)/;
            const regexResult = pattern.exec(this.sizeElement.innerText);
            if (!regexResult?.groups) {
                return null;
            }
            const sizeString = regexResult.groups["SIZE"];
            const unitString = regexResult.groups["UNIT"];
            let result = parseFloat(sizeString);
            if (unitString === "KiB") {
            } else if (unitString === "MiB") {
                result *= 1024;
            } else if (unitString === "GiB") {
                result *= 1024 ** 2;
            } else {
                throw new Error(`Unsupported unit: '${unitString}'`);
            }
            return result;
        } catch (e) {
            console.log(e);
            return null;
        }
    }
}

export default ListEntry;
