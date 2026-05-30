let loggedUser = null;
let activeTheme = 'theme-kertas';
let isNightMode = false; // Status latar belakang (malam atau pagi)

let initialData = [
    { id: 1, title: 'Cahaya Malam', content: 'Lihatlah kunang-kunang ini,\nmereka bersinar di kegelapan,\nseperti hadirmu di kepalaku,\nyang tak pernah pudar oleh waktu,\nterus menerangi setiap sepiku.', author: 'Zora', theme: 'theme-malam', date: '30/5/2026' },
    { id: 2, title: 'Kopi & Rindu', content: 'Pahitnya pas, manisnya cukup.\nMirip ceritamu hari ini.\nAku suka mendengarkanmu bercerita panjang lebar.', author: 'Lea', theme: 'theme-kopi', date: '30/5/2026' }
];

let poems = JSON.parse(localStorage.getItem('shared_poems_v3')) || initialData;

// --- SISTEM NUANSA WAKTU (PAGI / MALAM) ---
function initTimeMode() {
    const hour = new Date().getHours();
    // Jika jam 6 sore sampai 5 pagi = Malam. Jika jam 6 pagi sampai 5 sore = Pagi.
    if (hour >= 18 || hour < 6) {
        setMode(true); // Night
    } else {
        setMode(false); // Morning
    }
}

function toggleTimeMode() {
    setMode(!isNightMode);
}

function setMode(toNight) {
    isNightMode = toNight;
    const body = document.body;
    const modeBtn = document.getElementById('mode-btn');
    
    if (isNightMode) {
        body.classList.remove('morning-mode');
        body.classList.add('night-mode');
        modeBtn.innerHTML = '☀️ Mode Pagi';
    } else {
        body.classList.remove('night-mode');
        body.classList.add('morning-mode');
        modeBtn.innerHTML = '🌙 Mode Malam';
    }
    
    // Refresh partikel sesuai mode
    createBackgroundParticles();
}

