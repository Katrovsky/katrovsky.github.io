import * as params from '@params';

const resList = document.getElementById('searchResults');
const sInput = document.getElementById('searchInput');
const searchBox = document.getElementById('searchbox');
const statusEl = document.getElementById('searchStatus');

let fuse;
let currentElement = null;
let firstResult = null;
let lastResult = null;

const hint = 'Введите запрос, чтобы найти статью';

const defaultFuseOptions = {
    distance: 100,
    threshold: 0.4,
    ignoreLocation: true,
    keys: ['title', 'permalink', 'summary', 'content']
};

const buildFuseOptions = () => {
    if (!params.fuseOpts) {
        return defaultFuseOptions;
    }

    return {
        isCaseSensitive: params.fuseOpts.iscasesensitive ?? false,
        includeScore: params.fuseOpts.includescore ?? false,
        includeMatches: params.fuseOpts.includematches ?? false,
        minMatchCharLength: params.fuseOpts.minmatchcharlength ?? 1,
        shouldSort: params.fuseOpts.shouldsort ?? true,
        findAllMatches: params.fuseOpts.findallmatches ?? false,
        keys: params.fuseOpts.keys ?? defaultFuseOptions.keys,
        location: params.fuseOpts.location ?? 0,
        threshold: params.fuseOpts.threshold ?? defaultFuseOptions.threshold,
        distance: params.fuseOpts.distance ?? defaultFuseOptions.distance,
        ignoreLocation: params.fuseOpts.ignorelocation ?? defaultFuseOptions.ignoreLocation
    };
};

const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    };
};

const setStatus = (text) => {
    if (statusEl) {
        statusEl.textContent = text;
    }
};

const syncUrl = (query) => {
    const url = new URL(window.location.href);
    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }
    window.history.replaceState(null, '', url);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getTerms = (query) => query.split(/\s+/).filter((term) => term.length > 1);

const appendHighlighted = (parent, text, pattern) => {
    if (!pattern) {
        parent.appendChild(document.createTextNode(text));
        return;
    }

    text.split(pattern).forEach((part, index) => {
        if (!part) {
            return;
        }

        if (index % 2 === 1) {
            const mark = document.createElement('mark');
            mark.textContent = part;
            parent.appendChild(mark);
        } else {
            parent.appendChild(document.createTextNode(part));
        }
    });
};

const buildSnippet = (item, terms) => {
    const content = (item.content || '').replace(/\s+/g, ' ').trim();
    const lower = content.toLowerCase();
    let index = -1;

    for (const term of terms) {
        const found = lower.indexOf(term.toLowerCase());
        if (found !== -1 && (index === -1 || found < index)) {
            index = found;
        }
    }

    if (index === -1) {
        const fallback = (item.description || item.summary || content).trim();
        return fallback.length > 160 ? `${fallback.slice(0, 160).trimEnd()}…` : fallback;
    }

    const start = Math.max(0, index - 60);
    const end = Math.min(content.length, index + 140);
    return `${start > 0 ? '…' : ''}${content.slice(start, end).trim()}${end < content.length ? '…' : ''}`;
};

const reset = () => {
    currentElement = null;
    firstResult = null;
    lastResult = null;
    resList.innerHTML = '';
    sInput.value = '';
    setStatus(hint);
    syncUrl('');
    sInput.focus();
};

const setActiveResult = (element) => {
    document.querySelectorAll('.focus').forEach((item) => item.classList.remove('focus'));

    if (!element) {
        return;
    }

    element.focus();
    element.parentElement?.classList.add('focus');
    currentElement = element;
};

const renderResults = (items, query) => {
    resList.innerHTML = '';
    currentElement = null;
    firstResult = null;
    lastResult = null;

    if (!query) {
        setStatus(hint);
        return;
    }

    if (items.length === 0) {
        setStatus(`Ничего не найдено по запросу «${query}»`);
        return;
    }

    setStatus(`Найдено: ${items.length}`);

    const terms = getTerms(query);
    const pattern = terms.length ? new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi') : null;
    const fragment = document.createDocumentFragment();

    for (const item of items) {
        const li = document.createElement('li');
        const body = document.createElement('div');
        body.className = 'result-body';

        if (item.path) {
            const path = document.createElement('span');
            path.className = 'result-path';
            path.textContent = item.path;
            body.appendChild(path);
        }

        const title = document.createElement('span');
        title.className = 'result-title';
        appendHighlighted(title, item.title, pattern);
        body.appendChild(title);

        const snippetText = buildSnippet(item, terms);
        if (snippetText) {
            const snippet = document.createElement('span');
            snippet.className = 'result-snippet';
            appendHighlighted(snippet, snippetText, pattern);
            body.appendChild(snippet);
        }

        const link = document.createElement('a');
        link.className = 'entry-link';
        link.href = item.permalink;
        link.setAttribute('aria-label', item.title);

        li.appendChild(body);
        li.appendChild(link);
        fragment.appendChild(li);
    }

    resList.appendChild(fragment);
    firstResult = resList.firstElementChild;
    lastResult = resList.lastElementChild;
};

const performSearch = () => {
    if (!fuse) {
        return;
    }

    const query = sInput.value.trim();
    syncUrl(query);

    if (!query) {
        renderResults([], '');
        return;
    }

    const searchOptions = params.fuseOpts?.limit ? { limit: params.fuseOpts.limit } : undefined;
    const results = searchOptions ? fuse.search(query, searchOptions) : fuse.search(query);
    renderResults(results.map((result) => result.item), query);
};

const initSearch = async () => {
    if (!sInput || !resList) {
        return;
    }

    sInput.disabled = false;
    sInput.focus();
    setStatus(hint);

    try {
        const response = await fetch('../index.json');
        if (!response.ok) {
            throw new Error(`Search index load failed: ${response.status}`);
        }

        const data = await response.json();
        if (data) {
            fuse = new Fuse(data, buildFuseOptions());
        }
    } catch (error) {
        console.error(error);
        setStatus('Не удалось загрузить поисковый индекс');
        return;
    }

    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) {
        sInput.value = initial.slice(0, 64);
        performSearch();
    }
};

window.addEventListener('load', initSearch);

sInput?.addEventListener('input', debounce(performSearch, 150));

sInput?.addEventListener('search', () => {
    if (!sInput.value) {
        reset();
    }
});

document.addEventListener('keydown', (event) => {
    const { key } = event;
    const active = document.activeElement;
    const isInSearchBox = searchBox?.contains(active);

    if (key === 'Escape') {
        reset();
        return;
    }

    if (!firstResult || !isInSearchBox) {
        return;
    }

    if (key === 'ArrowDown') {
        event.preventDefault();

        if (active === sInput) {
            setActiveResult(firstResult.querySelector('.entry-link'));
        } else if (active?.parentElement !== lastResult) {
            setActiveResult(active?.parentElement?.nextElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'ArrowUp') {
        event.preventDefault();

        if (active?.parentElement === firstResult) {
            setActiveResult(sInput);
        } else if (active !== sInput) {
            setActiveResult(active?.parentElement?.previousElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'ArrowRight') {
        if (active?.matches?.('.entry-link')) {
            active.click();
        }
    }
});