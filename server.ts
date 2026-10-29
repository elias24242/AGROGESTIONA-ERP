/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Servidor Backend Full Stack (Express + Vite)
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// In-Memory & File-Backed Database Engine for Server Operations
import * as SeedData from './src/data/initialData';
import { handleAiChatRequest } from './src/services/aiChatServerService';

const PERSIST_FILE = path.resolve(process.cwd(), 'server-db-store.json');
let serverDbState: any = null;

const persistServerState = () => {
  try {
    if (serverDbState) {
      fs.writeFileSync(PERSIST_FILE, JSON.stringify(serverDbState, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Error al persistir estado en disco:', e);
  }
};

const getServerState = () => {
  if (!serverDbState) {
    if (fs.existsSync(PERSIST_FILE)) {
      try {
        const raw = fs.readFileSync(PERSIST_FILE, 'utf-8');
        serverDbState = JSON.parse(raw);
        if (!serverDbState.especies || serverDbState.especies.length === 0) {
          serverDbState.especies = [...SeedData.INITIAL_ESPECIES];
          persistServerState();
        }
        if (!serverDbState.usuarios || !Array.isArray(serverDbState.usuarios)) {
          serverDbState.usuarios = [...SeedData.INITIAL_USUARIOS];
          persistServerState();
        } else {
          // Reconciliar perfiles iniciales asegurando que usuarios como joacopagani07, 123, admin, etc. existan con sus claves
          let updatedUsers = false;
          SeedData.INITIAL_USUARIOS.forEach(initUser => {
            const existing = serverDbState.usuarios.find(
              (u: any) =>
                u.id_usuario === initUser.id_usuario ||
                (u.username && u.username.toLowerCase() === initUser.username.toLowerCase())
            );
            if (!existing) {
              serverDbState.usuarios.push({ ...initUser });
              updatedUsers = true;
            } else if (!existing.password_hash || existing.password_hash === '') {
              existing.password_hash = initUser.password_hash;
              existing.activo = true;
              existing.inhabilitado = false;
              updatedUsers = true;
            }
          });

          // Sincronizar inventario inicial consolidado (Bovinos y Porcinos confirmados)
          if (Array.isArray(serverDbState.inventario)) {
            SeedData.INITIAL_INVENTARIO.forEach((initInv: any) => {
              const idx = serverDbState.inventario.findIndex((i: any) => i.id_inventario === initInv.id_inventario);
              if (idx === -1) {
                serverDbState.inventario.push({ ...initInv });
                updatedUsers = true;
              } else if (serverDbState.inventario[idx].cabezas === 0 && initInv.cabezas > 0) {
                serverDbState.inventario[idx] = { ...initInv };
                updatedUsers = true;
              }
            });
          }
          if (updatedUsers) {
            persistServerState();
          }
        }
      } catch (e) {
        console.warn('Error leyendo server-db-store.json, cargando seeds:', e);
      }
    }
    if (!serverDbState) {
      serverDbState = {
        especies: [...SeedData.INITIAL_ESPECIES],
        unidades: [...SeedData.INITIAL_UNIDADES],
        subunidades: [...SeedData.INITIAL_SUBUNIDADES],
        campanias: [...SeedData.INITIAL_CAMPANIAS],
        lotes: [...SeedData.INITIAL_LOTES],
        categorias: [...SeedData.INITIAL_CATEGORIAS],
        insumos: [...SeedData.INITIAL_INSUMOS],
        productos: [...SeedData.INITIAL_PRODUCTOS],
        terceros: [...SeedData.INITIAL_TERCEROS],
        cuentas: [...SeedData.INITIAL_CUENTAS],
        inventario: [...SeedData.INITIAL_INVENTARIO],
        movimientos: [...SeedData.INITIAL_MOVIMIENTOS],
        pesajes: [],
        produccion: [],
        referencias: [...SeedData.INITIAL_REFERENCIAS],
        dosis: [...SeedData.INITIAL_DOSIS],
        sanidad: [],
        consumos: [],
        compras: [],
        detalles_compras: [],
        ventas: [...SeedData.INITIAL_VENTAS],
        detalles_ventas: [...SeedData.INITIAL_DETALLES_VENTAS],
        costos: [],
        distribuciones_costos: [],
        cobros: [...SeedData.INITIAL_COBROS],
        pagos: [],
        usuarios: [...SeedData.INITIAL_USUARIOS],
        auditoria: [...SeedData.INITIAL_AUDITORIA],
      };
      persistServerState();
    }
  }
  return serverDbState;
};

// ================= API ENDPOINTS =================

// 1. Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    sistema: 'SISTEMA DE GESTIÓN GANADERA POZO DEL CARRIL – LA AGUADA (UNRC)',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/especies', (req: Request, res: Response) => {
  const state = getServerState();
  res.json({ success: true, especies: state.especies || SeedData.INITIAL_ESPECIES });
});

// 2. Autenticación en Backend (Regla obligatoria: Email o Usuario + Password + Check Activo)
app.post('/api/auth/login', (req: Request, res: Response): void => {
  const { username, email, password } = req.body;
  const state = getServerState();

  const identifier = (email || username || '').toString().toLowerCase().trim();
  const rawPass = (password || '').toString().trim();

  if (!identifier || !rawPass) {
    res.status(400).json({ error: 'Debe ingresar su correo electrónico (o usuario) y contraseña' });
    return;
  }

  // REQUERIMIENTO DIRECTO DEL USUARIO: Acceso garantizado con usuario "123" y contraseña "taller 2"
  const isUser123 = identifier === '123';
  const isPassTaller2 = rawPass.toLowerCase() === 'taller 2' || rawPass.toLowerCase() === 'taller2' || rawPass === 'taller 2';
  if (isUser123 && isPassTaller2) {
    let u123 = state.usuarios.find((u: any) => u.username.toString().trim() === '123');
    if (!u123) {
      u123 = {
        id_usuario: 'USR-123',
        username: '123',
        password_hash: 'taller 2',
        nombre_completo: 'Usuario Taller 2',
        email: 'taller2@unrc.edu.ar',
        id_rol: 'ROL-ADMIN',
        rol_nombre: 'ADMINISTRADOR',
        activo: true,
        inhabilitado: false,
        fecha_alta: '2026-07-01',
        fecha_modificacion: new Date().toISOString().substring(0, 10),
      };
      state.usuarios.push(u123);
      persistServerState();
    } else {
      u123.activo = true;
      u123.inhabilitado = false;
      u123.password_hash = 'taller 2';
      persistServerState();
    }
    const { password_hash: _ph, ...safeUser } = u123;
    safeUser.activo = true;
    safeUser.inhabilitado = false;
    res.json({
      success: true,
      user: safeUser,
      token: `session-${Date.now()}-USR-123`,
    });
    return;
  }

  const user = state.usuarios.find((u: any) => 
    u.username.toString().toLowerCase().trim() === identifier || 
    (u.email && u.email.toString().toLowerCase().trim() === identifier) ||
    u.id_usuario === identifier
  );

  if (!user) {
    res.status(401).json({ error: 'Credenciales inválidas. Usuario no registrado.' });
    return;
  }

  // Validación de usuario inactivo / inhabilitado (Prueba de Aceptación 9 y Reglas de Seguridad)
  const estaInhabilitado = user.inhabilitado === true || user.activo === false;
  if (estaInhabilitado) {
    res.status(403).json({
      error: 'Usuario inhabilitado para operar en el sistema. Contacte al Administrador.',
      codigo: 'USUARIO_INACTIVO',
    });
    return;
  }

  // Validación de password flexible y robusta (considerando trim y tanto password_hash como password)
  const storedPass = (user.password_hash || user.password || '').toString().trim();
  if (storedPass !== rawPass) {
    res.status(401).json({ error: 'Contraseña incorrecta. Verifique sus credenciales.' });
    return;
  }

  // Éxito: responder con datos seguros con propiedades explícitas
  const { password_hash, ...safeUser } = user;
  safeUser.inhabilitado = false;
  safeUser.activo = true;
  res.json({
    success: true,
    user: safeUser,
    token: `session-${Date.now()}-${safeUser.id_usuario}`,
  });
});

// 3. Obtener Estado y Catálogos
app.get('/api/erp/state', (req: Request, res: Response) => {
  const state = getServerState();
  res.json({ success: true, data: state });
});

// 3b. Incorporar o Actualizar Insumo en Backend Store
app.post('/api/erp/insumos', (req: Request, res: Response): void => {
  try {
    const nuevoInsumo = req.body;
    if (!nuevoInsumo || !nuevoInsumo.nombre) {
      res.status(400).json({ error: 'Datos de insumo incompletos' });
      return;
    }
    const state = getServerState();
    if (!Array.isArray(state.insumos)) {
      state.insumos = [];
    }
    const idx = state.insumos.findIndex((i: any) => i.id_insumo === nuevoInsumo.id_insumo || (i.codigo && i.codigo === nuevoInsumo.codigo));
    if (idx >= 0) {
      state.insumos[idx] = { ...state.insumos[idx], ...nuevoInsumo };
    } else {
      state.insumos.push(nuevoInsumo);
    }
    persistServerState();
    res.json({ success: true, insumo: nuevoInsumo });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error guardando insumo' });
  }
});

// 4. Sincronización con Google Sheets Proxy (Server-side)
app.post('/api/sheets/proxy-batch-get', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization;
  const { spreadsheetId, ranges } = req.body;

  if (!token || !spreadsheetId || !ranges) {
    res.status(400).json({ error: 'Faltan parámetros de autorización o spreadsheet' });
    return;
  }

  try {
    const rangesParam = ranges.map((r: string) => `ranges=${encodeURIComponent(r)}`).join('&');
    const googleRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesParam}`,
      {
        headers: { Authorization: token },
      }
    );
    const data = await googleRes.json();
    res.status(googleRes.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error en comunicación con Google Sheets' });
  }
});

app.post('/api/sheets/proxy-metadata', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization;
  const { spreadsheetId } = req.body;

  if (!spreadsheetId) {
    res.status(400).json({ error: 'Falta spreadsheetId' });
    return;
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = token;

    const googleRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
      { headers }
    );

    if (googleRes.ok) {
      const data = await googleRes.json();
      res.json({
        success: true,
        title: data.properties?.title || 'ERP Ovinos - Google Sheet',
        sheetsCount: (data.sheets || []).length,
        sheets: (data.sheets || []).map((s: any) => s.properties?.title),
      });
      return;
    }

    const errText = await googleRes.text();
    res.status(googleRes.status).json({
      success: false,
      error: `Error de Google Sheets API (${googleRes.status}): ${errText}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error al consultar metadatos de Sheets' });
  }
});

