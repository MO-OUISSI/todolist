// State
let current = new Date();
let selectedDate = new Date();
const state = {
  todosByDate: {}, // key: YYYY-MM-DD -> [{ id, text, done, priority }]
  notesByDate: {}, // key: YYYY-MM-DD -> string
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
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const prioritySelect = document.getElementById('prioritySelect');

// Navigation elements
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Stats elements
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const completionRateEl = document.getElementById('completionRate');
const activeDaysEl = document.getElementById('activeDays');
const weeklyChartEl = document.getElementById('weeklyChart');
const priorityChartEl = document.getElementById('priorityChart');

// Notes elements
const noteTextarea = document.getElementById('noteTextarea');
const noteDateLabel = document.getElementById('noteDateLabel');
const noteCharCount = document.getElementById('noteCharCount');
const noteWordCount = document.getElementById('noteWordCount');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const clearNoteBtn = document.getElementById('clearNoteBtn');

// Settings elements
const themeSelect = document.getElementById('themeSelect');
const exportAllBtn = document.getElementById('exportAllBtn');
const importAllBtn = document.getElementById('importAllBtn');
const importAllFile = document.getElementById('importAllFile');
const clearAllDataBtn = document.getElementById('clearAllDataBtn');

// Persistence
function load(){
  try{
    const raw = localStorage.getItem('calendo:v1');
    if(raw){
      const saved = JSON.parse(raw);
      state.todosByDate = saved.todosByDate||{};
      state.notesByDate = saved.notesByDate||{};
      state.theme = saved.theme||null;
    }
  }catch{}
}
function save(){
  localStorage.setItem('calendo:v1', JSON.stringify({
    todosByDate: state.todosByDate,
    notesByDate: state.notesByDate,
    theme: state.theme,
  }));
}

// Theme
function applyTheme(){
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let theme = state.theme;
  
  if(theme === 'auto' || !theme) {
    theme = prefersDark ? 'dark' : 'light';
  }
  
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  
  if(themeSelect){
    themeSelect.value = state.theme || 'auto';
  }
}

// Navigation with smooth animations
function showPage(pageName){
  const currentActivePage = document.querySelector('.page.active');
  const targetPage = document.getElementById(pageName + 'Page');
  const targetBtn = document.querySelector(`[data-page="${pageName}"]`);
  
  // If already on the same page, do nothing
  if (currentActivePage === targetPage) return;
  
  // Remove active states
  pages.forEach(page => page.classList.remove('active'));
  navBtns.forEach(btn => btn.classList.remove('active'));
  
  // Add slide-out animation to current page
  if (currentActivePage) {
    currentActivePage.classList.add('slide-out');
    
    // Wait for slide-out animation to complete
    setTimeout(() => {
      currentActivePage.classList.remove('slide-out');
      
      // Show new page with animation
      if (targetPage) {
        targetPage.classList.add('active');
      }
      if (targetBtn) {
        targetBtn.classList.add('active');
      }
      
      // Update page-specific content
      if(pageName === 'stats') updateStats();
      if(pageName === 'notes') updateNotes();
      
    }, 200); // Match the slide-out transition duration
  } else {
    // No current page, show immediately
    if (targetPage) {
      targetPage.classList.add('active');
    }
    if (targetBtn) {
      targetBtn.classList.add('active');
    }
    
    // Update page-specific content
    if(pageName === 'stats') updateStats();
    if(pageName === 'notes') updateNotes();
  }
}

// Calendar build - Completely rewritten for reliability
function buildCalendar(){
  console.log('Building calendar...');
  
  if (!gridEl) {
    console.error('Calendar grid element not found');
    return;
  }
  
  // Clear existing content
  gridEl.innerHTML = '';
  
  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // Sunday start
  const today = new Date();
  
  // Create 42 days (6 weeks)
  for(let i = 0; i < 42; i++){
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const inMonth = d.getMonth() === current.getMonth();
    const key = ymd(d);
    const hasTodos = (state.todosByDate[key] || []).length > 0;
    
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    
    // Add classes based on state
    if (!inMonth) dayEl.classList.add('out');
    if (isSameDay(d, today)) dayEl.classList.add('today');
    if (isSameDay(d, selectedDate)) dayEl.classList.add('selected');
    if (hasTodos) dayEl.classList.add('has-todos');
    
    dayEl.textContent = d.getDate();
    dayEl.addEventListener('click', () => {
      selectedDate = clampToMidnight(d);
      render();
    });
    
    gridEl.appendChild(dayEl);
  }
  
  // Update month label
  if (monthEl) {
    monthEl.textContent = monthLabel(current);
  }
  
  console.log('Calendar built successfully');
}

// Todos
function getTodos(date){
  const key = ymd(date);
  return state.todosByDate[key] || (state.todosByDate[key]=[]);
}
function addTodo(text){
  const items = getTodos(selectedDate);
  const priority = prioritySelect ? prioritySelect.value : 'normal';
  items.push({ id: crypto.randomUUID(), text, done:false, priority });
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
  console.log('Rendering todos...');
  
  if (selectedLabel) {
    selectedLabel.textContent = isSameDay(selectedDate, new Date()) ? 'Today' : dayLabel(selectedDate);
  }
  
  const items = getTodos(selectedDate);
  
  if (!listEl) {
    console.error('Task list element not found');
    return;
  }
  
  listEl.innerHTML = '';
  
  items.forEach((t, index) => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task-item' + (t.done ? ' done' : '');
    taskEl.draggable = true;
    taskEl.dataset.id = t.id;
    
    // Drag events
    taskEl.addEventListener('dragstart', (e) => { 
      taskEl.classList.add('dragging'); 
      e.dataTransfer.setData('text/plain', t.id); 
    });
    taskEl.addEventListener('dragend', () => { 
      taskEl.classList.remove('dragging'); 
    });
    taskEl.addEventListener('dragover', (e) => { 
      e.preventDefault(); 
      const dragging = listEl.querySelector('.dragging'); 
      if (!dragging || dragging === taskEl) return; 
      const rect = taskEl.getBoundingClientRect(); 
      const before = (e.clientY - rect.top) < rect.height / 2; 
      listEl.insertBefore(dragging, before ? taskEl : taskEl.nextSibling); 
    });
    taskEl.addEventListener('drop', () => {
      const ids = Array.from(listEl.children).map(x => x.dataset.id);
      const reordered = ids.map(id => items.find(x => x.id === id)).filter(Boolean);
      state.todosByDate[ymd(selectedDate)] = reordered;
      save();
    });

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.addEventListener('change', () => toggleTodo(t.id));

    // Task text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = t.text;
    textSpan.title = 'Double-click to edit';
    textSpan.addEventListener('dblclick', () => startEdit(textSpan, t));

    // Priority badge
    const badge = document.createElement('span');
    badge.className = 'priority ' + (t.priority || 'normal');
    badge.textContent = (t.priority || 'normal').toUpperCase();

    // Actions
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(textSpan, t));
    
    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => removeTodo(t.id));

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    taskEl.appendChild(cb);
    taskEl.appendChild(badge);
    taskEl.appendChild(textSpan);
    taskEl.appendChild(actions);
    listEl.appendChild(taskEl);
  });
  
  console.log('Todos rendered successfully');
}

