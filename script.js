let loggedUser = null;
let activeTheme = 'theme-kertas';
let isNightMode = false;
let poems = [];
let currentViewedPoemId = null; 

// --- VARIABEL UNTUK MELACAK NOTIFIKASI BARU ---
let isInitialLoad = true;
let knownPoemIds = new Set();
let knownReplyIds = new Set();

const firebaseConfig = {
  apiKey: "AIzaSyDZDWGR-8-SN1HpLEr8t4RzJRRPglKPLZQ",
  authDomain: "zoralea-e2bdb.firebaseapp.com",
  projectId: "zoralea-e2bdb",
  storageBucket: "zoralea-e2bdb.firebasestorage.app",
  messagingSenderId: "705403846840",
  appId: "1:705403846840:web:902a615de8ed13a310f44d",
  measurementId: "G-C7M1NQZ3CR"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- MEMINTA IZIN NOTIFIKASI KE HP ---
function askNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// --- FUNGSI MENGIRIM NOTIFIKASI KE LAYAR HP ---
function sendPushNotification(title, bodyMessage) {
    if ("Notification" in window && Notification.permission === "granted") {
        // Icon hati estetik untuk notifikasi
        const iconUrl = "https://cdn-icons-png.flaticon.com/512/833/833472.png"; 
        
        // Memunculkan Notifikasi
        new Notification(title, { 
            body: bodyMessage, 
            icon: iconUrl,
            vibrate: [200, 100, 200] // Membuat HP bergetar
        });
    }
}

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
    askNotificationPermission(); // Minta izin saat web dibuka
});

function handleLogin() {
    const passcode = document.getElementById('passcode').value.trim().toLowerCase();
    const errorText = document.getElementById('login-error');

    if (passcode === 'cakrawala' || passcode === 'imup') {
        loggedUser = passcode === 'cakrawala' ? 'Zora' : 'Lea';
        errorText.style.display = 'none';
        
        // Memastikan izin notifikasi diminta ulang jika sebelumnya belum
        askNotificationPermission(); 
        
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
    isInitialLoad = true; // Reset status load
    setTimeout(() => { document.getElementById('login-screen').classList.add('active'); }, 50);
}

// --- FUNGSI MENDENGARKAN DATABASE SEKALIGUS CEK NOTIFIKASI ---
function listenToFirebase() {
    database.ref('puisi_kita').on('value', (snapshot) => {
        poems = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                const poemData = data[key];
                poems.push({ firebaseId: key, ...poemData });
                
                // CEK NOTIFIKASI PUISI BARU
                if (!isInitialLoad) {
                    if (!knownPoemIds.has(key) && poemData.author !== loggedUser) {
                        sendPushNotification("Ruang Kata Kita", `${poemData.author} baru saja menulis sesuatu untukmu: "${poemData.title}"`);
                    }
                }
                knownPoemIds.add(key);

                // CEK NOTIFIKASI BALASAN BARU
                if (poemData.replies) {
                    Object.keys(poemData.replies).forEach(replyKey => {
                        const replyData = poemData.replies[replyKey];
                        
                        if (!isInitialLoad) {
                            if (!knownReplyIds.has(replyKey) && replyData.author !== loggedUser) {
                                sendPushNotification("Balasan Baru", `${replyData.author} membalas tulisanmu: "${replyData.text}"`);
                            }
                        }
                        knownReplyIds.add(replyKey);
                    });
                }
            });
            
            poems.sort((a, b) => b.id - a.id);
        }
        
        // Setelah tarikan data pertama selesai, ubah status agar data selanjutnya memicu notifikasi
        isInitialLoad = false; 

        displayPoems();
        
        if(currentViewedPoemId) {
            const updatedPoem = poems.find(p => p.firebaseId === currentViewedPoemId);
            if(updatedPoem) {
                renderReplies(updatedPoem);
            } else {
                closeViewModal(); 
            }
        }
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
        currentViewedPoemId = poem.firebaseId;
        document.getElementById('view-title').innerText = poem.title;
        document.getElementById('view-content').innerText = poem.content; 
        document.getElementById('view-author').innerText = poem.author;
        document.getElementById('view-date').innerText = poem.date;
        document.getElementById('view-modal-content').className = `modal-content ${poem.theme}`; 
        
        renderReplies(poem);

        document.getElementById('view-modal').style.display = 'flex';
    }
}

