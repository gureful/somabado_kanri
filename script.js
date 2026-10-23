const SUPABASE_URL = 'https://hgncgmwyimxhtxsvujje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnbmNnbXd5aW14aHR4c3Z1amplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MzU5MDAsImV4cCI6MjEwMzExMTkwMH0.woPE34ngX-8EF_ffTeEeHxzoBT-hJRsJCJ4fZOmPIHg';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let calendar; // グローバルで保持
let currentWidth = window.innerWidth; // リサイズ判定用

document.addEventListener('DOMContentLoaded', function() {
  loadNotices();
  initCalendar();
});

// --- 1. 連絡板データの取得・表示 ---
async function loadNotices() {
  const { data: notices, error } = await supabaseClient
    .from('notices')
    .select('*')
    .order('important', { ascending: false })
    .order('created_at', { ascending: false });

  const container = document.getElementById('notice-list');
  if (error) {
    container.innerHTML = '<p>お知らせの取得に失敗しました。</p>';
    console.error('Notices Fetch Error:', error);
    return;
  }

  if (!notices || notices.length === 0) {
    container.innerHTML = '<p style="color: #666;">現在お知らせはありません。</p>';
    return;
  }

  container.innerHTML = notices.map(notice => {
    const date = new Date(notice.created_at).toLocaleDateString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const badge = notice.important ? '<span class="badge-important">重要</span>' : '';
    
    return `
      <div class="notice-card ${notice.important ? 'important' : ''}">
        <div class="notice-header">
          <p class="notice-title">${badge}${escapeHtml(notice.title)}</p>
          <span class="notice-date">${date}</span>
        </div>
        <div class="notice-content">${escapeHtml(notice.content)}</div>
      </div>
    `;
  }).join('');
}

// --- 2. カレンダーの初期化・表示 ---
async function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  
  const { data: events, error } = await supabaseClient.from('events').select('*');
  if (error) {
    console.error('Events Fetch Error:', error);
  }

  const isMobile = window.innerWidth < 768;

  calendar = new FullCalendar.Calendar(calendarEl, {
    // スマホはリスト表示(listMonth)、PC・タブレットは月表示(dayGridMonth)
    initialView: isMobile ? 'listMonth' : 'dayGridMonth',
    locale: 'ja',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: isMobile ? 'dayGridMonth,listMonth' : 'dayGridMonth,timeGridWeek,listMonth'
    },
    buttonText: {
      today: '今日',
      month: '月',
      week: '週',
      list: '一覧'
    },
    events: events || [],
    // 画面の「横幅」が実際に変わった時のみビューを切り替える（スクロールによる不具合を防止）
    windowResize: function() {
      if (window.innerWidth === currentWidth) return; // 縦スクロールによる伸縮は無視
      currentWidth = window.innerWidth;

      if (window.innerWidth < 768) {
        calendar.changeView('listMonth');
      } else {
        calendar.changeView('dayGridMonth');
      }
    }
  });
  
  calendar.render();
}

// XSS対策用エスケープ関数
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}