const { challenges } = require("./challenges");

// حالة التطبيق
const AppState = {
    userPoints: parseInt(localStorage.getItem('userPoints')) || 0,
    streak: parseInt(localStorage.getItem('streak')) || 0,
    completedChallenges: JSON.parse(localStorage.getItem('completedChallenges')) || [],
    currentChallenge: null,
    selectedOption: null,
    timer: 150, // 2:30 دقيقة
    timerInterval: null,
    isChallengeCompleted: false
};

// تهيئة التطبيق
function initApp() {
    console.log('🧠 تهيئة عقل يانع...');
    
    // تحديث الواجهة
    updateUI();
    
    // تحميل تحدٍ عشوائي
    loadRandomChallenge();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // بدء المؤقت
    startTimer();
    
    showNotification('🎯 تم تحميل تحدٍ جديد! جاهز للبدء؟', 'info');
}

// تحديث الواجهة
function updateUI() {
    // تحديث النقاط
    document.getElementById('userPoints').textContent = `${AppState.userPoints} نقطة`;
    document.getElementById('streakCount').textContent = `${AppState.streak} يوم`;
    
    // تحديث الإحصائيات
    document.getElementById('activeUsers').textContent = '2,847';
    document.getElementById('totalChallenges').textContent = '1,258';
    document.getElementById('avgIQ').textContent = '+15%';
}

// تحميل تحدٍ عشوائي
function loadRandomChallenge() {
    // جمع جميع التحديات
    const allChallenges = [];
    Object.values(challenges).forEach(category => {
        allChallenges.push(...category);
    });
    
    // استبعاد التحديات المكتملة
    const availableChallenges = allChallenges.filter(challenge => 
        !AppState.completedChallenges.includes(challenge.id)
    );
    
    // إذا كانت جميع التحديات مكتملة، أعد تعيينها
    if (availableChallenges.length === 0) {
        AppState.completedChallenges = [];
        loadRandomChallenge();
        return;
    }
    
    // اختيار تحدٍ عشوائي
    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    AppState.currentChallenge = availableChallenges[randomIndex];
    
    // تحديث الواجهة
    displayChallenge();
}

// عرض التحدي
function displayChallenge() {
    if (!AppState.currentChallenge) return;
    
    const challenge = AppState.currentChallenge;
    
    // تحديث العنوان والنص
    document.getElementById('challengeTitle').textContent = challenge.title;
    document.getElementById('challengeText').textContent = challenge.description;
    
    // تحديث مستوى الصعوبة
    const difficultyBadge = document.querySelector('.difficulty-badge');
    difficultyBadge.textContent = getDifficultyText(challenge.difficulty);
    difficultyBadge.className = `difficulty-badge ${challenge.difficulty}`;
    
    // تحديث النقاط
    document.querySelector('.points-reward span').textContent = `+${challenge.points} نقطة`;
    
    // إعداد نوع الإجابة
    if (challenge.type === 'multiple') {
        document.getElementById('optionsContainer').style.display = 'grid';
        document.getElementById('answerContainer').style.display = 'none';
        
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        challenge.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.dataset.index = index;
            
            optionElement.innerHTML = `
                <span class="option-letter">${String.fromCharCode(1569 + index)}</span>
                <p>${option}</p>
            `;
            
            optionElement.addEventListener('click', () => selectOption(optionElement));
            optionsContainer.appendChild(optionElement);
        });
    } else {
        document.getElementById('optionsContainer').style.display = 'none';
        document.getElementById('answerContainer').style.display = 'block';
        document.getElementById('userAnswer').value = '';
    }
    
    // إخفاء النتائج
    document.getElementById('resultContainer').style.display = 'none';
    AppState.selectedOption = null;
    AppState.isChallengeCompleted = false;
    
    // إعادة تعيين التوقيت
    resetTimer();
}

