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

    // Pair selector (فعلاً فقط لاگ می‌کند)
    const pairSelect = document.getElementById('pairSelect');
    if (pairSelect) {
        pairSelect.addEventListener('change', (e) => {
            console.log('جفت ارز انتخاب شده:', e.target.value);
            // در مراحل بعدی اینجا قیمت و چارت آپدیت می‌شود
        });
    }

    console.log('FX Dashboard loaded successfully');
});
