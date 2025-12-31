// Shared JavaScript utilities

// Set active navbar link
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Sound helper
function playClickSound() {
    const sound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3');
    sound.volume = 0.5;
    sound.play().catch(() => {});
}

function playSuccessSound() {
    const sound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
    sound.volume = 0.5;
    sound.play().catch(() => {});
}

// Smooth scroll - hanya untuk anchor links yang valid (bukan SPA routing)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Skip SPA routing links (yang dimulai dengan #/)
        if (href.startsWith('#/')) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe cards helper
function observeAnimatedElements(root = document) {
    root.querySelectorAll('.card, .gallery-item, .level-card, .message-card, .timeline-content, .stat-card, .stat-box').forEach(el => {
        observer.observe(el);
    });
}

// Initial observe
observeAnimatedElements(document);

// Helper: convert Google Drive 'view' to direct 'download' URL
function normalizeMusicUrl(u) {
    if (!u) return u;
    const m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : u;
}

// Matikan fallback otomatis yang berputar
function handleAudioError(failedId, musicData, savedMuted) {
    console.warn('Audio gagal untuk lagu:', failedId);
    // Tidak ada fallback otomatis
}

function attemptPlay() {
    // Tidak digunakan lagi
}

// ===== PERSISTENT MUSIC PLAYER =====
function initializeMusicPlayer() {
    const musicData = {
        1: 'music/Cristina Perri - AThousandYears.mp3',
        2: 'music/Give Me Your Forever.mp3',
        3: 'music/you.mp3'
    };

    // Buat audio player
    if (!window.globalAudioPlayer) {
        window.globalAudioPlayer = new Audio();
        window.globalAudioPlayer.volume = 0.5;
        window.globalAudioPlayer.preload = 'auto';
        window.globalAudioPlayer.loop = true; // putar berulang terus
        // Hapus pengaturan crossOrigin untuk sumber lokal
    }

    // Pastikan selectedSong valid, fallback ke "1"
    window.globalAudioPlayer.loop = true;
    let songId = localStorage.getItem('selectedSong') || '1';
    if (!musicData[songId]) songId = '1';
    localStorage.setItem('selectedSong', songId);

    const savedMuted = localStorage.getItem('musicMuted');
    const savedCurrentTime = localStorage.getItem('musicCurrentTime');
    const savedUrl = localStorage.getItem('musicUrl');
    // Sinkronkan status mute dengan yang tersimpan
    window.globalAudioPlayer.muted = savedMuted === 'true';

    // Set sumber sederhana ke file lokal
    const url = musicData[songId];
    // Encode untuk keamanan path (spasi, karakter khusus) saat dihosting
    const encodedUrl = url ? encodeURI(url) : url;
    const shouldSetSource = !window.globalAudioPlayer.src || savedUrl !== encodedUrl;

    if (encodedUrl && shouldSetSource) {
        window.globalAudioPlayer.src = encodedUrl;
        window.globalAudioPlayer.load();
        localStorage.setItem('musicUrl', encodedUrl);
    }

    if (encodedUrl) {
        if (savedCurrentTime && savedUrl === encodedUrl) {
            window.globalAudioPlayer.currentTime = parseFloat(savedCurrentTime);
        } else {
            window.globalAudioPlayer.currentTime = 0;
            localStorage.removeItem('musicCurrentTime');
        }

        const tryPlay = () => {
            if (!window.globalAudioPlayer || window.globalAudioPlayer.muted) return;
            window.globalAudioPlayer.play().catch(() => {});
        };

        if (shouldSetSource) {
            window.globalAudioPlayer.addEventListener('canplay', tryPlay, { once: true });
        } else {
            tryPlay();
        }

        // Pastikan pemutaran dimulai saat ada interaksi pengguna (untuk melewati blokir autoplay)
        document.addEventListener('pointerdown', () => {
            tryPlay();
        }, { once: true });
    }

    updateMusicButtonsUI();
}

// Ubah lagu saat tombol .music-btn diklik
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.music-btn');
    if (!btn || !btn.dataset.song) return;
    playClickSound();
    localStorage.setItem('selectedSong', btn.dataset.song);
    initializeMusicPlayer();
    updateMusicButtonsUI();
});

function updateMusicButtonsUI() {
    const musicBtns = document.querySelectorAll('.music-btn');
    const currentSong = localStorage.getItem('selectedSong');
    
    musicBtns.forEach(btn => {
        if (btn.dataset.song === currentSong) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Bind UI controls for music (mute, progress, time)
function bindMusicUI() {
    if (window.__musicUIBound) return;
    window.__musicUIBound = true;

    const muteBtn = document.getElementById('muteBtn');
    const progressBar = document.getElementById('progressBar');
    const musicTime = document.getElementById('musicTime');
    const musicProgress = document.querySelector('.music-progress');

    function updateMuteIcon() {
        const isMuted = localStorage.getItem('musicMuted') === 'true';
        if (muteBtn) muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        if (window.globalAudioPlayer) window.globalAudioPlayer.muted = isMuted;
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', function() {
            const isMuted = localStorage.getItem('musicMuted') === 'true';
            localStorage.setItem('musicMuted', (!isMuted).toString());
            updateMuteIcon();
            if (window.globalAudioPlayer && isMuted) {
                // was muted -> now unmuted
                window.globalAudioPlayer.play().catch(() => {});
            }
        });
        updateMuteIcon();
    }

    if (window.globalAudioPlayer) {
        window.globalAudioPlayer.addEventListener('timeupdate', function() {
            if (!progressBar || !musicTime) return;
            if (this.duration) {
                const percent = (this.currentTime / this.duration) * 100;
                progressBar.style.width = percent + '%';
                const minutes = Math.floor(this.currentTime / 60);
                const seconds = Math.floor(this.currentTime % 60);
                musicTime.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
            }
        });
    }

    if (musicProgress) {
        musicProgress.addEventListener('click', function(e) {
            if (window.globalAudioPlayer && window.globalAudioPlayer.duration) {
                const rect = this.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                window.globalAudioPlayer.currentTime = percent * window.globalAudioPlayer.duration;
            }
        });
    }
}

// Save music position every second
setInterval(() => {
    if (window.globalAudioPlayer && window.globalAudioPlayer.src) {
        localStorage.setItem('musicCurrentTime', window.globalAudioPlayer.currentTime);
    }
}, 1000);

// Initialize music player on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeMusicPlayer();
    bindMusicUI();
    bindMusicMinimizeUI();
});
// Minimize/restore music player
function bindMusicMinimizeUI() {
    const player = document.getElementById('musicPlayer');
    const closeBtn = document.getElementById('musicClose');
    const header = player ? player.querySelector('.music-header') : null;

    // Restore previous state
    const minimized = localStorage.getItem('musicMinimized') === 'true';
    if (player && minimized) player.classList.add('minimized');

    if (closeBtn && player) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            player.classList.toggle('minimized');
            localStorage.setItem('musicMinimized', player.classList.contains('minimized'));
        });
    }

    if (header && player) {
        header.addEventListener('click', () => {
            if (player.classList.contains('minimized')) {
                player.classList.remove('minimized');
                localStorage.setItem('musicMinimized', 'false');
            }
        });
    }
}

