import Css from "./Css";
import ListEntry from "./ListEntry";
import { createCopyRsyncCommandButton, createCopyRsyncPathButton, createRsyncCommandElement, createRsyncDestinationPathInput, createRsyncOptionsInput, getRsyncCommand, getRsyncPath } from "./rsyncFunctions";
import { createSummaryElement } from "./summaryFunctions";

function getEntriesTable(): HTMLTableElement {
    const table = document.querySelector<HTMLTableElement>('#list');

    if (!table) {
        throw new Error('Table not found');
    }

    return table;
}

function getBasePath(): string {
    const headings = document.querySelectorAll('h1');
    let basePath: string | null = null;
    for (const headingElement of headings) {
        const indexOfPrefix = 'Index of ';
        const fullIndexofPrefix = indexOfPrefix + '/files/';
        if (!headingElement.innerText.startsWith(fullIndexofPrefix)) {
            continue;
        }
        basePath = headingElement.innerText.slice(indexOfPrefix.length);
        break;
    }
    if (!basePath) {
        throw new Error("Heading with base path not found");
    }    
    return basePath;
}

function getHeaderRow(table: HTMLTableElement): HTMLTableRowElement {
    const headerRow = table.querySelector('thead tr');
    if (!(headerRow instanceof HTMLTableRowElement)) {
        throw new Error('Header row not found');
    }
    return headerRow;
}

type ListEntryPostRefreshFunc = (entry: ListEntry, selectedEntries: ListEntry[]) => void;

function createHeaderCell(refreshFunc: (func: ListEntryPostRefreshFunc) => void): HTMLTableCellElement {
    const myHeader = document.createElement('th');

    const selectAllButton = document.createElement('button');
    myHeader.appendChild(selectAllButton);
    selectAllButton.classList.add(Css.myrientButton);
    selectAllButton.innerText = "Select all";
    selectAllButton.addEventListener("click", () => {
        refreshFunc((entry, selectedEntries) => {
            entry.selected = true;
            selectedEntries.push(entry);
        });
    });

    const unSelectAllButton = document.createElement('button');
    myHeader.appendChild(unSelectAllButton);
    unSelectAllButton.classList.add(Css.myrientButton);
    unSelectAllButton.innerText = "Unselect all";
    unSelectAllButton.addEventListener("click", () => {
        refreshFunc((entry) => {
            entry.selected = false;
        });
    });

    return myHeader;
}

function main() {
    console.log('Myrient helper extension loaded');

    const table = getEntriesTable();
    const basePath = getBasePath();
    const headerRow = getHeaderRow(table);
    const fileNameHeader = headerRow.firstElementChild;
    if (fileNameHeader instanceof HTMLElement) {
        fileNameHeader.style.width = "unset";
    }

    const tableParent = table.parentElement;
    if (!tableParent) {
        throw new Error('No parent element for table');
    }

    const comboContainer = document.createElement("div");
    tableParent.insertBefore(comboContainer, table);
    comboContainer.classList.add(Css.containerGeneral);

    const overrideRsyncOptionsInput = createRsyncOptionsInput();
    comboContainer.appendChild(overrideRsyncOptionsInput);

    const pathInput = createRsyncDestinationPathInput();
    comboContainer.appendChild(pathInput);

    const rsyncComboCommandElement = createRsyncCommandElement(comboContainer);    

    const listEntries: ListEntry[] = [];
    let selectedListEntries: ListEntry[] = [];

    function refreshRsyncCommand() {
        if (selectedListEntries.length === 0 || selectedListEntries.length === listEntries.length) {
            rsyncComboCommandElement.innerText = getRsyncCommand(pathInput.value, overrideRsyncOptionsInput.value, getRsyncPath(basePath));
        } else {
            rsyncComboCommandElement.innerText = getRsyncCommand(pathInput.value, overrideRsyncOptionsInput.value, ...selectedListEntries.map(e => e.rsyncPath));
        }
    }

    pathInput.addEventListener("input", () => {
        refreshRsyncCommand();
    });

    overrideRsyncOptionsInput.addEventListener("input", () => {
        refreshRsyncCommand();
    });

    const [summaryElement, updateSummaryElement] = createSummaryElement(listEntries);

    function refreshSelectedListEntries(entryFunc: ListEntryPostRefreshFunc | null = null) {
        selectedListEntries = [];
        entryFunc ??= (entry: ListEntry) => {
            if (entry.selected) {
                selectedListEntries.push(entry);
            }
        }

        for (const listEntry of listEntries) {
            entryFunc(listEntry, selectedListEntries);
        }

        updateSummaryElement(selectedListEntries);

        refreshRsyncCommand();
    }

    const myHeader = createHeaderCell(refreshSelectedListEntries);
    headerRow.prepend(myHeader);

    myHeader.appendChild(summaryElement);

    const rows = table.querySelectorAll<HTMLTableRowElement>('tbody tr');
    for (const row of rows) {
        const myCell = document.createElement('td');
        row.prepend(myCell);

        let listEntry: ListEntry;
        try {
            listEntry = new ListEntry(row, basePath, myCell, refreshSelectedListEntries);
        } catch (e) {
            console.log(e);
            continue;
        }

        listEntries.push(listEntry);

        const copyRsyncPathButton = createCopyRsyncPathButton(listEntry);
        myCell.appendChild(copyRsyncPathButton);

        const copyRsyncCommandButton = createCopyRsyncCommandButton(listEntry, overrideRsyncOptionsInput);
        myCell.appendChild(copyRsyncCommandButton);
    }

    refreshSelectedListEntries();
}

main();
