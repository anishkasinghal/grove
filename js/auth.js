async function authenticate(mode, credentials){
  const response = await apiRequest(`/api/auth/${mode}`, {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  setToken(response.token);
  await loadAll();
}

function signOut(){
  clearToken();
  DB = {};
  loadAll().then(()=>route()).catch(error=>console.error('Could not reset local data:', error));
}

function renderAuthModal(errorText=''){
  openModal(`
    <div class="modal-head"><h3>Sign in to Grove</h3><button class="iconbtn" id="auth-close"><svg><use href="#ic-x"/></svg></button></div>
    ${errorText ? `<p class="pill clay">${esc(errorText)}</p>` : ''}
    <div class="field"><label>Email</label><input type="email" id="auth-email" autocomplete="email"></div>
    <div class="field"><label>Password</label><input type="password" id="auth-password" autocomplete="current-password"></div>
    <div class="field" id="auth-name-wrap" style="display:none"><label>Name</label><input type="text" id="auth-name" autocomplete="name"></div>
    <div class="form-actions">
      <button class="btn btn-primary" id="auth-submit">Sign in</button>
      <button class="btn" id="auth-google">Continue with Google</button>
    </div>
    <button class="btn btn-ghost" id="auth-toggle">Create an account</button>
  `);
  let mode = 'login';
  const submit = document.getElementById('auth-submit');
  const toggle = document.getElementById('auth-toggle');
  const nameWrap = document.getElementById('auth-name-wrap');
  document.getElementById('auth-close').onclick = closeModal;
  toggle.onclick = ()=>{
    mode = mode === 'login' ? 'register' : 'login';
    submit.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    toggle.textContent = mode === 'login' ? 'Create an account' : 'I already have an account';
    nameWrap.style.display = mode === 'login' ? 'none' : 'block';
  };
  document.getElementById('auth-google').onclick = ()=>{ location.href = `${API_BASE}/api/auth/google`; };
  submit.onclick = async ()=>{
    submit.disabled = true;
    try{
      await authenticate(mode, {
        email: document.getElementById('auth-email').value,
        password: document.getElementById('auth-password').value,
        name: document.getElementById('auth-name')?.value
      });
      closeModal();
      updateAccountButton();
      route();
    }catch(error){
      submit.disabled = false;
      renderAuthModal(error.message);
    }
  };
}

function updateAccountButton(){
  const button = document.getElementById('account-btn');
  if(!button) return;
  button.textContent = isAuthenticated() ? 'Account' : 'Sign in';
  button.onclick = ()=>{
    if(isAuthenticated()){
      openModal(`<div class="modal-head"><h3>Account</h3><button class="iconbtn" id="account-close"><svg><use href="#ic-x"/></svg></button></div>
        <p class="muted">Your Grove data syncs across devices.</p><div class="form-actions"><button class="btn btn-primary" id="account-signout">Sign out</button></div>`);
      document.getElementById('account-close').onclick = closeModal;
      document.getElementById('account-signout').onclick = ()=>{ closeModal(); signOut(); updateAccountButton(); };
    }else renderAuthModal();
  };
}

function handleAuthRedirect(){
  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  if(token){
    setToken(token);
    history.replaceState({}, '', location.pathname + location.hash);
  }
  if(params.get('authError')){
    history.replaceState({}, '', location.pathname + location.hash);
    renderAuthModal('Google sign-in failed');
  }
}

handleAuthRedirect();
updateAccountButton();
