class Css {
    static readonly myrientTextInput = "myrient-text-input";
    static readonly myrientButton = "myrient-button";
}

function getRsyncPath(path: string) {
    let result = 'rsync://rsync.myrient.erista.me';
    if (!path.startsWith('/')) {
        result += '/';
    }
    result += path;
    return result;
}

function getRsyncCommand(destPath: string, options: string | null = null, ...sourcePaths: string[]): string {
    if (sourcePaths.length === 0) {
        throw new Error('At least one source path is required');
    }
    let result = 'rsync';
    options = options?.trim() ?? null;
    if ((options?.length ?? 0) > 0) {
        result += ` ${options}`;
    } else {
        result += " -tru --progress";
    }
    for (const sourcePath of sourcePaths) {
        result += ` "${sourcePath}"`;
    }
    result += ` "${destPath}"`;
    return result;
}

class ListEntry {
    linkElement: HTMLAnchorElement;
    linkCellElement: HTMLTableCellElement;
    sizeElement: HTMLTableCellElement;

    customCellElement: HTMLTableCellElement;
    checkbox: HTMLInputElement;

    private basePath: string;

    title: string;

    private _selected: boolean = true;
    public get selected(): boolean {
        return this._selected;
    }
    public set selected(value: boolean) {
        this._selected = value;
        this.checkbox.checked = this._selected;
    }

    constructor(rowElement: HTMLTableRowElement, basePath: string,
        customCellElement: HTMLTableCellElement, refreshFunc: () => void) {
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
        checkBox.style.width = "2em";
        checkBox.setAttribute('type', 'checkbox');
        checkBox.checked = this.selected;
        checkBox.addEventListener('click', () => {
            this.toggleSelected();
            refreshFunc();
        });
        this.customCellElement.appendChild(checkBox);
        this.checkbox = checkBox;
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
}

function main() {
    console.log('Myrient helper extension loaded');
    const table = document.querySelector<HTMLTableElement>('#list');

    if (!table) {
        console.log('Table not found');
        return;
    }

    const headings = document.querySelectorAll('h1');
    let _basePath: string | null = null;
    for (const headingElement of headings) {
        const indexOfPrefix = 'Index of ';
        const fullIndexofPrefix = indexOfPrefix + '/files/';
        if (!headingElement.innerText.startsWith(fullIndexofPrefix)) {
            continue;
        }
        _basePath = headingElement.innerText.slice(indexOfPrefix.length);
        break;
    }
    if (!_basePath) {
        console.log('Heading with base path not found');
        return;
    }    
    const basePath = _basePath;

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) {
        console.log('Header row not found');
        return;
    }

    const tableParent = table.parentElement;
    if (!tableParent) {
        console.log('No parent element for table');
        return;
    }

    const comboContainer = document.createElement("div");
    tableParent.insertBefore(comboContainer, table);
    comboContainer.style.width = "80%";
    comboContainer.style.margin = "auto";

    const overrideRsyncOptionsInput = document.createElement('input');
    overrideRsyncOptionsInput.type = 'text';
    overrideRsyncOptionsInput.defaultValue = "-tru --progress";
    overrideRsyncOptionsInput.placeholder = "Type rsync options here";
    overrideRsyncOptionsInput.title = "Rsync options";
    overrideRsyncOptionsInput.classList.add(Css.myrientTextInput);
    comboContainer.appendChild(overrideRsyncOptionsInput);

    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.defaultValue = "destination";
    pathInput.placeholder = "Type rsync destination here";
    pathInput.title = "Rsync destination";
    pathInput.classList.add(Css.myrientTextInput);
    comboContainer.appendChild(pathInput);

    const rsyncComboCommandDiv = document.createElement("div");
    comboContainer.appendChild(rsyncComboCommandDiv);
    const rsyncComboCommandPre = document.createElement("pre");
    rsyncComboCommandDiv.appendChild(rsyncComboCommandPre);
    const rsyncComboCommandCode = document.createElement("code");
    rsyncComboCommandPre.appendChild(rsyncComboCommandCode);

