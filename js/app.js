// ============================================================
  // CONFIGURACIÓN — actualizar cuando exista el workflow n8n real
  // ============================================================
  const LOGIN_WEBHOOK_URL = 'https://n8n.gorekia.com/webhook/panel-login';
  const TOKEN_KEY = 'vitaerec_panel_token';
  const USER_KEY = 'vitaerec_panel_usuario';

  // Derivaciones — endpoints pendientes de construir en n8n (mismo patrón que panel-login).
  // Contrato esperado:
  //   GET  panel-derivaciones            -> 200, array de:
  //        { id, telefono, nombre_cliente|null, categoria: 'queja'|'dolor'|'patologia'|'otro',
  //          mensaje, enviado_en (ISO), atendido: bool, atendido_en: ISO|null }
  //        Header: Authorization: Bearer <token>
  //   POST panel-derivaciones-atender    -> body { id }, Header: Authorization: Bearer <token>
  //        El backend resuelve quién atiende a partir del token (sesiones_panel -> usuarios_panel),
  //        nunca confiar en un atendido_por que mande el cliente.
  const DERIVACIONES_API_URL = 'https://n8n.gorekia.com/webhook/panel-derivaciones';
  const DERIVACIONES_ATENDER_URL = 'https://n8n.gorekia.com/webhook/panel-derivaciones-atender';

  // Agenda — endpoint pendiente de construir en n8n (mismo patrón: validar sesión + Postgres).
  // Contrato esperado:
  //   GET panel-agenda?fecha=YYYY-MM-DD  -> 200, array de:
  //     { id, hora_inicio, hora_fin, estado, origen: 'bot'|'manual',
  //       profesional, servicio, cliente_nombre, cliente_apellidos }
  //     Header: Authorization: Bearer <token>
  //     El backend filtra citas.fecha = $1 AND citas.estado != 'cancelada'
  const AGENDA_API_URL = 'https://n8n.gorekia.com/webhook/panel-agenda';

  // Servicios — endpoint pendiente de construir en n8n (mismo patrón: validar sesión + Postgres).
  // Contrato esperado:
  //   GET  panel-servicios  -> 200, array de:
  //        { id, nombre, duracion_min, precio, requiere_profesor, es_bono,
  //          sesiones_bono, caducidad_meses, es_2pax, activo }
  //        Header: Authorization: Bearer <token>
  //   POST panel-servicios  -> body el servicio completo (con los campos editados),
  //        Header: Authorization: Bearer <token>.
  //        El backend solo debe leer/escribir nombre, duracion_min, precio y activo —
  //        el resto viaja en el body para no perderlo pero no debe escribirse con lo
  //        que mande el cliente.
  const SERVICIOS_API_URL = 'https://n8n.gorekia.com/webhook/panel-servicios';

  // Equipo y horas — endpoint pendiente de construir en n8n (mismo patrón que panel-servicios).
  // Contrato esperado:
  //   GET  panel-equipo?semana=YYYY-MM-DD  -> 200, array de:
  //        { id, nombre, min_horas_semana, max_horas_semana, max_sesiones_seguidas,
  //          descanso_min_horas, descanso_mediodia_min, ofertable_por_bot, apto_dificil,
  //          activo, horas_realizadas }
  //        `semana` es el lunes de la semana a consultar; `horas_realizadas` se calcula
  //        en el backend a partir de `citas` (no de horario_semanal), solo sesiones ya
  //        pasadas y no canceladas, entre ese lunes y el domingo siguiente.
  //        Header: Authorization: Bearer <token>
  //   POST panel-equipo  -> body el profesional completo (con los campos editados),
  //        Header: Authorization: Bearer <token>.
  const EQUIPO_API_URL = 'https://n8n.gorekia.com/webhook/panel-equipo';

  // Configuración — endpoint pendiente de construir en n8n (mismo patrón que panel-equipo).
  // Contrato esperado:
  //   GET  panel-config  -> 200, objeto plano (no array, es un único conjunto de ajustes):
  //        { antelacion_minima_reserva_horas, max_sesiones_simultaneas,
  //          franja_condicional_inicio, franja_condicional_fin,
  //          penalizacion_20_24h_porcentaje, penalizacion_0_20h_porcentaje }
  //        Header: Authorization: Bearer <token>
  //   POST panel-config  -> body ese mismo objeto con los campos editados,
  //        Header: Authorization: Bearer <token>.
  //        NO toca `contexto_clinica` — esa clave se gestiona aparte (es el .md de VR-Informacion).
  // PENDIENTE (post-reunión): penalizacion_20_24h_porcentaje y penalizacion_0_20h_porcentaje
  // están hardcodeadas como 20/24/50/100 directamente en el Code node de VR-Cancelar y
  // VR-Modificar — cambiarlas aquí actualiza config_centro pero NO afecta al bot todavía.
  // Falta reescribir esos Code nodes para que lean estos dos valores en vez de tenerlos fijos.
  const CONFIG_API_URL = 'https://n8n.gorekia.com/webhook/panel-config';

  // Vistas con su propio markup ya escrito en el HTML (no se generan como placeholder vacío)
  const CUSTOM_VIEWS = ['derivaciones', 'agenda', 'servicios', 'equipo', 'config'];

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
    if (CUSTOM_VIEWS.includes(key)) return; // ya tiene su <section> propia en el HTML
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
      if (view === 'derivaciones') derivCargar();
      if (view === 'agenda') agendaCargar();
      if (view === 'servicios') servCargar();
      if (view === 'equipo') equipoCargar();
      if (view === 'config') configCargar();
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

  // ============================================================
  // DERIVACIONES — carga real desde n8n, filtro y marcar como atendida
  // ============================================================
  let derivFiltro = 'pendientes';
  let derivDatos = [];

  function derivIconoCategoria(cat) {
    switch (cat) {
      case 'queja':
        return '<path d="M8 10h8M8 14h5"/><path d="M21 12c0 4.5-4 8-9 8-1.3 0-2.6-.2-3.7-.7L3 21l1.8-4.5C4 15.2 3 13.7 3 12c0-4.5 4-8 9-8s9 3.5 9 8z"/>';
      case 'dolor':
        return '<path d="M12 21s-7-4.5-9.5-9C.8 8.3 2 4.8 5.3 4.1 7.6 3.6 9.9 4.6 12 7c2.1-2.4 4.4-3.4 6.7-2.9 3.3.7 4.5 4.2 2.8 7.9C19 16.5 12 21 12 21z"/>';
      case 'patologia':
        return '<circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".8" fill="currentColor" stroke="none"/>';
      default:
        return '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>';
    }
  }
  function derivEtiquetaCategoria(cat) {
    return { queja: 'Queja', dolor: 'Dolor', patologia: 'Patología' }[cat] || 'Otro';
  }
  function derivClaseCategoria(cat) {
    return ['queja', 'dolor', 'patologia'].includes(cat) ? 'cat-' + cat : 'cat-otro';
  }
  function derivTiempoRelativo(iso) {
    const fecha = new Date(iso);
    if (isNaN(fecha)) return '';
    const minutos = Math.round((Date.now() - fecha.getTime()) / 60000);
    if (minutos < 1) return 'ahora mismo';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    return `hace ${Math.round(horas / 24)} d`;
  }
  function derivEscapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Separa "Resumen: ..." y "Mensaje original: "..."" del texto que guarda VR-Derivacion.
  // Si el mensaje no sigue ese formato (por ejemplo si viene de otro origen en el futuro),
  // devuelve null y la tarjeta cae al texto plano de siempre.
  function derivParsearMensaje(mensaje) {
    if (!mensaje) return null;
    const resumenMatch = mensaje.match(/Resumen:\s*([^\n]+)/i);
    const originalMatch = mensaje.match(/Mensaje original:\s*\n?"([^"]*)"/i);
    if (!resumenMatch && !originalMatch) return null;
    return {
      resumen: resumenMatch ? resumenMatch[1].trim() : null,
      original: originalMatch ? originalMatch[1].trim() : null
    };
  }

  function derivRenderCard(item) {
    const cat = derivClaseCategoria(item.categoria);
    const nombre = derivEscapeHtml(item.nombre_cliente || 'Cliente sin identificar');
    const atendida = !!item.atendido;
    const parseado = derivParsearMensaje(item.mensaje);

    const cuerpoHtml = (parseado && (parseado.resumen || parseado.original))
      ? `
        ${parseado.resumen ? `<p class="deriv-resumen">${derivEscapeHtml(parseado.resumen)}</p>` : ''}
        ${parseado.original ? `
          <div class="deriv-quote">
            <p class="deriv-quote-label">Mensaje original</p>
            <p class="deriv-quote-text">"${derivEscapeHtml(parseado.original)}"</p>
          </div>
        ` : ''}
      `
      : `<p class="deriv-mensaje">${derivEscapeHtml(item.mensaje)}</p>`;

    return `
      <div class="deriv-card ${atendida ? 'is-atendida' : ''}" data-id="${item.id}">
        <div class="deriv-badge ${cat}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${derivIconoCategoria(item.categoria)}</svg>
        </div>
        <div class="deriv-body">
          <div class="deriv-top-row">
            <div>
              <span class="deriv-cliente">${nombre}</span>
              <span class="deriv-tel">${derivEscapeHtml(item.telefono || '')}</span>
            </div>
            <span class="deriv-tiempo">${derivTiempoRelativo(item.enviado_en)}</span>
          </div>
          <span class="deriv-cat-label ${cat}">${derivEtiquetaCategoria(item.categoria)}</span>
          ${cuerpoHtml}
          <div class="deriv-actions">
            ${atendida
              ? `<span class="deriv-atendida-tag"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Atendida</span>`
              : `<button class="deriv-atender-btn" data-action="atender" data-id="${item.id}">Marcar como atendida</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  function derivRenderLista() {
    const lista = document.getElementById('deriv-list');
    const vacio = document.getElementById('deriv-empty');
    const visibles = derivFiltro === 'pendientes' ? derivDatos.filter(i => !i.atendido) : derivDatos;

    if (visibles.length === 0) {
      lista.innerHTML = '';
      vacio.style.display = 'block';
      return;
    }
    vacio.style.display = 'none';
    lista.innerHTML = visibles
      .slice()
      .sort((a, b) => new Date(b.enviado_en) - new Date(a.enviado_en))
      .map(derivRenderCard)
      .join('');
  }

  async function derivCargar() {
    const loading = document.getElementById('deriv-loading');
    const error = document.getElementById('deriv-error');
    const lista = document.getElementById('deriv-list');
    const vacio = document.getElementById('deriv-empty');
    const refreshBtn = document.getElementById('deriv-refresh');

    error.style.display = 'none';
    vacio.style.display = 'none';
    lista.innerHTML = '';
    loading.style.display = 'block';
    refreshBtn.classList.add('spinning');

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(DERIVACIONES_API_URL, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('respuesta no ok');
      derivDatos = await res.json();
      loading.style.display = 'none';
      derivRenderLista();
    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
    } finally {
      refreshBtn.classList.remove('spinning');
    }
  }

  async function derivMarcarAtendida(id, btn) {
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(DERIVACIONES_ATENDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const item = derivDatos.find(d => d.id === id);
      if (item) { item.atendido = true; item.atendido_en = new Date().toISOString(); }
      derivRenderLista();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Reintentar';
    }
  }

  document.getElementById('deriv-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="atender"]');
    if (!btn) return;
    derivMarcarAtendida(Number(btn.dataset.id), btn);
  });

  document.getElementById('deriv-retry').addEventListener('click', derivCargar);
  document.getElementById('deriv-refresh').addEventListener('click', derivCargar);

  document.getElementById('deriv-filter').querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#deriv-filter .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      derivFiltro = pill.dataset.filter;
      derivRenderLista();
    });
  });

  // ============================================================
  // AGENDA — vista diaria conectada a n8n
  // ============================================================
  // Paleta exacta por profesional, ya definida en los mockups del CRM
  const AGENDA_COLOR_PROFESIONAL = {
    pablo: '#3B82F6', sonia: '#E6007E', rebeca: '#0EA5A4', veni: '#8B5CF6',
    alberto: '#F59E0B', adrian: '#22C55E', alicia: '#EC4899', diego: '#6366F1', hugo: '#EF4444'
  };

  let agendaFecha = new Date();

  function agendaFormatearISO(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function agendaEsHoy(fecha) {
    return fecha.toDateString() === new Date().toDateString();
  }
  function agendaFormatearLabel(fecha) {
    const texto = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
  function agendaColorProfesional(nombre) {
    const key = (nombre || '').trim().toLowerCase();
    return AGENDA_COLOR_PROFESIONAL[key] || '#9C9EAA';
  }

  function agendaRenderFila(item) {
    const color = agendaColorProfesional(item.profesional);
    const cliente = [item.cliente_nombre, item.cliente_apellidos].filter(Boolean).join(' ');
    const origenBadge = item.origen === 'bot'
      ? '<span class="badge badge-bot">Bot</span>'
      : '<span class="badge badge-manual">Manual</span>';
    return `
      <div class="cita-row">
        <div class="cita-time">${(item.hora_inicio || '').slice(0, 5)}</div>
        <div class="prof-dot" style="background:${color}"></div>
        <div class="cita-info">
          <div class="cita-servicio">${derivEscapeHtml(item.servicio || '')}</div>
          <div class="cita-prof">${derivEscapeHtml(item.profesional || '')}</div>
        </div>
        ${origenBadge}
        <div class="cita-cliente">${derivEscapeHtml(cliente)}</div>
      </div>
    `;
  }

  function agendaRenderLista(items) {
    const lista = document.getElementById('agenda-list');
    const vacio = document.getElementById('agenda-empty');
    if (!items || items.length === 0) {
      lista.innerHTML = '';
      vacio.style.display = 'block';
      return;
    }
    vacio.style.display = 'none';
    lista.innerHTML = items
      .slice()
      .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
      .map(agendaRenderFila)
      .join('');
  }

  function agendaActualizarCabecera() {
    document.getElementById('agenda-fecha-label').textContent = agendaFormatearLabel(agendaFecha);
    document.getElementById('agenda-hoy').style.display = agendaEsHoy(agendaFecha) ? 'none' : 'inline-block';
  }

  async function agendaCargar() {
    agendaActualizarCabecera();
    const loading = document.getElementById('agenda-loading');
    const error = document.getElementById('agenda-error');
    const lista = document.getElementById('agenda-list');
    const vacio = document.getElementById('agenda-empty');
    const refreshBtn = document.getElementById('agenda-refresh');

    error.style.display = 'none';
    vacio.style.display = 'none';
    lista.innerHTML = '';
    loading.style.display = 'block';
    refreshBtn.classList.add('spinning');

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const url = `${AGENDA_API_URL}?fecha=${agendaFormatearISO(agendaFecha)}`;
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('respuesta no ok');
      const datos = await res.json();
      loading.style.display = 'none';
      agendaRenderLista(datos);
    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
    } finally {
      refreshBtn.classList.remove('spinning');
    }
  }

  function agendaEsFinDeSemana(fecha) {
    const dia = fecha.getDay(); // 0 = domingo, 6 = sábado
    return dia === 0 || dia === 6;
  }

  document.getElementById('agenda-prev').addEventListener('click', () => {
    do {
      agendaFecha.setDate(agendaFecha.getDate() - 1);
    } while (agendaEsFinDeSemana(agendaFecha));
    agendaCargar();
  });
  document.getElementById('agenda-next').addEventListener('click', () => {
    do {
      agendaFecha.setDate(agendaFecha.getDate() + 1);
    } while (agendaEsFinDeSemana(agendaFecha));
    agendaCargar();
  });
  document.getElementById('agenda-hoy').addEventListener('click', () => {
    agendaFecha = new Date();
    agendaCargar();
  });
  document.getElementById('agenda-retry').addEventListener('click', agendaCargar);
  document.getElementById('agenda-refresh').addEventListener('click', agendaCargar);

  // ============================================================
  // SERVICIOS — catálogo editable (nombre, duración, precio, activo)
  // ============================================================
  let serviciosDatos = {}; // por id, para reconstruir el objeto completo al guardar

  function servRenderFila(s) {
    return `
      <tr data-id="${s.id}">
        <td><input type="text" class="serv-input serv-input-nombre" value="${derivEscapeHtml(s.nombre)}"></td>
        <td><input type="number" class="serv-input serv-input-num serv-input-duracion" value="${s.duracion_min}" min="5" step="5"> min</td>
        <td>€ <input type="number" class="serv-input serv-input-num serv-input-precio" value="${Number(s.precio).toFixed(2)}" min="0" step="0.5"></td>
        <td>
          <label class="serv-switch">
            <input type="checkbox" class="serv-input-activo" ${s.activo ? 'checked' : ''}>
            <span class="serv-switch-slider"></span>
          </label>
        </td>
        <td><button class="serv-save-btn" data-action="guardar" disabled>Guardar</button></td>
      </tr>
    `;
  }

  function servRenderLista() {
    document.getElementById('servicios-list').innerHTML = Object.values(serviciosDatos)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(servRenderFila)
      .join('');
  }

  async function servCargar() {
    const loading = document.getElementById('servicios-loading');
    const error = document.getElementById('servicios-error');
    const empty = document.getElementById('servicios-empty');
    const tabla = document.getElementById('servicios-table');
    const tbody = document.getElementById('servicios-list');
    const refreshBtn = document.getElementById('servicios-refresh');

    error.style.display = 'none';
    empty.style.display = 'none';
    tabla.style.display = 'none';
    tbody.innerHTML = '';
    loading.style.display = 'block';
    refreshBtn.classList.add('spinning');

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(SERVICIOS_API_URL, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const datos = await res.json();
      loading.style.display = 'none';

      if (!datos || datos.length === 0) {
        empty.style.display = 'block';
        return;
      }
      serviciosDatos = {};
      datos.forEach(s => { serviciosDatos[s.id] = s; });
      servRenderLista();
      tabla.style.display = '';

    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
    } finally {
      refreshBtn.classList.remove('spinning');
    }
  }

  async function servGuardarFila(tr, btn) {
    const id = Number(tr.dataset.id);
    const original = serviciosDatos[id];
    const actualizado = Object.assign({}, original, {
      nombre: tr.querySelector('.serv-input-nombre').value.trim(),
      duracion_min: Number(tr.querySelector('.serv-input-duracion').value),
      precio: Number(tr.querySelector('.serv-input-precio').value),
      activo: tr.querySelector('.serv-input-activo').checked
    });

    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(SERVICIOS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(actualizado)
      });
      if (!res.ok) throw new Error('respuesta no ok');

      serviciosDatos[id] = actualizado;
      tr.classList.remove('is-dirty');
      btn.textContent = 'Guardado';
      setTimeout(() => { btn.textContent = 'Guardar'; btn.disabled = true; }, 1500);

    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Reintentar';
    }
  }

  document.getElementById('servicios-list').addEventListener('input', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    tr.classList.add('is-dirty');
    tr.querySelector('.serv-save-btn').disabled = false;
  });

  document.getElementById('servicios-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="guardar"]');
    if (!btn) return;
    servGuardarFila(btn.closest('tr'), btn);
  });

  document.getElementById('servicios-retry').addEventListener('click', servCargar);
  document.getElementById('servicios-refresh').addEventListener('click', servCargar);

  // ============================================================
  // EQUIPO Y HORAS — límites editables por profesional + horas realizadas por semana
  // ============================================================
  let equipoDatos = {}; // por id, para reconstruir el objeto completo al guardar
  let equipoSemanaInicio = equipoLunesDeSemana(new Date());

  function equipoLunesDeSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay(); // 0 = domingo
    const diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function equipoFormatearISO(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function equipoEsSemanaActual(inicio) {
    return equipoFormatearISO(inicio) === equipoFormatearISO(equipoLunesDeSemana(new Date()));
  }
  function equipoFormatearLabelSemana(inicio) {
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    return `${inicio.toLocaleDateString('es-ES', opts)} – ${fin.toLocaleDateString('es-ES', opts)}`;
  }
  function equipoActualizarCabecera() {
    document.getElementById('equipo-semana-label').textContent = equipoFormatearLabelSemana(equipoSemanaInicio);
    document.getElementById('equipo-hoy').style.display = equipoEsSemanaActual(equipoSemanaInicio) ? 'none' : 'inline-block';
    document.getElementById('equipo-next').disabled = equipoEsSemanaActual(equipoSemanaInicio);
  }

  function equipoRenderFila(p) {
    return `
      <tr data-id="${p.id}">
        <td><input type="text" class="serv-input equipo-input-nombre" value="${derivEscapeHtml(p.nombre)}"></td>
        <td>
          <input type="number" class="serv-input serv-input-num equipo-input-minh" value="${p.min_horas_semana}" min="0" step="1">
          –
          <input type="number" class="serv-input serv-input-num equipo-input-maxh" value="${p.max_horas_semana}" min="0" step="1">
        </td>
        <td>${Number(p.horas_realizadas || 0).toFixed(1)}h</td>
        <td><input type="number" class="serv-input serv-input-num equipo-input-maxses" value="${p.max_sesiones_seguidas}" min="1" step="1"></td>
        <td><input type="number" class="serv-input serv-input-num equipo-input-descmin" value="${p.descanso_min_horas}" min="0" step="0.5"></td>
        <td><input type="number" class="serv-input serv-input-num equipo-input-descmed" value="${p.descanso_mediodia_min}" min="0" step="5"></td>
        <td>
          <label class="serv-switch">
            <input type="checkbox" class="equipo-input-bot" ${p.ofertable_por_bot ? 'checked' : ''}>
            <span class="serv-switch-slider"></span>
          </label>
        </td>
        <td>
          <label class="serv-switch">
            <input type="checkbox" class="equipo-input-dificil" ${p.apto_dificil ? 'checked' : ''}>
            <span class="serv-switch-slider"></span>
          </label>
        </td>
        <td>
          <label class="serv-switch">
            <input type="checkbox" class="equipo-input-activo" ${p.activo ? 'checked' : ''}>
            <span class="serv-switch-slider"></span>
          </label>
        </td>
        <td><button class="serv-save-btn" data-action="guardar" disabled>Guardar</button></td>
      </tr>
    `;
  }

  function equipoRenderLista() {
    document.getElementById('equipo-list').innerHTML = Object.values(equipoDatos)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(equipoRenderFila)
      .join('');
  }

  async function equipoCargar() {
    equipoActualizarCabecera();
    const loading = document.getElementById('equipo-loading');
    const error = document.getElementById('equipo-error');
    const empty = document.getElementById('equipo-empty');
    const tabla = document.getElementById('equipo-table');
    const tbody = document.getElementById('equipo-list');
    const refreshBtn = document.getElementById('equipo-refresh');

    error.style.display = 'none';
    empty.style.display = 'none';
    tabla.style.display = 'none';
    tbody.innerHTML = '';
    loading.style.display = 'block';
    refreshBtn.classList.add('spinning');

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const url = `${EQUIPO_API_URL}?semana=${equipoFormatearISO(equipoSemanaInicio)}`;
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('respuesta no ok');
      const datos = await res.json();
      loading.style.display = 'none';

      if (!datos || datos.length === 0) {
        empty.style.display = 'block';
        return;
      }
      equipoDatos = {};
      datos.forEach(p => { equipoDatos[p.id] = p; });
      equipoRenderLista();
      tabla.style.display = '';

    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
    } finally {
      refreshBtn.classList.remove('spinning');
    }
  }

  async function equipoGuardarFila(tr, btn) {
    const id = Number(tr.dataset.id);
    const original = equipoDatos[id];
    const actualizado = Object.assign({}, original, {
      nombre: tr.querySelector('.equipo-input-nombre').value.trim(),
      min_horas_semana: Number(tr.querySelector('.equipo-input-minh').value),
      max_horas_semana: Number(tr.querySelector('.equipo-input-maxh').value),
      max_sesiones_seguidas: Number(tr.querySelector('.equipo-input-maxses').value),
      descanso_min_horas: Number(tr.querySelector('.equipo-input-descmin').value),
      descanso_mediodia_min: Number(tr.querySelector('.equipo-input-descmed').value),
      ofertable_por_bot: tr.querySelector('.equipo-input-bot').checked,
      apto_dificil: tr.querySelector('.equipo-input-dificil').checked,
      activo: tr.querySelector('.equipo-input-activo').checked
    });

    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(EQUIPO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(actualizado)
      });
      if (!res.ok) throw new Error('respuesta no ok');

      equipoDatos[id] = actualizado;
      tr.classList.remove('is-dirty');
      btn.textContent = 'Guardado';
      setTimeout(() => { btn.textContent = 'Guardar'; btn.disabled = true; }, 1500);

    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Reintentar';
    }
  }

  document.getElementById('equipo-list').addEventListener('input', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    tr.classList.add('is-dirty');
    tr.querySelector('.serv-save-btn').disabled = false;
  });

  document.getElementById('equipo-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="guardar"]');
    if (!btn) return;
    equipoGuardarFila(btn.closest('tr'), btn);
  });

  document.getElementById('equipo-prev').addEventListener('click', () => {
    equipoSemanaInicio.setDate(equipoSemanaInicio.getDate() - 7);
    equipoCargar();
  });
  document.getElementById('equipo-next').addEventListener('click', () => {
    if (equipoEsSemanaActual(equipoSemanaInicio)) return;
    equipoSemanaInicio.setDate(equipoSemanaInicio.getDate() + 7);
    equipoCargar();
  });
  document.getElementById('equipo-hoy').addEventListener('click', () => {
    equipoSemanaInicio = equipoLunesDeSemana(new Date());
    equipoCargar();
  });
  document.getElementById('equipo-retry').addEventListener('click', equipoCargar);
  document.getElementById('equipo-refresh').addEventListener('click', equipoCargar);

  // ============================================================
  // CONFIGURACIÓN — ajustes generales del centro (config_centro)
  // ============================================================
  function configPoblarFormulario(cfg) {
    document.getElementById('config-antelacion').value = cfg.antelacion_minima_reserva_horas;
    document.getElementById('config-max-sesiones').value = cfg.max_sesiones_simultaneas;
    document.getElementById('config-franja-inicio').value = cfg.franja_condicional_inicio;
    document.getElementById('config-franja-fin').value = cfg.franja_condicional_fin;
    document.getElementById('config-pen-20-24').value = cfg.penalizacion_20_24h_porcentaje;
    document.getElementById('config-pen-0-20').value = cfg.penalizacion_0_20h_porcentaje;
  }

  async function configCargar() {
    const loading = document.getElementById('config-loading');
    const error = document.getElementById('config-error');
    const form = document.getElementById('config-form');
    const refreshBtn = document.getElementById('config-refresh');

    error.style.display = 'none';
    form.style.display = 'none';
    loading.style.display = 'block';
    refreshBtn.classList.add('spinning');

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(CONFIG_API_URL, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('respuesta no ok');
      const cfg = await res.json();
      loading.style.display = 'none';

      configPoblarFormulario(cfg);
      document.getElementById('config-guardar').disabled = true;
      document.getElementById('config-guardar').classList.remove('is-dirty');
      form.style.display = 'flex';

    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
    } finally {
      refreshBtn.classList.remove('spinning');
    }
  }

  async function configGuardar() {
    const btn = document.getElementById('config-guardar');
    const saveError = document.getElementById('config-save-error');
    saveError.style.display = 'none';

    const actualizado = {
      antelacion_minima_reserva_horas: Number(document.getElementById('config-antelacion').value),
      max_sesiones_simultaneas: Number(document.getElementById('config-max-sesiones').value),
      franja_condicional_inicio: document.getElementById('config-franja-inicio').value,
      franja_condicional_fin: document.getElementById('config-franja-fin').value,
      penalizacion_20_24h_porcentaje: Number(document.getElementById('config-pen-20-24').value),
      penalizacion_0_20h_porcentaje: Number(document.getElementById('config-pen-0-20').value)
    };

    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(CONFIG_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(actualizado)
      });
      if (!res.ok) throw new Error('respuesta no ok');

      btn.textContent = 'Guardado';
      btn.classList.remove('is-dirty');
      setTimeout(() => { btn.textContent = 'Guardar cambios'; btn.disabled = true; }, 1500);

    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Guardar cambios';
      saveError.style.display = 'block';
    }
  }

  document.getElementById('config-form').addEventListener('input', () => {
    const btnGuardar = document.getElementById('config-guardar');
    btnGuardar.disabled = false;
    btnGuardar.classList.add('is-dirty');
  });
  document.getElementById('config-guardar').addEventListener('click', configGuardar);
  document.getElementById('config-retry').addEventListener('click', configCargar);
  document.getElementById('config-refresh').addEventListener('click', configCargar);