    const memoInputContainer = document.querySelector('.memo-input');


    // App State
    let memos = [];
    let archivedMemos = [];
    let currentView = 'main'; // 'main' or 'archive'
    let activeTag = null;

    // --- ICON SVGs ---
    const ICONS = {
        archive: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>',
        restore: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
        delete: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
    };

    // --- UTILITY FUNCTIONS ---
    const getFormattedTimestamp = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    // --- LOCAL STORAGE & STATE MANAGEMENT ---
    const loadData = () => {
        const savedMemos = localStorage.getItem('memos');
        const savedArchivedMemos = localStorage.getItem('archivedMemos');
        const savedTheme = localStorage.getItem('theme') || 'light';

        if (savedMemos) {
            memos = JSON.parse(savedMemos).map(memo => ({
                ...memo,
                priority: memo.priority || 1,
                timestamp: memo.timestamp || 'N/A',
                tags: memo.tags || []
            }));
        }
        if (savedArchivedMemos) {
            archivedMemos = JSON.parse(savedArchivedMemos);
        }
        applyTheme(savedTheme);
    };

    const saveMemos = () => localStorage.setItem('memos', JSON.stringify(memos));
    const saveArchivedMemos = () => localStorage.setItem('archivedMemos', JSON.stringify(archivedMemos));

    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        localStorage.setItem('theme', theme);
    };

    // --- RENDERING ---
    const renderAll = () => {
        renderMemos();
        renderTags();
        updateUIForView();
    };

    const renderMemos = () => {
        memoList.innerHTML = '';
        const sourceMemos = currentView === 'main' ? memos : archivedMemos;
        const searchTerm = searchInput.value.toLowerCase();

        const filteredMemos = sourceMemos.filter(memo => {
            if (!memo || typeof memo.text !== 'string') return false;
            const matchesSearch = memo.text.toLowerCase().includes(searchTerm) || (memo.tags && memo.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            const matchesTag = currentView === 'main' && activeTag ? memo.tags.includes(activeTag) : true;
            return matchesSearch && matchesTag;
        });

        if (filteredMemos.length === 0) {
            memoList.innerHTML = `<p style="text-align: center; color: var(--text-secondary-light);">표시할 메모가 없습니다.</p>`;
        } else {
            filteredMemos.forEach(memo => {
                const memoItem = createMemoElement(memo, currentView);
                memoList.appendChild(memoItem);
            });
        }
    };

    const renderTags = () => {
        tagFiltersContainer.innerHTML = '';
        if (currentView !== 'main') return;

        const allTags = new Set(memos.flatMap(memo => memo.tags));
        if (allTags.size > 0) {
            const allButton = document.createElement('button');
            allButton.textContent = '모든 태그';
            allButton.className = 'tag-filter' + (activeTag === null ? ' active' : '');
            allButton.addEventListener('click', () => {
                activeTag = null;
                renderAll();
            });
            tagFiltersContainer.appendChild(allButton);

            allTags.forEach(tag => {
                const tagBtn = document.createElement('button');
                tagBtn.textContent = tag;
                tagBtn.className = 'tag-filter' + (tag === activeTag ? ' active' : '');
                tagBtn.addEventListener('click', () => {
                    activeTag = activeTag === tag ? null : tag;
                    renderAll();
                });
                tagFiltersContainer.appendChild(tagBtn);
            });
        }
    };

    const createMemoElement = (memo, view) => {
        const memoItem = document.createElement('div');
        memoItem.className = 'memo-item';
        memoItem.dataset.id = memo.id;
        memoItem.dataset.priority = memo.priority;

        const isArchived = view === 'archive';
        
        const header = document.createElement('div');
        header.className = 'memo-item-header';
        
        const priorityDisplay = document.createElement('div');
        if (isArchived) {
            priorityDisplay.innerHTML = `<span>중요도 ${memo.priority}</span>`;
        } else {
            const prioritySelectEl = document.createElement('select');
            prioritySelectEl.className = 'priority-select';
            for (let i = 1; i <= 5; i++) {
                prioritySelectEl.innerHTML += `<option value="${i}" ${memo.priority === i ? 'selected' : ''}>중요도 ${i}</option>`;
            }
            prioritySelectEl.addEventListener('change', (e) => updateMemoPriority(memo.id, parseInt(e.target.value)));
            priorityDisplay.appendChild(prioritySelectEl);
        }
        header.appendChild(priorityDisplay);

        if (!isArchived) {
            const archiveBtn = document.createElement('button');
            archiveBtn.className = 'archive-btn';
            archiveBtn.innerHTML = ICONS.archive;
            archiveBtn.title = '아카이브';
            archiveBtn.addEventListener('click', () => archiveMemo(memo.id));
            header.appendChild(archiveBtn);
        }

        const memoTextarea = document.createElement('textarea');
        memoTextarea.value = memo.text;
        memoTextarea.readOnly = isArchived;
        if (!isArchived) {
            memoTextarea.addEventListener('input', () => updateMemoText(memo.id, memoTextarea.value));
        }

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'memo-tags';
        if (memo.tags && memo.tags.length > 0) {
            memo.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'memo-tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
        }

        const footer = document.createElement('div');
        footer.className = 'memo-footer';
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'memo-timestamp';
        timestampDiv.textContent = memo.timestamp;
        
        const actionsWrapper = document.createElement('div')
        actionsWrapper.className = 'archive-actions';

        if (isArchived) {
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'restore-btn';
            restoreBtn.innerHTML = ICONS.restore;
            restoreBtn.title = '복구';
            restoreBtn.addEventListener('click', () => restoreMemo(memo.id));
            
            const permDeleteBtn = document.createElement('button');
            permDeleteBtn.className = 'perm-delete-btn';
            permDeleteBtn.innerHTML = ICONS.delete;
            permDeleteBtn.title = '영구 삭제';
            permDeleteBtn.addEventListener('click', () => permanentlyDeleteMemo(memo.id));
            
            actionsWrapper.append(restoreBtn, permDeleteBtn);
        }
        
        footer.append(timestampDiv, actionsWrapper);
        memoItem.append(header, memoTextarea, tagsContainer, footer);
        return memoItem;
    };

    const updateUIForView = () => {
        const isMainView = currentView === 'main';
        memoInputContainer.style.display = isMainView ? 'flex' : 'none';
        sortBtn.style.display = isMainView ? 'inline-block' : 'none';
        tagFiltersContainer.style.display = isMainView ? 'flex' : 'none';
        toggleArchiveViewBtn.textContent = isMainView ? '아카이브 보기' : '메모 목록 보기';
        document.querySelector('.search-bar').style.display = isMainView ? 'block' : 'none';
    };

    // --- CRUD & OTHER ACTIONS ---
    const addMemo = () => {
        const text = memoTextInput.value.trim();
        if (text === '') return;

        const tags = tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        
        const newMemo = {
            id: Date.now(),
            text: text,
            priority: parseInt(prioritySelect.value),
            timestamp: getFormattedTimestamp(),
            tags: tags
        };

        memos.unshift(newMemo);
        saveMemos();
        memoTextInput.value = '';
        tagInput.value = '';
        renderAll();
    };

    const updateMemoText = (id, newText) => {
        const memo = memos.find(m => m.id === id);
        if (memo) {
            memo.text = newText;
            memo.timestamp = getFormattedTimestamp();
            saveMemos();
            const timestampEl = document.querySelector(`.memo-item[data-id='${id}'] .memo-timestamp`);
            if (timestampEl) timestampEl.textContent = memo.timestamp;
        }
    };

     const updateMemoPriority = (id, newPriority) => {
        const memo = memos.find(m => m.id === id);
        if (memo) {
            memo.priority = newPriority;
            saveMemos();
            renderAll();
        }
    };

    const archiveMemo = (id) => {
        const memoIndex = memos.findIndex(m => m.id === id);
        if (memoIndex > -1) {
            const [memoToArchive] = memos.splice(memoIndex, 1);
            archivedMemos.unshift(memoToArchive);
            saveMemos();
            saveArchivedMemos();
            renderAll();
        }
    };

    const restoreMemo = (id) => {
        const memoIndex = archivedMemos.findIndex(m => m.id === id);
        if (memoIndex > -1) {
            const [memoToRestore] = archivedMemos.splice(memoIndex, 1);
            memos.unshift(memoToRestore);
            saveMemos();
            saveArchivedMemos();
            renderAll();
        }
    };

    const permanentlyDeleteMemo = (id) => {
        if (confirm('정말로 이 메모를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            archivedMemos = archivedMemos.filter(m => m.id !== id);
            saveArchivedMemos();
            renderAll();
        }
    };

    const sortByPriority = () => {
        if (currentView === 'main') {
            memos.sort((a, b) => b.priority - a.priority);
            renderAll();
        }
    };

    const toggleView = () => {
        currentView = currentView === 'main' ? 'archive' : 'main';
        activeTag = null; 
        renderAll();
    };

    // --- EVENT LISTENERS ---
    saveBtn.addEventListener('click', addMemo);
    searchInput.addEventListener('input', renderMemos);
    sortBtn.addEventListener('click', sortByPriority);
    themeToggleBtn.addEventListener('click', () => applyTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark'));
    toggleArchiveViewBtn.addEventListener('click', toggleView);

    // --- INITIALIZATION ---
    loadData();
    renderAll();

