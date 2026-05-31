let loggedUser = null;
let activeTheme = 'theme-kertas';
let isNightMode = false;
let poems = [];

// =========================================================================
// PENTING: GANTI DENGAN KODE FIREBASE MILIKMU DARI CONSOLE.FIREBASE.GOOGLE.COM
// Jika ini dibiarkan "AIzaSyASDFGH...", tombol simpan PASTI GAGAL / ERROR!
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDZDWGR-8-SN1HpLEr8t4RzJRRPglKPLZQ",
  authDomain: "zoralea-e2bdb.firebaseapp.com",
  projectId: "zoralea-e2bdb",
  storageBucket: "zoralea-e2bdb.firebasestorage.app",
  messagingSenderId: "705403846840",
  appId: "1:705403846840:web:902a615de8ed13a310f44d",
  measurementId: "G-C7M1NQZ3CR"
};
// =========================================================================

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function initTimeMode() {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) { setMode(true); } else { setMode(false); }
}

function toggleTimeMode() { setMode(!isNightMode); }

function setMode(toNight) {
    isNightMode = toNight;
    const body = document.body;
    const modeBtn = document.getElementById('mode-btn');
    if (isNightMode) {
        body.classList.remove('morning-mode'); body.classList.add('night-mode');
        modeBtn.innerHTML = '☀️ Mode Pagi';
    } else {
        body.classList.remove('night-mode'); body.classList.add('morning-mode');
        modeBtn.innerHTML = '🌙 Mode Malam';
    }
    createBackgroundParticles();
}

function createBackgroundParticles() {
    const container = document.getElementById('particles-background');
    if (!container) return; container.innerHTML = '';
    const count = isNightMode ? 50 : 25;
    const className = isNightMode ? 'firefly' : 'morning-light';
    for (let i = 0; i < count; i++) {
        let el = document.createElement('div');
        el.className = className;
        el.style.left = `${Math.random() * 100}vw`; el.style.top = `${Math.random() * 100}vh`;
        el.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 5}s`;
        el.style.animationDuration = `${3 + Math.random() * 4}s, ${20 + Math.random() * 20}s`;
        container.appendChild(el);
    }
}

function createLoginParticles() {
    const container = document.getElementById('login-particles');
    if (!container) return;
    const emojis = ['💖', '✨', '🌸', '🐱', '🦋', '☁️'];
    for (let i = 0; i < 15; i++) {
        let el = document.createElement('div'); el.className = 'element';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = `${Math.random() * 100}%`; el.style.animationDelay = `${Math.random() * 5}s`;
        el.style.animationDuration = `${6 + Math.random() * 4}s`;
        container.appendChild(el);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTimeMode();
    createLoginParticles();
});

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
            listenToFirebase(); 
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
    setTimeout(() => { document.getElementById('login-screen').classList.add('active'); }, 50);
}

function listenToFirebase() {
    database.ref('puisi_kita').on('value', (snapshot) => {
        poems = [];
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                poems.push({ firebaseId: key, ...data[key] });
            });
            poems.sort((a, b) => b.id - a.id);
        }
        displayPoems();
    });
}

function displayPoems() {
    const container = document.getElementById('poems-container');
    container.innerHTML = '';

    if(poems.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; opacity:0.6; padding-top:40px;">Belum ada goresan kata. Yuk tulis perasaanmu pertama kali... ❤️</p>`;
        return;
    }

    poems.forEach((poem, index) => {
        const card = document.createElement('div');
        card.className = `poem-card ${poem.theme}`;
        card.style.animationDelay = `${index * 0.05}s`;
        card.onclick = () => openViewModal(poem.id);

        const isAuthor = (poem.author === loggedUser);
        const actionsHtml = isAuthor ? `
            <div class="poem-actions">
                <button class="action-btn" onclick="event.stopPropagation(); openEditModal('${poem.firebaseId}')" title="Edit">✎</button>
                <button class="action-btn" onclick="event.stopPropagation(); handleDeletePoem('${poem.firebaseId}', '${poem.title}')" title="Hapus">🗑️</button>
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

function openViewModal(id) {
    const poem = poems.find(p => p.id == id);
    if(poem) {
        document.getElementById('view-title').innerText = poem.title;
        document.getElementById('view-content').innerText = poem.content; 
        document.getElementById('view-author').innerText = poem.author;
        document.getElementById('view-date').innerText = poem.date;
        document.getElementById('view-modal-content').className = `modal-content ${poem.theme}`; 
        document.getElementById('view-modal').style.display = 'flex';
    }
}

function closeViewModal() { document.getElementById('view-modal').style.display = 'none'; }

function openPoemModal() {
    document.getElementById('poem-modal').style.display = 'flex';
    document.getElementById('poem-id').value = '';
    document.getElementById('poem-title').value = '';
    document.getElementById('poem-content').value = '';
    document.getElementById('modal-heading').innerText = 'Goreskan Tintamu';
    changeSelectedTheme('theme-kertas'); 
}

function closePoemModal() { document.getElementById('poem-modal').style.display = 'none'; }

function changeSelectedTheme(themeClassName) {
    activeTheme = themeClassName;
    document.querySelectorAll('.theme-opt').forEach(opt => opt.classList.remove('selected'));
    document.querySelector(`.${themeClassName}`).classList.add('selected');
}

function handleSavePoem() {
    const firebaseId = document.getElementById('poem-id').value;
    const title = document.getElementById('poem-title').value.trim();
    const content = document.getElementById('poem-content').value.trim();
    const currentDate = new Date().toLocaleDateString('id-ID');

    if (!title || !content) {
        alert('Tuliskan judul dan isinya ya....'); return;
    }

    const poemData = {
        title: title,
        content: content,
        theme: activeTheme,
        author: loggedUser,
        date: currentDate
    };

    if (firebaseId) {
        database.ref('puisi_kita/' + firebaseId).update({
            title: title,
            content: content,
            theme: activeTheme,
            date: currentDate + ' (diedit)'
        }).then(() => { 
            closePoemModal(); 
        }).catch((error) => {
            alert("Oops! Data gagal disimpan.\nPastikan Kunci Firebase milikmu sudah benar dan Rules Database disetel ke true.\n\nError: " + error.message);
        });
    } else {
        poemData.id = Date.now();
        database.ref('puisi_kita').push(poemData).then(() => { 
            closePoemModal(); 
        }).catch((error) => {
            alert("Oops! Data gagal disimpan.\nPastikan Kunci Firebase milikmu sudah benar dan Rules Database disetel ke true.\n\nError: " + error.message);
        });
    }
}

function openEditModal(firebaseId) {
    const poem = poems.find(p => p.firebaseId === firebaseId);
    if (poem && poem.author === loggedUser) {
        document.getElementById('poem-id').value = poem.firebaseId;
        document.getElementById('poem-title').value = poem.title;
        document.getElementById('poem-content').value = poem.content;
        document.getElementById('modal-heading').innerText = 'Perbarui Rasamu';
        changeSelectedTheme(poem.theme);
        document.getElementById('poem-modal').style.display = 'flex';
    }
}

function handleDeletePoem(firebaseId, title) {
    const poem = poems.find(p => p.firebaseId === firebaseId);
    if (poem && poem.author === loggedUser) {
        if (confirm(`Yakin ingin menghapus tulisan "${title}" dari ruang kita?`)) {
            database.ref('puisi_kita/' + firebaseId).remove();
        }
    }
}

window.addEventListener('keyup', function(e) {
    if (document.getElementById('passcode') === document.activeElement && e.key === 'Enter') { handleLogin(); }
});
