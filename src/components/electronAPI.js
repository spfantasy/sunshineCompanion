
export async function listNode(keyword) {
    return await window.electron.fetchData("listNode", {"keyword": keyword});
}

export async function getNode(keyword) {
    return await window.electron.fetchData("getNode", {"keyword": keyword});
}

export async function fetchJson(filename) {
    return await window.electron.fetchData("json", {"filename": filename});
}

export async function dumpFlow() {
    return await window.electron.fetchData("dumpFlow", {});
}

export async function deleteNode(nodeValue) {
    return await window.electron.fetchData("deleteNode", {"nodeValue": nodeValue});
}

export async function addOrUpdateNode(node) {
    return await window.electron.fetchData("addOrUpdateNode", {"node": node});
}
