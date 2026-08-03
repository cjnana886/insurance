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

const btnReset = document.getElementById('btnReset');
const btnPrint = document.getElementById('btnPrint');
const btnCalculate = document.getElementById('btnCalculate');
const resultsContainer = document.getElementById('resultsContainer');
const afterYearCard = document.getElementById('afterYearCard');
const validationError = document.getElementById('validationError');
const validationErrorText = document.getElementById('validationErrorText');

// Utility: Number formatting with thousands separator
function parseFormattedNumber(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

function formatThousands(val, decimals = 0) {
    const num = parseFormattedNumber(val);
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function fmtTWD(num) {
    return "NT$ " + formatThousands(num, 0);
}

function fmtUSD(num) {
    return "$" + formatThousands(num, 2) + " USD";
}

function fmtUnits(num) {
    return formatThousands(num, 4);
}

// Format Input Fields with Thousands Separators
function formatCurrencyInput(inputElem) {
    if (!inputElem) return;
    let rawVal = inputElem.value.replace(/[^0-9.]/g, '');
    if (rawVal === '') {
        inputElem.value = '';
        return;
    }
    let parts = rawVal.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    inputElem.value = parts.join('.');
}

// Preset Date YYYY-MM-DD
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
if (inputDate) inputDate.value = `${yyyy}-${mm}-${dd}`;

// Form Validation
function validateForm() {
    let isValid = true;
    let missingFields = [];

    const fieldsToValidate = [
        { elem: inputDate, name: "日期" },
        { elem: fundName, name: "基金名稱" },
        { elem: investAmountTWD, name: "投入金額" },
        { elem: navUSD, name: "淨值" },
        { elem: exchangeRate, name: "美金匯率" },
        { elem: feePercent, name: "手續費率" }
    ];

    if (mgmtFeeInput && !mgmtFeeInput.disabled) {
        fieldsToValidate.push({ elem: mgmtFeeInput, name: "管理費" });
    }

    fieldsToValidate.forEach(field => {
        if (!field.elem) return;
        const val = field.elem.value.trim();
        if (val === '' || val === null) {
            isValid = false;
            missingFields.push(field.name);
            field.elem.classList.add('border-red-500', 'bg-red-50');
            field.elem.classList.remove('border-slate-300', 'bg-slate-50');
        } else {
            field.elem.classList.remove('border-red-500', 'bg-red-50');
            field.elem.classList.add('border-slate-300', 'bg-slate-50');
        }
    });

    if (!isValid) {
        if (validationError && validationErrorText) {
            validationErrorText.innerText = `請填寫以下欄位（不可為空）：${missingFields.join('、')}`;
            validationError.classList.remove('hidden');
        }
        if (resultsContainer) {
            resultsContainer.classList.add('hidden');
        }
    } else {
        if (validationError) {
            validationError.classList.add('hidden');
        }
    }

    return isValid;
}

// Management Fee disabled state check
function checkMgmtFeeDisabledState() {
    if (!investAmountTWD) return;
    const investTWD = parseFormattedNumber(investAmountTWD.value);
    const mgmtFeeStatus = document.getElementById('mgmtFeeStatus');
    const investNotice = document.getElementById('investAmountNotice');

    if (investTWD >= 1200000) {
        if (mgmtFeeStatus) {
            mgmtFeeStatus.innerText = "滿 1,200,000 免收管理費";
            mgmtFeeStatus.className = "text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800";
        }
        if (investNotice) investNotice.className = "text-xs text-emerald-600 font-bold mt-1";
        if (mgmtFeeInput) {
            mgmtFeeInput.disabled = true;
            mgmtFeeInput.value = "0";
            mgmtFeeInput.classList.remove('border-red-500', 'bg-red-50');
        }
    } else {
        if (mgmtFeeInput) {
            mgmtFeeInput.disabled = false;
            const currentVal = parseFormattedNumber(mgmtFeeInput.value);
            if (currentVal === 0 || mgmtFeeInput.value === '0') {
                mgmtFeeInput.value = "100";
            }
        }
        if (mgmtFeeStatus) {
            mgmtFeeStatus.innerText = "未滿 1,200,000 收取管理費";
            mgmtFeeStatus.className = "text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800";
        }
        if (investNotice) investNotice.className = "text-xs text-slate-500 mt-1";
    }

    const feePct = parseFormattedNumber(feePercent?.value);
    const feeTWD = investTWD * (feePct / 100);
    const feeCalculatedTWD = document.getElementById('feeCalculatedTWD');
    if (feeCalculatedTWD) {
        feeCalculatedTWD.innerText = fmtTWD(feeTWD);
    }
}

// Reset to Defaults
function resetDefaults() {
    if (fundName) fundName.value = "富蘭克林穩定月收益基金";
    if (navUSD) navUSD.value = 9.92;
    if (exchangeRate) exchangeRate.value = 32.5;
    if (investAmountTWD) investAmountTWD.value = "300,000";
    if (feePercent) feePercent.value = 4.3;
    if (mgmtFeeInput) mgmtFeeInput.value = "100";
    if (scen1Rate) scen1Rate.value = 0.067;
    if (scen2Rate) scen2Rate.value = 0.055;
    
    checkMgmtFeeDisabledState();
    if (validationError) validationError.classList.add('hidden');
    if (resultsContainer) resultsContainer.classList.add('hidden');
}

// Main Calculation Function
function calculateAll() {
    if (!validateForm()) {
        return;
    }

    const nav = parseFormattedNumber(navUSD?.value);
    const exRate = parseFormattedNumber(exchangeRate?.value) || 1;
    const investTWD = parseFormattedNumber(investAmountTWD?.value);
    const feePct = parseFormattedNumber(feePercent?.value);

    // Display Date
    const displayDate = document.getElementById('displayDate');
    if (displayDate && inputDate) {
        displayDate.innerText = `試算日期：${inputDate.value}`;
    }

    let mgmtTWD = investTWD >= 1200000 ? 0 : parseFormattedNumber(mgmtFeeInput?.value);

    // Mathematical Calculations
    const feeTWD = investTWD * (feePct / 100);
    const feeUSD = exRate > 0 ? feeTWD / exRate : 0;

    const actualTWD = investTWD - feeTWD;
    const actualUSD = exRate > 0 ? actualTWD / exRate : 0;

    const units = nav > 0 ? actualUSD / nav : 0;

    const mgmtUSD = exRate > 0 ? mgmtTWD / exRate : 0;
    const mgmtUnits = nav > 0 ? mgmtUSD / nav : 0;

    // Update Screen DOM Results safely
    const setElemText = (id, text) => {
        const elem = document.getElementById(id);
        if (elem) elem.innerText = text;
    };

    setElemText('feeCalculatedTWD', fmtTWD(feeTWD));
    setElemText('resFeeTWD', fmtTWD(feeTWD));
    setElemText('resFeeUSD', fmtUSD(feeUSD));
    setElemText('resActualTWD', fmtTWD(actualTWD));
    setElemText('resActualUSD', fmtUSD(actualUSD));
    setElemText('resUnits', fmtUnits(units));

    const mgmtFeeDetails = document.getElementById('mgmtFeeDetails');
    if (mgmtFeeDetails) {
        mgmtFeeDetails.innerHTML = 
            `管理費 <b>NT$ ${formatThousands(mgmtTWD)}</b> ＝ <b>${fmtUSD(mgmtUSD)}</b> ，換算單位數 <b>${mgmtUnits.toFixed(4)} 單位</b>`;
    }

    // Scenarios (首年)
    calcScenario('scen1', units, exRate, investTWD);
    calcScenario('scen2', units, exRate, investTWD);

    // 根據投入金額是否滿 120W 決定是否顯示「一年後管理費扣除與配息試算區塊」
    if (investTWD >= 1200000) {
        if (afterYearCard) afterYearCard.classList.add('hidden');
    } else {
        if (afterYearCard) afterYearCard.classList.remove('hidden');
        calcAfterOneYear(units, mgmtUnits, exRate);
    }

    // Populate A4 Print Report Data
    populatePrintReport(investTWD, feeTWD, feeUSD, exRate, nav, actualTWD, actualUSD, mgmtTWD, mgmtUnits, units);

    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function calcScenario(prefix, units, currentExRate, investTWD) {
    const rateElem = document.getElementById(`${prefix}Rate`);
    const divRatePerUnit = parseFormattedNumber(rateElem?.value);

    const monthlyUSD = units * divRatePerUnit;
    const monthlyTWD = monthlyUSD * currentExRate;
    const roundedMonthlyTWD = Math.round(monthlyTWD);
    const annualizedPct = investTWD > 0 ? ((monthlyTWD * 12) / investTWD) * 100 : 0;

    let lowRate = currentExRate === 32.5 ? 30 : Math.round((currentExRate - 2) * 10) / 10;
    let highRate = currentExRate + 1.0;

    const lowTWD = monthlyUSD * lowRate;
    const midTWD = monthlyTWD;
    const highTWD = monthlyUSD * highRate;

    // DOM Updates safely
    const setElemText = (id, text) => {
        const elem = document.getElementById(id);
        if (elem) elem.innerText = text;
    };

    setElemText(`${prefix}CurrRateText`, currentExRate);
    setElemText(`${prefix}MonthlyTWD`, fmtTWD(monthlyTWD));

    const formulaTextElem = document.getElementById(`${prefix}FormulaText`);
    if (formulaTextElem) {
        formulaTextElem.innerText = `(${fmtUnits(units)} × ${divRatePerUnit}) × ${currentExRate}`;
    }

    const annualFormulaElem = document.getElementById(`${prefix}AnnualFormulaText`);
    if (annualFormulaElem) {
        annualFormulaElem.innerText = `(${formatThousands(roundedMonthlyTWD)} × 12) / ${formatThousands(investTWD)}`;
    }

    setElemText(`${prefix}Annualized`, formatThousands(annualizedPct, 3) + " %");

    setElemText(`${prefix}LowRateText`, lowRate);
    setElemText(`${prefix}MidRateText`, currentExRate);
    setElemText(`${prefix}HighRateText`, highRate);

    setElemText(`${prefix}LowTWD`, fmtTWD(lowTWD));
    setElemText(`${prefix}MidTWD`, fmtTWD(midTWD));
    setElemText(`${prefix}HighTWD`, fmtTWD(highTWD));
}

function calcAfterOneYear(initialUnits, monthlyMgmtUnits, currentExRate) {
    const divRatePerUnit = parseFormattedNumber(scen1Rate?.value) || 0.067;
    const yearMgmtUnits = monthlyMgmtUnits * 12;
    const remainingUnits = initialUnits - yearMgmtUnits;

    const afterYearMonthlyUSD = remainingUnits * divRatePerUnit;
    const afterYearMonthlyTWD = afterYearMonthlyUSD * currentExRate;

    const afterYearUnitsDetail = document.getElementById('afterYearUnitsDetail');
    if (afterYearUnitsDetail) {
        afterYearUnitsDetail.innerText = 
            `${fmtUnits(initialUnits)} - (${monthlyMgmtUnits.toFixed(4)} × 12) = ${fmtUnits(remainingUnits)} 單位`;
    }

    const afterYearRateText = document.getElementById('afterYearRateText');
    if (afterYearRateText) afterYearRateText.innerText = currentExRate;

    const afterYearMonthlyTWDElem = document.getElementById('afterYearMonthlyTWD');
    if (afterYearMonthlyTWDElem) {
        afterYearMonthlyTWDElem.innerText = fmtTWD(afterYearMonthlyTWD);
    }

    const afterYearCalcFormula = document.getElementById('afterYearCalcFormula');
    if (afterYearCalcFormula) {
        afterYearCalcFormula.innerText = 
            `${fmtUnits(remainingUnits)} × ${divRatePerUnit} × ${currentExRate} = ${formatThousands(Math.round(afterYearMonthlyTWD))}`;
    }
}

// Populate A4 Clean Print Report
function populatePrintReport(investTWD, feeTWD, feeUSD, exRate, nav, actualTWD, actualUSD, mgmtTWD, mgmtUnits, units) {
    const setElemText = (id, text) => {
        const elem = document.getElementById(id);
        if (elem) elem.innerText = text;
    };
    const setElemHTML = (id, html) => {
        const elem = document.getElementById(id);
        if (elem) elem.innerHTML = html;
    };

    const fundVal = fundName?.value || '';
    const feePctVal = parseFormattedNumber(feePercent?.value);

    setElemText('printReportFundTitle', `基金名稱：${fundVal}`);
    setElemText('printReportDate', `試算日期：${inputDate?.value || ''}`);
    setElemText('printInvestTWD', fmtTWD(investTWD));
    setElemText('printFeeLabel', `手續費金額 (${feePctVal}%)`);
    
    // 美元金額斷行顯示
    setElemHTML('printFeeTWD', `${fmtTWD(feeTWD)}<br><span class="text-[10px] text-slate-600 font-normal">(${fmtUSD(feeUSD)})</span>`);
    
    setElemText('printExRate', `${exRate}`);
    setElemText('printNavUSD', `$${nav} USD`);
    setElemHTML('printActualTWD', `${fmtTWD(actualTWD)}<br><span class="text-[10px] text-slate-600 font-normal">(${fmtUSD(actualUSD)})</span>`);

    if (investTWD >= 1200000) {
        setElemText('printMgmtFee', '滿 1,200,000 免收管理費');
    } else {
        setElemText('printMgmtFee', `NT$ ${formatThousands(mgmtTWD)} /月 (換算 ${mgmtUnits.toFixed(4)} 單位/月)`);
    }

    setElemText('printUnits', `${fmtUnits(units)} 單位`);

    // Exchange Rate Sensitivity Calculations
    let lowRate = exRate === 32.5 ? 30 : Math.round((exRate - 2) * 10) / 10;
    let highRate = exRate + 1.0;

    ['printLowRateText1', 'printLowRateText2'].forEach(id => setElemText(id, lowRate));
    ['printMidRateText1', 'printMidRateText2'].forEach(id => setElemText(id, exRate));
    ['printHighRateText1', 'printHighRateText2'].forEach(id => setElemText(id, highRate));

    // Scenario A (常用/預期配息率)
    const rate1 = parseFormattedNumber(scen1Rate?.value) || 0.067;
    const scen1MonthlyUSD = units * rate1;
    const scen1MidTWD = scen1MonthlyUSD * exRate;
    const scen1LowTWD = scen1MonthlyUSD * lowRate;
    const scen1HighTWD = scen1MonthlyUSD * highRate;

    const scen1LowAnnual = investTWD > 0 ? ((scen1LowTWD * 12) / investTWD) * 100 : 0;
    const scen1MidAnnual = investTWD > 0 ? ((scen1MidTWD * 12) / investTWD) * 100 : 0;
    const scen1HighAnnual = investTWD > 0 ? ((scen1HighTWD * 12) / investTWD) * 100 : 0;

    setElemText('printScen1Rate', `${rate1} USD`);
    setElemText('printScen1LowTWD', fmtTWD(scen1LowTWD));
    setElemText('printScen1MidTWD', fmtTWD(scen1MidTWD));
    setElemText('printScen1HighTWD', fmtTWD(scen1HighTWD));

    setElemText('printScen1LowAnnual', `${formatThousands(scen1LowAnnual, 3)} %`);
    setElemText('printScen1MidAnnual', `${formatThousands(scen1MidAnnual, 3)} %`);
    setElemText('printScen1HighAnnual', `${formatThousands(scen1HighAnnual, 3)} %`);

    // Scenario B (保守/極端配息率)
    const rate2 = parseFormattedNumber(scen2Rate?.value) || 0.055;
    const scen2MonthlyUSD = units * rate2;
    const scen2MidTWD = scen2MonthlyUSD * exRate;
    const scen2LowTWD = scen2MonthlyUSD * lowRate;
    const scen2HighTWD = scen2MonthlyUSD * highRate;

    const scen2LowAnnual = investTWD > 0 ? ((scen2LowTWD * 12) / investTWD) * 100 : 0;
    const scen2MidAnnual = investTWD > 0 ? ((scen2MidTWD * 12) / investTWD) * 100 : 0;
    const scen2HighAnnual = investTWD > 0 ? ((scen2HighTWD * 12) / investTWD) * 100 : 0;

    setElemText('printScen2Rate', `${rate2} USD`);
    setElemText('printScen2LowTWD', fmtTWD(scen2LowTWD));
    setElemText('printScen2MidTWD', fmtTWD(scen2MidTWD));
    setElemText('printScen2HighTWD', fmtTWD(scen2HighTWD));

    setElemText('printScen2LowAnnual', `${formatThousands(scen2LowAnnual, 3)} %`);
    setElemText('printScen2MidAnnual', `${formatThousands(scen2MidAnnual, 3)} %`);
    setElemText('printScen2HighAnnual', `${formatThousands(scen2HighAnnual, 3)} %`);

    // After 1 year
    const printAfterSection = document.getElementById('printAfterYearSection');
    if (investTWD >= 1200000) {
        if (printAfterSection) printAfterSection.classList.add('hidden');
    } else {
        if (printAfterSection) printAfterSection.classList.remove('hidden');
        const remainingUnits = units - (mgmtUnits * 12);
        const afterMonthlyTWD = remainingUnits * rate1 * exRate;
        setElemText('printAfterUnits', `${fmtUnits(remainingUnits)} 單位`);
        setElemText('printAfterMonthly', fmtTWD(afterMonthlyTWD));
    }

    // Timestamp
    const now = new Date();
    setElemText('printReportTimestamp', now.toLocaleString('zh-TW'));
}

// Attach Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    if (investAmountTWD) {
        investAmountTWD.addEventListener('input', (e) => {
            formatCurrencyInput(e.target);
            checkMgmtFeeDisabledState();
        });
    }

    if (mgmtFeeInput) {
        mgmtFeeInput.addEventListener('input', (e) => {
            formatCurrencyInput(e.target);
        });
    }

    if (feePercent) {
        feePercent.addEventListener('input', checkMgmtFeeDisabledState);
    }

    [scen1Rate, scen2Rate].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (resultsContainer && !resultsContainer.classList.contains('hidden')) {
                    calculateAll();
                }
            });
        }
    });

    if (btnCalculate) btnCalculate.addEventListener('click', calculateAll);
    if (btnReset) btnReset.addEventListener('click', resetDefaults);

    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            if (validateForm()) {
                calculateAll();
                window.print();
            }
        });
    }

    checkMgmtFeeDisabledState();
});