function createBackgroundParticles() {
    const container = document.getElementById('particles-background');
    if (!container) return;
    container.innerHTML = '';
    
    const count = isNightMode ? 50 : 25; // Malam banyak kunang, pagi sedikit cahaya
    const className = isNightMode ? 'firefly' : 'morning-light';

    for (let i = 0; i < count; i++) {
        let el = document.createElement('div');
        el.className = className;
        el.style.left = `${Math.random() * 100}vw`;
        el.style.top = `${Math.random() * 100}vh`;
        el.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 5}s`;
        el.style.animationDuration = `${3 + Math.random() * 4}s, ${20 + Math.random() * 20}s`;
        container.appendChild(el);
    }
}

// Emojis melayang di menu login
function createLoginParticles() {
    const container = document.getElementById('login-particles');
    if (!container) return;
    const emojis = ['💖', '✨', '🌸', '🐱', '🦋', '☁️'];
    for (let i = 0; i < 15; i++) {
        let el = document.createElement('div');
        el.className = 'element';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = `${Math.random() * 100}%`;
        el.style.animationDelay = `${Math.random() * 5}s`;
        el.style.animationDuration = `${6 + Math.random() * 4}s`;
        container.appendChild(el);
    }
}

// Eksekusi saat web dibuka
document.addEventListener('DOMContentLoaded', () => {
    initTimeMode();
    createLoginParticles();
});


// --- SISTEM LOGIN ---
function handleLogin() {
    const passcode = document.getElementById('passcode').value.trim().toLowerCase();
    const errorText = document.getElementById('login-error');

    if (passcode === 'cakrawala' || passcode === 'imup') {
        loggedUser = passcode === 'cakrawala' ? 'Zora' : 'Lea';
        errorText.style.display = 'none';
        
        document.getElementById('login-screen').classList.remove('active');
        setTimeout(() => {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            document.getElementById('user-display').innerText = loggedUser;
            displayPoems();
        }, 600);
    } else {
        errorText.style.display = 'block';
    }
}

function handleLogout() {
    loggedUser = null;
    document.getElementById('passcode').value = '';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('login-screen').classList.add('active');
    }, 50);
}


// --- MENAMPILKAN PUISI ---
function displayPoems() {
    const container = document.getElementById('poems-container');
    container.innerHTML = '';

    poems.forEach((poem, index) => {
        const card = document.createElement('div');
        card.className = `poem-card ${poem.theme}`;
        card.style.animationDelay = `${index * 0.08}s`;
        
        // FUNGSI KLIK CARD UNTUK MEMBACA FULL
        card.onclick = () => openViewModal(poem.id);

        const isAuthor = (poem.author === loggedUser);
        
        // PENTING: Gunakan event.stopPropagation() agar saat klik tombol edit, card tidak ikut terbuka
        const actionsHtml = isAuthor ? `
            <div class="poem-actions">
                <button class="action-btn" onclick="event.stopPropagation(); openEditModal(${poem.id})" title="Edit">✎</button>
                <button class="action-btn" onclick="event.stopPropagation(); handleDeletePoem(${poem.id})" title="Hapus">🗑️</button>
            </div>
        ` : `<span></span>`;

        card.innerHTML = `
            <div class="poem-title">${poem.title}</div>
            <div class="poem-content-preview">${poem.content}</div>
            <div class="poem-footer">
                <span>Oleh: <b>${poem.author}</b></span>
                ${actionsHtml}
            </div>
        `;
        container.appendChild(card);
    });
}

// --- MODAL: BACA PUISI (BISA DIPENCET) ---
function openViewModal(id) {
    const poem = poems.find(p => p.id == id);
    if(poem) {
        document.getElementById('view-title').innerText = poem.title;
        // Gunakan pre-wrap di CSS / innerText untuk menjaga baris (enter)
        document.getElementById('view-content').innerText = poem.content; 
        document.getElementById('view-author').innerText = poem.author;
        document.getElementById('view-date').innerText = poem.date;
        
        // Ubah warna latar popup bacaan sesuai dengan tema kartu puisinya
        const modalContent = document.getElementById('view-modal-content');
        modalContent.className = `modal-content ${poem.theme}`; 

        document.getElementById('view-modal').style.display = 'flex';
    }
}

function closeViewModal() {
    document.getElementById('view-modal').style.display = 'none';
}


// --- MODAL: TULIS / EDIT PUISI ---
function openPoemModal() {
    document.getElementById('poem-modal').style.display = 'flex';
    document.getElementById('poem-id').value = '';
    document.getElementById('poem-title').value = '';
    document.getElementById('poem-content').value = '';
    document.getElementById('modal-heading').innerText = 'Goreskan Tintamu';
    changeSelectedTheme('theme-kertas'); 
}

function closePoemModal() {
    document.getElementById('poem-modal').style.display = 'none';
}

function changeSelectedTheme(themeClassName) {
    activeTheme = themeClassName;
    document.querySelectorAll('.theme-opt').forEach(opt => opt.classList.remove('selected'));
    document.querySelector(`.${themeClassName}`).classList.add('selected');
}


// --- SIMPAN, EDIT, HAPUS ---
function handleSavePoem() {
    const id = document.getElementById('poem-id').value;
    const title = document.getElementById('poem-title').value.trim();
    const content = document.getElementById('poem-content').value.trim();
    const currentDate = new Date().toLocaleDateString('id-ID');

    if (!title || !content) {
        alert('Tuliskan judul dan isinya ya...');
        return;
    }

    if (id) {
        const index = poems.findIndex(p => p.id == id);
        if (index !== -1 && poems[index].author === loggedUser) {
            poems[index].title = title;
            poems[index].content = content;
            poems[index].theme = activeTheme;
            poems[index].date = currentDate + ' (diedit)';
        }
    } else {
        const newPoem = {
            id: Date.now(),
            title: title,
            content: content,
            author: loggedUser,
            theme: activeTheme,
            date: currentDate
        };
        poems.unshift(newPoem);
    }

    saveToStorage();
    closePoemModal();
    displayPoems();
}

function openEditModal(id) {
    const poem = poems.find(p => p.id == id);
    if (poem && poem.author === loggedUser) {
        document.getElementById('poem-id').value = poem.id;
        document.getElementById('poem-title').value = poem.title;
        document.getElementById('poem-content').value = poem.content;
        document.getElementById('modal-heading').innerText = 'Perbarui Rasamu';
        changeSelectedTheme(poem.theme);
        document.getElementById('poem-modal').style.display = 'flex';
    }
}

function handleDeletePoem(id) {
    const poem = poems.find(p => p.id == id);
    if (poem && poem.author === loggedUser) {
        if (confirm(`Yakin ingin menghapus tulisan "${poem.title}"?`)) {
            poems = poems.filter(p => p.id !== id);
            saveToStorage();
            displayPoems();
        }
    }
}

function saveToStorage() {
    localStorage.setItem('shared_poems_v3', JSON.stringify(poems));
}

window.addEventListener('keyup', function(e) {
    if (document.getElementById('passcode') === document.activeElement && e.key === 'Enter') {
        handleLogin();
    }
});