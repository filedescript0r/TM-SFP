// ==UserScript==
// @name         Stake Fairness Panel
// @author       1114.dev
// @namespace    https://tampermonkey.net/
// @version      0.3.22
// @description  Stake Fireness Panel (Является пльзовательским скриптом, который сохраняет историю  смены сида, экспортирует историю, и позволяет сменить пару сидов)
// @match        https://stake.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let currentModal = null;
    let waitingResolver = null;

    // --- КОНСТАНТЫ LOCAL STORAGE ---
    const LS_TOTAL_BETS_KEY = 'tm_stake_total_bets';
    const LS_ROTATIONS_KEY = 'tm_stake_rotations';
    const LS_LAST_READ_BETS_KEY = 'tm_stake_last_read_bets_current_seed';
    const LS_PANEL_POSITION_KEY = 'tm_stake_panel_position';
    const LS_HISTORY_KEY = 'tm_stake_history_log';

    /* =========================
       СЧЕТЧИКИ И ИСТОРИЯ
    ========================= */

    function getCounter(key) {
        return parseInt(localStorage.getItem(key) || '0', 10);
    }

    function setCounter(key, value) {
        localStorage.setItem(key, value.toString());
    }

    function getHistory() {
        const raw = localStorage.getItem(LS_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function addToHistory(entryString) {
        const history = getHistory();
        history.push(entryString);
        localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
    }

    let totalBets = getCounter(LS_TOTAL_BETS_KEY);
    let seedRotations = getCounter(LS_ROTATIONS_KEY);

    /* =========================
       СБРОС СЧЕТЧИКОВ
    ========================= */

    function resetCounters() {
        if (!confirm('Вы уверены? Это сбросит ВСЕ счетчики и ОЧИСТИТ историю экспорта.')) return;

        setCounter(LS_TOTAL_BETS_KEY, 0);
        setCounter(LS_ROTATIONS_KEY, 0);
        setCounter(LS_LAST_READ_BETS_KEY, 0);
        localStorage.removeItem(LS_HISTORY_KEY);

        totalBets = 0;
        seedRotations = 0;
        updatePanelDisplay(null);

        alert('Данные и история сброшены.');
    }

    /* =========================
       УТИЛИТЫ
    ========================= */

    function getValueByLabel(modal, labelText) {
        const span = [...modal.querySelectorAll('span')]
            .find(s => s.textContent.trim() === labelText);
        const input = span?.closest('label, div')?.querySelector('input');
        return input?.value ?? '—';
    }

    function switchToSeedsTab(modal) {
        const tab = [...modal.querySelectorAll('button, div')]
            .find(el => el.textContent.trim() === 'Сиды');
        if (!tab) return false;
        tab.click();
        return true;
    }

    function waitForSeedForm(modal, timeout = 2000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const timer = setInterval(() => {
                const input = modal.querySelector('input[data-testid="roatateSeed"]');
                if (input) { clearInterval(timer); resolve(); }
                if (Date.now() - start > timeout) { clearInterval(timer); reject(); }
            }, 50);
        });
    }

    function waitForChangeButton(modal, timeout = 2000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const timer = setInterval(() => {
                const form = modal.querySelector('input[data-testid="roatateSeed"]')?.closest('form');
                const button = form ? [...form.querySelectorAll('button')]
                    .find(b => b.textContent.trim() === 'Изменить' && !b.disabled) : null;
                if (button) { clearInterval(timer); resolve(); }
                if (Date.now() - start > timeout) { clearInterval(timer); reject(); }
            }, 50);
        });
    }

    function findFairnessButton() {
        return [...document.querySelectorAll('button')]
            .find(b => b.textContent.trim() === 'Честность');
    }

    function rotateSeed(modal) {
        const input = modal.querySelector('input[data-testid="roatateSeed"]');
        const form = input?.closest('form');
        const submit = form?.querySelector('button[type="submit"]');
        if (submit) submit.click();
    }

    function closeModal(modal) {
        const closeButton =
            modal.querySelector('button[data-testid="game-modal-close"]') ||
            modal.querySelector('button[aria-label="Закрыть"]') ||
            modal.querySelector('button[aria-label="Close Modal"]');
        if (closeButton) closeButton.click();
    }

    /* =========================
       ОБНОВЛЕНИЕ ДАННЫХ
    ========================= */

    function openFairnessModal() {
        const btn = findFairnessButton();
        if (btn) btn.click();
    }

    function waitForModal() {
        return new Promise(resolve => {
            if (currentModal) return resolve(currentModal);
            waitingResolver = resolve;
        });
    }

    function updatePanelDisplay(modal) {
        const betsInModal = modal
            ? getValueByLabel(modal, 'Количество ставок, сделанных с этой парой сидов')
            : '—';

        const clientSeed = modal
            ? getValueByLabel(modal, 'Действующий клиентский сид')
            : document.getElementById('tm-client')?.title || '—';

        const serverSeed = modal
            ? getValueByLabel(modal, 'Действующий серверный сид (хешированный)')
            : document.getElementById('tm-server')?.title || '—';

        const betsEl = document.getElementById('tm-bets');
        const clientEl = document.getElementById('tm-client');
        const serverEl = document.getElementById('tm-server');
        const totalBetsEl = document.getElementById('tm-total-bets');
        const rotationsEl = document.getElementById('tm-rotations');

        if (betsEl) betsEl.textContent = betsInModal;
        if (clientEl) { clientEl.textContent = clientSeed; clientEl.title = clientSeed; }
        if (serverEl) { serverEl.textContent = serverSeed; serverEl.title = serverSeed; }

        if (betsInModal !== '—') {
            const currentBets = parseInt(betsInModal, 10);
            const lastReadBets = getCounter(LS_LAST_READ_BETS_KEY);
            const difference = currentBets - lastReadBets;

            if (difference > 0) {
                totalBets += difference;
                setCounter(LS_TOTAL_BETS_KEY, totalBets);
                setCounter(LS_LAST_READ_BETS_KEY, currentBets);
            } else if (currentBets === 0 && lastReadBets > 0) {
                setCounter(LS_LAST_READ_BETS_KEY, 0);
            }
        }

        if (totalBetsEl) totalBetsEl.textContent = totalBets.toLocaleString('ru-RU');
        if (rotationsEl) rotationsEl.textContent = seedRotations.toLocaleString('ru-RU');
    }

    /* =========================
       ИСТОРИЯ
    ========================= */

    function captureCurrentStateToString() {
        const betsRaw = document.getElementById('tm-bets')?.textContent || '—';
        const bets = betsRaw !== '—' ? betsRaw.replace(/\s+/g, '') : '—';

        const client = document.getElementById('tm-client')?.title || '—';
        const server = document.getElementById('tm-server')?.title || '—';
        const date = new Date().toLocaleString('ru-RU');

        return `Stake | [${date}] | Ставки: ${bets} | Client: ${client} | Server: ${server}`;
    }

    /* =========================
       ЭКСПОРТ
    ========================= */

    function exportData() {
        const history = getHistory();
        let content = '';

        if (history.length > 0) {
            content = '=== STAKE HISTORY LOG ===\n' +
                      history.join('\n') +
                      '\n=========================\n';
        } else {
            content = 'История пуста. Сделайте смену сида.\n';
        }

        content += `\nТекущие общие счетчики:\nВсего ставок: ${totalBets}\nСмен сида: ${seedRotations}\nВыгружено: ${new Date().toLocaleString('ru-RU')}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `stake_history_log_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /* =========================
       ПАНЕЛЬ
    ========================= */

    function makePanelDraggable(panel) {
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        const savedPosition = localStorage.getItem(LS_PANEL_POSITION_KEY);
        if (savedPosition) {
            const pos = JSON.parse(savedPosition);
            panel.style.top = `${pos.y}px`;
            panel.style.left = `${pos.x}px`;
            panel.style.right = 'auto';
        }

        const header = panel.querySelector('#tm-header');

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            header.style.cursor = 'grabbing';
            offset = {
                x: e.clientX - panel.getBoundingClientRect().left,
                y: e.clientY - panel.getBoundingClientRect().top
            };
            panel.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = `${e.clientX - offset.x}px`;
            panel.style.top = `${e.clientY - offset.y}px`;
            panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            header.style.cursor = 'grab';
            localStorage.setItem(LS_PANEL_POSITION_KEY, JSON.stringify({
                x: panel.getBoundingClientRect().left,
                y: panel.getBoundingClientRect().top
            }));
        });
    }

    function createPanel() {
        if (document.getElementById('tm-fairness-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'tm-fairness-panel';

        const style = document.createElement('style');
        style.textContent = `

#tm-fairness-panel{
    position:fixed;
    top:100px;
    right:20px;
    z-index:999999;
    width:390px;
    background:#132733;
    color:#e6edf3;
    border-radius:10px;
    border:1px solid #1f3a48;
    box-shadow:0 8px 24px rgba(0,0,0,.45);
    font-family:Inter,system-ui,sans-serif;
    font-size:12px;
    padding:10px
}

#tm-header{
    font-weight:700;
    font-size:13px;
    margin-bottom:8px;
    padding-bottom:6px;
    border-bottom:1px solid #1f3a48;
    cursor:grab;
    display:flex;
    align-items:center;
    gap:6px
}

.tm-row{
    display:grid;
    grid-template-columns:auto 1fr;
    gap:8px;
    align-items:center;
    margin-bottom:6px
}

.tm-label{
    font-size:11px;
    color:#9fb2c1;
    white-space:nowrap
}

.tm-value{
    background:#0f212e;
    border:1px solid #1f3a48;
    border-radius:6px;
    padding:5px 8px;
    font-size:12px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis
}

.tm-value.highlight{
    font-size:14px;
    font-weight:700;
    color:#00e701;
    text-align:right
}

.tm-row.stats{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-top:4px
}

.tm-stat-box{
    background:#0f212e;
    border:1px solid #1f3a48;
    border-radius:6px;
    padding:6px 8px;
    text-align:center
}

.tm-stat-box .tm-label{
    display:block;
    margin-bottom:2px
}

.tm-stat-value{
    font-weight:700;
    color:#3fc5ff
}

.tm-btn-group{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-top:8px
}

.tm-btn{
    height:32px;
    border-radius:6px;
    border:1px solid #1f3a48;
    background:#1b3645;
    color:#e6edf3;
    font-weight:600;
    cursor:pointer
}

.tm-btn:hover{
    background:#234a5d
}

.tm-btn.primary{
    background:#00e701;
    border-color:#00e701;
    color:#041b0a
}

.tm-btn.primary:hover{
    background:#20f520
}

        `;
        document.head.appendChild(style);

        panel.innerHTML = `
<div id="tm-header">Stake Fairness Panel <span style="opacity:.6">(v.0.3.22)</span></div>

<div class="tm-row">
  <div class="tm-label">Ставок (текущий сид):</div>
  <div id="tm-bets" class="tm-value highlight">—</div>
</div>

<div class="tm-row">
  <div class="tm-label">Клиентский сид:</div>
  <div id="tm-client" class="tm-value" title="—">—</div>
</div>

<div class="tm-row">
  <div class="tm-label">Серверный сид:</div>
  <div id="tm-server" class="tm-value" title="—">—</div>
</div>

<div class="tm-row stats">
  <div class="tm-stat-box">
    <span class="tm-label">Всего ставок</span>
    <div id="tm-total-bets" class="tm-stat-value">0</div>
  </div>
  <div class="tm-stat-box">
    <span class="tm-label">Смен сида</span>
    <div id="tm-rotations" class="tm-stat-value">0</div>
  </div>
</div>

<div class="tm-btn-group">
  <button id="tm-refresh" class="tm-btn">Обновить</button>
  <button id="tm-change" class="tm-btn primary">Сменить</button>
</div>

<div class="tm-btn-group">
  <button id="tm-export" class="tm-btn">Экспорт истории</button>
  <button id="tm-reset" class="tm-btn">Сброс всех данных</button>
</div>

        `;

        document.body.appendChild(panel);
        makePanelDraggable(panel);

        panel.querySelector('#tm-refresh').onclick = async () => {
            if (!currentModal) openFairnessModal();
            const modal = await waitForModal();
            switchToSeedsTab(modal);
            await new Promise(r => setTimeout(r, 300));
            updatePanelDisplay(modal);
            await new Promise(r => setTimeout(r, 800));
            closeModal(modal);
        };

        panel.querySelector('#tm-change').onclick = async () => {
            if (!currentModal) openFairnessModal();
            const modal = await waitForModal();
            switchToSeedsTab(modal);

            try {
                await new Promise(r => setTimeout(r, 500));
                updatePanelDisplay(modal);

                const logEntry = captureCurrentStateToString();
                addToHistory(logEntry);

                await waitForSeedForm(modal);
                await waitForChangeButton(modal);
                rotateSeed(modal);

                seedRotations++;
                setCounter(LS_ROTATIONS_KEY, seedRotations);
                setCounter(LS_LAST_READ_BETS_KEY, 0);

                await new Promise(r => setTimeout(r, 1000));
                updatePanelDisplay(modal);
                closeModal(modal);
            } catch (e) {
                console.warn(e);
            }
        };

        panel.querySelector('#tm-export').onclick = exportData;
        panel.querySelector('#tm-reset').onclick = resetCounters;

        updatePanelDisplay(null);
    }

    const observer = new MutationObserver(() => {
        const modal = document.querySelector('.wrapper.svelte-sfon24');
        if (modal && modal !== currentModal) {
            currentModal = modal;
            if (waitingResolver) { waitingResolver(modal); waitingResolver = null; }
        } else if (!modal) {
            currentModal = null;
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    createPanel();
})();
