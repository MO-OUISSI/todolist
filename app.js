// State
let current = new Date();
let selectedDate = new Date();
const state = {
  todosByDate: {}, // key: YYYY-MM-DD -> [{ id, text, done }]
  theme: null,
};

// Utils
const ymd = (d) => d.toISOString().slice(0,10);
const clampToMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monthLabel = (d) => d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
const dayLabel = (d) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const isSameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

// Elements
const monthEl = document.getElementById('monthLabel');
const gridEl = document.getElementById('calendarGrid');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');
const selectedLabel = document.getElementById('selectedDateLabel');
const todayBtn = document.getElementById('todayBtn');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const formEl = document.getElementById('addTodoForm');
const inputEl = document.getElementById('todoInput');
const listEl = document.getElementById('todoList');
const themeToggle = document.getElementById('themeToggle');
const installBtn = document.getElementById('installBtn');

// Persistence
function load(){
  try{
    const raw = localStorage.getItem('calendo:v1');
    if(raw){
      const saved = JSON.parse(raw);
      state.todosByDate = saved.todosByDate||{};
      state.theme = saved.theme||null;
    }
  }catch{}
}
function save(){
  localStorage.setItem('calendo:v1', JSON.stringify({
    todosByDate: state.todosByDate,
    theme: state.theme,
  }));
}

// Theme
function applyTheme(){
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = state.theme ? state.theme==='dark' : prefersDark;
  document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
  themeToggle.textContent = useDark ? '🌙' : '☀️';
}

// Calendar build
function buildCalendar(){
  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // Sunday start
  const cells = [];
  const today = new Date();
  for(let i=0;i<42;i++){
    const d = new Date(start);
    d.setDate(start.getDate()+i);
    const inMonth = d.getMonth()===current.getMonth();
    const key = ymd(d);
    const hasTodos = (state.todosByDate[key]||[]).length>0;
    const btn = document.createElement('button');
    btn.className = 'day'+(inMonth?'':' out')+(isSameDay(d,today)?' today':'')+(isSameDay(d,selectedDate)?' selected':'');
    btn.setAttribute('role','gridcell');
    btn.textContent = String(d.getDate());
    if(hasTodos) btn.classList.add('has-todos');
    btn.addEventListener('click',()=>{
      selectedDate = clampToMidnight(d);
      render();
    });
    cells.push(btn);
  }
  gridEl.replaceChildren(...cells);
  monthEl.textContent = monthLabel(current);
}

// Todos
function getTodos(date){
  const key = ymd(date);
  return state.todosByDate[key] || (state.todosByDate[key]=[]);
}
function addTodo(text){
  const items = getTodos(selectedDate);
  items.push({ id: crypto.randomUUID(), text, done:false });
  save();
  renderTodos();
  buildCalendar();
}
function toggleTodo(id){
  const items = getTodos(selectedDate);
  const t = items.find(x=>x.id===id);
  if(t){ t.done=!t.done; save(); renderTodos(); buildCalendar(); }
}
function removeTodo(id){
  const items = getTodos(selectedDate);
  const idx = items.findIndex(x=>x.id===id);
  if(idx>-1){ items.splice(idx,1); save(); renderTodos(); buildCalendar(); }
}
function clearDone(){
  const items = getTodos(selectedDate);
  const next = items.filter(x=>!x.done);
  state.todosByDate[ymd(selectedDate)] = next;
  save();
  renderTodos();
  buildCalendar();
}

function renderTodos(){
  selectedLabel.textContent = isSameDay(selectedDate, new Date()) ? 'Today' : dayLabel(selectedDate);
  const items = getTodos(selectedDate);
  listEl.innerHTML = '';
  for(const t of items){
    const li = document.createElement('li');
    li.className = 'todo-item'+(t.done?' done':'');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = t.done; cb.addEventListener('change',()=>toggleTodo(t.id));
    const span = document.createElement('span'); span.className='todo-text'; span.textContent = t.text;
    const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Delete'; del.addEventListener('click',()=>removeTodo(t.id));
    const actions = document.createElement('div'); actions.className='todo-actions'; actions.appendChild(del);
    li.appendChild(cb); li.appendChild(span); li.appendChild(actions);
    listEl.appendChild(li);
  }
}

// Navigation
prevBtn.addEventListener('click',()=>{ current = new Date(current.getFullYear(), current.getMonth()-1, 1); buildCalendar(); });
nextBtn.addEventListener('click',()=>{ current = new Date(current.getFullYear(), current.getMonth()+1, 1); buildCalendar(); });
todayBtn.addEventListener('click',()=>{ selectedDate = clampToMidnight(new Date()); current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1); render(); });
clearDoneBtn.addEventListener('click', clearDone);

// Form
formEl.addEventListener('submit', (e)=>{
  e.preventDefault();
  const v = inputEl.value.trim();
  if(!v) return;
  addTodo(v);
  inputEl.value='';
  inputEl.focus();
});

// Theme toggle
themeToggle.addEventListener('click',()=>{
  const currentTheme = document.documentElement.dataset.theme;
  const next = currentTheme==='dark' ? 'light' : 'dark';
  state.theme = next;
  applyTheme();
  save();
});

// PWA: install prompt
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice; // { outcome }
  deferredPrompt = null;
  installBtn.hidden = true;
});

// Service Worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./service-worker.js');
  });
}

function render(){
  buildCalendar();
  renderTodos();
  applyTheme();
}

// Init
load();
selectedDate = clampToMidnight(selectedDate);
current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
document.addEventListener('DOMContentLoaded', render);


