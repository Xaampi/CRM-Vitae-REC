// ============================================================
  // CONFIGURACIÓN — actualizar cuando exista el workflow n8n real
  // ============================================================
  const LOGIN_WEBHOOK_URL = 'https://n8n.gorekia.com/webhook/panel-login';
  const TOKEN_KEY = 'vitaerec_panel_token';
  const USER_KEY = 'vitaerec_panel_usuario';

  // Cada sección: icono (reutilizado del nav) + qué va a vivir aquí cuando se construya
  const VIEWS = {
    inicio: {
      title: 'Inicio',
      icon: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
      desc: 'Aquí verás cada mañana las citas del día, los bonos a punto de agotarse y lo que ha resuelto el bot desde ayer.'
    },
    agenda: {
      title: 'Agenda',
      icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
      desc: 'La agenda del centro día a día, en cuanto conectemos las reservas reales del bot.'
    },
    horario: {
      title: 'Horario semanal',
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>',
      desc: 'Aquí cargarás cada viernes los bloques reales de cada profesional — la pieza de la que depende todo el motor de reservas del bot.'
    },
    clientes: {
      title: 'Clientes',
      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      desc: 'La ficha de cada cliente: datos, profesional asignado, salud y bonos, en un solo sitio.'
    },
    bonos: {
      title: 'Bonos',
      icon: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/><line x1="12" y1="7" x2="12" y2="9"/><line x1="12" y1="11" x2="12" y2="13"/><line x1="12" y1="15" x2="12" y2="17"/>',
      desc: 'Bonos activos, sesiones restantes y avisos automáticos cuando quedan pocas.'
    },
    cobros: {
      title: 'Cobros',
      icon: '<path d="M20 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/><circle cx="17" cy="14" r="1.5"/>',
      desc: 'Quién ha pagado, cómo y cuándo — sin depender de la memoria.'
    },
    equipo: {
      title: 'Equipo y horas',
      icon: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M2 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/><path d="M16 20v-.5a3.5 3.5 0 0 1 3.5-3.5H20a2 2 0 0 1 2 2V20"/>',
      desc: 'Horas trabajadas por cada profesional frente a sus límites semanales.'
    },
    servicios: {
      title: 'Servicios y tarifas',
      icon: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',
      desc: 'El catálogo completo de servicios y bonos, editable sin tocar código.'
    },
    derivaciones: {
      title: 'Derivaciones',
      icon: '<path d="M12 3l10 18H2L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17.5" r=".8" fill="currentColor" stroke="none"/>',
      desc: 'Los casos que el bot no puede resolver solo — quejas, dolor, dudas — para que los gestiones tú.'
    },
    config: {
      title: 'Configuración',
      icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/',
      desc: 'Los parámetros del centro: horarios, antelaciones mínimas, penalizaciones.'
    }
  };

  // ---------- Render de las vistas vacías ----------
  const container = document.getElementById('views-container');
  Object.entries(VIEWS).forEach(([key, v]) => {
    const section = document.createElement('section');
    section.className = 'view';
    section.id = 'view-' + key;
    section.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v.icon}</svg></div>
        <h2>${v.title}</h2>
        <p>${v.desc}</p>
        <span class="empty-tag">En construcción</span>
      </div>
    `;
    container.appendChild(section);
  });
  document.getElementById('view-inicio').classList.add('active');

  // ---------- Navegación ----------
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + view).classList.add('active');
      document.getElementById('topbar-title').textContent = VIEWS[view].title;
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });

  // ---------- Sidebar colapsable ----------
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');
  const SIDEBAR_KEY = 'vitaerec_panel_sidebar_collapsed';

  function actualizarIconoSidebar() {
    const colapsada = sidebar.classList.contains('collapsed');
    sidebarToggleIcon.className = colapsada
      ? 'ti ti-layout-sidebar-left-expand'
      : 'ti ti-layout-sidebar-left-collapse';
  }

  if (localStorage.getItem(SIDEBAR_KEY) === 'true') {
    sidebar.classList.add('collapsed');
  }
  actualizarIconoSidebar();

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem(SIDEBAR_KEY, sidebar.classList.contains('collapsed'));
    actualizarIconoSidebar();
  });

  // ---------- Login ----------
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');

  function showApp(usuario) {
    loginScreen.style.display = 'none';
    app.classList.add('active');
    document.getElementById('user-name').textContent = usuario;
    document.getElementById('user-avatar').textContent = usuario.charAt(0).toUpperCase();
  }

  // Si ya hay sesión guardada, entra directo (validación real de caducidad
  // se hace en el primer webhook de datos que llamemos, no aquí)
  const tokenGuardado = localStorage.getItem(TOKEN_KEY);
  const usuarioGuardado = localStorage.getItem(USER_KEY);
  if (tokenGuardado && usuarioGuardado) {
    showApp(usuarioGuardado);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('show');
    const usuario = document.getElementById('login-usuario').value.trim();
    const password = document.getElementById('login-password').value;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando…';

    try {
      const res = await fetch(LOGIN_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      if (!res.ok) throw new Error('credenciales');

      const data = await res.json();
      if (!data.token) throw new Error('credenciales');

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, usuario);
      showApp(usuario);

    } catch (err) {
      loginError.classList.add('show');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    app.classList.remove('active');
    loginScreen.style.display = 'flex';
    loginForm.reset();
  });