    rsyncComboCommandPre.style.whiteSpace = "pre-wrap";
    rsyncComboCommandPre.style.overflowWrap = "break-word";

    const rsyncComboCommandCopyButton = document.createElement("button");
    rsyncComboCommandCopyButton.innerText = "Copy";
    rsyncComboCommandCopyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(rsyncComboCommandCode.innerText);
    });
    rsyncComboCommandCopyButton.classList.add(Css.myrientButton);
    rsyncComboCommandDiv.appendChild(rsyncComboCommandCopyButton);

    const listEntries: ListEntry[] = [];
    let selectedListEntries: ListEntry[] = [];

    function refreshRsyncCommand() {
        if (selectedListEntries.length === 0 || selectedListEntries.length === listEntries.length) {
            rsyncComboCommandCode.innerText = getRsyncCommand(pathInput.value, overrideRsyncOptionsInput.value, getRsyncPath(basePath));
        } else {
            rsyncComboCommandCode.innerText = getRsyncCommand(pathInput.value, overrideRsyncOptionsInput.value, ...selectedListEntries.map(e => e.rsyncPath));
        }
    }

    refreshRsyncCommand();

    pathInput.addEventListener("input", () => {
        refreshRsyncCommand();
    });

    overrideRsyncOptionsInput.addEventListener("input", () => {
        refreshRsyncCommand();
    });

    function refreshSelectedListEntries(entryFunc: ((entry: ListEntry, selectedEntries: ListEntry[]) => void) | null = null) {
        selectedListEntries = [];
        entryFunc ??= (entry: ListEntry) => {
            if (entry.selected) {
                selectedListEntries.push(entry);
            }
        }

        for (const listEntry of listEntries) {
            entryFunc(listEntry, selectedListEntries);
        }

        refreshRsyncCommand();
    }

    const myHeader = document.createElement('th');
    headerRow.appendChild(myHeader);
    const selectAllButton = document.createElement('button');
    myHeader.appendChild(selectAllButton);
    selectAllButton.classList.add(Css.myrientButton);
    selectAllButton.innerText = "Select all";
    selectAllButton.addEventListener("click", () => {
        refreshSelectedListEntries((entry, selectedEntries) => {
            entry.selected = true;
            selectedEntries.push(entry);
        });
    });
    const unSelectAllButton = document.createElement('button');
    myHeader.appendChild(unSelectAllButton);
    unSelectAllButton.classList.add(Css.myrientButton);
    unSelectAllButton.innerText = "Unselect all";
    unSelectAllButton.addEventListener("click", () => {
        refreshSelectedListEntries((entry) => {
            entry.selected = false;
        });
    });

    const rows = table.querySelectorAll<HTMLTableRowElement>('tbody tr');
    for (const row of rows) {
        const myCell = document.createElement('td');
        row.appendChild(myCell);

        let listEntry: ListEntry;
        try {
            listEntry = new ListEntry(row, basePath, myCell, refreshSelectedListEntries);
        } catch (e) {
            console.log(e);
            continue;
        }

        listEntries.push(listEntry);

        const copyRsyncPathButton = document.createElement('button');
        copyRsyncPathButton.classList.add(Css.myrientButton);
        copyRsyncPathButton.addEventListener('click', () => {
            navigator.clipboard.writeText(listEntry.rsyncPath);
        });
        copyRsyncPathButton.innerText = 'RP';
        copyRsyncPathButton.title = 'Copy Rsync path';
        myCell.appendChild(copyRsyncPathButton);

        const copyRsyncCommandButton = document.createElement('button');
        copyRsyncCommandButton.classList.add(Css.myrientButton);
        copyRsyncCommandButton.addEventListener('click', () => {
            navigator.clipboard.writeText(getRsyncCommand(listEntry.title, overrideRsyncOptionsInput.value, listEntry.rsyncPath));
        });
        copyRsyncCommandButton.innerText = 'CR';
        copyRsyncCommandButton.title = 'Copy Rsync command';
        myCell.appendChild(copyRsyncCommandButton);
    }
}

main();