// ===== Simple SPA Loader (keeps audio alive) =====
(function setupSPA(){
    const spaView = document.getElementById('spaView');
    const home = document.querySelector('.homepage-container');
    if (!spaView || !home) return; // aktif hanya di index.html

    // Data untuk halaman yang dapat dimuat dinamis
    const pageScripts = {
        'gallery.html': initGalleryPage,
        'messages.html': initMessagesPage,
        'game.html': initGamePage,
        'timeline.html': initTimelinePage
    };

    async function navigateTo(url){
        try {
            console.log('🔄 navigateTo called:', url);
            
            // Hide semua hidden sections dari dokumen
            const hiddenSections = ['game-section', 'gallery-section', 'messages-section', 'timeline-section'];
            hiddenSections.forEach(id => {
                const section = document.getElementById(id);
                if (section) {
                    section.style.display = 'none';
                    section.style.visibility = 'hidden';
                }
            });
            
            // Map URL ke section ID dalam index.html
            const sectionMap = {
                'game.html': 'game-section',
                'gallery.html': 'gallery-section',
                'messages.html': 'messages-section',
                'timeline.html': 'timeline-section'
            };

            const sectionId = sectionMap[url];
            if (!sectionId) {
                console.warn('❌ Unknown page:', url);
                return;
            }

            // Dapatkan section dari index.html
            const section = document.getElementById(sectionId);
            if (!section) {
                console.warn('❌ Section not found:', sectionId);
                return;
            }

            console.log('✅ Found section:', sectionId, 'HTML length:', section.innerHTML.length);

            // Clone section, make sure it's visible
            const contentClone = section.cloneNode(true);
            
            // HAPUS ID agar tidak terpengaruh CSS hidden sections
            contentClone.removeAttribute('id');
            contentClone.classList.remove('page-section');
            contentClone.classList.add('active-page');
            
            // Set visibility style
            contentClone.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: auto !important; width: 100% !important; min-height: auto !important;';
            
            // Clear spaView dan append content
            spaView.innerHTML = '';
            spaView.appendChild(contentClone);

            console.log('✅ Content cloned and appended, spaView children:', spaView.children.length);

            // Tampilkan SPA, sembunyikan home
            home.style.display = 'none';
            spaView.style.display = 'block';
            spaView.style.minHeight = 'auto';
            spaView.style.visibility = 'visible';
            spaView.style.opacity = '1';
            
            // Force reflow to ensure rendering
            void spaView.offsetHeight;

            // Scroll to top
            window.scrollTo(0, 0);

            // Double-check all elements are visible after layout
            setTimeout(() => {
                console.log('🔍 Verifying visibility after append...');
                console.log('   spaView display:', getComputedStyle(spaView).display);
                console.log('   spaView clientHeight:', spaView.clientHeight);
                
                // Make sure spaView itself is visible
                spaView.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: auto !important;';
                
                // Make sure cloned page is visible
                const clonedPage = spaView.querySelector('.active-page');
                if (clonedPage) {
                    clonedPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: auto !important; width: 100% !important;';
                    console.log('✅ Active page display fixed, clientHeight:', clonedPage.clientHeight);
                } else {
                    console.warn('❌ Active page not found in spaView');
                }
                
                // Make sure container is visible
                const container = spaView.querySelector('.container');
                if (container) {
                    container.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: auto !important;';
                    console.log('✅ Container display fixed, clientHeight:', container.clientHeight);
                } else {
                    console.warn('❌ Container not found in spaView');
                }
                
                observeAnimatedElements(spaView);
                bindMusicUI();
            }, 50);

            // Jalankan script halaman jika ada
            const initFunc = pageScripts[url];
            if (initFunc && typeof initFunc === 'function') {
                setTimeout(() => {
                    try {
                        console.log('🚀 Running initializer for:', url);
                        initFunc();
                        console.log('✅ Initializer completed:', url);
                    } catch(e) {
                        console.error('❌ Error initializing page:', url, e);
                    }
                }, 150);
            }

            // Push state agar tombol back berfungsi
            history.pushState({ spa: true, url }, '', '#'+url);
        } catch (err) {
            console.warn('SPA load gagal:', err);
        }
    }

    // Intersep klik pada kartu navigasi (homepage) dan navbar
    document.addEventListener('click', function(e){
        const cardLink = e.target.closest('a.nav-card') || e.target.closest('nav a[href]');
        if (!cardLink) return;
        let href = cardLink.getAttribute('href') || '';
        
        // Handle hash routing (#/page.html -> page.html, #/home -> home)
        if (href.startsWith('#/')) {
            href = href.substring(2);
            // Handle #/home -> go back to homepage
            if (href === 'home') {
                e.preventDefault();
                
                // Sembunyikan semua sections
                const hiddenSections = ['game-section', 'gallery-section', 'messages-section', 'timeline-section'];
                hiddenSections.forEach(id => {
                    const section = document.getElementById(id);
                    if (section) {
                        section.style.display = 'none';
                        section.style.visibility = 'hidden';
                        section.style.position = 'absolute';
                        section.style.left = '-99999px';
                    }
                });
                
                // Bersihkan spaView sepenuhnya
                spaView.innerHTML = '';
                spaView.style.display = 'none';
                spaView.style.visibility = 'hidden';
                
                // Tampilkan home dengan benar
                home.style.display = 'flex';
                home.style.visibility = 'visible';
                home.style.opacity = '1';
                
                window.scrollTo(0, 0);
                history.pushState({}, '', '/');
                return;
            }
        } else if (href.startsWith('#')) {
            return; // Biarkan anchor links normal
        }
        
        if (!href.endsWith('.html')) return;
        e.preventDefault();
        navigateTo(href);
    });

    // Back: jika user bersihkan hash/manually back ke awal
    window.addEventListener('popstate', function(){
        if (!location.hash) {
            // Sembunyikan semua sections
            const hiddenSections = ['game-section', 'gallery-section', 'messages-section', 'timeline-section'];
            hiddenSections.forEach(id => {
                const section = document.getElementById(id);
                if (section) {
                    section.style.display = 'none';
                    section.style.visibility = 'hidden';
                    section.style.position = 'absolute';
                    section.style.left = '-99999px';
                }
            });
            
            // Bersihkan spaView sepenuhnya
            spaView.innerHTML = '';
            spaView.style.display = 'none';
            spaView.style.visibility = 'hidden';
            
            // Tampilkan home dengan benar
            home.style.display = 'flex';
            home.style.visibility = 'visible';
            home.style.opacity = '1';
            
            window.scrollTo(0, 0);
        }
    });
})();

