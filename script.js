// ====================== CONFIG ======================
const API_KEY = "53c0391297564e8b91d9bb170a0d002e";

// Only Gold is fetched live. Others are static placeholders for now.
const PAIRS = [
    { symbol: "XAU/USD", name: "XAU/USD", live: true },
    { symbol: "EUR/USD", name: "EUR/USD", live: false, close: 1.0854, change: 0.0012, percent_change: 0.11, high: 1.0871, low: 1.0832 },
    { symbol: "GBP/USD", name: "GBP/USD", live: false, close: 1.2648, change: -0.0009, percent_change: -0.07, high: 1.2675, low: 1.2621 },
    { symbol: "USD/JPY", name: "USD/JPY", live: false, close: 153.42, change: 0.08, percent_change: 0.05, high: 153.65, low: 152.98 },
    { symbol: "BTC/USD", name: "BTC/USD", live: false, close: 67420, change: 420, percent_change: 0.63, high: 68100, low: 66850 },
    { symbol: "EUR/JPY", name: "EUR/JPY", live: false, close: 166.52, change: 0.15, percent_change: 0.09, high: 166.90, low: 165.80 },
    { symbol: "AUD/USD", name: "AUD/USD", live: false, close: 0.6621, change: -0.0011, percent_change: -0.17, high: 0.6645, low: 0.6602 }
];

// ====================== STATE ======================
let currentSymbol = "OANDA:XAUUSD";
let currentInterval = "60";
let widget = null;
let isUpdating = false;
let currentStackIndex = 0;
let priceData = [];
let isAnimating = false;

// Swipe
let startX = 0;
let currentX = 0;
let isDragging = false;

// ====================== THEME ======================
function initTheme() {
    const saved = localStorage.getItem("fx-theme");
    if (saved === "light") {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        document.getElementById("themeBtn").textContent = "☀";
    } else {
        document.body.classList.add("dark");
        document.getElementById("themeBtn").textContent = "☾";
    }
}

function toggleTheme() {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        document.getElementById("themeBtn").textContent = "☀";
        localStorage.setItem("fx-theme", "light");
    } else {
        document.body.classList.remove("light");
        document.body.classList.add("dark");
        document.getElementById("themeBtn").textContent = "☾";
        localStorage.setItem("fx-theme", "dark");
    }
}

// ====================== TRADINGVIEW ======================
function createWidget(symbol, interval) {
    const container = document.getElementById("tradingview_chart");
    if (!container) return;
    container.innerHTML = "";

    widget = new TradingView.widget({
        width: "100%",
        height: 400,
        symbol: symbol,
        interval: interval,
        timezone: "Etc/UTC",
        theme: document.body.classList.contains("light") ? "light" : "dark",
        style: "1",
        locale: "en",
        toolbar_bg: document.body.classList.contains("light") ? "#f1f5f9" : "#0d1321",
        enable_publishing: false,
        hide_top_toolbar: false,
        save_image: false,
        container_id: "tradingview_chart",
        backgroundColor: document.body.classList.contains("light") ? "#f1f5f9" : "#0d1321",
        gridColor: "rgba(128,128,128,0.1)",
        allow_symbol_change: true
    });
}

// ====================== PRICE HELPERS ======================
function formatPrice(value, symbol) {
    if (value === null || value === undefined || isNaN(value)) return "-";
    if (symbol.indexOf("XAU") !== -1 || symbol.indexOf("BTC") !== -1) return Number(value).toFixed(2);
    if (symbol.indexOf("JPY") !== -1) return Number(value).toFixed(3);
    return Number(value).toFixed(5);
}

function createStackCardHTML(data, index) {
    const isUp = data.percent_change >= 0;
    const changeClass = isUp ? "up" : "down";
    const sign = isUp ? "+" : "";
    const percent = Number(data.percent_change).toFixed(2);

    return '' +
        '<div class="stack-card" data-index="' + index + '">' +
            '<span class="badge ' + changeClass + '">' + sign + percent + '%</span>' +
            '<div class="pair-name">' + data.name + '</div>' +
            '<div class="price">' + formatPrice(data.close, data.symbol) + '</div>' +
            '<div class="price-change ' + changeClass + '">' + sign + formatPrice(data.change, data.symbol) + '</div>' +
            '<div class="card-footer">' +
                '<span>High: ' + formatPrice(data.high, data.symbol) + '</span>' +
                '<span>Low: ' + formatPrice(data.low, data.symbol) + '</span>' +
            '</div>' +
        '</div>';
}

