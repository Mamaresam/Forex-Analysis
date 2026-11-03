// ====================== CONFIG ======================
const API_KEY = "53c0391297564e8b91d9bb170a0d002e";

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
    // Recreate chart with new theme
    createWidget(currentSymbol, currentInterval);
}

// ====================== TRADINGVIEW ======================
function createWidget(symbol, interval) {
    const container = document.getElementById("tradingview_chart");
    if (!container) return;
    container.innerHTML = "";

    const isLight = document.body.classList.contains("light");

    widget = new TradingView.widget({
        width: "100%",
        height: 400,
        symbol: symbol,
        interval: interval,
        timezone: "Etc/UTC",
        theme: isLight ? "light" : "dark",
        style: "1",
        locale: "en",
        toolbar_bg: isLight ? "#f1f5f9" : "#0d1321",
        enable_publishing: false,
        hide_top_toolbar: false,
        save_image: false,
        container_id: "tradingview_chart",
        backgroundColor: isLight ? "#f1f5f9" : "#0d1321",
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

    if (gold) list.push(gold);

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

// ====================== DISINTEGRATION EFFECT ======================
function disintegrateCard(card, direction, callback) {
    const rect = card.getBoundingClientRect();
    const wrapper = document.getElementById("stackWrapper");
    const particleCount = 55;
    const particles = [];

    // Hide original card immediately
    card.style.opacity = "0";
    card.style.pointerEvents = "none";

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement("div");
        p.className = "particle";

        const size = 4 + Math.random() * 7;
        const startX = Math.random() * rect.width;
        const startY = Math.random() * rect.height;

        p.style.width = size + "px";
        p.style.height = size + "px";
        p.style.left = (rect.left - wrapper.getBoundingClientRect().left + startX) + "px";
        p.style.top = (rect.top - wrapper.getBoundingClientRect().top + startY) + "px";
        p.style.background = Math.random() > 0.4 ? "var(--accent)" : (Math.random() > 0.5 ? "var(--up)" : "var(--down)");
        p.style.opacity = "0.9";

        wrapper.appendChild(p);
        particles.push(p);

        // Random velocity
        const angle = direction === "left" ? (Math.PI + (Math.random() - 0.5) * 1.1) : ((Math.random() - 0.5) * 1.1);
        const speed = 80 + Math.random() * 160;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed * 0.7 - 30;
        const rot = (Math.random() - 0.5) * 720;

        // Animate with CSS transition
        requestAnimationFrame(function () {
            p.style.transition = "transform 0.7s cubic-bezier(0.15, 0.7, 0.3, 1), opacity 0.7s ease";
            p.style.transform = "translate(" + vx + "px, " + vy + "px) rotate(" + rot + "deg) scale(0.2)";
            p.style.opacity = "0";
        });
    }

    // Cleanup
    setTimeout(function () {
        for (let i = 0; i < particles.length; i++) {
            if (particles[i].parentNode) particles[i].parentNode.removeChild(particles[i]);
        }
        if (callback) callback();
    }, 720);
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

    const dots = dotsContainer.querySelectorAll(".dot");
    for (let i = 0; i < dots.length; i++) {
        dots[i].addEventListener("click", function () {
            if (isAnimating) return;
            const newIndex = parseInt(this.getAttribute("data-index"));
            if (newIndex === currentStackIndex) return;
            const dir = newIndex > currentStackIndex ? "left" : "right";
            goToIndex(newIndex, dir);
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

        card.style.transition = "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease";

        if (offset === 0) {
            card.style.transform = "translateY(0) scale(1)";
            card.style.opacity = "1";
            card.style.zIndex = "10";
            card.style.pointerEvents = "auto";
        } else if (offset === 1) {
            card.style.transform = "translateY(16px) scale(0.95)";
            card.style.opacity = "0.6";
            card.style.zIndex = "5";
            card.style.pointerEvents = "none";
        } else if (offset === 2) {
            card.style.transform = "translateY(30px) scale(0.90)";
            card.style.opacity = "0.3";
            card.style.zIndex = "3";
            card.style.pointerEvents = "none";
        } else {
            card.style.transform = "translateY(40px) scale(0.85)";
            card.style.opacity = "0";
            card.style.zIndex = "1";
            card.style.pointerEvents = "none";
        }
    }

    // Dots
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

    // Disintegrate current card
    disintegrateCard(currentCard, direction, function () {
        currentStackIndex = newIndex;
        updateStackPositions();
        isAnimating = false;
    });
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
    const threshold = 50;

    if (diff < -threshold) {
        const next = (currentStackIndex + 1) % priceData.length;
        goToIndex(next, "left");
    } else if (diff > threshold) {
        const prev = (currentStackIndex - 1 + priceData.length) % priceData.length;
        goToIndex(prev, "right");
    }
}

// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    createWidget(currentSymbol, currentInterval);
    updatePrices();

    setInterval(updatePrices, 60000);

    document.getElementById("themeBtn").addEventListener("click", toggleTheme);

    const tfs = document.querySelectorAll(".tf");
    for (let i = 0; i < tfs.length; i++) {
        tfs[i].addEventListener("click", function () {
            for (let j = 0; j < tfs.length; j++) tfs[j].classList.remove("active");
            this.classList.add("active");
            currentInterval = this.getAttribute("data-interval");
            createWidget(currentSymbol, currentInterval);
        });
    }

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

    console.log("FX Dashboard - Disintegration ready");
});