// ===== PAGE INITIALIZERS =====

function initGalleryPage() {
    const memoryData = [
        {
            id: 1,
            title: "Wisuda Bersama",
            date: "15 Juni 2019",
            emoji: "🎓",
            description: "Hari kelulusan kita yang tak terlupakan. Aku masih ingat bagaimana kebahagiaan di mata kamu saat itu."
        },
        {
            id: 2,
            title: "Fajar di Pantai",
            date: "23 Agustus 2020",
            emoji: "🌅",
            description: "Menonton fajar bersama dengan tangan yang saling bergenggam. Itu adalah momen paling romantis."
        },
        {
            id: 3,
            title: "Perayaan Ulang Tahun Pertama",
            date: "12 Desember 2021",
            emoji: "🎂",
            description: "Kue pertama yang kita rayakan bersama. Setiap lilin yang aku tiup adalah doa untuk kita bisa selamanya bersama."
        },
        {
            id: 4,
            title: "Petualangan ke Bali",
            date: "7 Februari 2022",
            emoji: "✈️",
            description: "Liburan pertama kita ke pulau yang indah. Setiap pantai yang kita kunjungi lebih bermakna karena kamu."
        },
        {
            id: 5,
            title: "Momen Intim Kita",
            date: "14 Februari 2023",
            emoji: "💑",
            description: "Hari Valentine yang penuh dengan cinta dan kehangatan. Kamu adalah rumah bagiku."
        },
        {
            id: 6,
            title: "Pesta Kejutan",
            date: "20 Mei 2023",
            emoji: "🎪",
            description: "Kejutan pesta yang aku rencanakan. Melihat kebahagiaan di wajahmu adalah saat-saat terbaik."
        },
        {
            id: 7,
            title: "Makan Malam Romantis",
            date: "8 Agustus 2023",
            emoji: "🍽️",
            description: "Malam yang penuh dengan percakapan bermakna. Momen-momen sederhana dengan kamu adalah yang terbaik."
        },
        {
            id: 8,
            title: "Konser Musik Bersama",
            date: "16 November 2023",
            emoji: "🎭",
            description: "Merasakan musik yang sama dengan jantung yang berdetak berirama sama."
        },
        {
            id: 9,
            title: "Piknik di Taman Bunga",
            date: "22 Maret 2024",
            emoji: "🌸",
            description: "Dikelilingi oleh bunga-bunga indah, tapi yang paling indah adalah senyummu."
        }
    ];

    const modal = document.getElementById('modal');
    const modalClose = document.querySelector('.modal-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (!modal || !modalClose || galleryItems.length === 0) return;

    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const memory = memoryData.find(m => m.id === id);
            if (!memory) return;

            document.getElementById('modalImage').textContent = memory.emoji;
            document.getElementById('modalTitle').textContent = memory.title;
            document.getElementById('modalDate').textContent = memory.date;
            document.getElementById('modalDescription').textContent = memory.description;
            document.getElementById('likeCount').textContent = '0';

            modal.classList.add('active');
        });
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            const count = parseInt(document.getElementById('likeCount').textContent);
            document.getElementById('likeCount').textContent = count + 1;
            this.style.background = 'linear-gradient(to right, var(--pink-secondary), var(--pink-dark))';
        });
    }
}

function initMessagesPage() {
    // Delegasi event untuk pesan sudah ada di shared.js
    console.log('Messages page initialized');
}