// الحصول على نص الصعوبة
function getDifficultyText(difficulty) {
    const difficultyMap = {
        'easy': 'سهل',
        'medium': 'متوسط',
        'hard': 'صعب'
    };
    return difficultyMap[difficulty] || 'متوسط';
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر التحقق من الإجابة
    document.getElementById('checkBtn').addEventListener('click', checkAnswer);
    
    // زر التلميح
    document.querySelector('.hint-btn').addEventListener('click', showHint);
    
    // زر التخطي
    document.querySelector('.skip-btn').addEventListener('click', skipChallenge);
    
    // زر المناقشة
    document.querySelector('.discuss-btn').addEventListener('click', showDiscussion);
    
    // زر التالي في النتيجة الصحيحة
    document.querySelector('.next-btn')?.addEventListener('click', loadRandomChallenge);
    
    // زر إعادة المحاولة في النتيجة الخاطئة
    document.querySelector('.retry-btn')?.addEventListener('click', () => {
        document.getElementById('resultContainer').style.display = 'none';
    });
    
    // زر الحل الكامل
    document.querySelector('.solution-btn')?.addEventListener('click', showSolution);
    
    // زر الإرسال للإجابات المفتوحة
    document.getElementById('submitAnswerBtn')?.addEventListener('click', checkAnswer);
    
    // إدخال الإجابة المفتوحة (Enter)
    document.getElementById('userAnswer')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    
    // المرشحات في لوحة المتصدرين
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            // هنا يمكن تحديث لوحة المتصدرين حسب الفلتر
        });
    });
    
    // إغلاق النافذة المنبثقة
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    document.querySelector('.cancel-btn')?.addEventListener('click', closeModal);
    document.querySelector('.confirm-btn')?.addEventListener('click', useHint);
    
    // انقر خارج النافذة المنبثقة لإغلاقها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// اختيار خيار
function selectOption(optionElement) {
    if (AppState.isChallengeCompleted) return;
    
    // إزالة التحديد من جميع الخيارات
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // تحديد الخيار الحالي
    optionElement.classList.add('selected');
    AppState.selectedOption = parseInt(optionElement.dataset.index);
}

// التحقق من الإجابة
function checkAnswer() {
    if (!AppState.currentChallenge) return;
    
    const challenge = AppState.currentChallenge;
    let isCorrect = false;
    
    if (challenge.type === 'multiple') {
        if (AppState.selectedOption === null) {
            showNotification('⚠️ الرجاء اختيار إجابة أولاً', 'warning');
            return;
        }
        
        isCorrect = AppState.selectedOption === challenge.correctAnswer;
        
        // عرض الخيارات الصحيحة والخاطئة
        document.querySelectorAll('.option').forEach((opt, index) => {
            if (index === challenge.correctAnswer) {
                opt.classList.add('correct');
            } else if (index === AppState.selectedOption && !isCorrect) {
                opt.classList.add('wrong');
            }
        });
    } else {
        const userAnswer = document.getElementById('userAnswer').value.trim().toLowerCase();
        const correctAnswer = challenge.correctAnswer.toLowerCase();
        
        isCorrect = userAnswer === correctAnswer;
        
        if (!isCorrect) {
            document.getElementById('userAnswer').style.borderColor = 'var(--danger)';
        }
    }
    
    // إيقاف المؤقت
    stopTimer();
    
    // عرض النتيجة
    showResult(isCorrect);
    
    // تحديث حالة التطبيق
    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
    
    AppState.isChallengeCompleted = true;
}

