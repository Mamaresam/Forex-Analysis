// FX Dashboard - Core Script

document.addEventListener('DOMContentLoaded', () => {
    // Timeframe buttons
    const timeframeBtns = document.querySelectorAll('.tf');
    timeframeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeframeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Refresh button animation
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.style.transform = 'rotate(360deg)';
            refreshBtn.style.transition = 'transform 0.6s ease';
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
            }, 600);
        });
    }

    // Pair selector
    const pairSelect = document.getElementById('pairSelect');
    if (pairSelect) {
        pairSelect.addEventListener('change', (e) => {
            console.log('Selected pair:', e.target.value);
            // In next steps we will update prices and chart here
        });
    }

    console.log('FX Dashboard loaded successfully');
});
