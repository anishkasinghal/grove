const KEYS = ['meta','tasks','habits','habitLogs','subjects','semesters','assignments','schedule',
  'studySessions','activeTimer','journalPrompts','journalEntries','expenses','lifeItems','categories','settings'];

const DEFAULTS = {
  meta: { lastOpenDate: null },
  tasks: [], habits: [], habitLogs: [], subjects: [], semesters: [], assignments: [], schedule: [],
  studySessions: [], activeTimer: null, journalEntries: [], expenses: [], lifeItems: [],
  journalPrompts: [
    "What's one thing you're grateful for today?",
    "What's the biggest challenge this week, and one small step forward?",
    "Describe your energy today in a few words — what's driving it?",
    "What did you learn today, in class or otherwise?",
    "What would make today feel like a win?",
    "Who or what supported you today?",
    "What's one thing you'd do differently if you could redo today?",
    "What are you looking forward to this week?"
  ],
  categories: {
    task: ["Academic","Personal","Errands","Health","Social"],
    expense: ["Food","Transport","Rent","Subscriptions","Fun","Supplies","Health","Other"],
    lifeArea: ["Health","Relationships","Finance","Growth","Home"],
    studyMethod: ["Pomodoro","Deep Work","Active Recall","Reading","Practice Problems","Group Study"]
  },
  settings: { name: "there", currency: "$" }
};

let DB = {};

const API_BASE = window.GROVE_API_BASE ||
  (location.protocol === 'file:' || (location.port && location.port !== '3000') ? 'http://localhost:3000' : '');
const TOKEN_KEY = 'grove.authToken';

function getToken(){ return localStorage.getItem(TOKEN_KEY); }
function setToken(token){ localStorage.setItem(TOKEN_KEY, token); }
function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
function isAuthenticated(){ return Boolean(getToken()); }

async function apiRequest(path, options={}){
  const headers = {...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {})};
  const token = getToken();
  if(token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, {...options, headers});
  const body = await response.text();
  let payload = null;
  try { payload = body ? JSON.parse(body) : null; } catch (_) {}
  if(!response.ok){
    if(response.status === 401) clearToken();
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

async function loadAll(){
  if(isAuthenticated()){
    try{
      const response = await apiRequest('/api/data');
      DB = response.data;
      return;
    }catch(error){
      console.error('Could not load data from Grove server:', error);
    }
  }
  const results = await Promise.all(KEYS.map(async k => {
    const stored = localStorage.getItem(`grove.data.${k}`);
    try { return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULTS[k])); }
    catch(e){ return JSON.parse(JSON.stringify(DEFAULTS[k])); }
  }));
  KEYS.forEach((k,i)=> DB[k] = results[i]);
  if(!DB.categories) DB.categories = JSON.parse(JSON.stringify(DEFAULTS.categories));
  if(!DB.settings) DB.settings = JSON.parse(JSON.stringify(DEFAULTS.settings));
  if(!DB.journalPrompts || !DB.journalPrompts.length) DB.journalPrompts = DEFAULTS.journalPrompts.slice();
}
async function save(key){
  if(isAuthenticated()){
    await apiRequest(`/api/data/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({value: DB[key]})
    });
    return;
  }
  localStorage.setItem(`grove.data.${key}`, JSON.stringify(DB[key]));
}
