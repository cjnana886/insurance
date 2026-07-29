// DOM Elements
const inputDate = document.getElementById('inputDate');
const fundName = document.getElementById('fundName');
const navUSD = document.getElementById('navUSD');
const exchangeRate = document.getElementById('exchangeRate');
const investAmountTWD = document.getElementById('investAmountTWD');
const feePercent = document.getElementById('feePercent');
const mgmtFeeInput = document.getElementById('mgmtFeeInput');

const scen1Rate = document.getElementById('scen1Rate');
const scen2Rate = document.getElementById('scen2Rate');

const btnFee43 = document.getElementById('btnFee43');
const btnFee55 = document.getElementById('btnFee55');
const btnFeeCustom = document.getElementById('btnFeeCustom');
const btnReset = document.getElementById('btnReset');
const btnPrint = document.getElementById('btnPrint');

// Preset Date to Today YYYY-MM-DD
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
if (inputDate) inputDate.value = `${yyyy}-${mm}-${dd}`;

// Set Fee Rate Handler
function setFeeRate(rate, name) {
    if (feePercent) feePercent.value = rate;
    updateActiveFeeButton(name);
    calculateAll();
}

function updateActiveFeeButton(name) {
    document.querySelectorAll('.fee-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
    });
    if (name === 'DSVA' && btnFee43) {
        btnFee43.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
    } else if (name === 'KVA' && btnFee55) {
        btnFee55.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
    } else if (btnFeeCustom) {
        btnFeeCustom.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
    }
}

// Reset to default values
function resetDefaults() {
    if (fundName) fundName.value = "富蘭克林穩定月收益基金";
    if (navUSD) navUSD.value = 9.92;
    if (exchangeRate) exchangeRate.value = 32.5;
    if (investAmountTWD) investAmountTWD.value = 300000;
    if (feePercent) feePercent.value = 4.3;
    if (mgmtFeeInput) mgmtFeeInput.value = 100;
    if (scen1Rate) scen1Rate.value = 0.067;
    if (scen2Rate) scen2Rate.value = 0.055;
    updateActiveFeeButton('DSVA');
    calculateAll();
}