function closeViewModal() { 
    currentViewedPoemId = null;
    document.getElementById('view-modal').style.display = 'none'; 
}

function renderReplies(poem) {
    const list = document.getElementById('replies-list');
    list.innerHTML = '';
    
    if(poem.replies) {
        Object.keys(poem.replies).forEach(replyKey => {
            const reply = poem.replies[replyKey];
            const isMe = reply.author === loggedUser;
            let actionsHtml = '';
            
            if(isMe) {
                actionsHtml = `
                    <div class="reply-actions">
                        <button class="reply-btn" onclick="openEditReplyModal('${poem.firebaseId}', '${replyKey}')">✎ Edit</button>
                        <button class="reply-btn" onclick="handleDeleteReply('${poem.firebaseId}', '${replyKey}')">🗑️</button>
                    </div>
                `;
            }

            list.innerHTML += `
                <div class="reply-bubble ${isMe ? 'my-reply' : 'their-reply'}">
                    <div>
                        <strong>${reply.author} <span style="opacity:0.6; font-weight:400; font-size:0.75rem;">• ${reply.date}</span></strong>
                        ${actionsHtml}
                    </div>
                    <p>${reply.text}</p>
                </div>
            `;
        });
    } else {
        list.innerHTML = '<p class="no-reply">Belum ada balasan, jadilah yang pertama membalas...</p>';
    }
}

function handleSendReply() {
    if(!currentViewedPoemId) return;
    const inputField = document.getElementById('reply-input');
    const text = inputField.value.trim();
    if(!text) return;
    
    const currentDate = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB, ' + new Date().toLocaleDateString('id-ID');
    
    const replyData = { author: loggedUser, text: text, date: currentDate, timestamp: Date.now() };
    database.ref('puisi_kita/' + currentViewedPoemId + '/replies').push(replyData);
    inputField.value = '';
}

function handleDeleteReply(poemId, replyId) {
    if(confirm('Yakin ingin menghapus balasan ini?')) {
        database.ref(`puisi_kita/${poemId}/replies/${replyId}`).remove();
    }
}

function openEditReplyModal(poemId, replyId) {
    const poem = poems.find(p => p.firebaseId === poemId);
    if(poem && poem.replies && poem.replies[replyId]) {
        const reply = poem.replies[replyId];
        document.getElementById('edit-reply-poem-id').value = poemId;
        document.getElementById('edit-reply-id').value = replyId;
        document.getElementById('edit-reply-content').value = reply.text;
        document.getElementById('edit-reply-modal').style.display = 'flex';
    }
}

function closeEditReplyModal() { document.getElementById('edit-reply-modal').style.display = 'none'; }

function handleSaveEditedReply() {
    const poemId = document.getElementById('edit-reply-poem-id').value;
    const replyId = document.getElementById('edit-reply-id').value;
    const newText = document.getElementById('edit-reply-content').value.trim();

    if(!newText) { alert('Balasan tidak boleh dikosongkan!'); return; }

    const currentDate = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB, ' + new Date().toLocaleDateString('id-ID') + ' (diedit)';

    database.ref(`puisi_kita/${poemId}/replies/${replyId}`).update({
        text: newText, date: currentDate
    }).then(() => { closeEditReplyModal(); });
}

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

    if (!title || !content) { alert('Tuliskan judul dan isinya ya....'); return; }

    const poemData = { title: title, content: content, theme: activeTheme, author: loggedUser, date: currentDate };

    if (firebaseId) {
        database.ref('puisi_kita/' + firebaseId).update({
            title: title, content: content, theme: activeTheme, date: currentDate + ' (diedit)'
        }).then(() => { closePoemModal(); });
    } else {
        poemData.id = Date.now();
        database.ref('puisi_kita').push(poemData).then(() => { closePoemModal(); });
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