function startEdit(spanEl, todo){
  const input = document.createElement('input');
  input.type = 'text';
  input.value = todo.text;
  input.className = 'todo-text';
  const finish = (commit)=>{
    if(commit){
      const v = input.value.trim();
      if(v){ todo.text = v; save(); renderTodos(); }
    }else{
      renderTodos();
    }
  };
  input.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'){ finish(true); }
    if(e.key==='Escape'){ finish(false); }
  });
  input.addEventListener('blur', ()=>finish(true));
  spanEl.replaceWith(input);
  input.focus();
  input.select();
}

// Stats
function updateStats(){
  const allTodos = Object.values(state.todosByDate).flat();
  const total = allTodos.length;
  const completed = allTodos.filter(t => t.done).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeDays = Object.keys(state.todosByDate).length;
  
  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  completionRateEl.textContent = rate + '%';
  activeDaysEl.textContent = activeDays;
  
  // Weekly chart
  const weeklyData = getWeeklyData();
  weeklyChartEl.innerHTML = '';
  weeklyData.forEach((count, i) => {
    const bar = document.createElement('div');
    bar.className = 'weekly-bar';
    bar.style.height = Math.max(4, (count / Math.max(...weeklyData)) * 100) + 'px';
    bar.title = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}: ${count} tasks`;
    weeklyChartEl.appendChild(bar);
  });
  
  // Priority chart
  const priorityCounts = { high: 0, normal: 0, low: 0 };
  allTodos.forEach(t => priorityCounts[t.priority || 'normal']++);
  priorityChartEl.innerHTML = '';
  Object.entries(priorityCounts).forEach(([priority, count]) => {
    if(count > 0){
      const item = document.createElement('div');
      item.className = 'priority-item';
      item.innerHTML = `<span class="priority ${priority}">${priority.toUpperCase()}</span><span>${count}</span>`;
      priorityChartEl.appendChild(item);
    }
  });
}

function getWeeklyData(){
  const data = [0,0,0,0,0,0,0];
  const today = new Date();
  for(let i = 0; i < 7; i++){
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = ymd(date);
    data[6-i] = (state.todosByDate[key] || []).length;
  }
  return data;
}

// Notes
function updateNotes(){
  const key = ymd(selectedDate);
  const note = state.notesByDate[key] || '';
  noteTextarea.value = note;
  noteDateLabel.textContent = isSameDay(selectedDate, new Date()) ? 'Today' : dayLabel(selectedDate);
  updateNoteStats();
}

function updateNoteStats(){
  const text = noteTextarea.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  noteCharCount.textContent = `${chars} characters`;
  noteWordCount.textContent = `${words} words`;
}

function saveNote(){
  const key = ymd(selectedDate);
  state.notesByDate[key] = noteTextarea.value;
  save();
}

function clearNote(){
  noteTextarea.value = '';
  updateNoteStats();
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

// Navigation buttons
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    showPage(page);
  });
});

// Notes
if(noteTextarea){
  noteTextarea.addEventListener('input', updateNoteStats);
  saveNoteBtn.addEventListener('click', saveNote);
  clearNoteBtn.addEventListener('click', clearNote);
}

// Settings
if(themeSelect){
  themeSelect.addEventListener('change', (e) => {
    state.theme = e.target.value === 'auto' ? null : e.target.value;
    applyTheme();
    save();
  });
}

// Export/Import
exportBtn.addEventListener('click', ()=>{
  const data = JSON.stringify({ version:'1', todosByDate: state.todosByDate }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'calendo-todos.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

if(exportAllBtn){
  exportAllBtn.addEventListener('click', ()=>{
    const data = JSON.stringify({ 
      version:'1', 
      todosByDate: state.todosByDate,
      notesByDate: state.notesByDate,
      theme: state.theme
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'calendo-all-data.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  });
}

importBtn.addEventListener('click', ()=> importFile.click());
importFile.addEventListener('change', async ()=>{
  const file = importFile.files[0];
  if(!file) return;
  try{
    const text = await file.text();
    const parsed = JSON.parse(text);
    if(parsed && parsed.todosByDate){
      state.todosByDate = parsed.todosByDate;
      save();
      render();
    }
  }catch(err){
    alert('Invalid file');
  }finally{
    importFile.value = '';
  }
});

if(importAllBtn){
  importAllBtn.addEventListener('click', ()=> importAllFile.click());
  importAllFile.addEventListener('change', async ()=>{
    const file = importAllFile.files[0];
    if(!file) return;
    try{
      const text = await file.text();
      const parsed = JSON.parse(text);
      if(parsed){
        if(parsed.todosByDate) state.todosByDate = parsed.todosByDate;
        if(parsed.notesByDate) state.notesByDate = parsed.notesByDate;
        if(parsed.theme) state.theme = parsed.theme;
        save();
        render();
        showPage('calendar');
      }
    }catch(err){
      alert('Invalid file');
    }finally{
      importAllFile.value = '';
    }
  });
}

if(clearAllDataBtn){
  clearAllDataBtn.addEventListener('click', () => {
    if(confirm('This will delete all your data. Are you sure?')){
      state.todosByDate = {};
      state.notesByDate = {};
      save();
      render();
      showPage('calendar');
    }
  });
}

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

// Ensure calendar renders immediately
function initApp() {
  // Small delay to ensure all DOM elements are ready
  setTimeout(() => {
    console.log('Initializing app...');
    console.log('Grid element:', gridEl);
    console.log('Month element:', monthEl);
    render();
    showPage('calendar');
    
    // Force calendar render again after a short delay
    setTimeout(() => {
      if (!document.querySelector('.day')) {
        console.log('Calendar not rendered, forcing render...');
        buildCalendar();
      }
    }, 50);
  }, 10);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already loaded
  initApp();
}

// Multiple fallbacks to ensure calendar renders
setTimeout(() => {
  if (!document.querySelector('.day')) {
    console.log('Fallback 1: Calendar not found, rendering...');
    buildCalendar();
  }
}, 100);

setTimeout(() => {
  if (!document.querySelector('.day')) {
    console.log('Fallback 2: Calendar still not found, rendering...');
    buildCalendar();
  }
}, 300);

setTimeout(() => {
  if (!document.querySelector('.day')) {
    console.log('Fallback 3: Final attempt to render calendar...');
    buildCalendar();
  }
}, 500);