function initGamePage() {
    // Load saved game state from localStorage
    const savedState = localStorage.getItem('birthdayGameState');
    const defaultState = {
        currentLevel: 1,
        score: 0,
        hearts: 0,
        maxHearts: 20,
        maxScore: 500,
        completedLevels: [],
        memoryPairsFound: 0,
        quizAnswers: 0,
    };
    
    // Game State Management
    const gameState = savedState ? JSON.parse(savedState) : defaultState;

    const gameData = {
        levels: [
            {
                id: 1,
                title: "Main Puzzle dulu yaa Geulis!!",
                icon: "🧩",
                type: "memory",
                pairs: [
                    { id: 1, emoji: "🥰" },
                    { id: 2, emoji: "🎂" },
                    { id: 3, emoji: "💕" },
                    { id: 4, emoji: "✨" }
                ]
            },
            {
                id: 2,
                title: "Quizz",
                icon: "❓",
                type: "quiz",
                questions: [
                    { question: "Warna favoritku?", options: ["Pink", "Biru", "Hijau", "Ungu"], correct: 0 },
                    { question: "Makanan favorit?", options: ["Sushi", "Pizza", "Ice Cream", "Rendang"], correct: 2 },
                    { question: "Dimana kita pertama ketemu?", options: ["Kafe", "Kampus", "Taman", "Konser"], correct: 1 }
                ]
            },
            {
                id: 3,
                title: "Tangkap Hati",
                icon: "💝",
                type: "catch",
                targetHearts: 10
            },
            {
                id: 4,
                title: "Hadiah",
                icon: "🎁",
                type: "birthday"
            }
        ]
    };

    // DOM Elements
    const DOM = {
        levelDisplay: document.getElementById('level'),
        scoreDisplay: document.getElementById('score'),
        levelProgress: document.getElementById('levelProgress'),
        scoreProgress: document.getElementById('scoreProgress'),
        gameContent: document.getElementById('gameContent'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        hintBtn: document.getElementById('hintBtn'),
        popup: document.getElementById('popup'),
        popupIcon: document.getElementById('popupIcon'),
        popupTitle: document.getElementById('popupTitle'),
        popupText: document.getElementById('popupText'),
        popupBtn: document.getElementById('popupBtn'),
        clickSound: document.getElementById('clickSound'),
        successSound: document.getElementById('successSound')
    };

    function updateStats() {
        if (!DOM.levelDisplay) return;
        DOM.levelDisplay.textContent = gameState.currentLevel;
        DOM.scoreDisplay.textContent = gameState.score;
        
        DOM.levelProgress.style.width = `${(gameState.currentLevel / 4) * 100}%`;
        DOM.scoreProgress.style.width = `${Math.min((gameState.score / gameState.maxScore) * 100, 100)}%`;
        
        document.querySelectorAll('.level-card').forEach(card => {
            const level = parseInt(card.dataset.level);
            card.classList.remove('active', 'completed', 'locked');
            
            if (gameState.completedLevels.includes(level)) {
                card.classList.add('completed');
                card.style.pointerEvents = 'auto';
                card.style.cursor = 'pointer';
            } else if (level === gameState.currentLevel) {
                card.classList.add('active');
                card.style.pointerEvents = 'auto';
                card.style.cursor = 'pointer';
            } else if (level > 1 && !gameState.completedLevels.includes(level - 1)) {
                // Locked: previous level not completed
                card.classList.add('locked');
                card.style.pointerEvents = 'auto'; // Still allow clicks for warning
                card.style.cursor = 'not-allowed';
            } else {
                // Available but not current
                card.classList.add('locked');
                card.style.pointerEvents = 'auto';
                card.style.cursor = 'pointer';
            }
        });
        
        if (DOM.prevBtn) DOM.prevBtn.disabled = gameState.currentLevel === 1;
        if (DOM.nextBtn) DOM.nextBtn.disabled = !gameState.completedLevels.includes(gameState.currentLevel) || gameState.currentLevel === 4;
        
        // Save game state to localStorage
        saveGameState();
    }
    
    function saveGameState() {
        localStorage.setItem('birthdayGameState', JSON.stringify(gameState));
    }

    function addScore(points) {
        gameState.score += points;
        if (gameState.score > gameState.maxScore) gameState.score = gameState.maxScore;
        gameState.hearts++;
        if (gameState.hearts > gameState.maxHearts) gameState.hearts = gameState.maxHearts;
        updateStats();
        playGameSound('success');
    }

    function playGameSound(soundName) {
        try {
            if (soundName === 'click') {
                if (DOM.clickSound) {
                    DOM.clickSound.currentTime = 0;
                    DOM.clickSound.play().catch(() => {});
                }
            } else if (soundName === 'success') {
                if (DOM.successSound) {
                    DOM.successSound.currentTime = 0;
                    DOM.successSound.play().catch(() => {});
                }
            }
        } catch (e) {
            console.log("Sound error");
        }
    }

    function showPopup(icon, title, text) {
        if (!DOM.popup) return;
        DOM.popupIcon.textContent = icon;
        DOM.popupTitle.textContent = title;
        DOM.popupText.textContent = text;
        DOM.popup.classList.add('active');
        playGameSound('success');
    }

    function showWarning(title, text) {
        if (!DOM.popup) return;
        DOM.popupIcon.textContent = '⚠️';
        DOM.popupTitle.textContent = title;
        DOM.popupText.textContent = text;
        DOM.popup.classList.add('active');
        playGameSound('click');
    }

    function loadLevel(levelId) {
        const level = gameData.levels.find(l => l.id === levelId);
        if (!level) return;
        
        gameState.currentLevel = levelId;
        updateStats();
        
        let content = '';
        
        switch(level.type) {
            case 'memory':
                const totalPairs = level.pairs.length;
                content = `
                    <h2 class="content-title">${level.title} 🧩</h2>
                    <p style="text-align: center; margin-bottom: 30px; font-size: 1.2rem; color: var(--pink-secondary);">Temukan pasangan emoji! ${gameState.memoryPairsFound}/${totalPairs} 💝</p>
                    <div class="memory-game" id="memoryGame" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; max-width: 600px; margin: 0 auto;">
                        ${[...level.pairs, ...level.pairs]
                            .sort(() => Math.random() - 0.5)
                            .map((pair, index) => `
                                <div class="memory-card" data-id="${pair.id}" data-index="${index}">
                                    <div class="card-inner">
                                        <div class="card-face card-front">
                                            <span style="font-size: 3rem;">❓</span>
                                        </div>
                                        <div class="card-face card-back">
                                            <span style="font-size: 3rem;">${pair.emoji}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                `;
                break;
                
            case 'quiz':
                const currentQuestion = level.questions[gameState.quizAnswers] || level.questions[0];
                content = `
                    <h2 class="content-title">${level.title} ❓</h2>
                    <p style="text-align: center; margin-bottom: 30px;">${gameState.quizAnswers}/${level.questions.length}</p>
                    <div class="quiz-container">
                        <div class="quiz-question">
                            <h3 style="margin-bottom: 15px; color: var(--pink-secondary);">${currentQuestion.question}</h3>
                        </div>
                        <div class="quiz-options" id="quizOptions">
                            ${currentQuestion.options.map((option, index) => `
                                <div class="quiz-option" data-answer="${index}">${option}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case 'catch':
                content = `
                    <h2 class="content-title">${level.title} 💝</h2>
                    <p style="text-align: center; margin-bottom: 20px; font-size: 1.2rem;">Klik 10 hati yang jatuh! <span id="heartsCaught" style="color: var(--pink-secondary); font-weight: bold;">0/10</span></p>
                    <div id="catchGame" style="width: 100%; max-width: 600px; height: 400px; margin: 0 auto; background: linear-gradient(135deg, var(--pink-light) 0%, var(--blue-light) 100%); border-radius: 20px; position: relative; overflow: hidden; border: 3px solid var(--pink-primary); cursor: crosshair;">
                        <!-- Hearts will be spawned here -->
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 1rem; color: var(--text-secondary);">
                        Klik hati sebelum jatuh! 💖
                    </div>
                `;
                break;
                
            case 'birthday':
                content = `
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Pacifico&family=Quicksand:wght@400;600;700&display=swap');
                        
                        .birthday-container {
                            text-align: center;
                            padding: 40px 20px;
                            background: linear-gradient(135deg, #ffd6ec 0%, #e8f4ff 100%);
                            border-radius: 30px;
                            box-shadow: 0 20px 60px rgba(255, 107, 157, 0.3);
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        
                        .birthday-title {
                            font-family: 'Playfair Display', 'Pacifico', cursive;
                            font-size: 4.5rem;
                            font-weight: 700;
                            color: #d946a6;
                            margin-bottom: 12px;
                            letter-spacing: 2px;
                            text-shadow: 2px 2px 8px rgba(217, 70, 166, 0.25);
                            animation: float 3s ease-in-out infinite;
                        }
                        
                        .birthday-name {
                            font-family: 'Playfair Display', 'Pacifico', cursive;
                            font-size: 3.5rem;
                            font-weight: 600;
                            background: linear-gradient(135deg, #d946a6 0%, #a855f7 50%, #7c3aed 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            margin-bottom: 28px;
                            letter-spacing: 1px;
                            animation: float 3s ease-in-out infinite 0.5s;
                        }
                        
                        .birthday-instruction {
                            font-family: 'Quicksand', sans-serif;
                            font-size: 1.3rem;
                            color: #7e5a7b;
                            margin-bottom: 30px;
                            font-weight: 600;
                        }
                        
                        .cake-container {
                            position: relative;
                            display: inline-block;
                            margin: 30px 0;
                        }
                        
                        .cake-emoji {
                            font-size: 16rem;
                            filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2));
                            animation: bounce-cake 2s ease-in-out infinite;
                        }
                        
                        /* Candle overlay styles removed */
                        
                        .status-message {
                            font-family: 'Quicksand', sans-serif;
                            font-size: 1.5rem;
                            font-weight: 700;
                            color: #ff6b9d;
                            margin-top: 30px;
                            padding: 15px 30px;
                            background: white;
                            border-radius: 20px;
                            display: inline-block;
                            box-shadow: 0 10px 30px rgba(255, 107, 157, 0.2);
                            animation: pulse-status 2s ease-in-out infinite;
                        }
                        
                        .click-hint {
                            font-family: 'Quicksand', sans-serif;
                            font-size: 1.1rem;
                            color: #b388ff;
                            margin-top: 20px;
                            font-weight: 600;
                            animation: bounce-hint 1s ease-in-out infinite;
                        }
                        
                        @keyframes float {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                        }
                        
                        @keyframes bounce-cake {
                            0%, 100% { transform: translateY(0) rotate(0deg); }
                            25% { transform: translateY(-15px) rotate(-2deg); }
                            75% { transform: translateY(-15px) rotate(2deg); }
                        }
                        
                        @keyframes flicker-fire {
                            0%, 100% { 
                                opacity: 1; 
                                transform: scale(1) translateY(0); 
                                filter: brightness(1) drop-shadow(0 0 20px #ffa500);
                            }
                            33% { 
                                opacity: 0.85; 
                                transform: scale(0.96) translateY(-2px); 
                                filter: brightness(1.1) drop-shadow(0 0 25px #ff8c00);
                            }
                            66% { 
                                opacity: 0.9; 
                                transform: scale(0.98) translateY(1px); 
                                filter: brightness(0.95) drop-shadow(0 0 18px #ffaa00);
                            }
                        }
                        
                        @keyframes puff {
                            0% { transform: scale(1); opacity: 1; }
                            50% { transform: scale(1.5); opacity: 0.5; }
                            100% { transform: scale(2); opacity: 0; }
                        }
                        
                        @keyframes pulse-status {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                        }
                        
                        @keyframes bounce-hint {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-5px); }
                        }
                        
                        @keyframes firework {
                            0% { transform: translate(0, 0); opacity: 1; }
                            100% { transform: translate(var(--x), var(--y)); opacity: 0; }
                        }
                        
                        .decoration-stars {
                            font-size: 2rem;
                            display: flex;
                            justify-content: center;
                            gap: 20px;
                            margin-top: 20px;
                            animation: twinkle 1.5s ease-in-out infinite;
                        }
                        
                        @keyframes twinkle {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.5; }
                        }

                        .mini-cakes {
                            display: none;
                        }
                        .mini-cake {
                            display: none;
                        }
                        
                        .romantic-decor {
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            pointer-events: none;
                        }
                        
                        .romantic-emoji {
                            position: absolute;
                            font-size: 2.2rem;
                            opacity: 0.65;
                            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
                            animation: float-emoji 4s ease-in-out infinite;
                        }
                        
                        @keyframes float-move {
                            0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
                            25% { transform: translateY(-12px) translateX(8px) rotate(5deg); }
                            50% { transform: translateY(-8px) translateX(-6px) rotate(-3deg); }
                            75% { transform: translateY(-15px) translateX(4px) rotate(2deg); }
                        }
                        
                        @keyframes float-emoji {
                            0%, 100% { transform: translateY(0) rotate(0deg); }
                            25% { transform: translateY(-15px) rotate(8deg); }
                            50% { transform: translateY(-10px) rotate(-5deg); }
                            75% { transform: translateY(-18px) rotate(4deg); }
                        }
                    </style>
                    
                    <div class="birthday-container">
                        <div class="birthday-title">Happy Birthday</div>
                        <div class="birthday-name">Siti Hajar Almakki</div>

                        <div class="cake-container" style="position: relative;">
                            <div class="romantic-decor">
                                <span class="romantic-emoji" style="top: 5%; left: 8%; animation-delay: 0s;">💕</span>
                                <span class="romantic-emoji" style="top: 12%; right: 10%; animation-delay: 0.3s;">✨</span>
                                <span class="romantic-emoji" style="top: 35%; left: 5%; animation-delay: 0.6s;">🎀</span>
                                <span class="romantic-emoji" style="top: 28%; right: 6%; animation-delay: 0.9s;">💖</span>
                                <span class="romantic-emoji" style="top: 60%; left: 12%; animation-delay: 0.4s;">🌹</span>
                                <span class="romantic-emoji" style="top: 58%; right: 8%; animation-delay: 0.7s;">💐</span>
                                <span class="romantic-emoji" style="bottom: 10%; left: 15%; animation-delay: 0.2s;">💝</span>
                                <span class="romantic-emoji" style="bottom: 12%; right: 10%; animation-delay: 0.8s;">✨</span>
                                <span class="romantic-emoji" style="top: 20%; left: 18%; animation-delay: 0.5s;">💗</span>
                                <span class="romantic-emoji" style="top: 50%; right: 15%; animation-delay: 1s;">🎀</span>
                            </div>
                            <div class="cake-emoji">🎂</div>
                        </div>
                    </div>
                    
                    <div id="fireworks" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; display: none;"></div>
                `;
                break;
        }
        
        if (DOM.gameContent) {
            DOM.gameContent.innerHTML = content;
            setupLevelInteractions(level);
        }
    }

    function setupLevelInteractions(level) {
        switch(level.type) {
            case 'memory':
                setupMemoryGame();
                break;
            case 'quiz':
                setupQuizGame();
                break;
            case 'catch':
                setupCatchGame();
                break;
            case 'birthday':
                setupBirthdayGame();
                break;
        }
    }

    function setupMemoryGame() {
        let flippedCards = [];
        let canFlip = true;
        const level = gameData.levels.find(l => l.id === gameState.currentLevel);
        const totalPairs = level.pairs.length;
        
        document.querySelectorAll('.memory-card').forEach(card => {
            card.addEventListener('click', () => {
                if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched') || flippedCards.length >= 2) return;
                
                playGameSound('click');
                card.classList.add('flipped');
                flippedCards.push(card);
                
                if (flippedCards.length === 2) {
                    canFlip = false;
                    const id1 = flippedCards[0].dataset.id;
                    const id2 = flippedCards[1].dataset.id;
                    
                    if (id1 === id2) {
                        // Match found!
                        setTimeout(() => {
                            flippedCards.forEach(c => {
                                c.classList.add('matched');
                                c.style.opacity = '0.3';
                                c.style.pointerEvents = 'none';
                            });
                            gameState.memoryPairsFound++;
                            addScore(25);
                            
                            // Update counter display
                            const counterText = document.querySelector('.content-title + p');
                            if (counterText) {
                                counterText.innerHTML = `Temukan pasangan emoji! ${gameState.memoryPairsFound}/${totalPairs} 💝`;
                            }
                            
                            if (gameState.memoryPairsFound >= totalPairs) {
                                setTimeout(() => completeLevel(), 500);
                            }
                            
                            flippedCards = [];
                            canFlip = true;
                        }, 500);
                    } else {
                        // No match
                        setTimeout(() => {
                            flippedCards.forEach(c => c.classList.remove('flipped'));
                            flippedCards = [];
                            canFlip = true;
                        }, 1000);
                    }
                }
            });
        });
    }

    function setupQuizGame() {
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', function() {
                const answer = parseInt(this.dataset.answer);
                const level = gameData.levels.find(l => l.id === gameState.currentLevel);
                const currentQuestion = level.questions[gameState.quizAnswers];
                
                playGameSound('click');
                
                if (answer === currentQuestion.correct) {
                    this.classList.add('correct');
                    gameState.quizAnswers++;
                    addScore(50);
                    
                    if (gameState.quizAnswers >= level.questions.length) {
                        setTimeout(() => completeLevel(), 1000);
                    } else {
                        setTimeout(() => loadLevel(gameState.currentLevel), 1500);
                    }
                } else {
                    this.classList.add('wrong');
                }
                
                document.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.style.pointerEvents = 'none';
                });
            });
        });
    }

    function setupCatchGame() {
        const level = gameData.levels.find(l => l.id === gameState.currentLevel);
        const catchGame = document.getElementById('catchGame');
        const heartsCaughtDisplay = document.getElementById('heartsCaught');
        let heartsCaught = 0;
        let heartsSpawned = 0;
        
        function createHeart() {
            if (heartsCaught >= level.targetHearts) return;
            
            const heart = document.createElement('div');
            heart.innerHTML = '💖';
            heart.style.cssText = `
                position: absolute;
                font-size: 2.5rem;
                cursor: pointer;
                animation: fall 3s linear;
                left: ${Math.random() * 90}%;
                top: -50px;
                user-select: none;
            `;
            
            // CSS animation for falling
            const styleSheet = document.createElement('style');
            styleSheet.textContent = `
                @keyframes fall {
                    from { top: -50px; transform: rotate(0deg); }
                    to { top: 420px; transform: rotate(360deg); }
                }
            `;
            if (!document.getElementById('fall-animation')) {
                styleSheet.id = 'fall-animation';
                document.head.appendChild(styleSheet);
            }
            
            heart.addEventListener('click', () => {
                playGameSound('click');
                heart.style.animation = 'none';
                heart.style.transform = 'scale(1.5)';
                heart.style.opacity = '0';
                
                heartsCaught++;
                heartsCaughtDisplay.textContent = `${heartsCaught}/${level.targetHearts}`;
                addScore(10);
                
                setTimeout(() => heart.remove(), 300);
                
                if (heartsCaught >= level.targetHearts) {
                    setTimeout(() => completeLevel(), 1000);
                }
            });
            
            heart.addEventListener('animationend', () => {
                heart.remove();
            });
            
            catchGame.appendChild(heart);
            heartsSpawned++;
        }
        
        // Spawn hearts every 800ms
        const spawnInterval = setInterval(() => {
            if (heartsCaught >= level.targetHearts) {
                clearInterval(spawnInterval);
                return;
            }
            createHeart();
        }, 800);
        
        // Initial hearts
        createHeart();
    }

    function setupBirthdayGame() {
        const fireworksContainer = document.getElementById('fireworks');
        if (fireworksContainer) {
            startFireworksLoop(fireworksContainer);
        }
        // Auto-complete the level after brief celebration
        setTimeout(() => {
            addScore(100);
            completeLevel();
        }, 2000);
    }
    
    function launchFireworks(container) {
        container.style.display = 'block';
        const colors = ['#ff6b9d', '#ffd166', '#7bc6ff', '#b388ff', '#ff9cd6'];
        const particleCount = 50;
        
        for (let burst = 0; burst < 5; burst++) {
            setTimeout(() => {
                const centerX = Math.random() * window.innerWidth;
                const centerY = Math.random() * window.innerHeight * 0.6;
                
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    const angle = (Math.PI * 2 * i) / particleCount;
                    const velocity = 100 + Math.random() * 100;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    particle.style.cssText = `
                        position: absolute;
                        left: ${centerX}px;
                        top: ${centerY}px;
                        width: 8px;
                        height: 8px;
                        background: ${color};
                        border-radius: 50%;
                        animation: firework 1s ease-out forwards;
                        --x: ${Math.cos(angle) * velocity}px;
                        --y: ${Math.sin(angle) * velocity}px;
                        box-shadow: 0 0 10px ${color};
                    `;
                    
                    container.appendChild(particle);
                    setTimeout(() => particle.remove(), 1000);
                }
            }, burst * 400);
        }
        
        // Keep container visible; no automatic hide
    }

    function startFireworksLoop(container) {
        // Continuous bursts loop
        const colors = ['#ff6b9d', '#ffd166', '#7bc6ff', '#b388ff', '#ff9cd6'];
        const particleCount = 50;
        container.style.display = 'block';
        const burst = () => {
            const centerX = Math.random() * window.innerWidth;
            const centerY = Math.random() * window.innerHeight * 0.6;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                const angle = (Math.PI * 2 * i) / particleCount;
                const velocity = 100 + Math.random() * 100;
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.cssText = `
                    position: absolute;
                    left: ${centerX}px;
                    top: ${centerY}px;
                    width: 8px;
                    height: 8px;
                    background: ${color};
                    border-radius: 50%;
                    animation: firework 1s ease-out forwards;
                    --x: ${Math.cos(angle) * velocity}px;
                    --y: ${Math.sin(angle) * velocity}px;
                    box-shadow: 0 0 10px ${color};
                `;
                container.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }
        };
        // Clear any existing loop then start
        if (container.__fwLoop) clearInterval(container.__fwLoop);
        burst();
        container.__fwLoop = setInterval(burst, 700);
    }

    function completeLevel() {
        if (!gameState.completedLevels.includes(gameState.currentLevel)) {
            gameState.completedLevels.push(gameState.currentLevel);
        }
        
        if (gameState.currentLevel === 1) gameState.memoryPairsFound = 0;
        if (gameState.currentLevel === 2) gameState.quizAnswers = 0;
        
        const rewards = [0, 50, 100, 150, 200];
        const messages = [
            "",
            "Puzzle berhasil dipecahkan, Proud!",
            "Quiz dijawab dengan sempurna, Proud!",
            "Semua hati berhasil ditangkap, Proud!",
            "Selamat mendapatkan hadiah Geulis!"
        ];
        
        showPopup("🎉", "Level Selesai!", `${messages[gameState.currentLevel]} +${rewards[gameState.currentLevel]} Poin!`);

        
        updateStats();
        sveGameState(); // Save progress after completing level
    }

    // Event Listeners Setup
    if (DOM.prevBtn) {
        DOM.prevBtn.addEventListener('click', () => {
            if (gameState.currentLevel > 1) {
                playGameSound('click');
                loadLevel(gameState.currentLevel - 1);
            }
        });
    }

    if (DOM.nextBtn) {
        DOM.nextBtn.addEventListener('click', () => {
            if (!gameState.completedLevels.includes(gameState.currentLevel)) {
                // Level belum diselesaikan
                const warnings = [
                    { icon: "🚫", title: "Belum Selesai!", text: "Kamu mau kabur? Selesaikan level ini dulu! 😤" },
                    { icon: "😤", title: "Jangan Lari!", text: "Kita belum selesai bersenang-senang! Finish ini level! 💪" },
                    { icon: "⏰", title: "Tunggu Dulu!", text: "Kamu harus selesaikan level " + gameState.currentLevel + " dulu sebelum lanjut! 😠" },
                    { icon: "💔", title: "Sayang Nih!", text: "Jangan skipkan level ini... Aku pengen lihat kamu menang! 🥺" }
                ];
                const warning = warnings[Math.floor(Math.random() * warnings.length)];
                showWarning(warning.title, warning.text);
            } else if (gameState.currentLevel < 4) {
                playGameSound('click');
                loadLevel(gameState.currentLevel + 1);
            }
        });
    }

    if (DOM.hintBtn) {
        DOM.hintBtn.addEventListener('click', () => {
            playGameSound('click');
            const hints = [
                { icon: "💡", title: "Petunjuk", text: "Eitss tidak bisaa wlee!!" },
                { icon: "🤔", title: "Hmm...", text: "Jangan menyerah sekarang!" },
                { icon: "💪", title: "Kamu Bisa!", text: "Aku percaya kamuu geuliss!" },
                { icon: "⏰", title: "Semangat Yapp!", text: "Waktu terus berjalan..." },
                { icon: "🎯", title: "Fokus Fokus!", text: "Sedikit lagi geuliss!" }
            ];
            const hint = hints[Math.floor(Math.random() * hints.length)];
            showPopup(hint.icon, hint.title, hint.text);
        });
    }

    if (DOM.popupBtn) {
        DOM.popupBtn.addEventListener('click', () => {
            playGameSound('click');
            if (DOM.popup) DOM.popup.classList.remove('active');
            if (gameState.currentLevel < 4 && gameState.completedLevels.includes(gameState.currentLevel)) {
                loadLevel(gameState.currentLevel + 1);
            }
        });
    }

    if (DOM.popup) {
        DOM.popup.addEventListener('click', (e) => {
            if (e.target === DOM.popup) {
                DOM.popup.classList.remove('active');
            }
        });
    }
    
    // Reset Game Button
    const resetGameBtn = document.getElementById('resetGameBtn');
    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', () => {
            const confirmed = confirm('Yakin ingin reset game? Semua progress akan hilang! 😱');
            if (confirmed) {
                playGameSound('click');
                localStorage.removeItem('birthdayGameState');
                location.reload(); // Reload page to reset game
            }
        });
    }

    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            
            // Check if level is locked
            // Level 1 always available, level 2-4 requires previous level completion
            const isLocked = level > 1 && !gameState.completedLevels.includes(level - 1);
            
            if (isLocked) {
                // Level belum unlock - show funny warning
                const warnings = [
                    { icon: "🔐", title: "Wah Wah Wah!", text: "Level ini masih terkunci! Selesaikan level " + (level - 1) + " dulu dong! 😤" },
                    { icon: "🚫", title: "Jangan Curang!", text: "Gak boleh lompat level! Nanti aku marah sama kamu! 😠" },
                    { icon: "⏳", title: "Sabaran Dulu!", text: "Kamu mau ngincar level " + level + "? Selesaikan level " + (level - 1) + " dulu lah! 💔" },
                    { icon: "😤", title: "Tengsin Nih!", text: "Sepertinya kamu coba curang... Level " + (level - 1) + " belum diselesaikan! 😡" },
                    { icon: "🛑", title: "STOP!", text: "Aku tahu kamu ingin cepat, tapi aturannya aturan! Lanjutkan level " + (level - 1) + "! 🤨" },
                    { icon: "💔", title: "Sakit Hati Nih!", text: "Kamu berani skip level? Kamu gak benar-benar ingin hadiah akhirnya ya? 😞" },
                    { icon: "😒", title: "Seriously?", text: "Kok curang sih? Ya masa skip level... level " + (level - 1) + " dulu lah! 🙄" },
                    { icon: "🤬", title: "Jangan Nakal!", text: "Kayaknya kamu lupa kalau aku lihat semua yang kamu lakukan! Selesaikan level " + (level - 1) + "! 😈" },
                    { icon: "💢", title: "Kesel Nih!", text: "Level " + level + " terkunci! Kamu harus selesaikan level " + (level - 1) + " dulu! Gampang kok! 😤💨" },
                    { icon: "🙅", title: "NO NO NO!", text: "Level " + level + " gak bisa diakses sebelum kamu selesai level " + (level - 1) + "! Aturan adalah aturan! 🚫✋" }
                ];
                const warning = warnings[Math.floor(Math.random() * warnings.length)];
                showWarning(warning.title, warning.text);
                playGameSound('click');
                return; // Stop here, don't load level
            }
            
            // Level is unlocked, can play
            playGameSound('click');
            loadLevel(level);
        });
    });

    // Initialize Game
    updateStats();
    loadLevel(1);
    setTimeout(() => {
        showPopup("🎮", "Selamat Datang!", "Selesaikan semua level untuk hadiah spesial! 💖");
    }, 500);
}

function initTimelinePage() {
    // Timeline logic bisa ditambahkan nanti
    console.log('Timeline page initialized');
}

// Delegasi interaksi tombol pesan (like/balas) agar tetap jalan di SPA
document.addEventListener('click', function(e){
    const act = e.target.closest('.message-action-btn');
    if (!act) return;
    playClickSound();
    act.classList.toggle('active');
});

// Unlock audio playback on first user interaction (autoplay policy bypass)
if (!window.__audioUnlockBound) {
    window.__audioUnlockBound = true;
    const unlock = () => {
        try {
            if (window.globalAudioPlayer) {
                // Hanya play jika tidak di-mute oleh pengguna
                if (!window.globalAudioPlayer.muted) {
                    window.globalAudioPlayer.play().catch(() => {});
                }
            }
        } finally {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
}
