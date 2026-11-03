// FX Dashboard - Core Script

let currentSymbol = "FX:EURUSD";
let currentInterval = "60";
let widget = null;

const symbolMap = {
    EURUSD: "FX:EURUSD",
    GBPUSD: "FX:GBPUSD",
    USDJPY: "FX:USDJPY",
    XAUUSD: "OANDA:XAUUSD",
    BTCUSD: "BINANCE:BTCUSDT"
};

function createWidget(symbol, interval) {
    // Clear previous widget
    const container = document.getElementById("tradingview_chart");
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
        hide_legend: false,
        save_image: false,
        container_id: "tradingview_chart",
        backgroundColor: "#0d1321",
        gridColor: "rgba(255, 255, 255, 0.06)",
        allow_symbol_change: true
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Initial chart
    createWidget(currentSymbol, currentInterval);

    // Timeframe buttons
    const timeframeBtns = document.querySelectorAll(".tf");
    timeframeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            timeframeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentInterval = btn.getAttribute("data-interval");
            createWidget(currentSymbol, currentInterval);
        });
    });

    // Pair selector
    const pairSelect = document.getElementById("pairSelect");
    if (pairSelect) {
        pairSelect.addEventListener("change", (e) => {
            const pair = e.target.value;
            currentSymbol = symbolMap[pair] || "FX:EURUSD";
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

            // Re-create widget to refresh
            createWidget(currentSymbol, currentInterval);
        });
    }

    console.log("FX Dashboard + TradingView loaded");
});