app.post('/api/sheets/proxy-batch-update', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization;
  const { spreadsheetId, data } = req.body;

  if (!token || !spreadsheetId || !data) {
    res.status(400).json({ error: 'Faltan parámetros de autorización, spreadsheetId o datos' });
    return;
  }

  try {
    const googleRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data,
        }),
      }
    );

    const resJson = await googleRes.json();
    res.status(googleRes.status).json(resJson);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al actualizar lote en Google Sheets' });
  }
});

// Cotización Oficial Dólar Hoy (Compra / Venta)
let cachedCotizacion: {
  compra: number;
  venta: number;
  ultimaActualizacion: string;
  timestamp: number;
} | null = null;

app.get('/api/cotizacion-dolar', async (req: Request, res: Response): Promise<void> => {
  const now = Date.now();
  if (cachedCotizacion && (now - cachedCotizacion.timestamp < 3 * 60 * 1000)) {
    res.json({
      success: true,
      compra: cachedCotizacion.compra,
      venta: cachedCotizacion.venta,
      ultimaActualizacion: cachedCotizacion.ultimaActualizacion,
      fuente: 'https://dolarhoy.com/cotizaciondolaroficial',
      cached: true,
    });
    return;
  }

  try {
    const response = await fetch('https://dolarhoy.com/cotizaciondolaroficial', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();

    let compra = 1490.00;
    let venta = 1540.00;
    let ultimaActualizacion = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const tileIdx = html.indexOf('class="tile is-child title">Dólar Oficial</div>');
    if (tileIdx !== -1) {
      const chunk = html.substring(tileIdx, tileIdx + 1200);
      const compraMatch = chunk.match(/Compra<\/div>\s*<div class="value">\$?([0-9.,]+)<\/div>/i);
      const ventaMatch = chunk.match(/Venta<\/div>\s*<div class="value">\$?([0-9.,]+)<\/div>/i);
      const updateMatch = chunk.match(/Actualizado por última vez:\s*([^<]+)/i);

      if (compraMatch && compraMatch[1]) {
        const parsed = parseFloat(compraMatch[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) compra = parsed;
      }

      if (ventaMatch && ventaMatch[1]) {
        const parsed = parseFloat(ventaMatch[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) venta = parsed;
      }

      if (updateMatch && updateMatch[1]) {
        ultimaActualizacion = updateMatch[1].trim();
      }
    } else {
      // Intento secundario contra API de Dólar Oficial de respaldo
      try {
        const apiRes = await fetch('https://dolarapi.com/v1/dolares/oficial', { signal: AbortSignal.timeout(3500) });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData && apiData.compra > 0 && apiData.venta > 0) {
            compra = apiData.compra;
            venta = apiData.venta;
            ultimaActualizacion = apiData.fechaActualizacion
              ? new Date(apiData.fechaActualizacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              : ultimaActualizacion;
          }
        }
      } catch (e) {}
    }

    cachedCotizacion = {
      compra,
      venta,
      ultimaActualizacion,
      timestamp: now,
    };

    res.json({
      success: true,
      compra,
      venta,
      ultimaActualizacion,
      fuente: 'https://dolarhoy.com/cotizaciondolaroficial',
    });
  } catch (err: any) {
    // Si falla la conexión a dolarhoy, intentar dolarapi
    try {
      const apiRes = await fetch('https://dolarapi.com/v1/dolares/oficial', { signal: AbortSignal.timeout(3500) });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData && apiData.compra > 0 && apiData.venta > 0) {
          const fresh = {
            compra: apiData.compra,
            venta: apiData.venta,
            ultimaActualizacion: apiData.fechaActualizacion
              ? new Date(apiData.fechaActualizacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: now,
          };
          cachedCotizacion = fresh;
          res.json({
            success: true,
            compra: fresh.compra,
            venta: fresh.venta,
            ultimaActualizacion: fresh.ultimaActualizacion,
            fuente: 'https://dolarapi.com/v1/dolares/oficial',
          });
          return;
        }
      }
    } catch (e) {}

    res.json({
      success: true,
      compra: cachedCotizacion?.compra || 1490.00,
      venta: cachedCotizacion?.venta || 1540.00,
      ultimaActualizacion: cachedCotizacion?.ultimaActualizacion || 'Referencia oficial',
      fuente: 'https://dolarhoy.com/cotizaciondolaroficial',
      fallback: true,
    });
  }
});

// 5. Gestión de Usuarios (Backend CRUD, Sync & Validaciones)
app.get('/api/users', (req: Request, res: Response) => {
  const state = getServerState();
  const safeUsers = state.usuarios.map((u: any) => ({
    id_usuario: u.id_usuario,
    username: u.username,
    nombre_completo: u.nombre_completo,
    email: u.email,
    id_rol: u.id_rol,
    rol_nombre: u.rol_nombre,
    activo: u.activo !== undefined ? !!u.activo : !u.inhabilitado,
    inhabilitado: u.inhabilitado !== undefined ? !!u.inhabilitado : !u.activo,
    fecha_alta: u.fecha_alta,
    fecha_modificacion: u.fecha_modificacion,
    password_hash: u.password_hash,
  }));
  res.json({ success: true, users: safeUsers });
});

// Sincronización en lote de usuarios desde el cliente
app.post('/api/users/sync', (req: Request, res: Response): void => {
  const { usuarios } = req.body;
  if (!Array.isArray(usuarios)) {
    res.status(400).json({ error: 'Formato inválido: usuarios debe ser un array' });
    return;
  }
  const state = getServerState();
  usuarios.forEach((incoming: any) => {
    if (!incoming.username) return;
    const idx = state.usuarios.findIndex((u: any) =>
      (incoming.id_usuario && u.id_usuario === incoming.id_usuario) ||
      u.username.toLowerCase() === incoming.username.trim().toLowerCase()
    );

    const userActivo = incoming.activo !== undefined 
      ? (incoming.activo === true || incoming.activo === 'true') 
      : (incoming.inhabilitado !== undefined ? !(incoming.inhabilitado === true || incoming.inhabilitado === 'true') : true);
    const userInhabilitado = incoming.inhabilitado !== undefined 
      ? (incoming.inhabilitado === true || incoming.inhabilitado === 'true') 
      : !userActivo;

    if (idx !== -1) {
      state.usuarios[idx] = {
        ...state.usuarios[idx],
        ...incoming,
        activo: userActivo,
        inhabilitado: userInhabilitado,
        password_hash: incoming.password_hash || incoming.password || state.usuarios[idx].password_hash,
      };
    } else {
      state.usuarios.push({
        id_usuario: incoming.id_usuario || `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: incoming.username.trim(),
        password_hash: incoming.password_hash || incoming.password || 'demo123',
        nombre_completo: incoming.nombre_completo || incoming.username,
        email: incoming.email || `${incoming.username.trim()}@unrc.edu.ar`,
        id_rol: incoming.id_rol || 'ROL-OPER',
        rol_nombre: incoming.rol_nombre || 'OPERADOR',
        activo: userActivo,
        inhabilitado: userInhabilitado,
        fecha_alta: incoming.fecha_alta || new Date().toISOString().substring(0, 10),
        fecha_modificacion: new Date().toISOString().substring(0, 10),
      });
    }
  });
  persistServerState();
  res.json({ success: true, count: state.usuarios.length });
});

app.post('/api/users', (req: Request, res: Response): void => {
  const { username, password, password_hash, nombre_completo, email, id_rol, rol_nombre, activo, id_usuario } = req.body;
  const state = getServerState();

  const rawPass = password || password_hash || 'demo123';

  if (!username || !nombre_completo) {
    res.status(400).json({ error: 'Faltan campos obligatorios (usuario y nombre completo)' });
    return;
  }

  const existingIdx = state.usuarios.findIndex((u: any) => u.username.toLowerCase() === username.trim().toLowerCase());
  const now = new Date().toISOString().substring(0, 10);
  const isActivo = activo !== undefined 
    ? (activo === true || activo === 'true') 
    : (req.body.inhabilitado !== undefined ? !(req.body.inhabilitado === true || req.body.inhabilitado === 'true') : true);
  const isInhabilitado = req.body.inhabilitado !== undefined 
    ? (req.body.inhabilitado === true || req.body.inhabilitado === 'true') 
    : !isActivo;

  if (existingIdx !== -1) {
    // Actualizar usuario existente con nueva contraseña y rol
    state.usuarios[existingIdx] = {
      ...state.usuarios[existingIdx],
      password_hash: rawPass.trim(),
      nombre_completo: nombre_completo ? nombre_completo.trim() : state.usuarios[existingIdx].nombre_completo,
      email: email ? email.trim() : state.usuarios[existingIdx].email,
      id_rol: id_rol || state.usuarios[existingIdx].id_rol,
      rol_nombre: rol_nombre || state.usuarios[existingIdx].rol_nombre,
      activo: isActivo,
      inhabilitado: isInhabilitado,
      fecha_modificacion: now,
    };
    persistServerState();
    const { password_hash: _ph, ...safeUser } = state.usuarios[existingIdx];
    res.status(200).json({ success: true, user: safeUser, actualizado: true });
    return;
  }

  const idUser = id_usuario || `USR-${Date.now()}`;
  const newUser = {
    id_usuario: idUser,
    username: username.trim(),
    password_hash: rawPass.trim(),
    nombre_completo: nombre_completo.trim(),
    email: email ? email.trim() : `${username.trim()}@unrc.edu.ar`,
    id_rol: id_rol || 'ROL-OPER',
    rol_nombre: rol_nombre || 'OPERADOR',
    activo: isActivo,
    inhabilitado: isInhabilitado,
    fecha_alta: now,
    fecha_modificacion: now,
  };

  state.usuarios.push(newUser);

  state.auditoria.unshift({
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: 'USR-ADMIN',
    username: 'admin',
    fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    operacion: 'ALTA',
    tabla_afectada: 'usuarios',
    id_registro: idUser,
    valor_nuevo: JSON.stringify({ username: newUser.username, rol: newUser.rol_nombre, activo: newUser.activo }),
    motivo: `Alta de nuevo usuario: ${newUser.nombre_completo} (@${newUser.username}) con rol ${newUser.rol_nombre}`,
  });

  persistServerState();

  const { password_hash: _ph, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

app.post('/api/users/toggle-active/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { activo, password } = req.body;
  const state = getServerState();

  const user = state.usuarios.find((u: any) =>
    u.id_usuario === id || u.username.toLowerCase() === id.toLowerCase()
  );
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const prevActivo = user.activo;
  user.activo = activo !== undefined ? (activo === true || activo === 'true') : !user.activo;
  user.inhabilitado = !user.activo;
  if (password && typeof password === 'string' && password.trim() !== '') {
    user.password_hash = password.trim();
  }
  user.fecha_modificacion = new Date().toISOString().substring(0, 10);

  state.auditoria.unshift({
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: 'USR-ADMIN',
    username: 'admin',
    fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    operacion: 'MODIFICACION',
    tabla_afectada: 'usuarios',
    id_registro: user.id_usuario,
    valor_anterior: JSON.stringify({ activo: prevActivo }),
    valor_nuevo: JSON.stringify({ activo: user.activo }),
    motivo: `Cambio de estado de acceso para usuario @${user.username}: activo=${user.activo}`,
  });

  persistServerState();

  const { password_hash: _ph, ...safeUser } = user;
  res.json({ success: true, user: safeUser, activo: user.activo });
});

app.put('/api/users/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { nombre_completo, email, id_rol, rol_nombre, activo, inhabilitado, password, password_hash } = req.body;
  const state = getServerState();

  const user = state.usuarios.find((u: any) =>
    u.id_usuario === id || u.username.toLowerCase() === id.toLowerCase()
  );
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const prevValue = { ...user };

  if (nombre_completo) user.nombre_completo = nombre_completo.trim();
  if (email) user.email = email.trim();
  if (id_rol) user.id_rol = id_rol;
  if (rol_nombre) user.rol_nombre = rol_nombre;
  if (activo !== undefined) {
    user.activo = activo === true || activo === 'true';
    user.inhabilitado = !user.activo;
  }
  if (inhabilitado !== undefined) {
    user.inhabilitado = inhabilitado === true || inhabilitado === 'true';
    user.activo = !user.inhabilitado;
  }
  const newPass = password || password_hash;
  if (newPass && typeof newPass === 'string' && newPass.trim() !== '') {
    user.password_hash = newPass.trim();
  }
  user.fecha_modificacion = new Date().toISOString().substring(0, 10);

  state.auditoria.unshift({
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: 'USR-ADMIN',
    username: 'admin',
    fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    operacion: 'MODIFICACION',
    tabla_afectada: 'usuarios',
    id_registro: user.id_usuario,
    valor_anterior: JSON.stringify({ rol: prevValue.rol_nombre, activo: prevValue.activo }),
    valor_nuevo: JSON.stringify({ rol: user.rol_nombre, activo: user.activo }),
    motivo: `Modificación de usuario @${user.username}: rol=${user.rol_nombre}, activo=${user.activo}`,
  });

  persistServerState();

  const { password_hash: _ph, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.delete('/api/users/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const state = getServerState();

  const userIdx = state.usuarios.findIndex((u: any) =>
    u.id_usuario === id || u.username.toLowerCase() === id.toLowerCase()
  );
  if (userIdx === -1) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const user = state.usuarios[userIdx];
  if (user.username.toLowerCase() === 'admin') {
    res.status(400).json({ error: 'No se puede eliminar la cuenta principal de Administrador' });
    return;
  }

  state.usuarios.splice(userIdx, 1);

  state.auditoria.unshift({
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: 'USR-ADMIN',
    username: 'admin',
    fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    operacion: 'ANULACION',
    tabla_afectada: 'usuarios',
    id_registro: id,
    valor_anterior: JSON.stringify({ username: user.username, nombre: user.nombre_completo, rol: user.rol_nombre }),
    valor_nuevo: JSON.stringify({ eliminado: true }),
    motivo: `Eliminación física de la cuenta de usuario: @${user.username} (${user.nombre_completo})`,
  });

  persistServerState();

  res.json({ success: true, message: `Usuario @${user.username} eliminado correctamente` });
});

// 6. Asistente IA (Orientación del Sistema & Interpretación de Datos en Tiempo Real)
app.post('/api/ai/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, mode, context } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Faltan mensajes en la consulta' });
      return;
    }
    const state = getServerState();
    const result = await handleAiChatRequest(messages, mode || 'interpretative', state, context);
    res.json({ success: true, text: result.text, model: result.model });
  } catch (err: any) {
    console.error('Error procesando chat IA en backend:', err);
    res.status(500).json({ error: err.message || 'Error en el asistente de inteligencia artificial' });
  }
});

// 7. Ingesta y Sincronización en Vivo de Modelo de Datos con Inteligencia Artificial
app.post('/api/ai/parse-model', async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawText, fileName, defaultCampania, defaultSubunidad } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: 'No se recibieron datos para procesar.' });
      return;
    }

    let parsedRecords: Record<string, any[]> = {};
    let summary = '';
    let detectedEntities: string[] = [];

    // 1. Interpretar con Google Gemini SDK si está disponible
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const prompt = `Analiza este conjunto de datos o texto de gestión ganadera (${fileName || 'archivo'}) y clasifícalo con precisión en las tablas del ERP:
Tablas reconocidas:
- "movimientos": [{ id_campania, fecha (YYYY-MM-DD), tipo (NACIMIENTO|MUERTE|VENTA|TRANSFERENCIA|COMPRA), id_subunidad_destino, id_categoria_destino, cabezas, kg_vivo_total, motivo }]
- "pesajes": [{ id_campania, id_subunidad, fecha, cabezas_pesadas, kg_vivo_total, kg_vivo_promedio, tipo_peso, observaciones }]
- "sanidad": [{ id_campania, id_subunidad, id_categoria, fecha, cabezas_tratadas, dosis_unitaria_real, consumo_total_real, diagnostico_motivo }]
- "consumos": [{ id_campania, id_subunidad, id_insumo, fecha, cantidad_real, costo_total_real }]
- "lotes": [{ id_subunidad, codigo, nombre, superficie_ha, activo: true }]
- "inventario": [{ id_campania, id_subunidad, id_categoria, fecha, cabezas, kg_vivo_total }]

Genera ÚNICAMENTE un JSON válido con esta estructura:
{
  "summary": "Resumen de lo interpretado y clasificado en 1 o 2 oraciones",
  "detectedEntities": ["movimientos", "pesajes", ...],
  "records": {
    "movimientos": [...],
    "pesajes": [...]
  }
}

Datos de entrada:
${rawText.substring(0, 15000)}
`;

        const resp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const text = resp.text || '{}';
        const aiJson = JSON.parse(text);
        if (aiJson && aiJson.records && typeof aiJson.records === 'object') {
          parsedRecords = aiJson.records;
          summary = aiJson.summary || 'Datos interpretados y categorizados exitosamente con IA.';
          detectedEntities = aiJson.detectedEntities || Object.keys(aiJson.records);
        }
      } catch (geminiErr: any) {
        console.warn('Gemini parser fallback activado:', geminiErr.message);
      }
    }

    // 2. Fallback heurístico local si Gemini no devolvió registros
    if (Object.keys(parsedRecords).length === 0) {
      if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed)) {
            parsedRecords = { movimientos: parsed };
            detectedEntities = ['movimientos'];
            summary = `Estructura JSON procesada con ${parsed.length} registros.`;
          } else if (typeof parsed === 'object') {
            parsedRecords = parsed;
            detectedEntities = Object.keys(parsed);
            summary = `Tablas JSON identificadas: ${detectedEntities.join(', ')}.`;
          }
        } catch {}
      }

      if (Object.keys(parsedRecords).length === 0) {
        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
        const rows = lines.slice(1).map(l => l.split(/[,;\t]/));
        parsedRecords = {
          movimientos: rows.slice(0, 50).map((r, i) => ({
            id_movimiento: `MOV-IA-${Date.now()}-${i}`,
            id_campania: defaultCampania || 'CAM-2026',
            fecha: new Date().toISOString().substring(0, 10),
            tipo: 'TRANSFERENCIA',
            id_subunidad_destino: defaultSubunidad || 'SUB-CRIA',
            cabezas: parseInt(r[1] || '1', 10) || 1,
            motivo: r[0] || 'Ingesta mediante IA',
          })),
        };
        detectedEntities = ['movimientos'];
        summary = `Archivo procesado con ${rows.length} registros tabulares.`;
      }
    }

    const totalRegistros = Object.values(parsedRecords).reduce(
      (acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    res.json({
      success: true,
      summary,
      detectedEntities,
      records: parsedRecords,
      totalRegistros,
    });
  } catch (err: any) {
    console.error('Error parseando modelo con IA:', err);
    res.status(500).json({ error: err.message || 'Error procesando modelo de datos con IA' });
  }
});

// 7. Iniciar Servidor con Vite
async function startServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servir estáticos en producción
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ERP Ovinos UNRC] Servidor iniciado en http://0.0.0.0:${port}`);
  });
}

startServer();
