import Css from "./Css";
import ListEntry from "./ListEntry";
import { round } from "./utils";

function getTotalSize(entries: ListEntry[]): [number, boolean] {
    let result = 0;
    let unknownCountPresent = false;
    for (const entry of entries) {
        if (entry.sizeKiB !== null) {
            result += entry.sizeKiB;
        } else {
            unknownCountPresent = true;
        }
    }
    return [result, unknownCountPresent];
}

function getSizeDisplay(sizeKiB: number | null, unknownCountPresent: boolean = false): string {
    if (sizeKiB === null) {
        return "???";
    }

    const unknownCountPresentString = unknownCountPresent ? "?" : "";

    if (round(sizeKiB) < 1024) {
        return `${round(sizeKiB)}${unknownCountPresentString} KiB`;
    }

    const sizeMiB = sizeKiB / 1024;
    if (round(sizeMiB) < 1024) {
        return `${round(sizeMiB)}${unknownCountPresentString} MiB`;
    }

    const sizeGiB = sizeMiB / 1024;
    if (round(sizeGiB) < 1024) {
        return `${round(sizeGiB)}${unknownCountPresentString} GiB`;
    }

    const sizeTiB = sizeGiB / 1024;
    return `${round(sizeTiB)}${unknownCountPresentString} TiB`;
}

export function createSummaryElement(allEntries: ListEntry[]): [HTMLElement, (entries: ListEntry[]) => void] {
    const summaryDiv = document.createElement("div");
    summaryDiv.classList.add(Css.containerGeneral);

    const amountDiv = document.createElement("div");
    summaryDiv.appendChild(amountDiv);

    const sizeDiv = document.createElement("div");
    summaryDiv.appendChild(sizeDiv);

    function updateFunc(entries: ListEntry[]): void {
        const [totalSize, totalUnknownCountPresent] = getTotalSize(allEntries);
        amountDiv.innerText = `${entries.length} / ${allEntries.length}`;
        const [size, unknownCountPresent] = getTotalSize(entries);
        sizeDiv.innerText = `${getSizeDisplay(size, unknownCountPresent)} / ${getSizeDisplay(totalSize, totalUnknownCountPresent)}`;
    }

    return [summaryDiv, updateFunc];
}