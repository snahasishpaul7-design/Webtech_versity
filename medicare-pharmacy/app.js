(() => {
  const authScreen = document.getElementById('authScreen');
  const workspace = document.getElementById('workspace');
  const pages = ['overview', 'staff', 'prescriptions', 'customers', 'security'];
  const authCards = ['login', 'register', 'forgot'];
  let toastTimer;

  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function setAuthCard(name, push = false) {
    if (!authCards.includes(name)) name = 'login';
    if (push && location.hash !== `#${name}`) history.pushState({ auth: name }, '', `#${name}`);
    authCards.forEach(card => document.getElementById(`${card}Card`).classList.toggle('hidden', card !== name));
    document.getElementById('authScreen').setAttribute('aria-label', name === 'login' ? 'Sign in' : name === 'register' ? 'Create an account' : 'Recover account');
  }

  function go(page, push = true) {
    if (!pages.includes(page)) page = 'overview';
    if (push && location.hash !== `#${page}`) history.pushState({ page }, '', `#${page}`);
    pages.forEach(id => document.getElementById(`page-${id}`).classList.toggle('hidden', id !== page));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    document.getElementById('profileMenu').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function signIn(name) {
    const shownName = (name || 'Admin User').trim() || 'Admin User';
    localStorage.setItem('medicare-demo-user', shownName);
    document.getElementById('profileName').textContent = shownName;
    document.getElementById('settingsName').textContent = shownName;
    document.getElementById('welcomeName').textContent = shownName.split(/\s+/)[0];
    document.getElementById('authScreen').classList.add('hidden');
    workspace.classList.remove('hidden');
    go(location.hash.slice(1) || 'overview', false);
  }

  function signOut() {
    localStorage.removeItem('medicare-demo-user');
    history.pushState({ page: 'login' }, '', '#login');
    workspace.classList.add('hidden');
    authScreen.classList.remove('hidden');
    setAuthCard('login');
    document.getElementById('loginForm').reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('You’ve been signed out. See you next time.');
  }

  document.addEventListener('click', event => {
    const pageButton = event.target.closest('[data-page]');
    const viewButton = event.target.closest('[data-view]');
    const actionButton = event.target.closest('[data-action]');
    if (pageButton) { event.preventDefault(); go(pageButton.dataset.page); }
    if (viewButton) setAuthCard(viewButton.dataset.view, true);
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === 'logout') signOut();
      if (action === 'back') history.back();
    }
  });

  // Open the recovery screen directly when the link is clicked.
  document.querySelector('[data-view="forgot"]').addEventListener('click', event => {
    event.preventDefault();
    setAuthCard('forgot', true);
  });

  document.getElementById('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    signIn(document.getElementById('loginName').value || 'Admin User');
  });
  document.getElementById('registerForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('regName').value;
    signIn(name);
    toast('Demo account created. Welcome to MediCare!');
  });
  document.getElementById('forgotForm').addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    setAuthCard('login', true);
    toast(`Recovery request prepared for ${email}.`);
  });
  document.querySelector('.show-password').addEventListener('click', event => {
    const input = document.getElementById('loginPassword');
    input.type = input.type === 'password' ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password');
  });
  document.getElementById('profileButton').addEventListener('click', () => document.getElementById('profileMenu').classList.toggle('hidden'));
  document.getElementById('activityToggle').addEventListener('click', event => {
    const extra = document.querySelector('.extra-activity');
    extra.classList.toggle('hidden');
    event.currentTarget.innerHTML = extra.classList.contains('hidden') ? 'See all activity <span>→</span>' : 'Show less <span>↑</span>';
  });

  const customerRows = [...document.querySelectorAll('#customerRows tr')];
  document.getElementById('customerSearch').addEventListener('input', event => {
    const query = event.target.value.toLowerCase().trim();
    let visible = 0;
    customerRows.forEach(row => {
      const match = row.textContent.toLowerCase().includes(query);
      row.classList.toggle('hidden', !match);
      if (match) visible++;
    });
    document.getElementById('customerEmpty').classList.toggle('hidden', visible > 0);
    document.getElementById('customerResults').textContent = query ? `Showing ${visible} matching customer${visible === 1 ? '' : 's'}` : 'Showing 5 of 35 customers';
  });

  const rxCustomers = { 'RX-2098': 'Kamal Uddin', 'RX-2097': 'Afsana Mimi', 'RX-2094': 'Jahid Hasan', 'RX-2091': 'Lubna Akter', 'RX-2089': 'Rafiul Islam' };
  function selectRx(id) {
    if (!rxCustomers[id]) return;
    document.getElementById('selectedRxTitle').textContent = id;
    document.getElementById('selectedRxCustomer').textContent = rxCustomers[id];
    const row = [...document.querySelectorAll('#prescriptionRows tr')].find(item => item.querySelector('.rx-link')?.dataset.rx === id);
    const status = row?.dataset.status || 'Pending';
    const badge = document.getElementById('selectedRxStatus');
    badge.textContent = status;
    badge.className = `status-pill ${status === 'Pending' ? 'status-pending' : status === 'Approved' ? 'status-active' : 'status-rejected'}`;
    document.querySelectorAll('#prescriptionRows tr').forEach(item => item.classList.toggle('selected-row', item === row));
  }
  document.getElementById('prescriptionRows').addEventListener('click', event => {
    const button = event.target.closest('[data-rx]');
    if (button) selectRx(button.dataset.rx);
  });
  document.querySelectorAll('[data-rx-action]').forEach(button => button.addEventListener('click', () => {
    const id = document.getElementById('selectedRxTitle').textContent;
    const row = [...document.querySelectorAll('#prescriptionRows tr')].find(item => item.querySelector('.rx-link')?.dataset.rx === id);
    if (!row) return;
    const status = button.dataset.rxAction;
    row.dataset.status = status;
    const badge = row.querySelector('.status-pill');
    badge.textContent = status;
    badge.className = `status-pill ${status === 'Approved' ? 'status-active' : 'status-rejected'}`;
    selectRx(id);
    toast(`${id} marked ${status.toLowerCase()}.`);
  }));
  document.getElementById('prescriptionFilter').addEventListener('change', event => {
    let visible = 0;
    document.querySelectorAll('#prescriptionRows tr').forEach(row => {
      const match = event.target.value === 'all' || row.dataset.status === event.target.value;
      row.classList.toggle('hidden', !match);
      if (match) visible++;
    });
    document.getElementById('rxShowing').textContent = visible;
  });
  document.getElementById('prescriptionFile').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('uploadFilename').textContent = file.name;
    toast(`${file.name} is ready to upload in this demo.`);
  });
  const uploadCard = document.querySelector('.upload-card');
  uploadCard.addEventListener('dragover', event => { event.preventDefault(); uploadCard.classList.add('dragging'); });
  uploadCard.addEventListener('dragleave', event => { if (!uploadCard.contains(event.relatedTarget)) uploadCard.classList.remove('dragging'); });
  uploadCard.addEventListener('drop', event => {
    event.preventDefault(); uploadCard.classList.remove('dragging');
    const file = event.dataTransfer.files[0];
    if (!file) return;
    document.getElementById('uploadFilename').textContent = file.name;
    toast(`${file.name} is ready to upload in this demo.`);
  });

  document.getElementById('staffForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get('name').trim();
    const email = data.get('email').trim();
    const role = data.get('role');
    const branch = data.get('branch').trim();
    const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    const row = document.createElement('tr');
    const cells = [document.createElement('td'), document.createElement('td'), document.createElement('td'), document.createElement('td'), document.createElement('td')];
    const person = document.createElement('span'); person.className = 'table-person';
    const avatar = document.createElement('i'); avatar.textContent = initials;
    const detail = document.createElement('span');
    const personName = document.createElement('b'); personName.textContent = name;
    const personEmail = document.createElement('small'); personEmail.textContent = email;
    detail.append(personName, personEmail); person.append(avatar, detail); cells[0].append(person);
    cells[1].textContent = role; cells[2].textContent = branch;
    const badge = document.createElement('span'); badge.className = 'status-pill status-pending'; badge.textContent = 'Invited'; cells[3].append(badge);
    cells[4].textContent = '···'; cells.forEach(cell => row.append(cell));
    document.getElementById('staffRows').prepend(row);
    event.currentTarget.reset();
    toast(`Invitation prepared for ${name}.`);
  });

  document.querySelectorAll('.settings-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(item => item.classList.toggle('active', item === tab));
    ['password', 'profile', 'sessions'].forEach(id => document.getElementById(`settings${id[0].toUpperCase()}${id.slice(1)}`).classList.toggle('hidden', id !== tab.dataset.settings));
  }));
  document.getElementById('passwordForm').addEventListener('submit', event => { event.preventDefault(); event.currentTarget.reset(); toast('Password updated for this demo session.'); });
  document.getElementById('profileForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('profileEditName').value.trim();
    localStorage.setItem('medicare-demo-user', name);
    document.getElementById('profileName').textContent = name;
    document.getElementById('settingsName').textContent = name;
    document.getElementById('welcomeName').textContent = name.split(/\s+/)[0];
    toast('Profile details saved.');
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !workspace.classList.contains('hidden')) {
      event.preventDefault(); go('customers'); document.getElementById('customerSearch').focus();
    }
    if (event.key === 'Escape') document.getElementById('profileMenu').classList.add('hidden');
  });

  window.addEventListener('popstate', () => {
    const page = location.hash.slice(1);
    if (localStorage.getItem('medicare-demo-user')) {
      authScreen.classList.add('hidden'); workspace.classList.remove('hidden'); go(page, false);
    } else {
      workspace.classList.add('hidden'); authScreen.classList.remove('hidden'); setAuthCard(authCards.includes(page) ? page : 'login');
    }
  });

  const savedUser = localStorage.getItem('medicare-demo-user');
  if (savedUser) signIn(savedUser);
  else { authScreen.classList.remove('hidden'); workspace.classList.add('hidden'); setAuthCard(location.hash === '#register' ? 'register' : 'login'); }
})();

