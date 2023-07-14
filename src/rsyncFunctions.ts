import Css from './Css';
import ListEntry from './ListEntry';

export function getRsyncCommand(
    destPath: string,
    options: string | null = null,
    ...sourcePaths: string[]
): string {
    if (sourcePaths.length === 0) {
        throw new Error('At least one source path is required');
    }
    let result = 'rsync';
    options = options?.trim() ?? null;
    if ((options?.length ?? 0) > 0) {
        result += ` ${options}`;
    } else {
        result += ' -tru --progress';
    }
    for (const sourcePath of sourcePaths) {
        result += ` "${sourcePath}"`;
    }
    result += ` "${destPath}"`;
    return result;
}

export function getRsyncPath(path: string) {
    let result = 'rsync://rsync.myrient.erista.me';
    if (!path.startsWith('/')) {
        result += '/';
    }
    result += path;
    return result;
}

export function createRsyncOptionsInput(): HTMLInputElement {
    const overrideRsyncOptionsInput = document.createElement('input');
    overrideRsyncOptionsInput.type = 'text';
    overrideRsyncOptionsInput.defaultValue = '-tru --progress';
    overrideRsyncOptionsInput.placeholder = 'Type rsync options here';
    overrideRsyncOptionsInput.title = 'Rsync options';
    overrideRsyncOptionsInput.classList.add(Css.myrientTextInput);
    return overrideRsyncOptionsInput;
}

export function createRsyncDestinationPathInput(): HTMLInputElement {
    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.defaultValue = 'destination';
    pathInput.placeholder = 'Type rsync destination here';
    pathInput.title = 'Rsync destination';
    pathInput.classList.add(Css.myrientTextInput);
    return pathInput;
}

function createComboCommandPreElement(): HTMLPreElement {
    const element = document.createElement('pre');
    element.classList.add(Css.codeTextContainer);
    return element;
}

export function createRsyncCommandElement(parent: HTMLElement): HTMLElement {
    const rsyncComboCommandDiv = document.createElement('div');
    parent.appendChild(rsyncComboCommandDiv);
    const rsyncComboCommandPre = createComboCommandPreElement();
    rsyncComboCommandDiv.appendChild(rsyncComboCommandPre);
    const rsyncComboCommandCode = document.createElement('code');
    rsyncComboCommandPre.appendChild(rsyncComboCommandCode);

    const rsyncComboCommandCopyButton = document.createElement('button');
    rsyncComboCommandCopyButton.innerText = 'Copy';
    rsyncComboCommandCopyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(rsyncComboCommandCode.innerText);
    });
    rsyncComboCommandCopyButton.classList.add(Css.myrientButton);
    rsyncComboCommandDiv.appendChild(rsyncComboCommandCopyButton);

    return rsyncComboCommandCode;
}

export function createCopyRsyncPathButton(listEntry: ListEntry): HTMLButtonElement {
    const copyRsyncPathButton = document.createElement('button');
    copyRsyncPathButton.classList.add(Css.myrientButton);
    copyRsyncPathButton.addEventListener('click', () => {
        navigator.clipboard.writeText(listEntry.rsyncPath);
    });
    copyRsyncPathButton.innerText = 'RP';
    copyRsyncPathButton.title = 'Copy Rsync path';
    return copyRsyncPathButton;
}

export function createCopyRsyncCommandButton(listEntry: ListEntry, optionsOverrideElement: HTMLInputElement): HTMLButtonElement {
    const copyRsyncCommandButton = document.createElement('button');
        copyRsyncCommandButton.classList.add(Css.myrientButton);
        copyRsyncCommandButton.addEventListener('click', () => {
            navigator.clipboard.writeText(getRsyncCommand(listEntry.title, optionsOverrideElement.value, listEntry.rsyncPath));
        });
        copyRsyncCommandButton.innerText = 'RC';
        copyRsyncCommandButton.title = 'Copy Rsync command';
        return copyRsyncCommandButton;
}