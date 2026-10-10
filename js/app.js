// ============================================================
  // CONFIGURACIÓN — actualizar cuando exista el workflow n8n real
  // ============================================================
  const LOGIN_WEBHOOK_URL = 'https://n8n.gorekia.com/webhook/panel-login';
  const TOKEN_KEY = 'vitaerec_panel_token';
  const USER_KEY = 'vitaerec_panel_usuario';

  // Validar sesión al cargar — endpoint pendiente de construir en n8n, mismo patrón
  // que el resto (Code Extraer Token → Validar Sesión (Execute Workflow By ID) → IF).
  // Contrato esperado:
  //   GET panel-sesion  -> 200 { valido: true, usuario: "Sonia" } si el token existe
  //                        en sesiones_panel y no ha caducado
  //                     -> 401 si no existe, caducó o fue revocado
  //        Header: Authorization: Bearer <token>
  const SESION_API_URL = 'https://n8n.gorekia.com/webhook/panel-sesion';

  // Logout — hoy solo borraba el token en localStorage; falta que también
  // desaparezca de sesiones_panel para que quede realmente invalidado.
  // Contrato esperado:
  //   POST panel-logout -> 200 {ok:true}, DELETE de la fila en sesiones_panel
  //        cuyo token coincide con el Authorization recibido.
  //        Header: Authorization: Bearer <token>
  const LOGOUT_API_URL = 'https://n8n.gorekia.com/webhook/panel-logout';

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
  //     { id, hora_inicio, hora_fin, estado: 'confirmada'|'realizada'|'no_show', origen: 'bot'|'manual',
  //       profesional, servicio, cliente_nombre, cliente_apellidos }
  //     Header: Authorization: Bearer <token>
  //     El backend filtra citas.fecha = $1 AND citas.estado != 'cancelada'
  //     `id` y `estado` son necesarios para el botón «No se presentó».
  const AGENDA_API_URL = 'https://n8n.gorekia.com/webhook/panel-agenda';
  // «No se presentó»: POST panel-agenda-noshow  body { id } o { id, deshacer: true }
  //   -> { ok: true, estado } | { ok: false, error, mensaje }   (Header: Authorization: Bearer <token>)
  //   Marca la cita como no_show y registra una penalización del 100 % (Sonia fija su importe o la condona en «Cancelaciones y Modificaciones»; luego se cobra en Cobros).
  //   Con deshacer: la cita vuelve a realizada/confirmada y se borra la penalización, mientras siga 'aplicada'.
  const AGENDA_NOSHOW_URL = 'https://n8n.gorekia.com/webhook/panel-agenda-noshow';

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
  //          franja_condicional_dias_cerrados, // objeto {lunes:bool, martes:bool, ...}
  //          penalizacion_20_24h_porcentaje, penalizacion_0_20h_porcentaje }
  //        Header: Authorization: Bearer <token>
  //   POST panel-config  -> body ese mismo objeto con los campos editados,
  //        Header: Authorization: Bearer <token>.
  //        NO toca `contexto_clinica` — esa clave se gestiona aparte (es el .md de VR-Informacion).
  // PENDIENTE (post-reunión): penalizacion_20_24h_porcentaje y penalizacion_0_20h_porcentaje
  // están hardcodeadas como 20/24/50/100 directamente en el Code node de VR-Cancelar y
  // VR-Modificar — cambiarlas aquí actualiza config_centro pero NO afecta al bot todavía.
  // Falta reescribir esos Code nodes para que lean estos dos valores en vez de tenerlos fijos.
  // PENDIENTE (mismo motivo): franja_condicional_dias_cerrados hay que confirmar si el motor
  // de huecos de VR-Reserva ya lee franja_condicional_inicio/fin — si no lo hace, este toggle
  // por día tampoco afectará al bot hasta que se cablee ahí también.
  const CONFIG_API_URL = 'https://n8n.gorekia.com/webhook/panel-config';
  const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

  // Clientes — workflow n8n `CRM CLIENTES` (mismo patrón: validar sesión + Postgres).
  // Contrato (entrega 1: listado; ficha, alta, actualización y documentos llegan después):
  //   GET  panel-clientes?q=texto&inactivos=0|1  -> 200, array de:
  //        { id, nombre, apellidos|null, telefono, etiqueta_dificil, activo,
  //          lopd_enviado, tutor: nombre del profesional|null }
  //        `q` busca por nombre, apellidos o teléfono (sin distinguir mayúsculas ni tildes).
  //        Por defecto solo activos; con inactivos=1 devuelve también los inactivos.
  //        Header: Authorization: Bearer <token>
  const CLIENTES_API_URL = 'https://n8n.gorekia.com/webhook/panel-clientes';
  // Ficha de cliente — GET panel-clientes-ficha?id=N -> 200, objeto:
  //   { cliente: { id, nombre, apellidos, telefono, fecha_nacimiento ('YYYY-MM-DD'|null), tutor_id|null,
  //                etiqueta_dificil, tipo_agenda, lesiones, objetivos, notas_internas, es_nuevo,
  //                lopd_enviado, fecha_alta, activo, habituales_todos } | null,
  //     habituales: [{ profesional_id, orden }]  (orden 1..3),
  //     excluido: profesional_id | null,
  //     documentos: [{ id, nombre, mime_type, tamano_bytes, subido_en }]  (sin contenido),
  //     profesionales: [{ id, nombre }]  (solo activos, para los desplegables) }
  //   `cliente: null` si el id no existe. Header: Authorization: Bearer <token>
  const CLIENTES_FICHA_URL = 'https://n8n.gorekia.com/webhook/panel-clientes-ficha';
  //   `?id=0` devuelve solo la lista `profesionales` (con `cliente: null`): el formulario de
  //   alta la usa para rellenar los desplegables.
  // Alta y edición — POST con el formulario COMPLETO como JSON (Header: Authorization: Bearer <token>):
  //   { id (solo al editar), nombre, apellidos, telefono, fecha_nacimiento ('YYYY-MM-DD'|''),
  //     tipo_agenda ('hora_fija'|'semanal'), etiqueta_dificil, activo, lopd_enviado,
  //     tutor_id|null, habituales_todos, habituales: [profesional_id, ...] (máx. 3, el orden
  //     de la lista es el orden 1..3), excluido: profesional_id|null, lesiones, objetivos, notas_internas }
  //   panel-clientes-alta        -> { ok: true, id }  |  { ok: false, error, mensaje }
  //   panel-clientes-actualizar  -> { ok: true, id }  |  { ok: false, error, mensaje }
  //   El backend valida y normaliza el teléfono; `mensaje` es apto para enseñar tal cual.
  const CLIENTES_ALTA_URL = 'https://n8n.gorekia.com/webhook/panel-clientes-alta';
  const CLIENTES_ACTUALIZAR_URL = 'https://n8n.gorekia.com/webhook/panel-clientes-actualizar';
  //   panel-clientes-eliminar    -> body { id }  ->  { ok: true } | { ok: false, error, mensaje }
  //   Borrado definitivo, solo si el cliente no tiene citas, bonos, penalizaciones ni reservas fijas
  //   (error `tiene_historial`, con `mensaje` listo para enseñar). Si no, se desactiva con `activo`.
  const CLIENTES_ELIMINAR_URL = 'https://n8n.gorekia.com/webhook/panel-clientes-eliminar';
  // Documentos del cliente (fotos, diagnósticos) — workflow aparte `CRM CLIENTES DOCS`.
  //   POST panel-clientes-doc-subir     body { cliente_id, nombre, contenido_b64 }  -> { ok: true, id } | { ok: false, error, mensaje }
  //   GET  panel-clientes-doc?id=N      -> { ok: true, id, nombre, mime_type, contenido_b64 } | { ok: false, error, mensaje }
  //   POST panel-clientes-doc-eliminar  body { id }                                 -> { ok: true } | { ok: false, error, mensaje }
  //   El backend comprueba el contenido real (PDF, JPG, PNG o WebP, máx. 8 MB) y lo guarda cifrado.
  //   El listado va dentro de panel-clientes-ficha (`documentos`), nunca con el contenido.
  const CLIENTES_DOC_SUBIR_URL = 'https://n8n.gorekia.com/webhook/panel-clientes-doc-subir';
  const CLIENTES_DOC_URL = 'https://n8n.gorekia.com/webhook/panel-clientes-doc';
  const CLIENTES_DOC_ELIMINAR_URL = 'https://n8n.gorekia.com/webhook/panel-clientes-doc-eliminar';

  // Vistas con su propio markup ya escrito en el HTML (no se generan como placeholder vacío)
  const CUSTOM_VIEWS = ['derivaciones', 'agenda', 'clientes', 'bonos', 'cobros', 'penalizaciones', 'servicios', 'equipo', 'config'];

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
    penalizaciones: {
      title: 'Cancelaciones y Modificaciones',
      icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9.5" y1="13.5" x2="14.5" y2="18.5"/><line x1="14.5" y1="13.5" x2="9.5" y2="18.5"/>',
      desc: 'Las penalizaciones por cancelar o cambiar una cita con poca antelación: fija el importe o condónalas.'
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
      if (view === 'clientes') clientesCargar();
      if (view === 'bonos') bonosCargar();
      if (view === 'cobros') cobrosCargar();
      if (view === 'penalizaciones') penCargar();
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

  // Si hay una sesión guardada, se valida contra la BD antes de entrar —
  // un token borrado o caducado en sesiones_panel ya no basta con estar en
  // localStorage para acceder al panel. Mientras se comprueba, se queda en
  // la pantalla de login; solo cambia a la app si el backend confirma que
  // el token sigue siendo válido.
  async function comprobarSesionGuardada() {
    const token = localStorage.getItem(TOKEN_KEY);
    const usuario = localStorage.getItem(USER_KEY);
    if (!token || !usuario) return;

    try {
      const res = await fetch(SESION_API_URL, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('sesión no válida');
      showApp(usuario);
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }
  comprobarSesionGuardada();

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

  document.getElementById('logout-btn').addEventListener('click', async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    // Best-effort: borra el token en sesiones_panel. Si falla (sin red,
    // servidor caído) el logout local sigue igualmente — nunca dejamos a
    // Sonia atrapada dentro del panel por un error de conexión.
    try {
      await fetch(LOGOUT_API_URL, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      });
    } catch (err) {
      // sin conexión o servidor caído — se ignora, el logout local basta
    }

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
    // «No se presentó»: solo cuando la cita ya ha empezado (y no está cancelada, que no sale en la lista).
    const empezada = new Date(agendaFormatearISO(agendaFecha) + 'T' + String(item.hora_inicio || '').slice(0, 5)) <= new Date();
    let acciones = '';
    if (item.estado === 'no_show') {
      acciones = `<span class="badge badge-noshow">No se presentó</span>
        <button type="button" class="cita-btn is-deshacer" data-noshow="deshacer" data-id="${Number(item.id)}">Deshacer</button>`;
    } else if ((item.estado === 'confirmada' || item.estado === 'realizada') && empezada) {
      acciones = `<button type="button" class="cita-btn" data-noshow="marcar" data-id="${Number(item.id)}">No se presentó</button>`;
    }
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
        <div class="cita-acciones" data-cliente="${cliEsc(cliente)}" data-hora="${cliEsc(String(item.hora_inicio || '').slice(0, 5))}">${acciones}</div>
      </div>
    `;
  }

  async function agendaNoShow(boton) {
    const deshacer = boton.dataset.noshow === 'deshacer';
    const cont = boton.closest('.cita-acciones');
    const quien = (cont.dataset.cliente || 'El cliente');
    const texto = deshacer
      ? `¿Deshacer «No se presentó» de ${quien} (${cont.dataset.hora})?\n\nSe eliminará la penalización registrada.`
      : `¿Marcar que ${quien} no se presentó a la cita de las ${cont.dataset.hora}?\n\nSe registrará una penalización del 100 % (luego decides su importe o si se condona) y, si la cita es de un bono, se descontará la sesión.`;
    if (!confirm(texto)) return;
    boton.disabled = true;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(AGENDA_NOSHOW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(deshacer ? { id: Number(boton.dataset.id), deshacer: true } : { id: Number(boton.dataset.id) })
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const t = await res.text();
      const r = t ? JSON.parse(t) : null;
      if (!r || typeof r.ok !== 'boolean') throw new Error('respuesta inesperada');
      if (!r.ok) {
        alert(r.mensaje || 'No se ha podido guardar.');
        boton.disabled = false;
        if (r.error === 'no_existe' || r.error === 'penalizacion_gestionada') agendaCargar();
        return;
      }
      agendaCargar();
    } catch (err) {
      alert('No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.');
      boton.disabled = false;
    }
  }
  document.getElementById('agenda-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-noshow]');
    if (b && !b.disabled) agendaNoShow(b);
  });

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

    // Si la clave todavía no existe en config_centro (primera carga tras este cambio),
    // por defecto cerrado todos los días — mismo comportamiento que había hasta ahora.
    const diasCerrados = cfg.franja_condicional_dias_cerrados || {};
    DIAS_SEMANA.forEach(dia => {
      const marcado = diasCerrados.hasOwnProperty(dia) ? !!diasCerrados[dia] : true;
      document.getElementById('config-dia-' + dia).checked = marcado;
    });
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

    const diasCerrados = {};
    DIAS_SEMANA.forEach(dia => {
      diasCerrados[dia] = document.getElementById('config-dia-' + dia).checked;
    });

    const actualizado = {
      antelacion_minima_reserva_horas: Number(document.getElementById('config-antelacion').value),
      max_sesiones_simultaneas: Number(document.getElementById('config-max-sesiones').value),
      franja_condicional_inicio: document.getElementById('config-franja-inicio').value,
      franja_condicional_fin: document.getElementById('config-franja-fin').value,
      franja_condicional_dias_cerrados: diasCerrados,
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

  // ============================================================
  // CLIENTES — listado con buscador (la ficha, el alta y los documentos llegan después)
  // ============================================================
  let cliFiltro = 'activos'; // 'activos' | 'todos'
  let cliBusqueda = '';
  let cliDatos = [];
  let cliPeticion = 0;       // contador para descartar respuestas antiguas si se teclea rápido
  let cliTimer = null;

  // El bot guarda el teléfono solo con dígitos y prefijo (34684200606); aquí se muestra legible.
  // Cualquier otro formato se enseña tal cual, sin tocarlo.
  function cliFormatearTelefono(tel) {
    const texto = String(tel || '');
    const digitos = texto.replace(/\D/g, '');
    if (digitos.length === 11 && digitos.startsWith('34')) {
      return `+34 ${digitos.slice(2, 5)} ${digitos.slice(5, 8)} ${digitos.slice(8)}`;
    }
    return texto;
  }

  function cliRenderFila(c) {
    const nombre = [c.nombre, c.apellidos].filter(Boolean).join(' ');
    const etiquetas = [
      c.etiqueta_dificil ? '<span class="badge badge-dificil">Difícil</span>' : '',
      c.activo ? '' : '<span class="badge badge-inactivo">Inactivo</span>'
    ].join('');
    const lopd = c.lopd_enviado
      ? '<span class="cli-lopd cli-lopd-ok">Enviado</span>'
      : '<span class="cli-lopd cli-lopd-pend">Pendiente</span>';
    return `
      <tr data-id="${Number(c.id)}" class="${c.activo ? '' : 'is-inactivo'}">
        <td class="cli-nombre">${derivEscapeHtml(nombre)}</td>
        <td>${derivEscapeHtml(cliFormatearTelefono(c.telefono))}</td>
        <td>${derivEscapeHtml(c.tutor || '—')}</td>
        <td><div class="cli-etiquetas">${etiquetas}</div></td>
        <td>${lopd}</td>
      </tr>
    `;
  }

  function cliRenderLista() {
    const empty = document.getElementById('clientes-empty');
    const tabla = document.getElementById('clientes-table');
    const contador = document.getElementById('clientes-count');

    if (!cliDatos || cliDatos.length === 0) {
      tabla.style.display = 'none';
      contador.textContent = '';
      document.getElementById('clientes-empty-titulo').textContent =
        cliBusqueda ? 'Sin resultados' : 'Sin clientes dados de alta';
      document.getElementById('clientes-empty-texto').textContent = cliBusqueda
        ? `No hay clientes que coincidan con «${cliBusqueda}».`
        : 'Los clientes que se registren por el bot o a mano aparecerán aquí.';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    document.getElementById('clientes-list').innerHTML = cliDatos.map(cliRenderFila).join('');
    contador.textContent = cliDatos.length === 1 ? '1 cliente' : `${cliDatos.length} clientes`;
    tabla.style.display = '';
  }

  // silencioso = true al buscar mientras se escribe: la tabla no se vacía ni parpadea
  // con "Cargando…" en cada pulsación, solo se actualiza cuando llega el resultado.
  async function clientesCargar(silencioso) {
    const loading = document.getElementById('clientes-loading');
    const error = document.getElementById('clientes-error');
    const empty = document.getElementById('clientes-empty');
    const tabla = document.getElementById('clientes-table');
    const refreshBtn = document.getElementById('clientes-refresh');
    const peticion = ++cliPeticion;

    error.style.display = 'none';
    refreshBtn.classList.add('spinning');
    if (!silencioso) {
      empty.style.display = 'none';
      tabla.style.display = 'none';
      loading.style.display = 'block';
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const url = `${CLIENTES_API_URL}?q=${encodeURIComponent(cliBusqueda)}&inactivos=${cliFiltro === 'todos' ? 1 : 0}`;
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('respuesta no ok');
      // n8n puede responder con cuerpo vacío cuando no hay filas: se trata como lista vacía
      const texto = await res.text();
      const datos = texto ? JSON.parse(texto) : [];
      if (peticion !== cliPeticion) return; // ya hay una búsqueda más reciente en marcha
      cliDatos = Array.isArray(datos) ? datos : [];
      loading.style.display = 'none';
      cliRenderLista();
    } catch (err) {
      if (peticion !== cliPeticion) return;
      loading.style.display = 'none';
      tabla.style.display = 'none';
      empty.style.display = 'none';
      error.style.display = 'block';
    } finally {
      if (peticion === cliPeticion) refreshBtn.classList.remove('spinning');
    }
  }

  document.getElementById('clientes-search').addEventListener('input', (e) => {
    cliBusqueda = e.target.value.trim();
    clearTimeout(cliTimer);
    cliTimer = setTimeout(() => clientesCargar(true), 300);
  });

  document.getElementById('clientes-filter').querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#clientes-filter .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      cliFiltro = pill.dataset.filter;
      clientesCargar(true);
    });
  });

  // Función flecha: si se pasara clientesCargar directo, el evento llegaría como `silencioso`.
  document.getElementById('clientes-retry').addEventListener('click', () => clientesCargar());
  document.getElementById('clientes-refresh').addEventListener('click', () => clientesCargar());

  // ------------------------------------------------------------
  // Ficha de cliente (panel lateral): edición y alta manual.
  // La validación de verdad la hace el backend (funciones SQL); aquí solo se avisa
  // antes de enviar para ahorrar el viaje y señalar el campo concreto.
  // ------------------------------------------------------------
  let cliFichaPeticion = 0;
  let cliModo = 'editar';        // 'editar' | 'crear'
  let cliFichaId = null;         // id del cliente abierto (null en un alta)
  let cliFormInicial = '';       // foto del formulario al abrir, para saber si hay cambios
  let cliGuardando = false;

  // derivEscapeHtml no escapa comillas, y aquí hay valores dentro de atributos (value="…").
  function cliEsc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const CLI_TIPOS_AGENDA = { semanal: 'Semana a semana', hora_fija: 'Hora fija' };

  function cliTamano(bytes) {
    const n = Number(bytes) || 0;
    if (n >= 1048576) return (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
    return Math.max(1, Math.round(n / 1024)) + ' KB';
  }

  function cliFecha(iso) {
    const d = iso ? new Date(iso) : null;
    return d && !isNaN(d) ? d.toLocaleDateString('es-ES') : '';
  }

  function cliOpcionesProf(profesionales, seleccionado, vacio) {
    const sel = seleccionado == null || seleccionado === '' ? null : Number(seleccionado);
    const lista = Array.isArray(profesionales) ? profesionales : [];
    let html = `<option value="">${cliEsc(vacio)}</option>`;
    html += lista.map(p =>
      `<option value="${Number(p.id)}"${Number(p.id) === sel ? ' selected' : ''}>${cliEsc(p.nombre)}</option>`
    ).join('');
    // Un profesional asignado que ya no está activo no debe desaparecer en silencio.
    if (sel != null && !lista.some(p => Number(p.id) === sel)) {
      html += `<option value="${sel}" selected>Profesional inactivo (#${sel})</option>`;
    }
    return html;
  }

  function cliCampo(etiqueta, control, obligatorio) {
    return `<div class="config-field"><label>${cliEsc(etiqueta)}${obligatorio ? ' <span class="cli-req">*</span>' : ''}</label>${control}</div>`;
  }

  function cliRenderFormulario(f, modo) {
    const c = f.cliente || {
      nombre: '', apellidos: '', telefono: '', fecha_nacimiento: null, tutor_id: null,
      etiqueta_dificil: false, tipo_agenda: 'semanal', lesiones: '', objetivos: '', notas_internas: '',
      lopd_enviado: false, activo: true, habituales_todos: false
    };
    const profesionales = f.profesionales || [];
    const habituales = Array.isArray(f.habituales) ? f.habituales : [];
    const porOrden = {};
    habituales.forEach(h => { porOrden[Number(h.orden)] = h.profesional_id; });

    let opcionesAgenda = Object.keys(CLI_TIPOS_AGENDA).map(k =>
      `<option value="${k}"${k === c.tipo_agenda ? ' selected' : ''}>${CLI_TIPOS_AGENDA[k]}</option>`).join('');
    if (c.tipo_agenda && !(c.tipo_agenda in CLI_TIPOS_AGENDA)) {
      opcionesAgenda += `<option value="${cliEsc(c.tipo_agenda)}" selected>${cliEsc(c.tipo_agenda)}</option>`;
    }

    const slots = [1, 2, 3].map(n => cliCampo(
      `Habitual ${n}`,
      `<select class="serv-input" data-campo="hab${n}">${cliOpcionesProf(profesionales, porOrden[n], '— Sin asignar —')}</select>`
    )).join('');

    const docsHtml = cliRenderDocs(Array.isArray(f.documentos) ? f.documentos : []);
    const bonosHtml = modo === 'editar' && Array.isArray(f.bonos) ? cliRenderBonos(f.bonos, !!c.activo) : '';
    const pagosHtml = modo === 'editar' && f.pagos && typeof f.pagos === 'object' ? cliRenderPagos(f.pagos) : '';

    return `
      <section class="cli-sec">
        <h3>Datos personales</h3>
        <div class="cli-row2">
          ${cliCampo('Nombre', `<input class="serv-input" data-campo="nombre" maxlength="100" value="${cliEsc(c.nombre)}">`, true)}
          ${cliCampo('Apellidos', `<input class="serv-input" data-campo="apellidos" maxlength="150" value="${cliEsc(c.apellidos)}">`)}
        </div>
        <div class="cli-row2">
          ${cliCampo('Teléfono', `<input class="serv-input" data-campo="telefono" inputmode="tel" maxlength="20" value="${cliEsc(modo === 'crear' ? '' : cliFormatearTelefono(c.telefono))}" placeholder="600 123 456">`, true)}
          ${cliCampo('Fecha de nacimiento', `<input type="date" class="serv-input" data-campo="fecha_nacimiento" value="${cliEsc(String(c.fecha_nacimiento || '').slice(0, 10))}">`)}
        </div>
        ${cliCampo('Tipo de agenda', `<select class="serv-input" data-campo="tipo_agenda">${opcionesAgenda}</select>`)}
        <div class="cli-checks">
          <label class="cli-check"><input type="checkbox" data-campo="etiqueta_dificil" ${c.etiqueta_dificil ? 'checked' : ''}> Cliente difícil (solo se le asignan profesionales aptos para clientes difíciles)</label>
          <label class="cli-check"><input type="checkbox" data-campo="activo" ${c.activo ? 'checked' : ''}> Cliente activo</label>
          <label class="cli-check"><input type="checkbox" data-campo="lopd_enviado" ${c.lopd_enviado ? 'checked' : ''}> Formulario LOPD enviado</label>
        </div>
      </section>

      <section class="cli-sec">
        <h3>Profesionales</h3>
        ${cliCampo('Tutor', `<select class="serv-input" data-campo="tutor_id">${cliOpcionesProf(profesionales, c.tutor_id, '— Sin tutor —')}</select>`)}
        <div class="cli-checks">
          <label class="cli-check"><input type="checkbox" data-campo="habituales_todos" ${c.habituales_todos ? 'checked' : ''}> Todos los profesionales son habituales</label>
        </div>
        <div class="cli-sec-inner" id="cli-slots" style="${c.habituales_todos ? 'display:none;' : ''}">${slots}</div>
        ${cliCampo('Excluido (no se le asigna nunca)', `<select class="serv-input" data-campo="excluido">${cliOpcionesProf(profesionales, f.excluido, '— Ninguno —')}</select>`)}
      </section>

      <section class="cli-sec">
        <h3>Salud y seguimiento</h3>
        ${cliCampo('Lesiones', `<textarea class="serv-input cli-textarea" data-campo="lesiones" maxlength="2000">${cliEsc(c.lesiones)}</textarea>`)}
        ${cliCampo('Objetivos', `<textarea class="serv-input cli-textarea" data-campo="objetivos" maxlength="2000">${cliEsc(c.objetivos)}</textarea>`)}
        ${cliCampo('Notas internas', `<textarea class="serv-input cli-textarea" data-campo="notas_internas" maxlength="2000">${cliEsc(c.notas_internas)}</textarea>`)}
      </section>

      ${bonosHtml}

      ${pagosHtml}

      <section class="cli-sec">
        <h3>Documentos</h3>
        ${modo === 'crear'
          ? '<p class="cli-vacio">Podrás adjuntar documentos cuando el cliente esté creado.</p>'
          : `<div id="cli-docs-lista">${docsHtml}</div>
        <div class="cli-doc-subir">
          <label class="cli-btn-sec cli-upload">+ Subir documento
            <input type="file" id="cli-doc-file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp">
          </label>
          <span class="cli-doc-estado" id="cli-doc-estado" role="status"></span>
        </div>
        <p class="cli-vacio">PDF, JPG, PNG o WebP · máximo 8 MB. Las fotos del iPhone en formato HEIC no se admiten: elige «Más compatible» en los ajustes de la cámara.</p>`}
      </section>`;
  }

  // ---------- Documentos ----------
  const CLI_DOC_TIPOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const CLI_DOC_MAX = 8 * 1024 * 1024;
  let cliSubiendo = false;

  function cliRenderDocs(docs) {
    if (!docs.length) return '<p class="cli-vacio">Sin documentos adjuntos.</p>';
    return `<ul class="cli-doc-list">${docs.map(d => `
      <li class="cli-doc">
        <div class="cli-doc-info">
          <span class="cli-doc-nombre">${cliEsc(d.nombre)}</span>
          <span class="cli-doc-meta">${cliEsc(cliTamano(d.tamano_bytes))} · ${cliEsc(cliFecha(d.subido_en))}</span>
        </div>
        <div class="cli-doc-acciones">
          <button type="button" class="cli-doc-btn" data-doc-abrir="${Number(d.id)}">Abrir</button>
          <button type="button" class="cli-doc-btn cli-doc-btn-del" data-doc-borrar="${Number(d.id)}" data-doc-nombre="${cliEsc(d.nombre)}">Borrar</button>
        </div>
      </li>`).join('')}</ul>`;
  }

  function cliDocEstado(texto, tipo) {
    const el = document.getElementById('cli-doc-estado');
    if (!el) return;
    el.textContent = texto || '';
    el.className = 'cli-doc-estado' + (tipo ? ' is-' + tipo : '');
  }

  // Vuelve a pedir solo la lista de documentos y repinta esa parte: el resto del
  // formulario (con posibles cambios sin guardar) no se toca.
  async function cliRefrescarDocs(idCliente) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${CLIENTES_FICHA_URL}?id=${encodeURIComponent(idCliente)}`, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('respuesta no ok');
      const texto = await res.text();
      const datos = texto ? JSON.parse(texto) : null;
      const cont = document.getElementById('cli-docs-lista');
      if (datos && datos.cliente && cont && cliFichaId === idCliente) cont.innerHTML = cliRenderDocs(datos.documentos || []);
    } catch (err) {
      cliDocEstado('Documento guardado, pero no se ha podido actualizar la lista. Cierra y vuelve a abrir la ficha.', 'error');
    }
  }

  function cliLeerBase64(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result).split(',')[1] || '');
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(archivo);
    });
  }

  async function cliSubirDocumento(archivo) {
    if (cliSubiendo || !archivo) return;
    const ext = (archivo.name.split('.').pop() || '').toLowerCase();
    if (ext === 'heic' || ext === 'heif' || /heic|heif/.test(archivo.type)) {
      cliDocEstado('Formato HEIC no admitido: haz la foto en JPG («Más compatible») o conviértela.', 'error');
      return;
    }
    if (archivo.type && !CLI_DOC_TIPOS.includes(archivo.type)) {
      cliDocEstado('Solo se admiten PDF, JPG, PNG o WebP.', 'error');
      return;
    }
    if (archivo.size > CLI_DOC_MAX) {
      cliDocEstado('El archivo supera los 8 MB.', 'error');
      return;
    }
    if (archivo.size === 0) {
      cliDocEstado('El archivo está vacío.', 'error');
      return;
    }

    const idCliente = cliFichaId;
    cliSubiendo = true;
    cliDocEstado('Subiendo…');
    try {
      const contenido = await cliLeerBase64(archivo);
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(CLIENTES_DOC_SUBIR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ cliente_id: idCliente, nombre: archivo.name, contenido_b64: contenido })
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const texto = await res.text();
      const r = texto ? JSON.parse(texto) : null;
      if (!r || typeof r.ok !== 'boolean') throw new Error('respuesta inesperada');
      if (!r.ok) { if (cliFichaId === idCliente) cliDocEstado(r.mensaje || 'No se ha podido subir el documento.', 'error'); return; }
      if (cliFichaId === idCliente) {
        cliDocEstado('Documento subido.', 'ok');
        await cliRefrescarDocs(idCliente);
      }
    } catch (err) {
      if (cliFichaId === idCliente) cliDocEstado('No se ha podido subir. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      cliSubiendo = false;
      const input = document.getElementById('cli-doc-file');
      if (input) input.value = '';
    }
  }

  // La pestaña se abre ANTES de la petición (dentro del clic) para que el navegador no la bloquee.
  async function cliAbrirDocumento(idDoc) {
    const ventana = window.open('', '_blank');
    if (ventana) { try { ventana.opener = null; ventana.document.title = 'Cargando documento…'; } catch (e) { /* ignorar */ } }
    cliDocEstado('Abriendo…');
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${CLIENTES_DOC_URL}?id=${encodeURIComponent(idDoc)}`, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('respuesta no ok');
      const texto = await res.text();
      const r = texto ? JSON.parse(texto) : null;
      if (!r || typeof r.ok !== 'boolean') throw new Error('respuesta inesperada');
      if (!r.ok) throw new Error(r.mensaje || 'error');
      const bin = atob(r.contenido_b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: r.mime_type }));
      if (ventana) {
        ventana.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url; a.download = r.nombre || 'documento';
        document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      cliDocEstado('');
    } catch (err) {
      if (ventana) ventana.close();
      cliDocEstado(err && err.message && err.message !== 'error' && !/respuesta/.test(err.message)
        ? err.message : 'No se ha podido abrir el documento.', 'error');
    }
  }

  async function cliBorrarDocumento(idDoc, nombre) {
    if (!confirm(`¿Eliminar el documento «${nombre}»? No se puede deshacer.`)) return;
    const idCliente = cliFichaId;
    cliDocEstado('Eliminando…');
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(CLIENTES_DOC_ELIMINAR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ id: idDoc })
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const texto = await res.text();
      const r = texto ? JSON.parse(texto) : null;
      if (!r || typeof r.ok !== 'boolean') throw new Error('respuesta inesperada');
      if (!r.ok && r.error !== 'no_existe') { cliDocEstado(r.mensaje || 'No se ha podido eliminar.', 'error'); return; }
      cliDocEstado('Documento eliminado.', 'ok');
      await cliRefrescarDocs(idCliente);
    } catch (err) {
      cliDocEstado('No se ha podido eliminar. Revisa la conexión e inténtalo de nuevo.', 'error');
    }
  }

  function cliCampoEl(nombre) {
    return document.querySelector(`#cli-drawer-body [data-campo="${nombre}"]`);
  }

  // Lee el formulario entero con la forma que espera el backend.
  function cliRecoger() {
    const txt = (n) => cliCampoEl(n).value.trim();
    const idONull = (n) => { const v = cliCampoEl(n).value; return v === '' ? null : Number(v); };
    const todos = cliCampoEl('habituales_todos').checked;
    const habituales = todos ? [] : ['hab1', 'hab2', 'hab3'].map(idONull).filter(v => v !== null);
    const datos = {
      nombre: txt('nombre'),
      apellidos: txt('apellidos'),
      telefono: txt('telefono'),
      fecha_nacimiento: cliCampoEl('fecha_nacimiento').value,
      tipo_agenda: cliCampoEl('tipo_agenda').value,
      etiqueta_dificil: cliCampoEl('etiqueta_dificil').checked,
      activo: cliCampoEl('activo').checked,
      lopd_enviado: cliCampoEl('lopd_enviado').checked,
      tutor_id: idONull('tutor_id'),
      habituales_todos: todos,
      habituales,
      excluido: idONull('excluido'),
      lesiones: txt('lesiones'),
      objetivos: txt('objetivos'),
      notas_internas: txt('notas_internas')
    };
    if (cliModo === 'editar') datos.id = cliFichaId;
    return datos;
  }

  // Devuelve { campo, mensaje } con el primer problema, o null si todo está bien.
  function cliValidar(d) {
    if (!d.nombre) return { campo: 'nombre', mensaje: 'El nombre es obligatorio.' };
    const digitos = d.telefono.replace(/\D/g, '');
    if (digitos.length < 9) return { campo: 'telefono', mensaje: 'El teléfono no es válido.' };
    if (new Set(d.habituales).size !== d.habituales.length) {
      return { campo: 'hab1', mensaje: 'Un profesional no puede repetirse entre los habituales.' };
    }
    if (d.excluido !== null && d.habituales.includes(d.excluido)) {
      return { campo: 'excluido', mensaje: 'El profesional excluido no puede ser también habitual.' };
    }
    if (d.excluido !== null && d.excluido === d.tutor_id) {
      return { campo: 'excluido', mensaje: 'El profesional excluido no puede ser el tutor.' };
    }
    return null;
  }

  // Campo del formulario al que apunta cada código de error del backend.
  const CLI_ERROR_CAMPO = {
    nombre_obligatorio: 'nombre', telefono_invalido: 'telefono', telefono_duplicado: 'telefono',
    fecha_invalida: 'fecha_nacimiento', tipo_agenda_invalido: 'tipo_agenda',
    demasiados_habituales: 'hab1', habituales_duplicados: 'hab1', excluido_conflicto: 'excluido'
  };

  function cliMensaje(texto, tipo) {
    const el = document.getElementById('cli-form-msg');
    el.textContent = texto || '';
    el.className = 'cli-form-msg' + (tipo ? ' is-' + tipo : '');
  }

  function cliMarcarCampo(nombre) {
    document.querySelectorAll('#cli-drawer-body .cli-invalid').forEach(e => e.classList.remove('cli-invalid'));
    const el = nombre ? cliCampoEl(nombre) : null;
    if (el) { el.classList.add('cli-invalid'); el.focus(); }
  }

  function cliHayCambios() {
    return !!document.getElementById('cli-form-guardar') && !!cliCampoEl('nombre')
      && JSON.stringify(cliRecoger()) !== cliFormInicial;
  }

  function cliActualizarBotonGuardar() {
    const btn = document.getElementById('cli-form-guardar');
    btn.disabled = cliGuardando || (cliModo === 'editar' && !cliHayCambios());
  }

  function cliPrepararFormulario() {
    cliFormInicial = JSON.stringify(cliRecoger());
    cliMensaje('');
    const guardar = document.getElementById('cli-form-guardar');
    guardar.textContent = cliModo === 'crear' ? 'Crear cliente' : 'Guardar cambios';
    document.getElementById('cli-drawer-foot').style.display = '';
    document.getElementById('cli-form-eliminar').style.display = cliModo === 'editar' ? '' : 'none';
    cliActualizarBotonGuardar();
  }

  function cliDrawerAbrir() {
    document.getElementById('cli-drawer').classList.add('open');
    document.getElementById('cli-drawer').setAttribute('aria-hidden', 'false');
    document.getElementById('cli-drawer-backdrop').classList.add('open');
  }

  function cliDrawerCerrar(forzar) {
    if (forzar !== true && cliHayCambios() && !confirm('Hay cambios sin guardar. ¿Cerrar la ficha igualmente?')) return false;
    cliFichaPeticion++; // descarta cualquier carga en curso
    cliFichaId = null;
    document.getElementById('cli-drawer').classList.remove('open');
    document.getElementById('cli-drawer').setAttribute('aria-hidden', 'true');
    document.getElementById('cli-drawer-backdrop').classList.remove('open');
    document.getElementById('cli-drawer-foot').style.display = 'none';
    return true;
  }

  // Carga la ficha (modo editar) o solo la lista de profesionales (modo crear, id=0)
  // y pinta el formulario. `mensajeOk` permite enseñar "Guardado" tras recargar.
  async function cliAbrirFicha(id, modo, mensajeOk) {
    const cuerpo = document.getElementById('cli-drawer-body');
    const titulo = document.getElementById('cli-drawer-titulo');
    const peticion = ++cliFichaPeticion;
    cliModo = modo || 'editar';
    cliFichaId = cliModo === 'editar' ? Number(id) : null;
    titulo.textContent = cliModo === 'crear' ? 'Nuevo cliente' : 'Ficha del cliente';
    cuerpo.innerHTML = '<div class="deriv-status">Cargando…</div>';
    document.getElementById('cli-drawer-foot').style.display = 'none';
    cliDrawerAbrir();

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${CLIENTES_FICHA_URL}?id=${cliModo === 'crear' ? 0 : encodeURIComponent(id)}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const texto = await res.text();
      const datos = texto ? JSON.parse(texto) : null;
      if (peticion !== cliFichaPeticion) return;
      if (!datos || (cliModo === 'editar' && !datos.cliente)) {
        cuerpo.innerHTML = '<div class="deriv-status deriv-status-error">Este cliente ya no existe.</div>';
        return;
      }
      if (cliModo === 'editar') {
        titulo.textContent = [datos.cliente.nombre, datos.cliente.apellidos].filter(Boolean).join(' ');
      }
      cuerpo.innerHTML = cliRenderFormulario(datos, cliModo);
      cliPrepararFormulario();
      if (mensajeOk) cliMensaje(mensajeOk, 'ok');
      if (cliModo === 'crear') cliCampoEl('nombre').focus();
    } catch (err) {
      if (peticion !== cliFichaPeticion) return;
      cuerpo.innerHTML = '<div class="deriv-status deriv-status-error">No se ha podido cargar la ficha. '
        + '<button type="button" class="deriv-retry-btn" id="cli-ficha-retry">Reintentar</button></div>';
      document.getElementById('cli-ficha-retry').addEventListener('click', () => cliAbrirFicha(id, cliModo));
    }
  }

  async function cliGuardar() {
    if (cliGuardando) return;
    const datos = cliRecoger();
    const problema = cliValidar(datos);
    if (problema) {
      cliMensaje(problema.mensaje, 'error');
      cliMarcarCampo(problema.campo);
      return;
    }
    cliMarcarCampo(null);
    cliGuardando = true;
    const btn = document.getElementById('cli-form-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    cliMensaje('');
    const modoAlEnviar = cliModo;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(modoAlEnviar === 'crear' ? CLIENTES_ALTA_URL : CLIENTES_ACTUALIZAR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(datos)
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const texto = await res.text();
      const r = texto ? JSON.parse(texto) : null;
      if (!r || typeof r.ok !== 'boolean') throw new Error('respuesta inesperada');

      if (!r.ok) {
        cliMensaje(r.mensaje || 'No se ha podido guardar.', 'error');
        cliMarcarCampo(CLI_ERROR_CAMPO[r.error] || null);
        return;
      }
      // Guardado: se recarga la ficha desde la BD (lo que se ve es lo que hay guardado)
      // y se refresca el listado de detrás.
      cliGuardando = false;
      clientesCargar(true);
      await cliAbrirFicha(r.id, 'editar', modoAlEnviar === 'crear' ? 'Cliente creado.' : 'Cambios guardados.');
    } catch (err) {
      cliMensaje('No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      cliGuardando = false;
      btn.textContent = cliModo === 'crear' ? 'Crear cliente' : 'Guardar cambios';
      cliActualizarBotonGuardar();
    }
  }

  document.getElementById('clientes-list').addEventListener('click', (e) => {
    const fila = e.target.closest('tr[data-id]');
    if (fila) cliAbrirFicha(fila.dataset.id, 'editar');
  });
  document.getElementById('clientes-nuevo').addEventListener('click', () => cliAbrirFicha(0, 'crear'));
  document.getElementById('cli-drawer-cerrar').addEventListener('click', () => cliDrawerCerrar());
  document.getElementById('cli-form-cancelar').addEventListener('click', () => cliDrawerCerrar());
  document.getElementById('cli-drawer-backdrop').addEventListener('click', () => cliDrawerCerrar());
  document.getElementById('cli-form-guardar').addEventListener('click', cliGuardar);

  async function cliEliminar() {
    if (cliGuardando || cliModo !== 'editar' || cliFichaId == null) return;
    const nombre = document.getElementById('cli-drawer-titulo').textContent;
    if (!confirm(`¿Eliminar definitivamente a «${nombre}»?\n\nSe borrarán también sus documentos y asignaciones. Esta acción no se puede deshacer.`)) return;

    const btn = document.getElementById('cli-form-eliminar');
    cliGuardando = true;
    btn.disabled = true;
    btn.textContent = 'Eliminando…';
    cliMensaje('');
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(CLIENTES_ELIMINAR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ id: cliFichaId })
      });
      if (!res.ok) throw new Error('respuesta no ok');
      const texto = await res.text();
      const r = texto ? JSON.parse(texto) : null;
      if (!r || typeof r.ok !== 'boolean') throw new Error('respuesta inesperada');
      if (!r.ok) {
        // También cubre "ya no existe" (borrado desde otro sitio): se refresca el listado.
        cliMensaje(r.mensaje || 'No se ha podido eliminar.', 'error');
        if (r.error === 'no_existe') clientesCargar(true);
        return;
      }
      cliDrawerCerrar(true);
      clientesCargar(true);
    } catch (err) {
      cliMensaje('No se ha podido eliminar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      cliGuardando = false;
      btn.disabled = false;
      btn.textContent = 'Eliminar cliente';
      cliActualizarBotonGuardar();
    }
  }
  document.getElementById('cli-form-eliminar').addEventListener('click', cliEliminar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('cli-drawer').classList.contains('open')) cliDrawerCerrar();
  });

  // Delegación en el cuerpo de la ficha: se vuelve a pintar entero al abrir y guardar.
  const cliCuerpo = document.getElementById('cli-drawer-body');
  function cliAlCambiar(e) {
    if (e.target.matches('[data-campo="habituales_todos"]')) {
      document.getElementById('cli-slots').style.display = e.target.checked ? 'none' : '';
    }
    if (e.target.classList && e.target.classList.contains('cli-invalid')) e.target.classList.remove('cli-invalid');
    if (cliModo === 'editar') cliActualizarBotonGuardar();
  }
  cliCuerpo.addEventListener('click', (e) => {
    const abrir = e.target.closest('[data-doc-abrir]');
    if (abrir) { cliAbrirDocumento(Number(abrir.dataset.docAbrir)); return; }
    const borrar = e.target.closest('[data-doc-borrar]');
    if (borrar) cliBorrarDocumento(Number(borrar.dataset.docBorrar), borrar.dataset.docNombre);
  });
  cliCuerpo.addEventListener('change', (e) => {
    if (e.target.id === 'cli-doc-file' && e.target.files && e.target.files[0]) cliSubirDocumento(e.target.files[0]);
  });
  cliCuerpo.addEventListener('input', cliAlCambiar);
  cliCuerpo.addEventListener('change', cliAlCambiar);

  // ============================================================
  // BONOS — listado, ficha, alta y ajustes (workflow n8n `CRM BONOS`, mismo patrón que Clientes)
  // ============================================================
  // Contrato (todas llevan Header: Authorization: Bearer <token>; las POST, Content-Type JSON):
  //   GET  panel-bonos?q=texto&ver=activos|todos  -> array de:
  //        { id, cliente_id, cliente_nombre, cliente_apellidos|null, cliente_telefono, servicio_id, servicio,
  //          es_2pax, fecha_inicio, fecha_caducidad|null, sesiones_totales, sesiones_restantes,
  //          estado: 'activo'|'agotado'|'caducado'|'anulado', pocas_sesiones, caduca_pronto, dias_para_caducar|null }
  //        `q` busca por cliente, teléfono o tipo de bono. El estado ya viene calculado (caducado/agotado al día).
  //   GET  panel-bonos-ficha?id=N  -> { bono, cliente, citas, reservas_fijas, servicios_bono, servicios_sesion,
  //                                     profesionales, umbrales }
  //        `id=0` devuelve solo los catálogos (para el alta), con bono/cliente a null.
  //        bono: { id, cliente_id, servicio_id, servicio, duracion_min, es_2pax, requiere_profesor, caducidad_meses,
  //                fecha_inicio, fecha_caducidad|null, sesiones_totales, sesiones_restantes, estado, ... }
  //        citas: [{ id, fecha, hora_inicio, hora_fin, estado, profesional|null, sesion_descontada }]
  //        reservas_fijas: [{ id, dia_semana (1 = lunes … 7 = domingo), hora_inicio, hora_fin, profesional_id|null,
  //                           profesional|null, servicio_id, servicio }]   (las activas del cliente)
  //        servicios_bono: [{ id, nombre, duracion_min, sesiones_bono, caducidad_meses|null, es_2pax, requiere_profesor }]
  //        servicios_sesion: [{ id, nombre, duracion_min, requiere_profesor, es_2pax, profesionales: [id, …] }]
  //        profesionales: [{ id, nombre }]
  //   POST panel-bonos-alta       body { cliente_id, servicio_id, fecha_inicio ('YYYY-MM-DD'), sesiones_usadas,
  //                                      reservas_fijas: [{ servicio_sesion_id, profesional_id|null, dia_semana, hora_inicio ('HH:MM') }] }
  //                               -> { ok: true, id, reservas_fijas: [ids], citas_vinculadas } | { ok: false, error, mensaje }
  //   POST panel-bonos-actualizar body { id, sesiones_restantes?, fecha_caducidad? ('' = sin caducidad), anulado? }
  //                               -> { ok: true, id, estado } | { ok: false, error, mensaje }   (solo viajan los campos cambiados)
  //   POST panel-bonos-eliminar   body { id } -> { ok: true } | { ok: false, error, mensaje }   (`tiene_historial` si ya tiene citas)
  //   POST panel-bonos-reserva-crear   body { bono_id, servicio_sesion_id, profesional_id|null, dia_semana, hora_inicio }
  //                               -> { ok: true, id } | { ok: false, error, mensaje }
  //   POST panel-bonos-reserva-quitar  body { id } -> { ok: true } | { ok: false, error, mensaje }  (solo la desactiva; no toca citas)
  //   `mensaje` es apto para enseñar tal cual.
  const BONOS_API_URL = 'https://n8n.gorekia.com/webhook/panel-bonos';
  const BONOS_FICHA_URL = 'https://n8n.gorekia.com/webhook/panel-bonos-ficha';
  const BONOS_ALTA_URL = 'https://n8n.gorekia.com/webhook/panel-bonos-alta';
  const BONOS_ACTUALIZAR_URL = 'https://n8n.gorekia.com/webhook/panel-bonos-actualizar';
  const BONOS_ELIMINAR_URL = 'https://n8n.gorekia.com/webhook/panel-bonos-eliminar';
  const BONOS_RESERVA_URL = 'https://n8n.gorekia.com/webhook/panel-bonos-reserva-crear';
  const BONOS_RESERVA_QUITAR_URL = 'https://n8n.gorekia.com/webhook/panel-bonos-reserva-quitar';

  const BO_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']; // índice 0 = día 1 (ISO)
  const BO_ESTADOS = { activo: 'Activo', agotado: 'Agotado', caducado: 'Caducado', anulado: 'Anulado' };
  const BO_ESTADOS_CITA = { confirmada: 'Confirmada', realizada: 'Realizada', no_show: 'No se presentó', cancelada: 'Cancelada' };
  const BO_MAX_RESERVAS = 7;

  // 'YYYY-MM-DD' (o ISO completo) -> 'DD/MM/YYYY' sin pasar por Date (evita desfases de zona horaria).
  function boFecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
  }
  function boHoyISO() { return agendaFormatearISO(new Date()); }

  // Igual que el backend: fecha + N meses; si el día no existe en el mes destino, el último día de ese mes.
  function boSumarMeses(iso, meses) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m || !Number.isFinite(Number(meses))) return '';
    const total = (Number(m[2]) - 1) + Number(meses);
    const anio = Number(m[1]) + Math.floor(total / 12);
    const mes = ((total % 12) + 12) % 12;
    const dia = Math.min(Number(m[3]), new Date(anio, mes + 1, 0).getDate());
    return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  function boDiasTexto(n) {
    n = Number(n);
    if (n < 0) return 'caducado';
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    return `en ${n} días`;
  }

  function boPill(estado) {
    const clave = estado in BO_ESTADOS ? estado : 'anulado';
    return `<span class="bo-pill bo-pill-${clave}">${cliEsc(BO_ESTADOS[estado] || estado)}</span>`;
  }

  async function boPost(url, cuerpo) {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(cuerpo)
    });
    if (!res.ok) throw new Error('respuesta no ok');
    const texto = await res.text();
    const r = texto ? JSON.parse(texto) : null;
    if (!r || typeof r.ok !== 'boolean') throw new Error('respuesta inesperada');
    return r;
  }

  async function boGet(url) {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('respuesta no ok');
    const texto = await res.text();
    return texto ? JSON.parse(texto) : null;
  }

  // ---------- Listado ----------
  let boFiltro = 'activos';   // 'activos' | 'todos'
  let boBusqueda = '';
  let boDatos = [];
  let boPeticion = 0;         // descarta respuestas antiguas si se teclea rápido
  let boTimer = null;

  function boRenderFila(b) {
    const nombre = [b.cliente_nombre, b.cliente_apellidos].filter(Boolean).join(' ');
    const tot = Number(b.sesiones_totales) || 0;
    const rest = Number(b.sesiones_restantes) || 0;
    const pct = tot > 0 ? Math.max(0, Math.min(100, Math.round((rest / tot) * 100))) : 0;
    const claseBarra = rest <= 0 ? 'is-cero' : (b.pocas_sesiones ? 'is-pocas' : '');
    const caducidad = b.fecha_caducidad
      ? `${cliEsc(boFecha(b.fecha_caducidad))}${b.caduca_pronto ? ` <span class="bo-aviso">(${cliEsc(boDiasTexto(b.dias_para_caducar))})</span>` : ''}`
      : '<span class="bo-sin-cad">Sin caducidad</span>';
    return `
      <tr data-id="${Number(b.id)}" class="${b.estado === 'activo' ? '' : 'bo-apagado'}">
        <td class="cli-nombre">${cliEsc(nombre)}<span class="bo-cliente-tel">${cliEsc(cliFormatearTelefono(b.cliente_telefono))}</span></td>
        <td class="bo-tipo">${cliEsc(b.servicio)}${b.es_2pax ? '<span class="badge badge-manual">2 pax</span>' : ''}</td>
        <td><div class="bo-sesiones">
          <span class="bo-sesiones-num">${rest} <span>/ ${tot}</span></span>
          <span class="bo-bar ${claseBarra}"><span style="width:${pct}%"></span></span>
        </div></td>
        <td>${cliEsc(boFecha(b.fecha_inicio))}</td>
        <td>${caducidad}</td>
        <td>${boPill(b.estado)}</td>
      </tr>`;
  }

  function boRenderLista() {
    const empty = document.getElementById('bonos-empty');
    const tabla = document.getElementById('bonos-table');
    const contador = document.getElementById('bonos-count');

    if (!boDatos || boDatos.length === 0) {
      tabla.style.display = 'none';
      contador.textContent = '';
      document.getElementById('bonos-empty-titulo').textContent = boBusqueda
        ? 'Sin resultados' : (boFiltro === 'activos' ? 'Sin bonos activos' : 'Sin bonos dados de alta');
      document.getElementById('bonos-empty-texto').textContent = boBusqueda
        ? `No hay bonos que coincidan con «${boBusqueda}».`
        : (boFiltro === 'activos'
          ? 'Los bonos vigentes aparecerán aquí. En «Todos» verás también los agotados, caducados y anulados.'
          : 'Los bonos que des de alta aparecerán aquí.');
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    document.getElementById('bonos-list').innerHTML = boDatos.map(boRenderFila).join('');
    contador.textContent = boDatos.length === 1 ? '1 bono' : `${boDatos.length} bonos`;
    tabla.style.display = '';
  }

  // silencioso = true al buscar mientras se escribe: la tabla no parpadea con "Cargando…".
  async function bonosCargar(silencioso) {
    const loading = document.getElementById('bonos-loading');
    const error = document.getElementById('bonos-error');
    const empty = document.getElementById('bonos-empty');
    const tabla = document.getElementById('bonos-table');
    const refreshBtn = document.getElementById('bonos-refresh');
    const peticion = ++boPeticion;

    error.style.display = 'none';
    refreshBtn.classList.add('spinning');
    if (!silencioso) {
      empty.style.display = 'none';
      tabla.style.display = 'none';
      loading.style.display = 'block';
    }
    try {
      const datos = await boGet(`${BONOS_API_URL}?q=${encodeURIComponent(boBusqueda)}&ver=${boFiltro}`);
      if (peticion !== boPeticion) return;
      boDatos = Array.isArray(datos) ? datos : [];
      loading.style.display = 'none';
      boRenderLista();
    } catch (err) {
      if (peticion !== boPeticion) return;
      loading.style.display = 'none';
      tabla.style.display = 'none';
      empty.style.display = 'none';
      error.style.display = 'block';
    } finally {
      if (peticion === boPeticion) refreshBtn.classList.remove('spinning');
    }
  }

  document.getElementById('bonos-search').addEventListener('input', (e) => {
    boBusqueda = e.target.value.trim();
    clearTimeout(boTimer);
    boTimer = setTimeout(() => bonosCargar(true), 300);
  });
  document.getElementById('bonos-filter').querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#bonos-filter .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      boFiltro = pill.dataset.filter;
      bonosCargar(true);
    });
  });
  document.getElementById('bonos-retry').addEventListener('click', () => bonosCargar());
  document.getElementById('bonos-refresh').addEventListener('click', () => bonosCargar());

  // ---------- Ficha y alta (panel lateral) ----------
  let boModo = 'editar';        // 'editar' | 'crear'
  let boFichaId = null;         // id del bono abierto (null en un alta)
  let boFichaPeticion = 0;
  let boFicha = null;           // última respuesta de la ficha (catálogos incluidos)
  let boFormInicial = '';       // foto de los ajustes al abrir, para saber si hay cambios
  let boGuardando = false;
  let boClienteSel = null;      // alta: { id, nombre } del cliente elegido
  let boPickerTimer = null;
  let boPickerPeticion = 0;

  function boCampoEl(nombre) {
    return document.querySelector(`#bo-drawer-body [data-campo="${nombre}"]`);
  }

  function boMensaje(texto, tipo) {
    const el = document.getElementById('bo-form-msg');
    el.textContent = texto || '';
    el.className = 'cli-form-msg' + (tipo ? ' is-' + tipo : '');
  }

  function boMarcar(el) {
    document.querySelectorAll('#bo-drawer-body .cli-invalid').forEach(e => e.classList.remove('cli-invalid'));
    if (el) { el.classList.add('cli-invalid'); if (el.focus) el.focus(); }
  }

  function boDrawerAbierto() { return document.getElementById('bo-drawer').classList.contains('open'); }

  function boDrawerAbrir() {
    document.getElementById('bo-drawer').classList.add('open');
    document.getElementById('bo-drawer').setAttribute('aria-hidden', 'false');
    document.getElementById('bo-drawer-backdrop').classList.add('open');
  }

  // Valores editables de la ficha de un bono existente (null si el formulario no está pintado).
  function boValoresEditar() {
    const a = boCampoEl('sesiones_restantes');
    const b = boCampoEl('fecha_caducidad');
    return a && b ? { sesiones_restantes: a.value.trim(), fecha_caducidad: b.value } : null;
  }

  function boHayCambios() {
    if (!document.getElementById('bo-form-guardar')) return false;
    if (boModo === 'editar') {
      const v = boValoresEditar();
      return !!v && JSON.stringify(v) !== boFormInicial;
    }
    if (!boCampoEl('servicio_id')) return false;
    return !!boClienteSel || !!boCampoEl('servicio_id').value || !!boCampoEl('sesiones_usadas').value.trim()
      || document.querySelectorAll('#bo-fijas-nuevas .bo-fija').length > 0;
  }

  function boActualizarBotonGuardar() {
    const btn = document.getElementById('bo-form-guardar');
    btn.disabled = boGuardando || (boModo === 'editar' && !boHayCambios());
  }

  function boDrawerCerrar(forzar) {
    if (forzar !== true && boHayCambios() && !confirm('Hay cambios sin guardar. ¿Cerrar igualmente?')) return false;
    boFichaPeticion++;
    boFichaId = null;
    boFicha = null;
    document.getElementById('bo-drawer').classList.remove('open');
    document.getElementById('bo-drawer').setAttribute('aria-hidden', 'true');
    document.getElementById('bo-drawer-backdrop').classList.remove('open');
    document.getElementById('bo-drawer-foot').style.display = 'none';
    return true;
  }

  // Tipo de bono sobre el que se filtran las reservas fijas: { duracion_min, es_2pax, requiere_profesor }
  function boTipoActual() {
    if (!boFicha) return null;
    if (boModo === 'editar') return boFicha.bono || null;
    const sel = boCampoEl('servicio_id');
    if (!sel || !sel.value) return null;
    return (boFicha.servicios_bono || []).find(s => String(s.id) === sel.value) || null;
  }

  function boServiciosCompatibles(tipo) {
    if (!tipo || !boFicha) return [];
    return (boFicha.servicios_sesion || []).filter(s =>
      Number(s.duracion_min) === Number(tipo.duracion_min)
      && !!s.es_2pax === !!tipo.es_2pax
      && !!s.requiere_profesor === !!tipo.requiere_profesor);
  }

  function boHora(h) { return String(h || '').slice(0, 5); }

  // ----- Filas de reserva fija (alta y "añadir" en la ficha) -----
  function boFilaFijaHtml(botones) {
    const dias = BO_DIAS.map((d, i) => `<option value="${i + 1}">${d}</option>`).join('');
    return `
      <div class="bo-fija" data-fija>
        <select class="serv-input bo-fija-serv" data-f="servicio" aria-label="Servicio de la sesión"></select>
        <select class="serv-input" data-f="prof" aria-label="Profesional"></select>
        <select class="serv-input" data-f="dia" aria-label="Día de la semana">${dias}</select>
        <input type="time" class="serv-input" data-f="hora" aria-label="Hora de inicio">
        <div class="bo-fija-fin">${botones}</div>
      </div>`;
  }

  function boFilaProfesionales(fila) {
    const selS = fila.querySelector('[data-f="servicio"]');
    const selP = fila.querySelector('[data-f="prof"]');
    const previo = selP.value;
    const s = (boFicha.servicios_sesion || []).find(x => String(x.id) === selS.value);
    if (!s) { selP.innerHTML = '<option value="">—</option>'; selP.disabled = true; return; }
    if (!s.requiere_profesor) {
      selP.innerHTML = '<option value="">No necesita profesional</option>';
      selP.disabled = true;
      return;
    }
    const ids = (s.profesionales || []).map(Number);
    const lista = (boFicha.profesionales || []).filter(p => ids.includes(Number(p.id)));
    selP.disabled = false;
    selP.innerHTML = `<option value="">${lista.length ? '— Profesional —' : 'Nadie cualificado'}</option>`
      + lista.map(p => `<option value="${Number(p.id)}">${cliEsc(p.nombre)}</option>`).join('');
    if (lista.some(p => String(p.id) === previo)) selP.value = previo;
  }

  function boFilaRefrescar(fila) {
    const tipo = boTipoActual();
    const selS = fila.querySelector('[data-f="servicio"]');
    const previo = selS.value;
    const comp = boServiciosCompatibles(tipo);
    const vacio = !tipo ? 'Elige antes el tipo de bono' : (comp.length ? '— Servicio de la sesión —' : 'No hay servicios compatibles');
    selS.innerHTML = `<option value="">${vacio}</option>`
      + comp.map(s => `<option value="${Number(s.id)}">${cliEsc(s.nombre)}</option>`).join('');
    if (comp.some(s => String(s.id) === previo)) selS.value = previo;
    else if (comp.length === 1) selS.value = String(comp[0].id);
    boFilaProfesionales(fila);
  }

  function boLeerFila(fila) {
    const sid = fila.querySelector('[data-f="servicio"]').value;
    const pid = fila.querySelector('[data-f="prof"]').value;
    return {
      servicio_sesion_id: sid ? Number(sid) : null,
      profesional_id: pid ? Number(pid) : null,
      dia_semana: Number(fila.querySelector('[data-f="dia"]').value),
      hora_inicio: fila.querySelector('[data-f="hora"]').value
    };
  }

  // Devuelve { mensaje, el } con el primer problema de la fila, o null.
  function boValidarFila(fila, prefijo) {
    const d = boLeerFila(fila);
    if (d.servicio_sesion_id == null) return { mensaje: `${prefijo}elige el servicio de la sesión.`, el: fila.querySelector('[data-f="servicio"]') };
    const s = (boFicha.servicios_sesion || []).find(x => Number(x.id) === d.servicio_sesion_id);
    if (s && s.requiere_profesor && d.profesional_id == null) {
      return { mensaje: `${prefijo}elige el profesional.`, el: fila.querySelector('[data-f="prof"]') };
    }
    if (!/^\d{2}:\d{2}$/.test(d.hora_inicio)) return { mensaje: `${prefijo}indica la hora de inicio.`, el: fila.querySelector('[data-f="hora"]') };
    return null;
  }

  // ----- Ficha de un bono existente -----
  function boRenderCitas(citas) {
    if (!citas.length) return '<p class="cli-vacio">Todavía no hay citas asociadas a este bono.</p>';
    return `<ul class="bo-citas">${citas.map(c => {
      let marca = '<span class="bo-cita-marca is-pend">Pendiente</span>';
      if (c.estado === 'cancelada') marca = '<span class="bo-cita-marca is-cancel">No cuenta</span>';
      else if (c.sesion_descontada) marca = '<span class="bo-cita-marca is-desc">−1 sesión</span>';
      return `<li class="bo-cita">
        <div>${cliEsc(boFecha(c.fecha))} · ${cliEsc(boHora(c.hora_inicio))}
          <div class="bo-cita-det">${cliEsc(BO_ESTADOS_CITA[c.estado] || c.estado)}${c.profesional ? ' · ' + cliEsc(c.profesional) : ''}</div></div>
        ${marca}</li>`;
    }).join('')}</ul>`;
  }

  function boRenderFijas(fijas) {
    if (!fijas.length) return '<p class="cli-vacio">Sin reservas fijas.</p>';
    return `<ul class="bo-fijas-lista">${fijas.map(r => {
      const dia = BO_DIAS[Number(r.dia_semana) - 1] || '?';
      const desc = `${dia} ${boHora(r.hora_inicio)}`;
      return `<li class="bo-fija-item">
        <div>${cliEsc(dia)} · ${cliEsc(boHora(r.hora_inicio))}–${cliEsc(boHora(r.hora_fin))}
          <small>${cliEsc(r.servicio || '')}${r.profesional ? ' · ' + cliEsc(r.profesional) : ''}</small></div>
        <button type="button" class="cli-doc-btn cli-doc-btn-del" data-fija-quitar="${Number(r.id)}" data-fija-desc="${cliEsc(desc)}">Quitar</button>
      </li>`;
    }).join('')}</ul>`;
  }

  function boRenderEditar(f) {
    const b = f.bono;
    const c = f.cliente || {};
    const nombreCli = [c.nombre, c.apellidos].filter(Boolean).join(' ');
    let ayudaEstado = '';
    if (b.estado === 'caducado') ayudaEstado = 'Este bono ha caducado. Para reactivarlo, amplía la fecha de caducidad.';
    else if (b.estado === 'agotado') ayudaEstado = 'Este bono está agotado. Sube las sesiones restantes para reactivarlo.';
    else if (b.estado === 'anulado') ayudaEstado = 'Este bono está anulado: no se descuentan sesiones ni se avisa al cliente.';

    return `
      <section class="cli-sec">
        <h3>Resumen</h3>
        <div class="bo-resumen">
          <div class="bo-resumen-fila"><span>Cliente</span>
            <button type="button" class="bo-link" data-bo-ver-cliente="${Number(b.cliente_id)}">${cliEsc(nombreCli)}</button></div>
          <div class="bo-resumen-fila"><span>Bono</span><span>${cliEsc(b.servicio)}${b.es_2pax ? ' · 2 pax' : ''}</span></div>
          <div class="bo-resumen-fila"><span>Estado</span>${boPill(b.estado)}</div>
          <div class="bo-resumen-fila"><span>Inicio</span><span>${cliEsc(boFecha(b.fecha_inicio))}</span></div>
          <div class="bo-resumen-fila"><span>Sesiones totales</span><span>${Number(b.sesiones_totales)}</span></div>
        </div>
      </section>

      <section class="cli-sec">
        <h3>Ajustes</h3>
        <div class="cli-row2">
          ${cliCampo('Sesiones restantes', `<input type="number" class="serv-input" data-campo="sesiones_restantes" min="0" max="${Number(b.sesiones_totales)}" step="1" value="${Number(b.sesiones_restantes)}">`)}
          ${cliCampo('Fecha de caducidad', `<input type="date" class="serv-input" data-campo="fecha_caducidad" min="${cliEsc(String(b.fecha_inicio).slice(0, 10))}" value="${cliEsc(String(b.fecha_caducidad || '').slice(0, 10))}">`)}
        </div>
        <p class="bo-ayuda">Las sesiones se descuentan solas cuando pasa la hora de la cita. Aquí puedes corregirlas a mano (entre 0 y ${Number(b.sesiones_totales)}). Vaciar la fecha deja el bono sin caducidad; cambiarla (prórroga) vuelve a activar el aviso de caducidad al cliente.</p>
        ${ayudaEstado ? `<p class="bo-ayuda is-aviso">${cliEsc(ayudaEstado)}</p>` : ''}
        <div class="bo-acciones-sec">
          <button type="button" class="cli-btn-sec" data-bo-anular="${b.estado === 'anulado' ? 'reactivar' : 'anular'}">${b.estado === 'anulado' ? 'Reactivar bono' : 'Anular bono'}</button>
        </div>
      </section>

      <section class="cli-sec">
        <h3>Reservas fijas del cliente</h3>
        <p class="bo-ayuda">Bloquean ese hueco semanal para que el bot no se lo ofrezca a nadie más. No crean citas por sí solas.</p>
        <div id="bo-fijas-lista">${boRenderFijas(Array.isArray(f.reservas_fijas) ? f.reservas_fijas : [])}</div>
        <div id="bo-fija-nueva"></div>
        ${b.estado === 'anulado' ? '' : '<button type="button" class="cli-btn-sec bo-add-btn" id="bo-fija-add">+ Añadir reserva fija</button>'}
        <div style="height:6px"></div>
      </section>

      <section class="cli-sec">
        <h3>Citas de este bono</h3>
        ${boRenderCitas(Array.isArray(f.citas) ? f.citas : [])}
      </section>`;
  }

  // ----- Alta -----
  function boRenderClienteSel() {
    if (boClienteSel) {
      return `<div class="bo-cliente-elegido"><span>${cliEsc(boClienteSel.nombre)}</span>
        <button type="button" class="cli-doc-btn" data-bo-cambiar-cliente>Cambiar</button></div>`;
    }
    return `<div class="bo-picker">
        <input class="serv-input" data-campo="cliente_q" placeholder="Escribe nombre o teléfono (mín. 2 letras)" autocomplete="off" aria-label="Buscar cliente">
        <ul class="bo-picker-lista" id="bo-picker-lista" style="display:none;"></ul>
      </div>`;
  }

  function boRenderAlta(f) {
    const tipos = Array.isArray(f.servicios_bono) ? f.servicios_bono : [];
    const opciones = '<option value="">— Elige el tipo de bono —</option>'
      + tipos.map(t => `<option value="${Number(t.id)}">${cliEsc(t.nombre)} · ${Number(t.sesiones_bono)} sesiones</option>`).join('');
    return `
      <section class="cli-sec">
        <h3>Cliente</h3>
        <div class="config-field"><label>Cliente <span class="cli-req">*</span></label>
          <div id="bo-cliente-sel">${boRenderClienteSel()}</div></div>
        <p class="bo-ayuda">Solo clientes activos. Si el cliente no existe, créalo antes en Clientes.</p>
      </section>

      <section class="cli-sec">
        <h3>Bono</h3>
        ${cliCampo('Tipo de bono', `<select class="serv-input" data-campo="servicio_id">${opciones}</select>`, true)}
        <div class="cli-row2">
          ${cliCampo('Fecha de inicio', `<input type="date" class="serv-input" data-campo="fecha_inicio" value="${cliEsc(boHoyISO())}">`)}
          ${cliCampo('Sesiones ya usadas', `<input type="number" class="serv-input" data-campo="sesiones_usadas" min="0" step="1" placeholder="0">`)}
        </div>
        <p class="bo-ayuda" id="bo-preview"></p>
        <p class="bo-ayuda">La fecha de inicio puede ser anterior a hoy (por ejemplo, un bono que ya estaba en marcha). Las sesiones ya usadas son opcionales.</p>
      </section>

      <section class="cli-sec">
        <h3>Reservas fijas (opcional)</h3>
        <p class="bo-ayuda">Un hueco semanal que el bot no ofrecerá a nadie más. Puedes añadir varios. No crean citas por sí solas.</p>
        <div class="bo-fijas-nuevas" id="bo-fijas-nuevas"></div>
        <button type="button" class="cli-btn-sec bo-add-btn" id="bo-fija-add">+ Añadir reserva fija</button>
        <div style="height:6px"></div>
      </section>`;
  }

  function boActualizarPreview() {
    const el = document.getElementById('bo-preview');
    if (!el || !boCampoEl('servicio_id')) return;
    const t = boTipoActual();
    if (!t) { el.textContent = ''; el.className = 'bo-ayuda'; return; }
    const ini = boCampoEl('fecha_inicio').value || boHoyISO();
    const txt = boCampoEl('sesiones_usadas').value.trim();
    const usadas = /^\d+$/.test(txt) ? Number(txt) : 0;
    const partes = [`Quedarán ${Math.max(0, Number(t.sesiones_bono) - usadas)} de ${Number(t.sesiones_bono)} sesiones.`];
    let aviso = false;
    if (t.caducidad_meses == null) {
      partes.push('Este tipo de bono no tiene caducidad definida.');
    } else {
      const cad = boSumarMeses(ini, Number(t.caducidad_meses));
      if (cad && cad < boHoyISO()) {
        aviso = true;
        partes.push(`Con esa fecha de inicio el bono ya estaría caducado (caducaría el ${boFecha(cad)}).`);
      } else if (cad) {
        partes.push(`Caducará el ${boFecha(cad)}.`);
      }
    }
    el.textContent = partes.join(' ');
    el.className = 'bo-ayuda' + (aviso ? ' is-aviso' : '');
  }

  // Buscador de cliente del alta (solo activos).
  async function boBuscarClientes(texto) {
    const lista = document.getElementById('bo-picker-lista');
    if (!lista) return;
    const peticion = ++boPickerPeticion;
    if (texto.length < 2) { lista.style.display = 'none'; lista.innerHTML = ''; return; }
    try {
      const datos = await boGet(`${CLIENTES_API_URL}?q=${encodeURIComponent(texto)}&inactivos=0`);
      if (peticion !== boPickerPeticion || !document.getElementById('bo-picker-lista')) return;
      const filas = (Array.isArray(datos) ? datos : []).filter(c => c.activo !== false).slice(0, 8);
      lista.innerHTML = filas.length
        ? filas.map(c => {
          const nombre = [c.nombre, c.apellidos].filter(Boolean).join(' ');
          return `<li data-cli-id="${Number(c.id)}" data-cli-nombre="${cliEsc(nombre)}">${cliEsc(nombre)}<small>${cliEsc(cliFormatearTelefono(c.telefono))}</small></li>`;
        }).join('')
        : '<li class="is-vacio">Ningún cliente activo coincide.</li>';
      lista.style.display = '';
    } catch (err) {
      if (peticion !== boPickerPeticion) return;
      lista.innerHTML = '<li class="is-vacio">No se ha podido buscar. Inténtalo de nuevo.</li>';
      lista.style.display = '';
    }
  }

  function boElegirCliente(id, nombre) {
    boClienteSel = id ? { id: Number(id), nombre } : null;
    document.getElementById('bo-cliente-sel').innerHTML = boRenderClienteSel();
    boMarcar(null);
    boActualizarBotonGuardar();
    if (!boClienteSel) { const q = boCampoEl('cliente_q'); if (q) q.focus(); }
  }

  function boPrepararFormulario() {
    boFormInicial = boModo === 'editar' ? JSON.stringify(boValoresEditar()) : '';
    boMensaje('');
    document.getElementById('bo-form-guardar').textContent = boModo === 'crear' ? 'Crear bono' : 'Guardar cambios';
    document.getElementById('bo-drawer-foot').style.display = '';
    document.getElementById('bo-form-eliminar').style.display = boModo === 'editar' ? '' : 'none';
    boActualizarBotonGuardar();
  }

  // Carga la ficha (editar) o solo los catálogos (crear, id=0) y pinta el formulario.
  // op: { mensajeOk, cliente: {id, nombre} (alta con cliente ya elegido), forzar }
  async function boAbrirFicha(id, modo, op) {
    op = op || {};
    if (!op.forzar && boDrawerAbierto() && boHayCambios() && !confirm('Hay cambios sin guardar. ¿Abandonarlos?')) return;
    const cuerpo = document.getElementById('bo-drawer-body');
    const titulo = document.getElementById('bo-drawer-titulo');
    const peticion = ++boFichaPeticion;
    boModo = modo || 'editar';
    boFichaId = boModo === 'editar' ? Number(id) : null;
    boClienteSel = boModo === 'crear' && op.cliente ? op.cliente : null;
    boFicha = null;
    titulo.textContent = boModo === 'crear' ? 'Nuevo bono' : 'Bono';
    cuerpo.innerHTML = '<div class="deriv-status">Cargando…</div>';
    document.getElementById('bo-drawer-foot').style.display = 'none';
    boDrawerAbrir();

    try {
      const datos = await boGet(`${BONOS_FICHA_URL}?id=${boModo === 'crear' ? 0 : encodeURIComponent(id)}`);
      if (peticion !== boFichaPeticion) return;
      if (!datos || (boModo === 'editar' && !datos.bono)) {
        cuerpo.innerHTML = '<div class="deriv-status deriv-status-error">Este bono ya no existe.</div>';
        return;
      }
      boFicha = datos;
      if (boModo === 'editar') {
        titulo.textContent = `${datos.bono.servicio}`;
        cuerpo.innerHTML = boRenderEditar(datos);
      } else {
        cuerpo.innerHTML = boRenderAlta(datos);
      }
      boPrepararFormulario();
      if (op.mensajeOk) boMensaje(op.mensajeOk, 'ok');
      if (boModo === 'crear') {
        boActualizarPreview();
        const foco = boClienteSel ? boCampoEl('servicio_id') : boCampoEl('cliente_q');
        if (foco) foco.focus();
      }
    } catch (err) {
      if (peticion !== boFichaPeticion) return;
      cuerpo.innerHTML = '<div class="deriv-status deriv-status-error">No se ha podido cargar. '
        + '<button type="button" class="deriv-retry-btn" id="bo-ficha-retry">Reintentar</button></div>';
      document.getElementById('bo-ficha-retry').addEventListener('click', () => boAbrirFicha(id, boModo, { cliente: op.cliente, forzar: true }));
    }
  }

  // Vuelve a pedir la ficha y repinta solo la lista de reservas fijas (lo demás, con posibles
  // cambios sin guardar, no se toca).
  async function boRefrescarFijas() {
    const id = boFichaId;
    try {
      const datos = await boGet(`${BONOS_FICHA_URL}?id=${encodeURIComponent(id)}`);
      const cont = document.getElementById('bo-fijas-lista');
      if (datos && datos.bono && cont && boFichaId === id) {
        boFicha = datos;
        cont.innerHTML = boRenderFijas(Array.isArray(datos.reservas_fijas) ? datos.reservas_fijas : []);
      }
    } catch (err) {
      boMensaje('Guardado, pero no se ha podido actualizar la lista. Cierra y vuelve a abrir el bono.', 'error');
    }
  }

  function boAbrirFilaNueva() {
    const cont = boModo === 'crear' ? document.getElementById('bo-fijas-nuevas') : document.getElementById('bo-fija-nueva');
    if (!cont) return;
    if (boModo === 'crear') {
      if (cont.querySelectorAll('.bo-fija').length >= BO_MAX_RESERVAS) { boMensaje(`Máximo ${BO_MAX_RESERVAS} reservas fijas.`, 'error'); return; }
      if (!boTipoActual()) { boMensaje('Elige primero el tipo de bono.', 'error'); boMarcar(boCampoEl('servicio_id')); return; }
      cont.insertAdjacentHTML('beforeend', boFilaFijaHtml('<button type="button" class="cli-doc-btn cli-doc-btn-del" data-fila-quitar>Quitar</button>'));
      boFilaRefrescar(cont.lastElementChild);
    } else {
      if (cont.querySelector('.bo-fija')) return; // ya hay una abierta
      cont.innerHTML = boFilaFijaHtml('<button type="button" class="cli-btn-sec" data-fila-cancelar>Cancelar</button>'
        + '<button type="button" class="cli-btn-pri" data-fila-guardar>Guardar reserva fija</button>');
      boFilaRefrescar(cont.querySelector('.bo-fija'));
      document.getElementById('bo-fija-add').style.display = 'none';
    }
    boMensaje('');
    boActualizarBotonGuardar();
  }

  function boCerrarFilaNueva() {
    const cont = document.getElementById('bo-fija-nueva');
    if (cont) cont.innerHTML = '';
    const add = document.getElementById('bo-fija-add');
    if (add) add.style.display = '';
  }

  async function boGuardarFilaNueva() {
    if (boGuardando) return;
    const fila = document.querySelector('#bo-fija-nueva .bo-fija');
    if (!fila) return;
    const problema = boValidarFila(fila, '');
    if (problema) {
      boMensaje(problema.mensaje.charAt(0).toUpperCase() + problema.mensaje.slice(1), 'error');
      boMarcar(problema.el);
      return;
    }
    boMarcar(null);
    boGuardando = true;
    const btn = fila.querySelector('[data-fila-guardar]');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    boMensaje('');
    const id = boFichaId;
    try {
      const r = await boPost(BONOS_RESERVA_URL, Object.assign({ bono_id: id }, boLeerFila(fila)));
      if (boFichaId !== id) return;
      if (!r.ok) { boMensaje(r.mensaje || 'No se ha podido guardar la reserva fija.', 'error'); return; }
      boCerrarFilaNueva();
      await boRefrescarFijas();
      if (boFichaId === id) boMensaje('Reserva fija añadida.', 'ok');
    } catch (err) {
      boMensaje('No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      boGuardando = false;
      btn.disabled = false;
      btn.textContent = 'Guardar reserva fija';
      boActualizarBotonGuardar();
    }
  }

  async function boQuitarReserva(idReserva, desc) {
    if (boGuardando) return;
    if (!confirm(`¿Quitar la reserva fija de ${desc}?\n\nEl hueco dejará de estar bloqueado para el bot. No se cambia ninguna cita ya creada.`)) return;
    boGuardando = true;
    boMensaje('');
    const id = boFichaId;
    try {
      const r = await boPost(BONOS_RESERVA_QUITAR_URL, { id: idReserva });
      if (boFichaId !== id) return;
      if (!r.ok && r.error !== 'no_existe') { boMensaje(r.mensaje || 'No se ha podido quitar.', 'error'); return; }
      await boRefrescarFijas();
      if (boFichaId === id) boMensaje('Reserva fija quitada.', 'ok');
    } catch (err) {
      boMensaje('No se ha podido quitar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      boGuardando = false;
      boActualizarBotonGuardar();
    }
  }

  async function boAnular(accion) {
    if (boGuardando || boModo !== 'editar') return;
    if (boHayCambios()) { boMensaje('Guarda o descarta los cambios de sesiones y caducidad antes de continuar.', 'error'); return; }
    if (accion === 'anular' && !confirm('¿Anular este bono?\n\nDejará de contar: no se descontarán más sesiones ni se avisará al cliente. Podrás reactivarlo cuando quieras.')) return;
    boGuardando = true;
    boMensaje('');
    const id = boFichaId;
    try {
      const r = await boPost(BONOS_ACTUALIZAR_URL, { id, anulado: accion === 'anular' });
      if (boFichaId !== id) return;
      if (!r.ok) { boMensaje(r.mensaje || 'No se ha podido guardar.', 'error'); return; }
      boGuardando = false;
      bonosCargar(true);
      await boAbrirFicha(id, 'editar', { forzar: true, mensajeOk: accion === 'anular' ? 'Bono anulado.' : 'Bono reactivado.' });
    } catch (err) {
      boMensaje('No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      boGuardando = false;
      boActualizarBotonGuardar();
    }
  }

  // ----- Guardar (alta o ajustes) -----
  const BO_ERRORES_RESERVA = ['hueco_ocupado', 'reserva_duplicada', 'profesional_invalido', 'profesional_obligatorio',
    'profesional_no_cualificado', 'profesional_excluido', 'profesional_no_apto', 'dia_invalido', 'hora_invalida',
    'servicio_sesion_invalido', 'duracion_no_coincide', 'tipo_no_coincide'];
  const BO_ERROR_CAMPO = {
    cliente_invalido: 'cliente_q', cliente_inactivo: 'cliente_q', servicio_invalido: 'servicio_id',
    fecha_invalida: 'fecha_inicio', bono_ya_caducado: 'fecha_inicio', sesiones_usadas_invalidas: 'sesiones_usadas',
    sesiones_invalidas: 'sesiones_restantes'
  };

  function boMarcarError(codigo) {
    if (BO_ERRORES_RESERVA.includes(codigo)) {
      document.querySelectorAll('#bo-drawer-body .bo-fija .serv-input').forEach(e => e.classList.add('cli-invalid'));
      return;
    }
    let nombre = BO_ERROR_CAMPO[codigo];
    if (nombre === 'fecha_inicio' && boModo === 'editar') nombre = 'fecha_caducidad';
    const el = nombre ? boCampoEl(nombre) : null;
    // Con cliente ya elegido no hay campo de búsqueda: se marca la caja del cliente.
    boMarcar(el || (nombre === 'cliente_q' ? document.querySelector('#bo-cliente-sel > *') : null));
  }

  async function boGuardarAlta() {
    const t = boTipoActual();
    if (!boClienteSel) { boMensaje('Elige el cliente del bono.', 'error'); boMarcar(boCampoEl('cliente_q')); return; }
    if (!t) { boMensaje('Elige el tipo de bono.', 'error'); boMarcar(boCampoEl('servicio_id')); return; }
    const inicio = boCampoEl('fecha_inicio').value;
    if (!inicio) { boMensaje('Indica la fecha de inicio.', 'error'); boMarcar(boCampoEl('fecha_inicio')); return; }
    const txtUsadas = boCampoEl('sesiones_usadas').value.trim();
    if (txtUsadas !== '' && (!/^\d+$/.test(txtUsadas) || Number(txtUsadas) >= Number(t.sesiones_bono))) {
      boMensaje(`Las sesiones ya usadas deben estar entre 0 y ${Number(t.sesiones_bono) - 1}.`, 'error');
      boMarcar(boCampoEl('sesiones_usadas'));
      return;
    }
    const filas = Array.from(document.querySelectorAll('#bo-fijas-nuevas .bo-fija'));
    for (let i = 0; i < filas.length; i++) {
      const p = boValidarFila(filas[i], filas.length > 1 ? `Reserva fija ${i + 1}: ` : 'Reserva fija: ');
      if (p) { boMensaje(p.mensaje, 'error'); boMarcar(p.el); return; }
    }
    boMarcar(null);
    const cuerpo = {
      cliente_id: boClienteSel.id,
      servicio_id: Number(t.id),
      fecha_inicio: inicio,
      sesiones_usadas: txtUsadas === '' ? 0 : Number(txtUsadas),
      reservas_fijas: filas.map(boLeerFila)
    };

    boGuardando = true;
    const btn = document.getElementById('bo-form-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    boMensaje('');
    try {
      const r = await boPost(BONOS_ALTA_URL, cuerpo);
      if (!r.ok) {
        boMensaje(r.mensaje || 'No se ha podido guardar.', 'error');
        boMarcarError(r.error);
        return;
      }
      boGuardando = false;
      bonosCargar(true);
      const vinc = Number(r.citas_vinculadas) || 0;
      const extra = vinc > 0 ? ` Se ${vinc === 1 ? 'ha vinculado 1 cita' : `han vinculado ${vinc} citas`} ya reservada${vinc === 1 ? '' : 's'}.` : '';
      await boAbrirFicha(r.id, 'editar', { forzar: true, mensajeOk: 'Bono creado.' + extra });
    } catch (err) {
      boMensaje('No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      boGuardando = false;
      btn.textContent = boModo === 'crear' ? 'Crear bono' : 'Guardar cambios';
      boActualizarBotonGuardar();
    }
  }

  async function boGuardarAjustes() {
    const v = boValoresEditar();
    const inicial = JSON.parse(boFormInicial);
    const b = boFicha.bono;
    const cuerpo = { id: boFichaId };
    if (v.sesiones_restantes !== inicial.sesiones_restantes) {
      if (!/^\d+$/.test(v.sesiones_restantes) || Number(v.sesiones_restantes) > Number(b.sesiones_totales)) {
        boMensaje(`Las sesiones restantes deben estar entre 0 y ${Number(b.sesiones_totales)}.`, 'error');
        boMarcar(boCampoEl('sesiones_restantes'));
        return;
      }
      cuerpo.sesiones_restantes = Number(v.sesiones_restantes);
    }
    if (v.fecha_caducidad !== inicial.fecha_caducidad) {
      if (v.fecha_caducidad && v.fecha_caducidad < String(b.fecha_inicio).slice(0, 10)) {
        boMensaje('La caducidad no puede ser anterior al inicio del bono.', 'error');
        boMarcar(boCampoEl('fecha_caducidad'));
        return;
      }
      cuerpo.fecha_caducidad = v.fecha_caducidad; // '' = sin caducidad
    }
    boMarcar(null);
    boGuardando = true;
    const btn = document.getElementById('bo-form-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    boMensaje('');
    const id = boFichaId;
    try {
      const r = await boPost(BONOS_ACTUALIZAR_URL, cuerpo);
      if (boFichaId !== id) return;
      if (!r.ok) {
        boMensaje(r.mensaje || 'No se ha podido guardar.', 'error');
        boMarcarError(r.error);
        return;
      }
      boGuardando = false;
      bonosCargar(true);
      await boAbrirFicha(id, 'editar', { forzar: true, mensajeOk: 'Cambios guardados.' });
    } catch (err) {
      boMensaje('No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      boGuardando = false;
      btn.textContent = boModo === 'crear' ? 'Crear bono' : 'Guardar cambios';
      boActualizarBotonGuardar();
    }
  }

  function boGuardar() {
    if (boGuardando) return;
    if (boModo === 'crear') boGuardarAlta(); else boGuardarAjustes();
  }

  async function boEliminar() {
    if (boGuardando || boModo !== 'editar' || boFichaId == null) return;
    if (!confirm('¿Eliminar este bono definitivamente?\n\nSolo se puede eliminar si todavía no tiene citas asociadas; si las tiene, anúlalo en su lugar. Esta acción no se puede deshacer.')) return;
    const btn = document.getElementById('bo-form-eliminar');
    boGuardando = true;
    btn.disabled = true;
    btn.textContent = 'Eliminando…';
    boMensaje('');
    const id = boFichaId;
    try {
      const r = await boPost(BONOS_ELIMINAR_URL, { id });
      if (boFichaId !== id) return;
      if (!r.ok) {
        boMensaje(r.mensaje || 'No se ha podido eliminar.', 'error');
        if (r.error === 'no_existe') bonosCargar(true);
        return;
      }
      boDrawerCerrar(true);
      bonosCargar(true);
    } catch (err) {
      boMensaje('No se ha podido eliminar. Revisa la conexión e inténtalo de nuevo.', 'error');
    } finally {
      boGuardando = false;
      btn.disabled = false;
      btn.textContent = 'Eliminar bono';
      boActualizarBotonGuardar();
    }
  }

  // ----- Enlaces con la ficha de cliente -----
  function boIrAVista() {
    const nav = document.querySelector('.nav-item[data-view="bonos"]');
    if (nav && !document.getElementById('view-bonos').classList.contains('active')) nav.click();
    else bonosCargar(true);
  }

  // Abre un bono desde fuera de la pantalla Bonos (p. ej. desde la ficha de cliente).
  function bonoAbrirDesdeCliente(idBono) {
    if (cliDrawerCerrar() === false) return;
    boIrAVista();
    boAbrirFicha(idBono, 'editar');
  }

  function bonoNuevoParaCliente(idCliente, nombre) {
    if (cliDrawerCerrar() === false) return;
    boIrAVista();
    boAbrirFicha(0, 'crear', { cliente: { id: Number(idCliente), nombre } });
  }

  // ----- Eventos del panel -----
  document.getElementById('bonos-list').addEventListener('click', (e) => {
    const fila = e.target.closest('tr[data-id]');
    if (fila) boAbrirFicha(fila.dataset.id, 'editar');
  });
  document.getElementById('bonos-nuevo').addEventListener('click', () => boAbrirFicha(0, 'crear'));
  document.getElementById('bo-drawer-cerrar').addEventListener('click', () => boDrawerCerrar());
  document.getElementById('bo-form-cancelar').addEventListener('click', () => boDrawerCerrar());
  document.getElementById('bo-drawer-backdrop').addEventListener('click', () => boDrawerCerrar());
  document.getElementById('bo-form-guardar').addEventListener('click', boGuardar);
  document.getElementById('bo-form-eliminar').addEventListener('click', boEliminar);
  // En fase de captura: se decide antes de que el handler de la ficha de cliente cierre su panel,
  // así un Escape cierra solo el panel que está por encima.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && boDrawerAbierto() && !document.getElementById('cli-drawer').classList.contains('open')) boDrawerCerrar();
  }, true);
  document.addEventListener('click', (e) => {
    // El desplegable de clientes se cierra al pulsar fuera.
    const lista = document.getElementById('bo-picker-lista');
    if (lista && !e.target.closest('.bo-picker')) lista.style.display = 'none';
  });

  const boCuerpo = document.getElementById('bo-drawer-body');
  boCuerpo.addEventListener('click', (e) => {
    const verCli = e.target.closest('[data-bo-ver-cliente]');
    if (verCli) { cliAbrirFicha(Number(verCli.dataset.boVerCliente), 'editar'); return; }
    const anular = e.target.closest('[data-bo-anular]');
    if (anular) { boAnular(anular.dataset.boAnular); return; }
    if (e.target.closest('#bo-fija-add')) { boAbrirFilaNueva(); return; }
    const quitarFila = e.target.closest('[data-fila-quitar]');
    if (quitarFila) { quitarFila.closest('.bo-fija').remove(); boActualizarBotonGuardar(); return; }
    if (e.target.closest('[data-fila-cancelar]')) { boCerrarFilaNueva(); return; }
    if (e.target.closest('[data-fila-guardar]')) { boGuardarFilaNueva(); return; }
    const quitarRes = e.target.closest('[data-fija-quitar]');
    if (quitarRes) { boQuitarReserva(Number(quitarRes.dataset.fijaQuitar), quitarRes.dataset.fijaDesc); return; }
    const cambiar = e.target.closest('[data-bo-cambiar-cliente]');
    if (cambiar) { boElegirCliente(null); return; }
    const opcion = e.target.closest('#bo-picker-lista li[data-cli-id]');
    if (opcion) boElegirCliente(opcion.dataset.cliId, opcion.dataset.cliNombre);
  });
  boCuerpo.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-campo="cliente_q"]')) {
      clearTimeout(boPickerTimer);
      const texto = t.value.trim();
      boPickerTimer = setTimeout(() => boBuscarClientes(texto), 250);
    }
    if (t.matches('[data-campo="fecha_inicio"], [data-campo="sesiones_usadas"]')) boActualizarPreview();
    if (t.classList && t.classList.contains('cli-invalid')) t.classList.remove('cli-invalid');
    if (boModo === 'editar') boActualizarBotonGuardar();
  });
  boCuerpo.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-campo="servicio_id"]')) {
      boActualizarPreview();
      document.querySelectorAll('#bo-fijas-nuevas .bo-fija').forEach(boFilaRefrescar);
    }
    if (t.matches('[data-f="servicio"]')) boFilaProfesionales(t.closest('.bo-fija'));
    if (t.classList && t.classList.contains('cli-invalid')) t.classList.remove('cli-invalid');
    if (boModo === 'editar') boActualizarBotonGuardar();
  });
  boCuerpo.addEventListener('keydown', (e) => {
    // Enter en el buscador elige el primer resultado.
    if (e.key === 'Enter' && e.target.matches('[data-campo="cliente_q"]')) {
      e.preventDefault();
      const primero = document.querySelector('#bo-picker-lista li[data-cli-id]');
      if (primero) boElegirCliente(primero.dataset.cliId, primero.dataset.cliNombre);
    }
  });

  // Sección «Bonos» de la ficha de cliente (solo lectura + atajos). La llama cliRenderFormulario.
  function cliRenderBonos(bonos, clienteActivo) {
    const lista = bonos.length
      ? `<ul class="cli-bonos">${bonos.map(b => {
        const cad = b.fecha_caducidad ? `caduca el ${boFecha(b.fecha_caducidad)}` : 'sin caducidad';
        return `<li class="cli-bono">
          <div><strong>${cliEsc(b.servicio)}</strong>
            <small>${Number(b.sesiones_restantes)} de ${Number(b.sesiones_totales)} sesiones · ${cliEsc(cad)}</small></div>
          <div class="cli-doc-acciones">${boPill(b.estado)}
            <button type="button" class="cli-doc-btn" data-bono-ver="${Number(b.id)}">Ver</button></div>
        </li>`;
      }).join('')}</ul>`
      : '<p class="cli-vacio">Este cliente no tiene bonos.</p>';
    const nuevo = clienteActivo
      ? '<div class="cli-bonos-acciones"><button type="button" class="cli-btn-sec" data-bono-nuevo>+ Nuevo bono</button></div>'
      : '<p class="cli-vacio">Un cliente inactivo no puede tener bonos nuevos.</p>';
    return `
      <section class="cli-sec">
        <h3>Bonos</h3>
        ${lista}
        ${nuevo}
      </section>`;
  }

  cliCuerpo.addEventListener('click', (e) => {
    const ver = e.target.closest('[data-bono-ver]');
    if (ver) { bonoAbrirDesdeCliente(Number(ver.dataset.bonoVer)); return; }
    if (e.target.closest('[data-bono-nuevo]') && cliFichaId != null) {
      bonoNuevoParaCliente(cliFichaId, document.getElementById('cli-drawer-titulo').textContent);
    }
  });

  // ============================================================
  // COBROS — pagos, totales por método y pendientes (workflow n8n `CRM COBROS`)
  // ============================================================
  // Contrato (todas llevan Header: Authorization: Bearer <token>; las POST, Content-Type JSON):
  //   GET  panel-cobros?q=&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&metodo=efectivo|transferencia|bizum&ver=vigentes|todos
  //        -> { ok: true, desde, hasta, totales: { total, n, efectivo, transferencia, bizum },
  //             pagos: [{ id, fecha, importe, metodo, notas|null, anulado, anulado_motivo|null,
  //                       cliente_id, cliente_nombre, cliente_apellidos|null, cliente_telefono,
  //                       concepto: 'bono'|'sesion'|'penalizacion', concepto_texto }] }
  //           | { ok: false, error, mensaje }.   Los anulados no cuentan en los totales. Sin fechas: el mes en curso.
  //   GET  panel-cobros-pendientes
  //        -> { ok: true, total_pendiente, penalizaciones_sin_importe,
  //             bonos:          [{ bono_id, cliente_*, servicio, es_2pax, fecha_inicio, estado, precio|null,
  //                                precio_personalizado, pagado, pendiente|null, sin_precio }],
  //             sesiones:       [{ cita_id, cliente_*, servicio, fecha (también pasadas), hora_inicio, estado_cita, precio|null,
  //                                precio_personalizado, pagado, pendiente|null, sin_precio }],
  //             penalizaciones: [{ penalizacion_id, cliente_*, porcentaje, cita_id, fecha_cita, hora_cita, servicio,
  //                                precio, pagado, pendiente }],
  //             gratuitos:      [{ tipo: 'bono'|'cita', id, cliente_*, concepto_texto }] }
  //   POST panel-cobros-pago     body { bono_id | cita_id | penalizacion_id, importe, metodo, fecha?, notas? }
  //                              -> { ok: true, id, pendiente } | { ok: false, error, mensaje }
  //   POST panel-cobros-anular   body { id, motivo }              -> { ok: true, id } | { ok: false, error, mensaje }
  //   POST panel-cobros-ajustar  body { tipo: 'bono'|'cita', id, precio? ('' = el del catálogo), gratis? (true|false) }
  //                              -> { ok: true, id } | { ok: false, error, mensaje }
  //   Ficha de cliente: panel-clientes-ficha devuelve además `pagos`: { pagado_total, pendiente_total,
  //        pagos: [{ id, fecha, importe, metodo, notas|null, anulado, anulado_motivo|null, concepto, concepto_texto }] }
  //   `mensaje` es apto para enseñar tal cual.
  const COBROS_API_URL = 'https://n8n.gorekia.com/webhook/panel-cobros';
  const COBROS_PEND_URL = 'https://n8n.gorekia.com/webhook/panel-cobros-pendientes';
  const COBROS_PAGO_URL = 'https://n8n.gorekia.com/webhook/panel-cobros-pago';
  const COBROS_ANULAR_URL = 'https://n8n.gorekia.com/webhook/panel-cobros-anular';
  const COBROS_AJUSTAR_URL = 'https://n8n.gorekia.com/webhook/panel-cobros-ajustar';

  const CB_METODOS = { efectivo: 'Efectivo', transferencia: 'Transferencia', bizum: 'Bizum' };
  const CB_CONCEPTOS = { bono: 'Bono', sesion: 'Sesión', penalizacion: 'Penalización' };
  const cbFormato = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  function cbEur(n) { return cbFormato.format(Number(n) || 0); }
  // 45 -> '45,00' (para rellenar el campo de importe)
  function cbNum(n) { return (Math.round(Number(n) * 100) / 100).toFixed(2).replace('.', ','); }
  function cbNombre(x) { return [x.cliente_nombre, x.cliente_apellidos].filter(Boolean).join(' '); }

  let cbTab = 'pagos';          // 'pagos' | 'pendientes'
  let cbPagos = null;           // última respuesta de panel-cobros
  let cbPend = null;            // última respuesta de panel-cobros-pendientes
  let cbBusqueda = '';
  let cbPeticion = 0;
  let cbTimer = null;

  function cbPrimerYUltimoDiaMes() {
    const hoy = new Date();
    return [agendaFormatearISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
            agendaFormatearISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))];
  }
  (function cbIniciarFechas() {
    const [d, h] = cbPrimerYUltimoDiaMes();
    document.getElementById('cobros-desde').value = d;
    document.getElementById('cobros-hasta').value = h;
  })();

  function cbEstado(modo, texto) { // 'loading' | 'error' | 'ok'
    document.getElementById('cobros-loading').style.display = modo === 'loading' ? 'block' : 'none';
    const err = document.getElementById('cobros-error');
    err.style.display = modo === 'error' ? 'block' : 'none';
    if (modo === 'error') document.getElementById('cobros-error-texto').textContent = texto || 'No se ha podido conectar con el servidor.';
    const verPagos = modo === 'ok' && cbTab === 'pagos';
    const verPend = modo === 'ok' && cbTab === 'pendientes';
    document.getElementById('cobros-pagos-panel').style.display = cbTab === 'pagos' && modo !== 'loading' && modo !== 'error' ? '' : 'none';
    document.getElementById('cobros-pend-panel').style.display = verPend ? '' : 'none';
    if (!verPagos) document.getElementById('cobros-count').textContent = '';
  }

  // ---------- Pestaña Pagos ----------
  function cbRenderPagos() {
    const d = cbPagos;
    const t = d.totales || {};
    document.getElementById('cobros-totales').innerHTML = `
      <div class="cb-total is-principal"><span>Total cobrado</span><strong>${cbEur(t.total)}</strong></div>
      <div class="cb-total"><span>Efectivo</span><strong>${cbEur(t.efectivo)}</strong></div>
      <div class="cb-total"><span>Transferencia</span><strong>${cbEur(t.transferencia)}</strong></div>
      <div class="cb-total"><span>Bizum</span><strong>${cbEur(t.bizum)}</strong></div>
      <div class="cb-total"><span>Nº de pagos</span><strong>${Number(t.n) || 0}</strong></div>`;
    const pagos = Array.isArray(d.pagos) ? d.pagos : [];
    const empty = document.getElementById('cobros-pagos-empty');
    const tabla = document.getElementById('cobros-pagos-table');
    document.getElementById('cobros-count').textContent = pagos.length === 500 ? '500+ pagos (acota el periodo)' : (pagos.length === 1 ? '1 pago' : `${pagos.length} pagos`);
    if (!pagos.length) {
      tabla.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    document.getElementById('cobros-pagos-list').innerHTML = pagos.map(p => {
      const sub = p.anulado
        ? `<span class="cb-sub">Anulado: ${cliEsc(p.anulado_motivo || '')}</span>`
        : (p.notas ? `<span class="cb-sub">${cliEsc(p.notas)}</span>` : '');
      return `<tr class="${p.anulado ? 'cb-anulado' : ''}">
        <td>${cliEsc(boFecha(p.fecha))}</td>
        <td class="cli-nombre"><button type="button" class="cb-link" data-cb-cliente="${Number(p.cliente_id)}">${cliEsc(cbNombre(p))}</button>
          <span class="bo-cliente-tel">${cliEsc(cliFormatearTelefono(p.cliente_telefono))}</span></td>
        <td>${cliEsc(p.concepto_texto || CB_CONCEPTOS[p.concepto] || '')}<span class="cb-sub">${cliEsc(CB_CONCEPTOS[p.concepto] || '')}</span>${sub}</td>
        <td>${cliEsc(CB_METODOS[p.metodo] || p.metodo)}</td>
        <td class="cb-num"><strong>${cbEur(p.importe)}</strong></td>
        <td>${p.anulado ? '<span class="cb-pill">Anulado</span>'
          : `<div class="cb-acciones"><button type="button" class="cb-btn" data-cb-anular="${Number(p.id)}">Anular</button></div>`}</td>
      </tr>`;
    }).join('');
    tabla.style.display = '';
  }

  async function cbCargarPagos(silencioso) {
    const peticion = ++cbPeticion;
    const refresh = document.getElementById('cobros-refresh');
    refresh.classList.add('spinning');
    if (!silencioso) cbEstado('loading');
    const par = new URLSearchParams();
    par.set('q', cbBusqueda);
    const desde = document.getElementById('cobros-desde').value;
    const hasta = document.getElementById('cobros-hasta').value;
    if (desde) par.set('desde', desde);
    if (hasta) par.set('hasta', hasta);
    par.set('metodo', document.getElementById('cobros-metodo').value);
    par.set('ver', document.getElementById('cobros-anulados').checked ? 'todos' : 'vigentes');
    try {
      const datos = await boGet(`${COBROS_API_URL}?${par.toString()}`);
      if (peticion !== cbPeticion) return;
      if (!datos || datos.ok !== true) {
        cbEstado('error', (datos && datos.mensaje) || 'No se han podido cargar los pagos.');
        return;
      }
      cbPagos = datos;
      cbEstado('ok');
      cbRenderPagos();
    } catch (err) {
      if (peticion !== cbPeticion) return;
      cbEstado('error');
    } finally {
      if (peticion === cbPeticion) refresh.classList.remove('spinning');
    }
  }

  // ---------- Pestaña Pendientes ----------
  function cbCoincide(x) {
    if (!cbBusqueda) return true;
    const q = cbBusqueda.toLowerCase();
    const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const digitos = cbBusqueda.replace(/\D/g, '');
    return norm(cbNombre(x)).includes(norm(q)) || (digitos.length >= 3 && String(x.cliente_telefono || '').includes(digitos));
  }

  function cbCeldaPrecio(x) {
    return x.sin_precio
      ? '<span class="cb-pill is-consultar">Consultar</span>'
      : `${cbEur(x.precio)}${x.precio_personalizado ? '<span class="cb-pill is-custom">Personalizado</span>' : ''}`;
  }
  function cbCeldaPendiente(x) {
    return x.sin_precio ? '<span class="cb-sub">sin precio</span>' : `<strong>${cbEur(x.pendiente)}</strong>`;
  }
  function cbClienteCelda(x) {
    return `<td class="cli-nombre"><button type="button" class="cb-link" data-cb-cliente="${Number(x.cliente_id)}">${cliEsc(cbNombre(x))}</button>
      <span class="bo-cliente-tel">${cliEsc(cliFormatearTelefono(x.cliente_telefono))}</span></td>`;
  }
  function cbTabla(titulo, cab, filas) {
    return `<div class="cb-seccion"><h3>${cliEsc(titulo)} (${filas.length})</h3>
      <div class="serv-table-wrap"><table class="serv-table">
        <thead><tr>${cab.map((c, i) => `<th${c.num ? ' class="cb-num"' : ''}>${cliEsc(c.t)}</th>`).join('')}</tr></thead>
        <tbody>${filas.join('')}</tbody></table></div></div>`;
  }

  function cbRenderPendientes() {
    const d = cbPend;
    const bonos = (d.bonos || []).filter(cbCoincide);
    const sesiones = (d.sesiones || []).filter(cbCoincide);
    const pens = (d.penalizaciones || []).filter(cbCoincide);
    const grat = (d.gratuitos || []).filter(cbCoincide);
    const sinImporte = Number(d.penalizaciones_sin_importe) || 0;

    document.getElementById('cobros-pend-resumen').innerHTML = `
      <div class="cb-total is-principal"><span>Total pendiente (con precio)</span><strong>${cbEur(d.total_pendiente)}</strong></div>
      <div class="cb-total"><span>Bonos</span><strong>${(d.bonos || []).length}</strong></div>
      <div class="cb-total"><span>Sesiones sueltas</span><strong>${(d.sesiones || []).length}</strong></div>
      <div class="cb-total"><span>Penalizaciones</span><strong>${(d.penalizaciones || []).length}</strong></div>`;
    document.getElementById('cobros-pend-avisos').innerHTML = sinImporte
      ? `<div class="cb-aviso">${sinImporte === 1 ? 'Hay 1 penalización' : `Hay ${sinImporte} penalizaciones`} sin importe. No se pueden cobrar hasta que se fije el importe (o se condone) en «Cancelaciones y Modificaciones». <button type="button" class="cb-link cb-link-aviso" data-cb-ir-pen>Ir a fijarlos</button></div>` : '';

    const total = bonos.length + sesiones.length + pens.length;
    const vacio = document.getElementById('cobros-pend-empty');
    if (!total && !grat.length) {
      vacio.style.display = 'block';
      document.getElementById('cobros-pend-empty-titulo').textContent = cbBusqueda ? 'Sin resultados' : 'Todo al día';
      document.getElementById('cobros-pend-empty-texto').textContent = cbBusqueda
        ? `No hay pendientes que coincidan con «${cbBusqueda}».` : 'No hay nada pendiente de cobro.';
    } else vacio.style.display = 'none';
    document.getElementById('cobros-count').textContent = total === 1 ? '1 pendiente' : `${total} pendientes`;

    const acc = (tipo, id, x) => `<div class="cb-acciones">
      ${x.sin_precio ? '' : `<button type="button" class="cb-btn is-pri" data-cb-cobrar="${tipo}:${id}">Cobrar</button>`}
      <button type="button" class="cb-btn" data-cb-precio="${tipo}:${id}">${x.sin_precio ? 'Fijar precio' : 'Precio'}</button>
      <button type="button" class="cb-btn" data-cb-gratis="${tipo}:${id}">Gratis</button></div>`;
    let html = '';
    if (bonos.length) {
      html += cbTabla('Bonos', [{ t: 'Cliente' }, { t: 'Bono' }, { t: 'Precio', num: true }, { t: 'Pagado', num: true }, { t: 'Pendiente', num: true }, { t: '' }],
        bonos.map(b => `<tr data-bono="${Number(b.bono_id)}">${cbClienteCelda(b)}
          <td class="bo-tipo">${cliEsc(b.servicio)}${b.es_2pax ? '<span class="badge badge-manual">2 pax</span>' : ''}<span class="cb-sub">Desde ${cliEsc(boFecha(b.fecha_inicio))} · ${cliEsc(BO_ESTADOS[b.estado] || b.estado)}</span></td>
          <td class="cb-num">${cbCeldaPrecio(b)}</td><td class="cb-num">${cbEur(b.pagado)}</td><td class="cb-num">${cbCeldaPendiente(b)}</td>
          <td>${acc('bono', Number(b.bono_id), b)}</td></tr>`));
    }
    if (sesiones.length) {
      html += cbTabla('Sesiones sueltas', [{ t: 'Cliente' }, { t: 'Sesión' }, { t: 'Precio', num: true }, { t: 'Pagado', num: true }, { t: 'Pendiente', num: true }, { t: '' }],
        sesiones.map(s => `<tr>${cbClienteCelda(s)}
          <td class="bo-tipo">${cliEsc(s.servicio)}<span class="cb-sub">${cliEsc(boFecha(s.fecha))} · ${cliEsc(String(s.hora_inicio || '').slice(0, 5))}${String(s.fecha).slice(0, 10) < boHoyISO() ? ' · <span class="bo-aviso">ya pasada</span>' : ''}</span></td>
          <td class="cb-num">${cbCeldaPrecio(s)}</td><td class="cb-num">${cbEur(s.pagado)}</td><td class="cb-num">${cbCeldaPendiente(s)}</td>
          <td>${acc('cita', Number(s.cita_id), s)}</td></tr>`));
    }
    if (pens.length) {
      html += cbTabla('Penalizaciones', [{ t: 'Cliente' }, { t: 'Cita' }, { t: 'Importe', num: true }, { t: 'Pagado', num: true }, { t: 'Pendiente', num: true }, { t: '' }],
        pens.map(p => `<tr>${cbClienteCelda(p)}
          <td class="bo-tipo">Penalización ${Number(p.porcentaje)}%<span class="cb-sub">${p.fecha_cita ? `${cliEsc(p.servicio || '')} · ${cliEsc(boFecha(p.fecha_cita))} ${cliEsc(String(p.hora_cita || '').slice(0, 5))}` : ''}</span></td>
          <td class="cb-num">${cbEur(p.precio)}</td><td class="cb-num">${cbEur(p.pagado)}</td><td class="cb-num"><strong>${cbEur(p.pendiente)}</strong></td>
          <td><div class="cb-acciones"><button type="button" class="cb-btn is-pri" data-cb-cobrar="pen:${Number(p.penalizacion_id)}">Cobrar</button></div></td></tr>`));
    }
    if (grat.length) {
      html += cbTabla('Marcados como gratuitos', [{ t: 'Cliente' }, { t: 'Concepto' }, { t: '' }],
        grat.map(g => `<tr>${cbClienteCelda(g)}<td>${cliEsc(g.concepto_texto)}<span class="cb-sub">${g.tipo === 'bono' ? 'Bono' : 'Sesión'}</span></td>
          <td><div class="cb-acciones"><button type="button" class="cb-btn" data-cb-quitar-gratis="${g.tipo}:${Number(g.id)}">Quitar «gratis»</button></div></td></tr>`));
    }
    document.getElementById('cobros-pend-secciones').innerHTML = html;
  }

  async function cbCargarPendientes(silencioso) {
    const peticion = ++cbPeticion;
    const refresh = document.getElementById('cobros-refresh');
    refresh.classList.add('spinning');
    if (!silencioso) cbEstado('loading');
    try {
      const datos = await boGet(COBROS_PEND_URL);
      if (peticion !== cbPeticion) return;
      if (!datos || datos.ok !== true) {
        cbEstado('error', (datos && datos.mensaje) || 'No se han podido cargar los pendientes.');
        return;
      }
      cbPend = datos;
      cbEstado('ok');
      cbRenderPendientes();
    } catch (err) {
      if (peticion !== cbPeticion) return;
      cbEstado('error');
    } finally {
      if (peticion === cbPeticion) refresh.classList.remove('spinning');
    }
  }

  function cobrosCargar(silencioso) {
    return cbTab === 'pagos' ? cbCargarPagos(silencioso) : cbCargarPendientes(silencioso);
  }

  // ---------- Eventos de la pantalla ----------
  document.getElementById('cobros-tabs').querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#cobros-tabs .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      cbTab = pill.dataset.tab;
      cobrosCargar();
    });
  });
  document.getElementById('cobros-search').addEventListener('input', (e) => {
    cbBusqueda = e.target.value.trim();
    clearTimeout(cbTimer);
    if (cbTab === 'pendientes') { if (cbPend) cbRenderPendientes(); return; } // filtro local, sin ir al servidor
    cbTimer = setTimeout(() => cbCargarPagos(true), 300);
  });
  ['cobros-desde', 'cobros-hasta', 'cobros-metodo', 'cobros-anulados'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => { if (cbTab === 'pagos') cbCargarPagos(true); });
  });
  document.getElementById('cobros-retry').addEventListener('click', () => cobrosCargar());
  document.getElementById('cobros-refresh').addEventListener('click', () => cobrosCargar());

  // ---------- Ventana (registrar pago / ajustar precio / anular pago) ----------
  let cbModal = null; // { tipo: 'pago'|'ajuste'|'anular', ... }

  function cbModalMsg(texto, tipo) {
    const el = document.getElementById('cb-modal-msg');
    el.textContent = texto || '';
    el.className = 'cli-form-msg' + (tipo ? ' is-' + tipo : '');
  }
  function cbModalCampo(nombre) { return document.querySelector(`#cb-modal-body [data-cb="${nombre}"]`); }
  function cbMarcar(el) {
    document.querySelectorAll('#cb-modal-body .cli-invalid').forEach(e => e.classList.remove('cli-invalid'));
    if (el) { el.classList.add('cli-invalid'); el.focus(); }
  }
  function cbCerrarModal() {
    const m = document.getElementById('cb-modal');
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    cbModal = null;
  }
  function cbAbrirModal(titulo, contexto, cuerpo, textoOk) {
    document.getElementById('cb-modal-titulo').textContent = titulo;
    document.getElementById('cb-modal-body').innerHTML = `<p class="cb-modal-ctx">${contexto}</p>${cuerpo}`;
    const ok = document.getElementById('cb-modal-ok');
    ok.textContent = textoOk; ok.disabled = false;
    cbModalMsg('');
    const m = document.getElementById('cb-modal');
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    const primero = document.querySelector('#cb-modal-body input, #cb-modal-body select');
    if (primero) primero.focus();
  }

  // Busca el elemento pendiente por clave 'bono:12' | 'cita:5' | 'pen:3'.
  function cbBuscar(clave) {
    const [tipo, id] = String(clave).split(':');
    const n = Number(id);
    if (!cbPend) return null;
    if (tipo === 'bono') return { tipo, id: n, x: (cbPend.bonos || []).find(b => Number(b.bono_id) === n) };
    if (tipo === 'cita') return { tipo, id: n, x: (cbPend.sesiones || []).find(s => Number(s.cita_id) === n) };
    if (tipo === 'pen') return { tipo, id: n, x: (cbPend.penalizaciones || []).find(p => Number(p.penalizacion_id) === n) };
    return null;
  }
  function cbDescripcion(it) {
    const x = it.x;
    if (it.tipo === 'bono') return `${cliEsc(cbNombre(x))} · ${cliEsc(x.servicio)}`;
    if (it.tipo === 'cita') return `${cliEsc(cbNombre(x))} · ${cliEsc(x.servicio)} · ${cliEsc(boFecha(x.fecha))} ${cliEsc(String(x.hora_inicio || '').slice(0, 5))}`;
    return `${cliEsc(cbNombre(x))} · Penalización ${Number(x.porcentaje)}%`;
  }

  function cbAbrirPago(clave) {
    const it = cbBuscar(clave);
    if (!it || !it.x || it.x.pendiente == null) return;
    cbModal = { tipo: 'pago', it };
    const hoy = boHoyISO();
    cbAbrirModal('Registrar pago',
      `${cbDescripcion(it)}<br>Precio ${cbEur(it.x.precio)} · pagado ${cbEur(it.x.pagado)} · <strong>pendiente ${cbEur(it.x.pendiente)}</strong>`,
      `${cliCampo('Importe (€)', `<input class="serv-input" data-cb="importe" inputmode="decimal" maxlength="10" value="${cbNum(it.x.pendiente)}">`, true)}
       ${cliCampo('Método de pago', `<select class="serv-input" data-cb="metodo"><option value="">— Elige —</option>${Object.keys(CB_METODOS).map(k => `<option value="${k}">${CB_METODOS[k]}</option>`).join('')}</select>`, true)}
       ${cliCampo('Fecha del pago', `<input type="date" class="serv-input" data-cb="fecha" value="${hoy}" max="${hoy}">`, true)}
       ${cliCampo('Notas (opcional)', `<input class="serv-input" data-cb="notas" maxlength="300">`)}`,
      'Registrar pago');
  }

  function cbAbrirAjuste(clave) {
    const it = cbBuscar(clave);
    if (!it || !it.x || it.tipo === 'pen') return;
    cbModal = { tipo: 'ajuste', it };
    const x = it.x;
    cbAbrirModal('Ajustar precio',
      `${cbDescripcion(it)}<br>${x.sin_precio ? 'Este servicio no tiene precio en el catálogo («Consultar»): fíjalo aquí.' : `Precio actual: ${cbEur(x.precio)}${x.precio_personalizado ? ' (personalizado)' : ' (el del catálogo)'}.`}${x.pagado > 0 ? ` Ya pagado: ${cbEur(x.pagado)}.` : ''}`,
      `${cliCampo('Precio (€)', `<input class="serv-input" data-cb="precio" inputmode="decimal" maxlength="10" value="${x.precio_personalizado ? cbNum(x.precio) : ''}" placeholder="${x.sin_precio ? 'Sin precio' : cbNum(x.precio) + ' (catálogo)'}">`)}
       <p class="bo-ayuda">Déjalo vacío para usar el precio del catálogo de servicios.</p>`,
      'Guardar precio');
  }

  function cbAbrirAnular(idPago) {
    const p = cbPagos && (cbPagos.pagos || []).find(x => Number(x.id) === idPago);
    if (!p) return;
    cbModal = { tipo: 'anular', id: idPago };
    cbAbrirModal('Anular pago',
      `${cliEsc(cbNombre(p))} · ${cliEsc(p.concepto_texto || '')}<br><strong>${cbEur(p.importe)}</strong> · ${cliEsc(CB_METODOS[p.metodo] || p.metodo)} · ${cliEsc(boFecha(p.fecha))}<br>El pago no se borra: queda en el historial como anulado y su importe deja de contar.`,
      cliCampo('Motivo de la anulación', `<input class="serv-input" data-cb="motivo" maxlength="200" placeholder="Por ejemplo: importe mal introducido">`, true),
      'Anular pago');
  }

  const CB_ERROR_CAMPO = {
    importe_invalido: 'importe', supera_precio: 'importe', ya_pagado: 'importe', metodo_invalido: 'metodo',
    fecha_invalida: 'fecha', fecha_futura: 'fecha', notas_largas: 'notas',
    precio_invalido: 'precio', precio_menor_pagado: 'precio', motivo_requerido: 'motivo', motivo_largo: 'motivo'
  };

  async function cbConfirmarModal() {
    if (!cbModal) return;
    const ok = document.getElementById('cb-modal-ok');
    const textoOk = ok.textContent;
    let url, cuerpo, mensajeOk;

    if (cbModal.tipo === 'pago') {
      const it = cbModal.it;
      const importe = cbModalCampo('importe').value.trim();
      const metodo = cbModalCampo('metodo').value;
      const fecha = cbModalCampo('fecha').value;
      if (!/^\d{1,7}([.,]\d{1,2})?$/.test(importe) || Number(importe.replace(',', '.')) <= 0) {
        cbModalMsg('Introduce un importe válido (por ejemplo 45 o 45,50).', 'error'); cbMarcar(cbModalCampo('importe')); return;
      }
      if (!metodo) { cbModalMsg('Elige cómo se ha pagado.', 'error'); cbMarcar(cbModalCampo('metodo')); return; }
      if (!fecha) { cbModalMsg('Indica la fecha del pago.', 'error'); cbMarcar(cbModalCampo('fecha')); return; }
      if (fecha > boHoyISO()) { cbModalMsg('La fecha del pago no puede ser futura.', 'error'); cbMarcar(cbModalCampo('fecha')); return; }
      cuerpo = { importe, metodo, fecha, notas: cbModalCampo('notas').value.trim() };
      cuerpo[it.tipo === 'bono' ? 'bono_id' : it.tipo === 'cita' ? 'cita_id' : 'penalizacion_id'] = it.id;
      url = COBROS_PAGO_URL; mensajeOk = 'Pago registrado.';
    } else if (cbModal.tipo === 'ajuste') {
      const precio = cbModalCampo('precio').value.trim();
      if (precio !== '' && !/^\d{1,7}([.,]\d{1,2})?$/.test(precio)) {
        cbModalMsg('Introduce un precio válido (por ejemplo 45 o 45,50) o déjalo vacío.', 'error'); cbMarcar(cbModalCampo('precio')); return;
      }
      cuerpo = { tipo: cbModal.it.tipo, id: cbModal.it.id, precio };
      url = COBROS_AJUSTAR_URL; mensajeOk = 'Precio guardado.';
    } else {
      const motivo = cbModalCampo('motivo').value.trim();
      if (motivo.length < 3) { cbModalMsg('Escribe el motivo de la anulación (mínimo 3 caracteres).', 'error'); cbMarcar(cbModalCampo('motivo')); return; }
      cuerpo = { id: cbModal.id, motivo };
      url = COBROS_ANULAR_URL; mensajeOk = 'Pago anulado.';
    }

    ok.disabled = true; ok.textContent = 'Guardando…'; cbModalMsg('');
    try {
      const r = await boPost(url, cuerpo);
      if (!r.ok) {
        cbModalMsg(r.mensaje || 'No se ha podido guardar.', 'error');
        if (CB_ERROR_CAMPO[r.error]) cbMarcar(cbModalCampo(CB_ERROR_CAMPO[r.error]));
        ok.disabled = false; ok.textContent = textoOk;
        if (r.error === 'no_existe') { cbCerrarModal(); cobrosCargar(true); }
        return;
      }
      cbCerrarModal();
      await cobrosCargar(true);
      cbToast(mensajeOk);
    } catch (err) {
      cbModalMsg('No se ha podido conectar con el servidor. Inténtalo de nuevo.', 'error');
      ok.disabled = false; ok.textContent = textoOk;
    }
  }

  // Aviso breve tras guardar (reutiliza el contador de la barra superior).
  function cbToast(texto) {
    const el = document.getElementById('cobros-count');
    const previo = el.textContent;
    el.textContent = '✓ ' + texto;
    setTimeout(() => { if (el.textContent === '✓ ' + texto) el.textContent = previo; }, 3500);
  }

  // Marcar / quitar «gratis» sin ventana: pide confirmación y envía.
  async function cbGratis(clave, valor) {
    const [tipo, id] = String(clave).split(':');
    const it = valor ? cbBuscar(clave) : null;
    if (valor && !(it && it.x)) return;
    const que = tipo === 'bono' ? 'este bono' : 'esta sesión';
    const texto = valor
      ? `¿Marcar ${que} como gratuito?\n\n${cbDescripcion(it).replace(/&[a-z#0-9]+;/g, '')}\n\nDejará de aparecer como pendiente y no admitirá pagos.`
      : `¿Quitar la marca «gratis» de ${que}?\n\nVolverá a aparecer como pendiente de cobro.`;
    if (!confirm(texto)) return;
    try {
      const r = await boPost(COBROS_AJUSTAR_URL, { tipo, id: Number(id), gratis: valor });
      if (!r.ok) { alert(r.mensaje || 'No se ha podido guardar el cambio.'); if (r.error === 'no_existe') cobrosCargar(true); return; }
      await cobrosCargar(true);
      cbToast(valor ? 'Marcado como gratuito.' : 'Marca «gratis» quitada.');
    } catch (err) {
      alert('No se ha podido conectar con el servidor. Inténtalo de nuevo.');
    }
  }

  document.getElementById('cb-modal-ok').addEventListener('click', cbConfirmarModal);
  document.getElementById('cb-modal-cancelar').addEventListener('click', cbCerrarModal);
  document.getElementById('cb-modal').addEventListener('mousedown', (e) => { if (e.target.id === 'cb-modal') cbCerrarModal(); });
  document.addEventListener('keydown', (e) => {
    if (!cbModal) return;
    if (e.key === 'Escape') { e.stopPropagation(); cbCerrarModal(); }
    else if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); cbConfirmarModal(); }
  }, true);

  document.getElementById('view-cobros').addEventListener('click', (e) => {
    const t = (sel) => e.target.closest(sel);
    let el;
    if ((el = t('[data-cb-cobrar]'))) return cbAbrirPago(el.dataset.cbCobrar);
    if ((el = t('[data-cb-precio]'))) return cbAbrirAjuste(el.dataset.cbPrecio);
    if ((el = t('[data-cb-gratis]'))) return cbGratis(el.dataset.cbGratis, true);
    if ((el = t('[data-cb-quitar-gratis]'))) return cbGratis(el.dataset.cbQuitarGratis, false);
    if ((el = t('[data-cb-anular]'))) return cbAbrirAnular(Number(el.dataset.cbAnular));
    if ((el = t('[data-cb-cliente]'))) return cliAbrirFicha(Number(el.dataset.cbCliente), 'editar');
    if (t('[data-cb-ir-pen]')) return document.querySelector('.nav-item[data-view="penalizaciones"]').click();
  });

  // ---------- Sección «Pagos» de la ficha de cliente (solo lectura). La llama cliRenderFormulario ----------
  function cliRenderPagos(pg) {
    const pagos = Array.isArray(pg.pagos) ? pg.pagos : [];
    const lista = pagos.length
      ? `<ul class="cli-pagos">${pagos.map(p => `<li class="cli-pago${p.anulado ? ' is-anulado' : ''}">
          <div>${cliEsc(p.concepto_texto || '')}<small>${cliEsc(boFecha(p.fecha))} · ${cliEsc(CB_METODOS[p.metodo] || p.metodo)}${p.anulado ? ` · Anulado: ${cliEsc(p.anulado_motivo || '')}` : (p.notas ? ` · ${cliEsc(p.notas)}` : '')}</small></div>
          <strong>${cbEur(p.importe)}</strong></li>`).join('')}</ul>`
      : '<p class="cli-vacio">Este cliente no tiene pagos registrados.</p>';
    return `
      <section class="cli-sec">
        <h3>Pagos</h3>
        <div class="cb-pag-resumen">
          <div><span>Pagado </span><strong>${cbEur(pg.pagado_total)}</strong></div>
          <div><span>Pendiente </span><strong>${cbEur(pg.pendiente_total)}</strong></div>
        </div>
        ${lista}
        <p class="bo-ayuda">Los pagos se registran desde la pantalla Cobros. Se muestran los últimos 100.</p>
      </section>`;
  }


  // ============================================================
  // CANCELACIONES Y MODIFICACIONES — penalizaciones (workflow n8n `CRM PENALIZACIONES`)
  // ============================================================
  // Aquí llegan las penalizaciones que crean el bot (cancelar / modificar una cita) y «No se presentó» (Agenda).
  // Sonia fija el importe en euros (o condona); una vez fijado, se cobra desde la pantalla Cobros.
  // Contrato (todas llevan Header: Authorization: Bearer <token>; las POST, Content-Type JSON):
  //   GET  panel-penalizaciones?q=&ver=sin_importe|por_cobrar|pagadas|condonadas|todas&origen=cancelacion|modificacion|no_show&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
  //        (desde/hasta sobre la fecha de la cita; vacío = sin límite)
  //        -> { ok: true,
  //             resumen: { sin_importe, por_cobrar, pagadas, condonadas, todas, total_por_cobrar },   // siempre de TODAS, sin filtros
  //             penalizaciones: [{ id, cliente_id, cliente_nombre, cliente_apellidos|null, cliente_telefono,
  //                                origen: 'cancelacion'|'modificacion'|'no_show', porcentaje, cita_id|null,
  //                                fecha_cita|null, hora_cita|null, cita_estado|null, servicio|null, de_bono,
  //                                importe|null, pagado, pendiente|null, importe_sugerido|null, base_texto|null,
  //                                situacion: 'sin_importe'|'por_cobrar'|'pagada'|'condonada'|'otra',
  //                                condonada_nombre|null, condonada_en|null, condonada_motivo|null, creada_en }] }   // máx. 500
  //           | { ok: false, error, mensaje }
  //   POST panel-penalizaciones-importe   body { id, importe ('45,50'; '' = quitar el importe) }  -> { ok: true, id, importe|null, pendiente|null } | { ok: false, error, mensaje }
  //   POST panel-penalizaciones-condonar  body { id, motivo?, por? }                              -> { ok: true, id } | { ok: false, error, mensaje }
  //   POST panel-penalizaciones-reactivar body { id }                                             -> { ok: true, id } | { ok: false, error, mensaje }
  //   `mensaje` es apto para enseñar tal cual. El importe sugerido nunca se guarda solo: se rellena en la ventana y Sonia lo confirma.
  const PEN_API_URL = 'https://n8n.gorekia.com/webhook/panel-penalizaciones';
  const PEN_IMPORTE_URL = 'https://n8n.gorekia.com/webhook/panel-penalizaciones-importe';
  const PEN_CONDONAR_URL = 'https://n8n.gorekia.com/webhook/panel-penalizaciones-condonar';
  const PEN_REACTIVAR_URL = 'https://n8n.gorekia.com/webhook/panel-penalizaciones-reactivar';

  const PEN_ORIGEN = { cancelacion: 'Cancelación', modificacion: 'Modificación', no_show: 'No se presentó' };
  const PEN_SITUACION = { sin_importe: 'Sin importe', por_cobrar: 'Por cobrar', pagada: 'Pagada', condonada: 'Condonada', otra: 'Otra' };
  const PEN_TABS = { sin_importe: 'Sin importe', por_cobrar: 'Por cobrar', condonadas: 'Condonadas', todas: 'Todas' };

  let penTab = 'sin_importe';
  let penDatos = null;
  let penBusqueda = '';
  let penPeticion = 0;
  let penTimer = null;
  let penModal = null; // { tipo: 'importe'|'condonar', id }

  function penEstado(modo, texto) { // 'loading' | 'error' | 'ok'
    document.getElementById('pen-loading').style.display = modo === 'loading' ? 'block' : 'none';
    document.getElementById('pen-error').style.display = modo === 'error' ? 'block' : 'none';
    if (modo === 'error') document.getElementById('pen-error-texto').textContent = texto || 'No se ha podido conectar con el servidor.';
    document.getElementById('pen-panel').style.display = modo === 'ok' ? '' : 'none';
    if (modo !== 'ok') document.getElementById('pen-count').textContent = '';
  }

  function penFechaCita(p) {
    return p.fecha_cita ? `${boFecha(p.fecha_cita)} ${String(p.hora_cita || '').slice(0, 5)}` : 'Sin cita asociada';
  }

  function penRender() {
    const d = penDatos;
    const r = d.resumen || {};
    // Pestañas con su contador
    document.querySelectorAll('#pen-tabs .pill').forEach(pill => {
      const n = Number(r[pill.dataset.tab]) || 0;
      pill.innerHTML = `${cliEsc(PEN_TABS[pill.dataset.tab])} <span class="pn-badge${pill.dataset.tab === 'sin_importe' && n > 0 ? ' is-aviso' : ''}">${n}</span>`;
    });
    document.getElementById('pen-resumen').innerHTML = `
      <div class="cb-total${Number(r.sin_importe) > 0 ? ' is-aviso' : ''}"><span>Sin importe</span><strong>${Number(r.sin_importe) || 0}</strong></div>
      <div class="cb-total is-principal"><span>Pendiente de cobro</span><strong>${cbEur(r.total_por_cobrar)}</strong></div>
      <div class="cb-total"><span>Por cobrar</span><strong>${Number(r.por_cobrar) || 0}</strong></div>
      <div class="cb-total"><span>Condonadas</span><strong>${Number(r.condonadas) || 0}</strong></div>`;

    const lista = Array.isArray(d.penalizaciones) ? d.penalizaciones : [];
    const hayFiltro = !!(penBusqueda || document.getElementById('pen-origen').value ||
                         document.getElementById('pen-desde').value || document.getElementById('pen-hasta').value);
    document.getElementById('pen-count').textContent = lista.length === 500 ? '500+ (acota los filtros)' : (lista.length === 1 ? '1 penalización' : `${lista.length} penalizaciones`);
    const vacio = document.getElementById('pen-empty');
    const tabla = document.getElementById('pen-table');
    if (!lista.length) {
      tabla.style.display = 'none';
      vacio.style.display = 'block';
      const t = { sin_importe: ['Todo al día', 'No hay penalizaciones pendientes de importe.'],
                  por_cobrar: ['Nada por cobrar', 'No hay penalizaciones con importe pendientes de cobro.'],
                  condonadas: ['Sin condonadas', 'Todavía no se ha condonado ninguna penalización.'],
                  todas: ['Sin penalizaciones', 'Cuando un cliente cancele o cambie su cita con poca antelación, aparecerá aquí.'] }[penTab];
      document.getElementById('pen-empty-titulo').textContent = hayFiltro ? 'Sin resultados' : t[0];
      document.getElementById('pen-empty-texto').textContent = hayFiltro ? 'No hay penalizaciones que coincidan con los filtros.' : t[1];
      return;
    }
    vacio.style.display = 'none';
    document.getElementById('pen-list').innerHTML = lista.map(p => {
      const sit = PEN_SITUACION[p.situacion] ? p.situacion : 'otra';
      let importe;
      if (p.importe != null) {
        importe = `<strong>${cbEur(p.importe)}</strong>${Number(p.pagado) > 0 ? `<span class="cb-sub">Pagado ${cbEur(p.pagado)}</span>` : ''}`;
      } else {
        importe = '<span class="cb-sub">—</span>' + (p.importe_sugerido != null ? `<span class="cb-sub">Sugerido ${cbEur(p.importe_sugerido)}</span>` : '');
      }
      let sub = '';
      if (sit === 'condonada') {
        const quien = [p.condonada_nombre ? `por ${p.condonada_nombre}` : '', p.condonada_en ? boFecha(p.condonada_en) : ''].filter(Boolean).join(' · ');
        sub = (quien ? `<span class="cb-sub">${cliEsc(quien)}</span>` : '') + (p.condonada_motivo ? `<span class="cb-sub">${cliEsc(p.condonada_motivo)}</span>` : '');
      } else if (sit === 'por_cobrar') {
        sub = `<span class="cb-sub">Falta ${cbEur(p.pendiente)}</span>`;
      }
      let acc = '';
      if (sit === 'sin_importe') {
        acc = `<button type="button" class="cb-btn is-pri" data-pen-importe="${Number(p.id)}">Fijar importe</button>
               <button type="button" class="cb-btn" data-pen-condonar="${Number(p.id)}">Condonar</button>`;
      } else if (sit === 'por_cobrar' || sit === 'pagada') {
        acc = `<button type="button" class="cb-btn" data-pen-importe="${Number(p.id)}">Cambiar importe</button>
               ${sit === 'por_cobrar' ? `<button type="button" class="cb-btn" data-pen-condonar="${Number(p.id)}">Condonar</button>` : ''}`;
      } else if (sit === 'condonada') {
        acc = `<button type="button" class="cb-btn" data-pen-reactivar="${Number(p.id)}">Reactivar</button>`;
      }
      return `<tr class="${sit === 'condonada' ? 'pn-condonada' : ''}">
        <td class="cli-nombre"><button type="button" class="cb-link" data-pen-cliente="${Number(p.cliente_id)}">${cliEsc(cbNombre(p))}</button>
          <span class="bo-cliente-tel">${cliEsc(cliFormatearTelefono(p.cliente_telefono))}</span></td>
        <td><span class="pn-tipo pn-tipo-${cliEsc(p.origen)}">${cliEsc(PEN_ORIGEN[p.origen] || p.origen)}</span>
          <span class="cb-sub">${cliEsc(p.servicio || '')}${p.servicio ? ' · ' : ''}${cliEsc(penFechaCita(p))}${p.de_bono ? ' · bono' : ''}</span></td>
        <td class="cb-num">${Number(p.porcentaje) || 0} %</td>
        <td class="cb-num">${importe}</td>
        <td><span class="pn-estado pn-estado-${sit}">${cliEsc(PEN_SITUACION[sit])}</span>${sub}</td>
        <td><div class="cb-acciones">${acc}</div></td>
      </tr>`;
    }).join('');
    tabla.style.display = '';
  }

  async function penCargar(silencioso) {
    const peticion = ++penPeticion;
    const refresh = document.getElementById('pen-refresh');
    refresh.classList.add('spinning');
    if (!silencioso) penEstado('loading');
    const par = new URLSearchParams();
    par.set('q', penBusqueda);
    par.set('ver', penTab);
    par.set('origen', document.getElementById('pen-origen').value);
    const desde = document.getElementById('pen-desde').value;
    const hasta = document.getElementById('pen-hasta').value;
    if (desde) par.set('desde', desde);
    if (hasta) par.set('hasta', hasta);
    try {
      const datos = await boGet(`${PEN_API_URL}?${par.toString()}`);
      if (peticion !== penPeticion) return;
      if (!datos || datos.ok !== true) {
        penEstado('error', (datos && datos.mensaje) || 'No se han podido cargar las penalizaciones.');
        return;
      }
      penDatos = datos;
      penEstado('ok');
      penRender();
    } catch (err) {
      if (peticion !== penPeticion) return;
      penEstado('error');
    } finally {
      if (peticion === penPeticion) refresh.classList.remove('spinning');
    }
  }

  // ---------- Eventos de la pantalla ----------
  document.querySelectorAll('#pen-tabs .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#pen-tabs .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      penTab = pill.dataset.tab;
      penCargar();
    });
  });
  document.getElementById('pen-search').addEventListener('input', (e) => {
    penBusqueda = e.target.value.trim();
    clearTimeout(penTimer);
    penTimer = setTimeout(() => penCargar(true), 300);
  });
  ['pen-origen', 'pen-desde', 'pen-hasta'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => penCargar(true));
  });
  document.getElementById('pen-retry').addEventListener('click', () => penCargar());
  document.getElementById('pen-refresh').addEventListener('click', () => penCargar());

  // ---------- Ventana (fijar importe / condonar) ----------
  function penModalMsg(texto, tipo) {
    const el = document.getElementById('pn-modal-msg');
    el.textContent = texto || '';
    el.className = 'cli-form-msg' + (tipo ? ' is-' + tipo : '');
  }
  function penModalCampo(nombre) { return document.querySelector(`#pn-modal-body [data-pn="${nombre}"]`); }
  function penMarcar(el) {
    document.querySelectorAll('#pn-modal-body .cli-invalid').forEach(e => e.classList.remove('cli-invalid'));
    if (el) { el.classList.add('cli-invalid'); el.focus(); }
  }
  function penCerrarModal() {
    const m = document.getElementById('pn-modal');
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    penModal = null;
  }
  function penAbrirModal(titulo, contexto, cuerpo, textoOk) {
    document.getElementById('pn-modal-titulo').textContent = titulo;
    document.getElementById('pn-modal-body').innerHTML = `<p class="cb-modal-ctx">${contexto}</p>${cuerpo}`;
    const ok = document.getElementById('pn-modal-ok');
    ok.textContent = textoOk; ok.disabled = false;
    penModalMsg('');
    const m = document.getElementById('pn-modal');
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    const primero = document.querySelector('#pn-modal-body input');
    if (primero) { primero.focus(); if (primero.select) primero.select(); }
  }
  function penBuscar(id) {
    return penDatos && (penDatos.penalizaciones || []).find(p => Number(p.id) === Number(id));
  }
  function penDescripcion(p) {
    return `${cliEsc(cbNombre(p))} · ${cliEsc(PEN_ORIGEN[p.origen] || p.origen)} ${Number(p.porcentaje) || 0} %<br>${cliEsc(p.servicio || '')}${p.servicio ? ' · ' : ''}${cliEsc(penFechaCita(p))}`;
  }

  function penAbrirImporte(id) {
    const p = penBuscar(id);
    if (!p) return;
    penModal = { tipo: 'importe', id: p.id };
    const valor = p.importe != null ? cbNum(p.importe) : (p.importe_sugerido != null ? cbNum(p.importe_sugerido) : '');
    const sugerencia = p.importe_sugerido != null
      ? `<p class="bo-ayuda">Sugerido: <strong>${cbEur(p.importe_sugerido)}</strong> (${Number(p.porcentaje)} % de «${cliEsc(p.base_texto || '')}»). Puedes cambiarlo.</p>`
      : '<p class="bo-ayuda">No hay un precio de referencia para sugerir el importe (sesión gratuita, servicio «Consultar» o sin cita). Escríbelo tú.</p>';
    const puedeQuitar = p.importe != null && !(Number(p.pagado) > 0);
    penAbrirModal(p.importe != null ? 'Cambiar importe' : 'Fijar importe',
      `${penDescripcion(p)}${Number(p.pagado) > 0 ? `<br>Ya pagado: <strong>${cbEur(p.pagado)}</strong> (el importe no puede ser menor).` : ''}`,
      `${cliCampo('Importe de la penalización (€)', `<input class="serv-input" data-pn="importe" inputmode="decimal" maxlength="10" value="${cliEsc(valor)}" placeholder="Por ejemplo 22,50">`, true)}
       ${sugerencia}${puedeQuitar ? '<p class="bo-ayuda">Déjalo vacío para quitar el importe.</p>' : ''}`,
      'Guardar importe');
  }

  function penAbrirCondonar(id) {
    const p = penBuscar(id);
    if (!p) return;
    penModal = { tipo: 'condonar', id: p.id };
    penAbrirModal('Condonar penalización',
      `${penDescripcion(p)}<br>Dejará de cobrarse. Se queda en el historial y la puedes reactivar cuando quieras.`,
      cliCampo('Motivo (opcional)', `<input class="serv-input" data-pn="motivo" maxlength="200" placeholder="Por ejemplo: avisó por teléfono y lo recuperamos">`),
      'Condonar');
  }

  const PEN_ERROR_CAMPO = { importe_invalido: 'importe', importe_menor_pagado: 'importe', tiene_pagos: 'importe', motivo_largo: 'motivo' };

  async function penConfirmarModal() {
    if (!penModal) return;
    const ok = document.getElementById('pn-modal-ok');
    const textoOk = ok.textContent;
    let url, cuerpo, mensajeOk;
    if (penModal.tipo === 'importe') {
      const p = penBuscar(penModal.id);
      const importe = penModalCampo('importe').value.trim();
      if (importe === '') {
        if (!(p && p.importe != null && !(Number(p.pagado) > 0))) {
          penModalMsg('Introduce el importe (por ejemplo 22 o 22,50). Si no hay que cobrar nada, usa «Condonar».', 'error'); penMarcar(penModalCampo('importe')); return;
        }
      } else if (!/^\d{1,7}([.,]\d{1,2})?$/.test(importe) || Number(importe.replace(',', '.')) <= 0) {
        penModalMsg('Introduce un importe válido mayor que 0 (por ejemplo 22 o 22,50).', 'error'); penMarcar(penModalCampo('importe')); return;
      }
      cuerpo = { id: penModal.id, importe };
      url = PEN_IMPORTE_URL; mensajeOk = importe === '' ? 'Importe quitado.' : 'Importe guardado.';
    } else {
      const motivo = penModalCampo('motivo').value.trim();
      cuerpo = { id: penModal.id, motivo, por: localStorage.getItem(USER_KEY) || '' };
      url = PEN_CONDONAR_URL; mensajeOk = 'Penalización condonada.';
    }
    ok.disabled = true; ok.textContent = 'Guardando…'; penModalMsg('');
    try {
      const r = await boPost(url, cuerpo);
      if (!r.ok) {
        penModalMsg(r.mensaje || 'No se ha podido guardar.', 'error');
        if (PEN_ERROR_CAMPO[r.error]) penMarcar(penModalCampo(PEN_ERROR_CAMPO[r.error]));
        ok.disabled = false; ok.textContent = textoOk;
        if (r.error === 'no_existe') { penCerrarModal(); penCargar(true); }
        return;
      }
      penCerrarModal();
      await penCargar(true);
      penToast(mensajeOk);
    } catch (err) {
      penModalMsg('No se ha podido conectar con el servidor. Inténtalo de nuevo.', 'error');
      ok.disabled = false; ok.textContent = textoOk;
    }
  }

  function penToast(texto) {
    const el = document.getElementById('pen-count');
    const previo = el.textContent;
    el.textContent = '✓ ' + texto;
    setTimeout(() => { if (el.textContent === '✓ ' + texto) el.textContent = previo; }, 3500);
  }

  async function penReactivar(id) {
    const p = penBuscar(id);
    if (!p) return;
    const texto = `${cbNombre(p)} · ${PEN_ORIGEN[p.origen] || p.origen} ${Number(p.porcentaje) || 0} %\n${p.servicio || ''}${p.servicio ? ' · ' : ''}${penFechaCita(p)}`;
    if (!confirm(`¿Reactivar esta penalización?\n\n${texto}\n\nVolverá a contar como pendiente.`)) return;
    try {
      const r = await boPost(PEN_REACTIVAR_URL, { id: Number(id) });
      if (!r.ok) { alert(r.mensaje || 'No se ha podido reactivar.'); if (r.error === 'no_existe') penCargar(true); return; }
      await penCargar(true);
      penToast('Penalización reactivada.');
    } catch (err) {
      alert('No se ha podido conectar con el servidor. Inténtalo de nuevo.');
    }
  }

  document.getElementById('pn-modal-ok').addEventListener('click', penConfirmarModal);
  document.getElementById('pn-modal-cancelar').addEventListener('click', penCerrarModal);
  document.getElementById('pn-modal').addEventListener('mousedown', (e) => { if (e.target.id === 'pn-modal') penCerrarModal(); });
  document.addEventListener('keydown', (e) => {
    if (!penModal) return;
    if (e.key === 'Escape') { e.stopPropagation(); penCerrarModal(); }
    else if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); penConfirmarModal(); }
  }, true);

  document.getElementById('view-penalizaciones').addEventListener('click', (e) => {
    const t = (sel) => e.target.closest(sel);
    let el;
    if ((el = t('[data-pen-importe]'))) return penAbrirImporte(el.dataset.penImporte);
    if ((el = t('[data-pen-condonar]'))) return penAbrirCondonar(el.dataset.penCondonar);
    if ((el = t('[data-pen-reactivar]'))) return penReactivar(el.dataset.penReactivar);
    if ((el = t('[data-pen-cliente]'))) return cliAbrirFicha(Number(el.dataset.penCliente), 'editar');
  });