// Formatters
function fmtTWD(num) {
    return "NT$ " + Math.round(num).toLocaleString('zh-TW');
}
function fmtUSD(num) {
    return "$" + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtUnits(num) {
    return num.toFixed(4);
}

// Main Calculation Function
function calculateAll() {
    const nav = parseFloat(navUSD?.value) || 0;
    const exRate = parseFloat(exchangeRate?.value) || 1;
    const investTWD = parseFloat(investAmountTWD?.value) || 0;
    const feePct = parseFloat(feePercent?.value) || 0;

    // Display Date
    const displayDate = document.getElementById('displayDate');
    if (displayDate && inputDate) {
        displayDate.innerText = `試算日期：${inputDate.value}`;
    }

    // Mgmt Fee Logic
    let mgmtTWD = 0;
    const mgmtFeeStatus = document.getElementById('mgmtFeeStatus');
    const investNotice = document.getElementById('investAmountNotice');

    if (investTWD >= 1200000) {
        mgmtTWD = 0;
        if (mgmtFeeStatus) {
            mgmtFeeStatus.innerText = "滿120萬 免收管理費";
            mgmtFeeStatus.className = "text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800";
        }
        if (investNotice) investNotice.className = "text-xs text-emerald-600 font-bold mt-1";
        if (mgmtFeeInput) {
            mgmtFeeInput.disabled = true;
            mgmtFeeInput.value = 0;
        }
    } else {
        if (mgmtFeeInput) {
            mgmtFeeInput.disabled = false;
            mgmtTWD = parseFloat(mgmtFeeInput.value) || 0;
        }
        if (mgmtFeeStatus) {
            mgmtFeeStatus.innerText = "未滿120萬 收取管理費";
            mgmtFeeStatus.className = "text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800";
        }
        if (investNotice) investNotice.className = "text-xs text-slate-500 mt-1";
    }

    // Math
    const feeTWD = investTWD * (feePct / 100);
    const feeUSD = exRate > 0 ? feeTWD / exRate : 0;

    const actualTWD = investTWD - feeTWD;
    const actualUSD = exRate > 0 ? actualTWD / exRate : 0;

    const units = nav > 0 ? actualUSD / nav : 0;

    const mgmtUSD = exRate > 0 ? mgmtTWD / exRate : 0;
    const mgmtUnits = nav > 0 ? mgmtUSD / nav : 0;

    // Update DOM - Step 1 & 2
    document.getElementById('feeCalculatedTWD').innerText = fmtTWD(feeTWD);
    document.getElementById('resFeeTWD').innerText = fmtTWD(feeTWD);
    document.getElementById('resFeeUSD').innerText = fmtUSD(feeUSD) + " USD";

    document.getElementById('resActualTWD').innerText = fmtTWD(actualTWD);
    document.getElementById('resActualUSD').innerText = fmtUSD(actualUSD) + " USD";

    document.getElementById('resUnits').innerText = fmtUnits(units);

    const mgmtFeeDetails = document.getElementById('mgmtFeeDetails');
    if (mgmtFeeDetails) {
        mgmtFeeDetails.innerHTML =
            `管理費 <b>NT$ ${mgmtTWD}</b> ＝ <b>${fmtUSD(mgmtUSD)} USD</b> ，換算單位數 <b>${mgmtUnits.toFixed(4)} 單位</b>`;
    }

    // Scenarios
    calcScenario('scen1', units, exRate, investTWD);
    calcScenario('scen2', units, exRate, investTWD);
}

function calcScenario(prefix, units, currentExRate, investTWD) {
    const rateElem = document.getElementById(`${prefix}Rate`);
    const divRatePerUnit = parseFloat(rateElem?.value) || 0;

    const monthlyUSD = units * divRatePerUnit;
    const monthlyTWD = monthlyUSD * currentExRate;
    const annualizedPct = investTWD > 0 ? ((monthlyTWD * 12) / investTWD) * 100 : 0;

    let lowRate = 30;
    let highRate = 33;

    if (currentExRate !== 32.5) {
        lowRate = Math.round((currentExRate - 2) * 10) / 10;
        highRate = Math.round((currentExRate + 2) * 10) / 10;
    }

    const lowTWD = monthlyUSD * lowRate;
    const midTWD = monthlyTWD;
    const highTWD = monthlyUSD * highRate;

    // DOM Updates
    document.getElementById(`${prefix}MonthlyUSD`).innerText = fmtUSD(monthlyUSD);
    document.getElementById(`${prefix}FormulaUSD`).innerText = `${units.toFixed(4)} × ${divRatePerUnit}`;

    document.getElementById(`${prefix}CurrRateText`).innerText = currentExRate;
    document.getElementById(`${prefix}MonthlyTWD`).innerText = fmtTWD(monthlyTWD);

    document.getElementById(`${prefix}Annualized`).innerText = annualizedPct.toFixed(3) + " %";

    document.getElementById(`${prefix}LowRateText`).innerText = lowRate;
    document.getElementById(`${prefix}MidRateText`).innerText = currentExRate;
    document.getElementById(`${prefix}HighRateText`).innerText = highRate;

    document.getElementById(`${prefix}LowTWD`).innerText = fmtTWD(lowTWD);
    document.getElementById(`${prefix}MidTWD`).innerText = fmtTWD(midTWD);
    document.getElementById(`${prefix}HighTWD`).innerText = fmtTWD(highTWD);
}

// Attach Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    // Input change listeners
    const inputs = [
        inputDate, fundName, navUSD, exchangeRate,
        investAmountTWD, feePercent, mgmtFeeInput,
        scen1Rate, scen2Rate
    ];

    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', calculateAll);
            input.addEventListener('change', calculateAll);
        }
    });

    // Buttons
    if (btnFee43) btnFee43.addEventListener('click', () => setFeeRate(4.3, 'DSVA'));
    if (btnFee55) btnFee55.addEventListener('click', () => setFeeRate(5.5, 'KVA'));
    if (btnFeeCustom) btnFeeCustom.addEventListener('click', () => setFeeRate(0, 'Custom'));
    if (btnReset) btnReset.addEventListener('click', resetDefaults);
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    // Initial render
    updateActiveFeeButton('DSVA');
    calculateAll();
});