// ====================== CONFIG ======================
const API_KEY = "53c0391297564e8b91d9bb170a0d002e";

const PAIRS = [
    { symbol: "EUR/USD", name: "EUR/USD" },
    { symbol: "GBP/USD", name: "GBP/USD" },
    { symbol: "XAU/USD", name: "XAU/USD" },
    { symbol: "USD/JPY", name: "USD/JPY" }
];

// ====================== STATE ======================
let currentSymbol = "FX:EURUSD";
let currentInterval = "60";
let widget = null;
let isUpdating = false;
let currentStackIndex = 0;
let priceData = [];

// Swipe variables
let startX = 0;
let currentX = 0;
let isDragging = false;

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
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0d1321",
        enable_publishing: false,
        hide_top_toolbar: false,
        save_image: false,
        container_id: "tradingview_chart",
        backgroundColor: "#0d1321",
        gridColor: "rgba(255, 255, 255, 0.06)",
        allow_symbol_change: true
    });
}

// ====================== PRICE HELPERS ======================
function formatPrice(value, symbol) {
    if (value === null || value === undefined || isNaN(value)) return "-";
    if (symbol.indexOf("XAU") !== -1) return Number(value).toFixed(2);
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

async function fetchPair(symbol) {
    try {
        const url = "https://api.twelvedata.com/quote?symbol=" + encodeURIComponent(symbol) + "&apikey=" + API_KEY;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 429 || (data.message && data.message.toLowerCase().indexOf("limit") !== -1)) {
            return { error: "rate_limit" };
        }

        if (data.status === "error" || !data.close) {
            console.warn("API Error:", symbol, data);
            return null;
        }

        return {
            symbol: symbol,
            name: symbol,
            close: parseFloat(data.close),
            change: parseFloat(data.change),
            percent_change: parseFloat(data.percent_change),
            high: parseFloat(data.high),
            low: parseFloat(data.low)
        };
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

async function updatePrices() {
    if (isUpdating) return;
    isUpdating = true;

    const results = [];
    let rateLimited = false;

    for (let i = 0; i < PAIRS.length; i++) {
        const pair = PAIRS[i];
        const data = await fetchPair(pair.symbol);

        if (data && data.error === "rate_limit") {
            rateLimited = true;
            break;
        }

        if (data) {
            data.name = pair.name;
            results.push(data);
        }

        await new Promise(function(resolve) {
            setTimeout(resolve, 1100);
        });
    }

    if (!rateLimited && results.length > 0) {
        priceData = results;
        renderStack();
    }

    isUpdating = false;
}

// ====================== STACK LOGIC ======================
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

    // Dot click
    const dots = dotsContainer.querySelectorAll(".dot");
    for (let i = 0; i < dots.length; i++) {
        dots[i].addEventListener("click", function() {
            currentStackIndex = parseInt(this.getAttribute("data-index"));
            updateStackPositions();
        });
    }

    updateStackPositions();
    initSwipe();
}

function updateStackPositions() {
    const cards = document.querySelectorAll(".stack-card");
    const total = cards.length;

    for (let i = 0; i < total; i++) {
        const card = cards[i];
        const offset = (i - currentStackIndex + total) % total;

        if (offset === 0) {
            // Active card
            card.style.transform = "translateY(0) scale(1)";
            card.style.opacity = "1";
            card.style.zIndex = "10";
            card.style.boxShadow = "0 20px 40px rgba(0,0,0,0.45)";
        } else if (offset === 1) {
            card.style.transform = "translateY(14px) scale(0.96)";
            card.style.opacity = "0.7";
            card.style.zIndex = "5";
            card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)";
        } else if (offset === 2) {
            card.style.transform = "translateY(26px) scale(0.92)";
            card.style.opacity = "0.4";
            card.style.zIndex = "3";
            card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        } else {
            card.style.transform = "translateY(36px) scale(0.88)";
            card.style.opacity = "0";
            card.style.zIndex = "1";
        }
    }

    // Update dots
    const dots = document.querySelectorAll(".dot");
    for (let i = 0; i < dots.length; i++) {
        if (i === currentStackIndex) {
            dots[i].classList.add("active");
        } else {
            dots[i].classList.remove("active");
        }
    }
}

function initSwipe() {
    const wrapper = document.getElementById("stackWrapper");
    if (!wrapper) return;

    // Touch events
    wrapper.addEventListener("touchstart", onStart, { passive: true });
    wrapper.addEventListener("touchmove", onMove, { passive: true });
    wrapper.addEventListener("touchend", onEnd);

    // Mouse events
    wrapper.addEventListener("mousedown", onStart);
    wrapper.addEventListener("mousemove", onMove);
    wrapper.addEventListener("mouseup", onEnd);
    wrapper.addEventListener("mouseleave", onEnd);
}

function onStart(e) {
    isDragging = true;
    startX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    currentX = startX;
}

function onMove(e) {
    if (!isDragging) return;
    currentX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
}

function onEnd() {
    if (!isDragging) return;
    isDragging = false;

    const diff = currentX - startX;
    const threshold = 60;

    if (diff < -threshold) {
        // Swipe left → next
        currentStackIndex = (currentStackIndex + 1) % priceData.length;
        updateStackPositions();
    } else if (diff > threshold) {
        // Swipe right → previous
        currentStackIndex = (currentStackIndex - 1 + priceData.length) % priceData.length;
        updateStackPositions();
    }
}

// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", function() {
    createWidget(currentSymbol, currentInterval);
    updatePrices();

    setInterval(updatePrices, 80000);

    // Timeframe buttons
    const tfs = document.querySelectorAll(".tf");
    for (let i = 0; i < tfs.length; i++) {
        tfs[i].addEventListener("click", function() {
            for (let j = 0; j < tfs.length; j++) {
                tfs[j].classList.remove("active");
            }
            this.classList.add("active");
            currentInterval = this.getAttribute("data-interval");
            createWidget(currentSymbol, currentInterval);
        });
    }

    // Pair selector (changes chart only)
    const pairSelect = document.getElementById("pairSelect");
    if (pairSelect) {
        pairSelect.addEventListener("change", function(e) {
            const map = {
                EURUSD: "FX:EURUSD",
                GBPUSD: "FX:GBPUSD",
                USDJPY: "FX:USDJPY",
                XAUUSD: "OANDA:XAUUSD",
                BTCUSD: "BINANCE:BTCUSDT"
            };
            currentSymbol = map[e.target.value] || "FX:EURUSD";
            createWidget(currentSymbol, currentInterval);
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", function() {
            refreshBtn.style.transform = "rotate(360deg)";
            refreshBtn.style.transition = "transform 0.6s ease";
            setTimeout(function() {
                refreshBtn.style.transform = "rotate(0deg)";
            }, 600);

            updatePrices();
            createWidget(currentSymbol, currentInterval);
        });
    }

    console.log("FX Dashboard ready - Stack UI");
});