async function fetchGold() {
    try {
        const url = "https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=" + API_KEY;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "error" || !data.close) return null;

        return {
            symbol: "XAU/USD",
            name: "XAU/USD",
            close: parseFloat(data.close),
            change: parseFloat(data.change),
            percent_change: parseFloat(data.percent_change),
            high: parseFloat(data.high),
            low: parseFloat(data.low),
            live: true
        };
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function updatePrices() {
    if (isUpdating) return;
    isUpdating = true;

    const gold = await fetchGold();
    const list = [];

    // Put live gold first if available
    if (gold) list.push(gold);

    // Add the rest (static for now)
    for (let i = 0; i < PAIRS.length; i++) {
        const p = PAIRS[i];
        if (p.symbol === "XAU/USD") continue;
        list.push({
            symbol: p.symbol,
            name: p.name,
            close: p.close,
            change: p.change,
            percent_change: p.percent_change,
            high: p.high,
            low: p.low,
            live: false
        });
    }

    if (list.length > 0) {
        priceData = list;
        renderStack();
    }

    isUpdating = false;
}

// ====================== STACK + ANIMATION ======================
function renderStack() {
    const wrapper = document.getElementById("stackWrapper");
    const dotsContainer = document.getElementById("stackDots");
    if (!wrapper || !priceData.length) return;

    let html = "";
    for (let i = 0; i < priceData.length; i++) {
        html += createStackCardHTML(priceData[i], i);
    }
    wrapper.innerHTML = html;

    // Dots
    let dotsHtml = "";
    for (let i = 0; i < priceData.length; i++) {
        dotsHtml += '<div class="dot' + (i === currentStackIndex ? ' active' : '') + '" data-index="' + i + '"></div>';
    }
    dotsContainer.innerHTML = dotsHtml;

    const dots = dotsContainer.querySelectorAll(".dot");
    for (let i = 0; i < dots.length; i++) {
        dots[i].addEventListener("click", function () {
            if (isAnimating) return;
            const newIndex = parseInt(this.getAttribute("data-index"));
            if (newIndex === currentStackIndex) return;
            goToIndex(newIndex);
        });
    }

    updateStackPositions(false);
    initSwipe();
}

function updateStackPositions(withEnterAnimation) {
    const cards = document.querySelectorAll(".stack-card");
    const total = cards.length;

    for (let i = 0; i < total; i++) {
        const card = cards[i];
        const offset = (i - currentStackIndex + total) % total;

        card.classList.remove("exit-left", "exit-right", "enter");

        if (offset === 0) {
            card.style.transform = "translateY(0) scale(1)";
            card.style.opacity = "1";
            card.style.filter = "blur(0)";
            card.style.zIndex = "10";
            if (withEnterAnimation) card.classList.add("enter");
        } else if (offset === 1) {
            card.style.transform = "translateY(16px) scale(0.95)";
            card.style.opacity = "0.65";
            card.style.filter = "blur(0)";
            card.style.zIndex = "5";
        } else if (offset === 2) {
            card.style.transform = "translateY(30px) scale(0.90)";
            card.style.opacity = "0.35";
            card.style.filter = "blur(0)";
            card.style.zIndex = "3";
        } else {
            card.style.transform = "translateY(40px) scale(0.85)";
            card.style.opacity = "0";
            card.style.zIndex = "1";
        }
    }

    // Update dots
    const dots = document.querySelectorAll(".dot");
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle("active", i === currentStackIndex);
    }
}

function goToIndex(newIndex, direction) {
    if (isAnimating || newIndex === currentStackIndex) return;
    isAnimating = true;

    const cards = document.querySelectorAll(".stack-card");
    const currentCard = cards[currentStackIndex];

    // Exit animation
    if (direction === "left") {
        currentCard.classList.add("exit-left");
    } else if (direction === "right") {
        currentCard.classList.add("exit-right");
    } else {
        // fallback
        currentCard.classList.add(newIndex > currentStackIndex ? "exit-left" : "exit-right");
    }

    setTimeout(function () {
        currentStackIndex = newIndex;
        updateStackPositions(true);
        isAnimating = false;
    }, 380);
}

function initSwipe() {
    const wrapper = document.getElementById("stackWrapper");
    if (!wrapper) return;

    wrapper.addEventListener("touchstart", onStart, { passive: true });
    wrapper.addEventListener("touchmove", onMove, { passive: true });
    wrapper.addEventListener("touchend", onEnd);

    wrapper.addEventListener("mousedown", onStart);
    wrapper.addEventListener("mousemove", onMove);
    wrapper.addEventListener("mouseup", onEnd);
    wrapper.addEventListener("mouseleave", onEnd);
}

function onStart(e) {
    if (isAnimating) return;
    isDragging = true;
    startX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    currentX = startX;
}

function onMove(e) {
    if (!isDragging) return;
    currentX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
}

function onEnd() {
    if (!isDragging || isAnimating) return;
    isDragging = false;

    const diff = currentX - startX;
    const threshold = 55;

    if (diff < -threshold) {
        // swipe left → next
        const next = (currentStackIndex + 1) % priceData.length;
        goToIndex(next, "left");
    } else if (diff > threshold) {
        // swipe right → prev
        const prev = (currentStackIndex - 1 + priceData.length) % priceData.length;
        goToIndex(prev, "right");
    }
}

// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    createWidget(currentSymbol, currentInterval);
    updatePrices();

    // Refresh gold every 60s
    setInterval(updatePrices, 60000);

    // Theme button
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);

    // Timeframes
    const tfs = document.querySelectorAll(".tf");
    for (let i = 0; i < tfs.length; i++) {
        tfs[i].addEventListener("click", function () {
            for (let j = 0; j < tfs.length; j++) tfs[j].classList.remove("active");
            this.classList.add("active");
            currentInterval = this.getAttribute("data-interval");
            createWidget(currentSymbol, currentInterval);
        });
    }

    // Pair selector (chart only)
    const pairSelect = document.getElementById("pairSelect");
    if (pairSelect) {
        pairSelect.addEventListener("change", function (e) {
            const map = {
                EURUSD: "FX:EURUSD",
                GBPUSD: "FX:GBPUSD",
                USDJPY: "FX:USDJPY",
                XAUUSD: "OANDA:XAUUSD",
                BTCUSD: "BINANCE:BTCUSDT"
            };
            currentSymbol = map[e.target.value] || "OANDA:XAUUSD";
            createWidget(currentSymbol, currentInterval);
        });
    }

    // Refresh
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", function () {
            refreshBtn.style.transform = "rotate(360deg)";
            refreshBtn.style.transition = "transform 0.55s ease";
            setTimeout(function () {
                refreshBtn.style.transform = "rotate(0deg)";
            }, 550);
            updatePrices();
            createWidget(currentSymbol, currentInterval);
        });
    }

    console.log("FX Dashboard - Stack + Theme ready");
});
