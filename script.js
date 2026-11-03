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

// ====================== TRADINGVIEW ======================
function createWidget(symbol, interval) {
    const container = document.getElementById("tradingview_chart");
    if (!container) return;
    container.innerHTML = "";

    widget = new TradingView.widget({
        width: "100%",
        height: 420,
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

// ====================== PRICE CARDS ======================
function formatPrice(value, symbol) {
    if (value === null || value === undefined || isNaN(value)) return "-";
    if (symbol.includes("XAU")) return Number(value).toFixed(2);
    if (symbol.includes("JPY")) return Number(value).toFixed(3);
    return Number(value).toFixed(5);
}

function createCardHTML(data) {
    const isUp = data.percent_change >= 0;
    const changeClass = isUp ? "up" : "down";
    const sign = isUp ? "+" : "";

    return `
        <div class="card price-card">
            <div class="card-header">
                <span class="pair-name">${data.name}</span>
                <span class="badge \( {changeClass}"> \){sign}${Number(data.percent_change).toFixed(2)}%</span>
            </div>
            <div class="price">${formatPrice(data.close, data.symbol)}</div>
            <div class="price-change ${changeClass}">
                \( {sign} \){formatPrice(data.change, data.symbol)}
            </div>
            <div class="card-footer">
                <span>High: ${formatPrice(data.high, data.symbol)}</span>
                <span>Low: ${formatPrice(data.low, data.symbol)}</span>
            </div>
        </div>
    `;
}

async function fetchPair(symbol) {
    try {
        const url = `https://api.twelvedata.com/quote?symbol=\( {encodeURIComponent(symbol)}&apikey= \){API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 429 || (data.message && data.message.toLowerCase().includes("limit"))) {
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

async function updatePriceCards() {
    if (isUpdating) return;
    isUpdating = true;

    const container = document.getElementById("priceCards");
    if (!container) {
        isUpdating = false;
        return;
    }

    container.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:#94a3b8; padding:40px;">Loading live prices...</div>`;

    const results = [];
    let rateLimited = false;

    for (const pair of PAIRS) {
        const data = await fetchPair(pair.symbol);

        if (data && data.error === "rate_limit") {
            rateLimited = true;
            break;
        }

        if (data) {
            data.name = pair.name;
            results.push(data);
        }

        // Delay to stay under free limit
        await new Promise(r => setTimeout(r, 1000));
    }

    if (rateLimited) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; color:#f59e0b; padding:40px;">
                Rate limit reached (Free plan limit).<br>
                Wait 1 minute then click the Refresh button.
            </div>`;
    } else if (results.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; color:#f43f5e; padding:40px;">
                Failed to load prices.<br>
                Open browser console (F12) for details.
            </div>`;
    } else {
        container.innerHTML = results.map(createCardHTML).join("");
    }

    isUpdating = false;
}

// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", () => {
    createWidget(currentSymbol, currentInterval);
    updatePriceCards();

    // Auto refresh every 75 seconds
    setInterval(updatePriceCards, 75000);

    // Timeframe buttons
    document.querySelectorAll(".tf").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tf").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentInterval = btn.getAttribute("data-interval");
            createWidget(currentSymbol, currentInterval);
        });
    });

    // Pair selector
    const pairSelect = document.getElementById("pairSelect");
    if (pairSelect) {
        pairSelect.addEventListener("change", (e) => {
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
        refreshBtn.addEventListener("click", () => {
            refreshBtn.style.transform = "rotate(360deg)";
            refreshBtn.style.transition = "transform 0.6s ease";
            setTimeout(() => {
                refreshBtn.style.transform = "rotate(0deg)";
            }, 600);

            updatePriceCards();
            createWidget(currentSymbol, currentInterval);
        });
    }

    console.log("FX Dashboard ready");
});
