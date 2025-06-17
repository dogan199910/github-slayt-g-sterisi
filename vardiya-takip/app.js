// Firebase configuration placeholder - replace with your project's config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Simple state management
let currentUser = null;
let currentRole = null;

function render() {
  const app = document.getElementById('app');
  if (!currentUser) {
    app.innerHTML = `
      <h3 class="mb-3">Giriş Yap</h3>
      <div id="recaptcha-container"></div>
      <input id="phone" type="tel" class="form-control mb-2" placeholder="Telefon Numarası" />
      <button id="send-code" class="btn btn-primary">Kodu Gönder</button>
      <div id="code-container" class="mt-2" style="display:none;">
        <input id="code" type="text" class="form-control mb-2" placeholder="Doğrulama Kodu" />
        <button id="verify-code" class="btn btn-success">Giriş Yap</button>
      </div>
    `;
    document.getElementById('send-code').onclick = sendCode;
  } else if (!currentRole) {
    app.innerHTML = `
      <h3 class="mb-3">Rol Seç</h3>
      <select id="role" class="form-select mb-3">
        <option value="Personnel">Personel</option>
        <option value="Manager">Yönetici</option>
      </select>
      <button id="save-role" class="btn btn-primary">Devam</button>
    `;
    document.getElementById('save-role').onclick = saveRole;
  } else if (currentRole === 'Personnel') {
    renderPersonnel();
  } else {
    renderManager();
  }
}

function sendCode() {
  const phoneNumber = document.getElementById('phone').value;
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible'
  });
  auth.signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
    .then(confirmationResult => {
      window.confirmationResult = confirmationResult;
      document.getElementById('code-container').style.display = 'block';
      document.getElementById('verify-code').onclick = verifyCode;
    })
    .catch(alert);
}

function verifyCode() {
  const code = document.getElementById('code').value;
  window.confirmationResult.confirm(code)
    .then(result => {
      currentUser = result.user;
      checkRole();
    })
    .catch(alert);
}

function checkRole() {
  db.collection('users').doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      currentRole = doc.data().role;
      render();
    } else {
      render();
    }
  });
}

function saveRole() {
  const role = document.getElementById('role').value;
  db.collection('users').doc(currentUser.uid).set({ role }).then(() => {
    currentRole = role;
    render();
  });
}

function renderPersonnel() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h3 class="mb-3">Vardiya Bildirimi</h3>
    <select id="unit" class="form-select mb-3">
      <option value="Birim 1">Birim 1</option>
      <option value="Birim 2">Birim 2</option>
      <option value="Birim 3">Birim 3</option>
      <option value="Birim 4">Birim 4</option>
      <option value="Birim 5">Birim 5</option>
    </select>
    <select id="type" class="form-select mb-3" onchange="toggleOther()">
      <option value="Start Shift">Vardiya Başlangıcı</option>
      <option value="Status Normal">Durum Normal</option>
      <option value="End Shift">Vardiya Sonu</option>
      <option value="Other">Diğer</option>
    </select>
    <input id="other" type="text" class="form-control mb-3" placeholder="Mesaj" style="display:none;" />
    <button id="send" class="btn btn-primary">Gönder</button>
    <button id="logout" class="btn btn-link">Çıkış</button>
  `;
  document.getElementById('send').onclick = sendNotification;
  document.getElementById('logout').onclick = logout;
}

function toggleOther() {
  const type = document.getElementById('type').value;
  document.getElementById('other').style.display = type === 'Other' ? 'block' : 'none';
}

function sendNotification() {
  const data = {
    unit: document.getElementById('unit').value,
    type: document.getElementById('type').value,
    message: document.getElementById('other').value || null,
    userId: currentUser.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  db.collection('notifications').add(data).then(() => {
    alert('Bildirim gönderildi');
  });
}

function renderManager() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h3 class="mb-3">Bildirimler</h3>
    <table class="table" id="table">
      <thead>
        <tr>
          <th>Birim</th>
          <th>Kullanıcı</th>
          <th>Tür</th>
          <th>Mesaj</th>
          <th>Zaman</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <button id="export" class="btn btn-secondary">CSV İndir</button>
    <button id="logout" class="btn btn-link">Çıkış</button>
  `;
  document.getElementById('export').onclick = exportCSV;
  document.getElementById('logout').onclick = logout;
  loadNotifications();
}

function loadNotifications() {
  db.collection('notifications').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    const tbody = document.querySelector('#table tbody');
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.unit}</td>
        <td>${d.userId}</td>
        <td>${d.type}</td>
        <td>${d.message || ''}</td>
        <td>${d.timestamp ? d.timestamp.toDate().toLocaleString() : ''}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function exportCSV() {
  db.collection('notifications').orderBy('timestamp').get().then(snapshot => {
    const rows = [
      ['Unit', 'UserID', 'Type', 'Message', 'Timestamp']
    ];
    snapshot.forEach(doc => {
      const d = doc.data();
      rows.push([
        d.unit,
        d.userId,
        d.type,
        d.message || '',
        d.timestamp ? d.timestamp.toDate().toISOString() : ''
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notifications.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function logout() {
  auth.signOut().then(() => {
    currentUser = null;
    currentRole = null;
    render();
  });
}

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    checkRole();
  } else {
    currentUser = null;
    currentRole = null;
    render();
  }
});

render();
