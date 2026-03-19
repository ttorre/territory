// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.page-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.page-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
    });
});

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
    discount: 27,       // slider 0-50
    size: 450,
    minMat: 3,
    maxMat: 12,
    shares: 80,
    cap: 80,
    floor: 120,
    // Matrix axis options (months)
    yAxis: [9, 7, 5, 3, 1],   // min maturity rows (top→bottom)
    xAxis: [1, 3, 5, 7, 9, 11] // max maturity cols (left→right)
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function discountPercent() {
    return 0.70 + (state.discount / 50) * 0.10; // 0.70% – 0.80%
}

function sharePrice() {
    return (discountPercent() / 100 * 45.25).toFixed(2);
}

function computeCellValue(rowIdx, colIdx) {
    // N/A only for the extreme invalid case (top-left corner variants)
    const minM = state.yAxis[rowIdx];
    const maxM = state.xAxis[colIdx];
    if (minM > maxM && maxM === 1 && minM >= 9) return null;

    const base = discountPercent() - 0.07; // anchors values ~0.71 at default
    const val = base + colIdx * 0.01 + rowIdx * 0.01;
    return Math.round(val * 100) / 100;
}

function getCellColor(value, minVal, maxVal) {
    const ratio = maxVal === minVal ? 0.5 : (value - minVal) / (maxVal - minVal);
    const lightness = Math.round(82 - ratio * 50); // 82% → 32%
    const saturation = Math.round(45 + ratio * 35); // 45% → 80%
    return `hsl(275, ${saturation}%, ${lightness}%)`;
}

// Find the cell closest to current minMat/maxMat slider values
function isSelectedCell(minM, maxM) {
    const closestMin = state.yAxis.reduce((a, b) =>
        Math.abs(b - state.minMat) < Math.abs(a - state.minMat) ? b : a);
    const closestMax = state.xAxis.reduce((a, b) =>
        Math.abs(b - state.maxMat) < Math.abs(a - state.maxMat) ? b : a);
    return minM === closestMin && maxM === closestMax;
}

// ── Heatmap render ────────────────────────────────────────────────────────────
function renderHeatmap() {
    // Collect all valid values for color scale
    const allVals = [];
    for (let r = 0; r < state.yAxis.length; r++) {
        for (let c = 0; c < state.xAxis.length; c++) {
            const v = computeCellValue(r, c);
            if (v !== null) allVals.push(v);
        }
    }
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);

    let html = '<div class="hm-grid">';
    html += '<div class="hm-y-axis">Minimum Maturity</div>';
    html += '<div class="hm-body">';

    // Data rows
    for (let r = 0; r < state.yAxis.length; r++) {
        html += '<div class="hm-row">';
        html += `<div class="hm-row-label">${state.yAxis[r]}m</div>`;
        for (let c = 0; c < state.xAxis.length; c++) {
            const val = computeCellValue(r, c);
            if (val === null) {
                html += '<div class="hm-cell hm-cell-na">N/A</div>';
            } else {
                const color = getCellColor(val, minVal, maxVal);
                const selected = isSelectedCell(state.yAxis[r], state.xAxis[c]);
                html += `<div class="hm-cell${selected ? ' hm-cell-selected' : ''}" style="background:${color}" title="${state.yAxis[r]}m min / ${state.xAxis[c]}m max">${val.toFixed(2)}%</div>`;
            }
        }
        html += '</div>';
    }

    // Column labels
    html += '<div class="hm-col-labels">';
    for (let c = 0; c < state.xAxis.length; c++) {
        html += `<div class="hm-col-label">${state.xAxis[c]}m</div>`;
    }
    html += '</div>';

    html += '</div></div>'; // hm-body, hm-grid
    document.getElementById('heatmapWrapper').innerHTML = html;
}

// ── Update info bar ───────────────────────────────────────────────────────────
function updateInfoBar() {
    const closestMin = state.yAxis.reduce((a, b) =>
        Math.abs(b - state.minMat) < Math.abs(a - state.minMat) ? b : a);
    const closestMax = state.xAxis.reduce((a, b) =>
        Math.abs(b - state.maxMat) < Math.abs(a - state.maxMat) ? b : a);

    document.getElementById('infoMinMat').textContent = closestMin + 'mo';
    document.getElementById('infoMaxMat').textContent = closestMax + 'mo';

    const dp = discountPercent().toFixed(2);
    const sp = sharePrice();
    document.getElementById('infoDiscount').textContent = `${dp}% - $${sp}`;
}