// عرض النتيجة
function showResult(isCorrect) {
    const resultContainer = document.getElementById('resultContainer');
    const correctResult = document.getElementById('correctResult');
    const wrongResult = document.getElementById('wrongResult');
    
    resultContainer.style.display = 'block';
    
    if (isCorrect) {
        correctResult.style.display = 'block';
        wrongResult.style.display = 'none';
    } else {
        correctResult.style.display = 'none';
        wrongResult.style.display = 'block';
        
        // تحديث نص الحل
        const solutionText = document.querySelector('#wrongResult .result-message');
        solutionText.innerHTML = `الإجابة الصحيحة هي: <strong>${getCorrectAnswerText()}</strong>`;
    }
    
    // التمرير إلى النتيجة
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// الحصول على نص الإجابة الصحيحة
function getCorrectAnswerText() {
    const challenge = AppState.currentChallenge;
    
    if (challenge.type === 'multiple') {
        return challenge.options[challenge.correctAnswer];
    } else {
        return challenge.correctAnswer;
    }
}

// التعامل مع الإجابة الصحيحة
function handleCorrectAnswer() {
    const challenge = AppState.currentChallenge;
    
    // زيادة النقاط
    AppState.userPoints += challenge.points;
    AppState.streak += 1;
    
    // إضافة التحدي إلى المكتملة
    if (!AppState.completedChallenges.includes(challenge.id)) {
        AppState.completedChallenges.push(challenge.id);
    }
    
    // حفظ في localStorage
    saveProgress();
    
    // تحديث الواجهة
    updateUI();
    
    // عرض إشعار
    showNotification(`🎉 أحسنت! ربحت ${challenge.points} نقطة!`, 'success');
}

// التعامل مع الإجابة الخاطئة
function handleWrongAnswer() {
    // تقليل السلسلة
    AppState.streak = 0;
    
    // حفظ في localStorage
    saveProgress();
    
    // تحديث الواجهة
    updateUI();
    
    // عرض إشعار
    showNotification('🤔 حاول مرة أخرى! يمكنك تعلم من خطأك', 'warning');
}

// حفظ التقدم
function saveProgress() {
    localStorage.setItem('userPoints', AppState.userPoints.toString());
    localStorage.setItem('streak', AppState.streak.toString());
    localStorage.setItem('completedChallenges', JSON.stringify(AppState.completedChallenges));
}

// عرض التلميح
function showHint() {
    if (!AppState.currentChallenge || AppState.isChallengeCompleted) return;
    
    const hintModal = document.getElementById('hintModal');
    const hintText = document.getElementById('hintText');
    
    hintText.textContent = AppState.currentChallenge.hint;
    hintModal.style.display = 'flex';
}

// استخدام التلميح
function useHint() {
    // خصم نقاط للتلميح
    if (AppState.userPoints >= 5) {
        AppState.userPoints -= 5;
        saveProgress();
        updateUI();
        showNotification('💡 استخدمت تلميحًا (-5 نقاط)', 'info');
    } else {
        showNotification('⚠️ ليس لديك نقاط كافية للتلميح', 'warning');
    }
    
    closeModal();
}

// تخطي التحدي
function skipChallenge() {
    if (AppState.isChallengeCompleted) return;
    
    // تقليل السلسلة
    AppState.streak = 0;
    saveProgress();
    updateUI();
    
    // تحميل تحدٍ جديد
    loadRandomChallenge();
    
    showNotification('⏭️ تم تخطي التحدي', 'info');
}

// عرض المناقشة
function showDiscussion() {
    showNotification('💬 ميزة المناقشة قريباً!', 'info');
}

// عرض الحل الكامل
function showSolution() {
    if (!AppState.currentChallenge) return;
    
    alert(`الحل الكامل:\n\n${AppState.currentChallenge.solution}`);
}

// إغلاق النافذة المنبثقة
function closeModal() {
    document.getElementById('hintModal').style.display = 'none';
}

// بدء المؤقت
function startTimer() {
    stopTimer(); // تأكد من إيقاف أي مؤقت سابق
    
    AppState.timerInterval = setInterval(() => {
        AppState.timer--;
        
        const minutes = Math.floor(AppState.timer / 60);
        const seconds = AppState.timer % 60;
        
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // تغيير اللون عند اقتراب الوقت من النفاد
        if (AppState.timer <= 30) {
            document.querySelector('.time-counter').style.background = 'rgba(255, 82, 82, 0.2)';
            document.querySelector('.time-counter').style.color = 'var(--danger)';
        }
        
        // انتهاء الوقت
        if (AppState.timer <= 0) {
            stopTimer();
            showNotification('⏰ انتهى الوقت! حاول مرة أخرى', 'error');
            checkAnswer(); // تحقق تلقائيًا
        }
    }, 1000);
}

// إيقاف المؤقت
function stopTimer() {
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
        AppState.timerInterval = null;
    }
}

