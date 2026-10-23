const SUPABASE_URL = 'https://hgncgmwyimxhtxsvujje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnbmNnbXd5aW14aHR4c3Z1amplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MzU5MDAsImV4cCI6MjEwMzExMTkwMH0.woPE34ngX-8EF_ffTeEeHxzoBT-hJRsJCJ4fZOmPIHg';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ページ読み込み時にセッション確認
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showAdminSection();
  }
});

function showAdminSection() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('admin-section').classList.remove('hidden');
  loadEvents();
  loadNotices();
}

// --- 認証機能 ---
async function login() {
  const password = document.getElementById('password-input').value;
  if (!password) { alert('パスワードを入力してください'); return; }
  
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: 'admin-calendar-2026@gmail.com',
    password: password
  });

  if (error) {
    console.error('Login Error:', error);
    alert('ログイン失敗: ' + error.message);
  } else {
    showAdminSection();
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  document.getElementById('admin-section').classList.add('hidden');
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('password-input').value = '';
}

// --- カレンダー（events）操作 ---
async function loadEvents() {
  const { data: events, error } = await supabaseClient.from('events').select('*').order('start', { ascending: true });
  if (error) {
    console.error('Events Load Error:', error);
    return;
  }
  const listEl = document.getElementById('event-list');
  listEl.innerHTML = '';
  if (events) {
    events.forEach(event => {
      const li = document.createElement('li');
      const dateStr = event.end ? `${event.start} 〜 ${event.end}` : event.start;
      li.innerHTML = `<span><strong>${escapeHtml(event.title)}</strong> (${dateStr})</span><button class="delete-btn" onclick="deleteEvent('${event.id}')">削除</button>`;
      listEl.appendChild(li);
    });
  }
}

async function addEvent() {
  const title = document.getElementById('event-title').value;
  const start = document.getElementById('event-start').value;
  const end = document.getElementById('event-end').value;
  if (!title || !start) { alert('タイトルと開始日は必須です'); return; }
  
  const newEvent = { title, start };
  if (end) newEvent.end = end;

  const { error } = await supabaseClient.from('events').insert([newEvent]);
  if (error) {
    alert('追加に失敗しました: ' + error.message);
  } else {
    alert('予定を追加しました');
    document.getElementById('event-title').value = '';
    document.getElementById('event-start').value = '';
    document.getElementById('event-end').value = '';
    loadEvents();
  }
}

async function deleteEvent(id) {
  if (!confirm('本当にこの予定を削除しますか？')) return;
  const { error } = await supabaseClient.from('events').delete().eq('id', id);
  if (error) {
    alert('削除に失敗しました: ' + error.message);
  } else {
    loadEvents();
  }
}

// --- 連絡板（notices）操作 ---
async function loadNotices() {
  const { data: notices, error } = await supabaseClient.from('notices').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Notices Load Error:', error);
    return;
  }
  const listEl = document.getElementById('notice-list');
  listEl.innerHTML = '';
  if (notices) {
    notices.forEach(notice => {
      const li = document.createElement('li');
      const date = new Date(notice.created_at).toLocaleDateString('ja-JP');
      const tag = notice.important ? '<span style="color:#800020; font-weight:bold;">[重要] </span>' : '';
      li.innerHTML = `<div><strong>${tag}${escapeHtml(notice.title)}</strong> <small style="color:#71717a;">(${date})</small></div><button class="delete-btn" onclick="deleteNotice(${notice.id})">削除</button>`;
      listEl.appendChild(li);
    });
  }
}

async function addNotice() {
  const title = document.getElementById('notice-title').value;
  const content = document.getElementById('notice-content').value;
  const important = document.getElementById('notice-important').checked;

  if (!title || !content) { alert('タイトルと本文を入力してください'); return; }

  const { error } = await supabaseClient.from('notices').insert([{ title, content, important }]);
  if (error) {
    alert('投稿に失敗しました: ' + error.message);
  } else {
    alert('お知らせを投稿しました');
    document.getElementById('notice-title').value = '';
    document.getElementById('notice-content').value = '';
    document.getElementById('notice-important').checked = false;
    loadNotices();
  }
}

async function deleteNotice(id) {
  if (!confirm('本当にこのお知らせを削除しますか？')) return;
  const { error } = await supabaseClient.from('notices').delete().eq('id', id);
  if (error) {
    alert('削除に失敗しました: ' + error.message);
  } else {
    loadNotices();
  }
}

// XSS対策用エスケープ関数
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}