// ── Slider updates ────────────────────────────────────────────────────────────
function updateSliderTrack(slider) {
    const min = +slider.min, max = +slider.max, val = +slider.value;
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--val', pct + '%');
    // Inline background fallback for browsers that don't support the custom property in track
    slider.style.background = `linear-gradient(to right, #1976d2 ${pct}%, #dce3ee ${pct}%)`;
}

document.getElementById('discountSlider').addEventListener('input', e => {
    state.discount = +e.target.value;
    const dp = discountPercent().toFixed(2);
    const sp = sharePrice();
    document.getElementById('discountDisplay').textContent = `${dp}% - $${sp}/Share`;
    updateSliderTrack(e.target);
    updateInfoBar();
    renderHeatmap();
});

document.getElementById('sizeSlider').addEventListener('input', e => {
    state.size = +e.target.value;
    document.getElementById('sizeDisplay').textContent = state.size + 'M';
    updateSliderTrack(e.target);
});

document.getElementById('minMatSlider').addEventListener('input', e => {
    state.minMat = +e.target.value;
    document.getElementById('minMatDisplay').textContent = state.minMat + 'mo';
    updateSliderTrack(e.target);
    updateInfoBar();
    renderHeatmap();
});

document.getElementById('maxMatSlider').addEventListener('input', e => {
    state.maxMat = +e.target.value;
    document.getElementById('maxMatDisplay').textContent = state.maxMat + 'mo';
    updateSliderTrack(e.target);
    updateInfoBar();
    renderHeatmap();
});

document.getElementById('sharesSlider').addEventListener('input', e => {
    state.shares = +e.target.value;
    document.getElementById('sharesDisplay').textContent = state.shares + '%';
    updateSliderTrack(e.target);
});

document.getElementById('capSlider').addEventListener('input', e => {
    state.cap = +e.target.value;
    document.getElementById('capDisplay').textContent = state.cap + '%';
    updateSliderTrack(e.target);
});

document.getElementById('floorSlider').addEventListener('input', e => {
    state.floor = +e.target.value;
    document.getElementById('floorDisplay').textContent = state.floor + '%';
    updateSliderTrack(e.target);
});

// ── Date picker ───────────────────────────────────────────────────────────────
document.getElementById('effectiveDate').addEventListener('change', e => {
    const d = new Date(e.target.value + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    document.getElementById('effectiveDisplay').textContent =
        `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
});

// ── Price protection toggle ───────────────────────────────────────────────────
document.getElementById('priceProtToggle').addEventListener('change', e => {
    const on = e.target.checked;
    document.getElementById('priceProtDisplay').textContent = on ? 'Collared' : 'Uncollared';
    document.getElementById('capControl').style.display = on ? '' : 'none';
    document.getElementById('floorControl').style.display = on ? '' : 'none';
});

// ── Matrix axis add/remove ────────────────────────────────────────────────────
const Y_STEP = 2; // months
const X_STEP = 2;

document.getElementById('addRowTop').addEventListener('click', () => {
    const next = state.yAxis[0] + Y_STEP;
    if (next <= 24) { state.yAxis.unshift(next); renderHeatmap(); }
});

document.getElementById('addRowBtn').addEventListener('click', () => {
    const next = state.yAxis[state.yAxis.length - 1] - Y_STEP;
    if (next >= 1) { state.yAxis.push(next); renderHeatmap(); }
});

document.getElementById('removeRowBtn').addEventListener('click', () => {
    if (state.yAxis.length > 2) { state.yAxis.shift(); renderHeatmap(); }
});

document.getElementById('addColBtn').addEventListener('click', () => {
    const next = state.xAxis[state.xAxis.length - 1] + X_STEP;
    if (next <= 24) { state.xAxis.push(next); renderHeatmap(); }
});

document.getElementById('removeColBtn').addEventListener('click', () => {
    if (state.xAxis.length > 2) { state.xAxis.pop(); renderHeatmap(); }
});

// ── Sub-nav tabs ──────────────────────────────────────────────────────────────
document.querySelectorAll('.ib-subnav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.ib-subnav-tab').forEach(t => t.classList.remove('ib-tab-active'));
        if (!tab.classList.contains('ib-tab-analyze') && !tab.classList.contains('ib-tab-build')) {
            tab.classList.add('ib-tab-active');
        }
    });
});

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
    // Set initial slider track fills
    document.querySelectorAll('.ib-slider').forEach(updateSliderTrack);
    updateInfoBar();
    renderHeatmap();
})();