// إعادة تعيين المؤقت
function resetTimer() {
    stopTimer();
    AppState.timer = 150; // 2:30 دقيقة
    document.getElementById('timer').textContent = '02:30';
    document.querySelector('.time-counter').style.background = 'rgba(255, 107, 157, 0.1)';
    document.querySelector('.time-counter').style.color = 'var(--secondary)';
    startTimer();
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    // تعيين النص
    notificationText.textContent = message;
    
    // تعيين اللون حسب النوع
    let bgColor = 'var(--dark)';
    let icon = 'info-circle';
    
    switch (type) {
        case 'success':
            bgColor = 'var(--success)';
            icon = 'check-circle';
            break;
        case 'warning':
            bgColor = 'var(--warning)';
            icon = 'exclamation-triangle';
            break;
        case 'error':
            bgColor = 'var(--danger)';
            icon = 'exclamation-circle';
            break;
    }
    
    notification.querySelector('i').className = `fas fa-${icon}`;
    notification.style.background = bgColor;
    
    // إظهار الإشعار
    notification.classList.add('show');
    
    // إخفاء الإشعار بعد 5 ثوانٍ
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// تحديث شريط التقدم في الإحصائيات
function updateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width || '0%';
        const targetWidth = bar.getAttribute('data-width') || '65%';
        
        // إعادة تعيين للرسوم المتحركة
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 100);
    });
}

// تهيئة شريط التقدم
function initProgressBars() {
    document.querySelectorAll('.progress-fill').forEach(bar => {
        const width = bar.textContent;
        bar.style.width = width;
        bar.setAttribute('data-width', width);
        bar.textContent = '';
    });
}

// بدء التطبيق
window.addEventListener('DOMContentLoaded', () => {
    initApp();
    initProgressBars();
    updateProgressBars();
    
    // تحديث شريط التقدم عند تمرير الماوس
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('mouseenter', updateProgressBars);
    });
    
    // تحديث تاريخ اليوم
    const today = new Date();
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    const dayName = arabicDays[today.getDay()];
    const day = today.getDate();
    const month = arabicMonths[today.getMonth()];
    
    document.getElementById('currentDate').textContent = `${dayName} ${day} ${month}`;
});

// اختصارات لوحة المفاتيح
document.addEventListener('keydown', (e) => {
    // مسافة للتحقق من الإجابة
    if (e.code === 'Space' && !e.target.matches('textarea, input')) {
        e.preventDefault();
        checkAnswer();
    }
    
    // Esc لإغلاق النوافذ المنبثقة
    if (e.code === 'Escape') {
        closeModal();
    }
    
    // الأرقام لاختيار الخيارات (1-4)
    if (e.code >= 'Digit1' && e.code <= 'Digit4') {
        const index = parseInt(e.code.slice(-1)) - 1;
        const options = document.querySelectorAll('.option');
        if (options[index]) {
            selectOption(options[index]);
        }
    }
});

// منع إغلاق الصفحة أثناء التحدي
window.addEventListener('beforeunload', (e) => {
    if (!AppState.isChallengeCompleted && AppState.timer > 0) {
        e.preventDefault();
        e.returnValue = 'لديك تحدٍ قيد التنفيذ! هل تريد المغادرة حقاً؟';
    }
});

// حفظ التقدم عند إغلاق الصفحة
window.addEventListener('unload', () => {
    saveProgress();

});