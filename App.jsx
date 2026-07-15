import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  Home, Wallet, Briefcase, Heart, CheckSquare, Plus, X, PiggyBank,
  ChevronRight, ArrowLeft, Check, Users, Truck, Utensils, Dumbbell, Plane, Trash2,
  ArrowUpRight, TrendingUp, Baby, User, Building2, Receipt, CreditCard, Coins, Settings, Cloud,
} from "lucide-react";

/* ---------------------------------------------------------------
   Design tokens — minimalist, one accent per profile
--------------------------------------------------------------- */
const C = {
  bg: "#F5F6F8",       // app background
  surface: "#FFFFFF",  // cards
  soft: "#FAFBFC",     // faint fill
  line: "#EBEDF0",     // hairline borders
  ink: "#151B23",      // primary text
  inkSoft: "#6C7681",  // secondary text
  inkFaint: "#A7AEB7", // tertiary text
  personal: "#E15E38", // personal accent (warm)
  row: "#2E6F9E",      // Row Energy accent (blue)
  good: "#2F9E6A",     // income / positive
};

const alpha = (hex, a) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

const gastoCategorias = ["Nómina", "Gasolina", "Casetas", "Proveedores", "Otro"];
const gastoCatColors = { "Nómina": "#2E6F9E", "Gasolina": "#E15E38", "Casetas": "#3E9E8F", "Proveedores": "#7A6CD4", "Otro": "#6C7681" };

const catColors = { personal: "#E15E38", nuestros: "#5B8FB0", row: "#2E6F9E" };
const catLabels = { personal: "Personal", nuestros: "Nuestros proyectos", row: "Row Energy" };

const chartPalette = ["#2E6F9E", "#E15E38", "#3E9E8F", "#7A6CD4", "#E0A33E", "#6C7681", "#C05680", "#4A9E5C"];

/* ---------------------------------------------------------------
   Seed data
--------------------------------------------------------------- */
const seedApartados = [
  { id: "emma", nombre: "Emma", meta: null },
  { id: "esposa", nombre: "Esposa", meta: null },
  { id: "luis", nombre: "Luis", meta: null },
  { id: "ahorro", nombre: "Ahorro", meta: null },
  { id: "inversion", nombre: "Inversiones", meta: null },
];

const seedIngresos = [];
const seedEgresos = [];
const seedInversionesLog = [];

const seedProyNuestros = [];

const seedProyRow = [];

const seedTareas = [];

const seedSalud = { ejercicio: [], alimentacion: [], vacaciones: [] };

/* ---------------------------------------------------------------
   Building blocks
--------------------------------------------------------------- */
function Pill({ active, onClick, children, accent }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all"
      style={{
        background: active ? accent : C.surface,
        color: active ? C.surface : C.inkSoft,
        border: `1px solid ${active ? accent : C.line}`,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style, onClick, flat }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl mb-3"
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        boxShadow: flat ? "none" : "0 1px 2px rgba(21,27,35,0.04)",
        padding: 16,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function IconBadge({ Icon, color }) {
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: alpha(color, 0.1) }}>
      <Icon size={18} color={color} strokeWidth={2} />
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: alpha(color, 0.12), color }}>
      {children}
    </span>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

function Donut({ value, size = 108, stroke = 10, color, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.4s" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0 }} className="flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: C.inkFaint }}>{children}</p>;
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.inkSoft }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 13px", borderRadius: 12, border: `1px solid ${C.line}`,
  fontSize: 15, color: C.ink, background: C.soft, outline: "none", boxSizing: "border-box",
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(21,27,35,0.4)" }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl p-5 overflow-y-auto animate-slideup"
        style={{ background: C.surface, maxWidth: 448, maxHeight: "88%", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold display" style={{ color: C.ink }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.soft, color: C.inkSoft }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SidePanel({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ background: C.bg }}>
      <div className="w-full overflow-y-auto" style={{ maxWidth: 448, background: C.bg }}>
        <div className="sticky top-0 z-10 px-5 flex items-center gap-3"
          style={{ background: alpha(C.bg, 0.92), backdropFilter: "blur(8px)", paddingTop: "calc(14px + env(safe-area-inset-top))", paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}>
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-bold display truncate" style={{ color: C.ink }}>{title}</h2>
            {subtitle && <p className="text-xs truncate" style={{ color: C.inkSoft }}>{subtitle}</p>}
          </div>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, color }) {
  return (
    <button onClick={onClick} className="w-full py-3.5 rounded-2xl font-semibold text-[15px] mt-1 transition-transform active:scale-[0.99]" style={{ background: color, color: C.surface }}>
      {children}
    </button>
  );
}

function NavCard({ Icon, color, title, subtitle, onClick, full }) {
  return (
    <button onClick={onClick} className="text-left transition-transform active:scale-[0.98]" style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div className="rounded-2xl h-full" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 1px 2px rgba(21,27,35,0.04)", padding: 16 }}>
        <div className="flex items-start justify-between">
          <IconBadge Icon={Icon} color={color} />
          <ChevronRight size={18} color={C.inkFaint} />
        </div>
        <p className="font-bold display text-[15px] mt-3" style={{ color: C.ink }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{subtitle}</p>
      </div>
    </button>
  );
}

function BackButton({ onClick, label = "Menú" }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-[13px] font-semibold mb-3" style={{ color: C.inkSoft }}>
      <ArrowLeft size={16} /> {label}
    </button>
  );
}

function CategoryBreakdown({ data, total }) {
  if (!data.length) return <p className="text-sm" style={{ color: C.inkSoft }}>Aún no hay gastos para mostrar.</p>;
  return (
    <div className="space-y-2.5">
      {data.map(([cat, monto], i) => {
        const pct = total ? Math.round((monto / total) * 100) : 0;
        const color = chartPalette[i % chartPalette.length];
        return (
          <div key={cat}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[13px] font-medium" style={{ color: C.ink }}>{cat}</span>
              <span className="text-xs" style={{ color: C.inkSoft }}>{fmt(monto)} · {pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------
   App
--------------------------------------------------------------- */
function SpaceGate({ onEnter, configured }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }} className="flex items-center justify-center px-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');.display{font-family:'Space Grotesk',system-ui,sans-serif;letter-spacing:-0.01em;}`}</style>
      <div className="w-full" style={{ maxWidth: 360 }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center display font-bold text-xl mx-auto mb-5" style={{ background: C.personal, color: C.surface }}>N</div>
        <h1 className="display text-2xl font-bold text-center" style={{ color: C.ink }}>Nuestra App</h1>
        <p className="text-sm text-center mt-2 mb-6" style={{ color: C.inkSoft }}>
          Escribe la contraseña compartida. Tú y tu esposa deben usar la misma para ver y editar la misma información.
        </p>
        {!configured && (
          <p className="text-xs text-center mb-4 px-3 py-2 rounded-xl" style={{ color: C.personal, background: alpha(C.personal, 0.1) }}>
            Falta conectar Supabase. Revisa las variables en el archivo .env antes de desplegar.
          </p>
        )}
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Contraseña compartida"
          type="password"
          style={{ ...inputStyle, marginBottom: 12 }}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) onEnter(val.trim()); }}
        />
        <button onClick={() => val.trim() && onEnter(val.trim())} className="w-full py-3.5 rounded-2xl font-semibold text-[15px]" style={{ background: C.personal, color: C.surface }}>
          Entrar
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState("personal");
  const accent = profile === "personal" ? C.personal : C.row;

  const [tab, setTab] = useState("inicio");
  const resetSubs = () => { setFinSub(null); setSaludSub(null); setTaskFilter(null); };
  const goTab = (k) => { setTab(k); resetSubs(); };
  const switchProfile = (p) => { setProfile(p); setTab("inicio"); resetSubs(); };

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const resetForm = () => setForm({});
  const closeModal = () => { setModal(null); resetForm(); };

  const [detalleProyectoId, setDetalleProyectoId] = useState(null);
  const [detalleSub, setDetalleSub] = useState(null); // null = muestra los 3 recuadros

  const [apartados, setApartados] = useState(seedApartados);
  const [ingresos, setIngresos] = useState(seedIngresos);
  const [egresos, setEgresos] = useState(seedEgresos);
  const [inversionesLog, setInversionesLog] = useState(seedInversionesLog);

  const [proyNuestros, setProyNuestros] = useState(seedProyNuestros);
  const [proyRow, setProyRow] = useState(seedProyRow);

  const [tareas, setTareas] = useState(seedTareas);
  const [salud, setSalud] = useState(seedSalud);

  /* ---------- Sincronización en la nube (contraseña compartida) ---------- */
  const [spaceCode, setSpaceCode] = useState(() => (typeof localStorage !== "undefined" ? localStorage.getItem("na_space") : null));
  const [syncState, setSyncState] = useState("idle"); // idle | loading | ready | saving | error
  const hydrating = useRef(false);
  const dirty = useRef(false);
  const saveTimer = useRef(null);

  const currentDoc = () => ({ apartados, ingresos, egresos, inversionesLog, proyNuestros, proyRow, tareas, salud });

  const applyDoc = (d) => {
    if (!d) return;
    hydrating.current = true;
    setApartados(d.apartados ?? []);
    setIngresos(d.ingresos ?? []);
    setEgresos(d.egresos ?? []);
    setInversionesLog(d.inversionesLog ?? []);
    setProyNuestros(d.proyNuestros ?? []);
    setProyRow(d.proyRow ?? []);
    setTareas(d.tareas ?? []);
    setSalud(d.salud ?? { ejercicio: [], alimentacion: [], vacaciones: [] });
    setTimeout(() => { hydrating.current = false; }, 0);
  };

  const loadNow = async () => {
    if (!spaceCode || !supabase || dirty.current) return;
    const { data, error } = await supabase.rpc("get_space", { p_code: spaceCode });
    if (error) { setSyncState("error"); return; }
    if (data) applyDoc(data);
    else await supabase.rpc("save_space", { p_code: spaceCode, p_data: currentDoc() });
    setSyncState("ready");
  };

  // cargar al entrar + refrescar al volver a la app y cada 20s
  useEffect(() => {
    if (!spaceCode || !supabase) return;
    setSyncState("loading");
    loadNow();
    const onVis = () => { if (document.visibilityState === "visible") loadNow(); };
    document.addEventListener("visibilitychange", onVis);
    const iv = setInterval(loadNow, 20000);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceCode]);

  // guardar (con retraso) cuando cambie cualquier dato
  useEffect(() => {
    if (!spaceCode || !supabase || hydrating.current) return;
    dirty.current = true;
    setSyncState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.rpc("save_space", { p_code: spaceCode, p_data: currentDoc() });
      dirty.current = false;
      setSyncState(error ? "error" : "ready");
    }, 700);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartados, ingresos, egresos, inversionesLog, proyNuestros, proyRow, tareas, salud]);

  const enterSpace = (code) => { localStorage.setItem("na_space", code); setSpaceCode(code); };
  const leaveSpace = () => { localStorage.removeItem("na_space"); setSpaceCode(null); };

  const [finSub, setFinSub] = useState(null);
  const [taskFilter, setTaskFilter] = useState(null);
  const [saludSub, setSaludSub] = useState(null);

  /* -------- derived (personal) -------- */
  const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
  const totalEgresos = egresos.reduce((s, i) => s + i.monto, 0);
  const balanceGeneral = totalIngresos - totalEgresos;

  const mesActual = todayISO().slice(0, 7);
  // Presupuesto del mes: solo egresos marcados como presupuesto (renta, despensa, servicios, Emma). Excluye gastos personales.
  const presupuestoMes = egresos
    .filter((e) => e.presupuesto && (e.fecha || "").slice(0, 7) === mesActual)
    .reduce((s, e) => s + e.monto, 0);

  const egresosPorCategoria = () => {
    const map = {};
    egresos.forEach((e) => { map[e.categoria] = (map[e.categoria] || 0) + e.monto; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  const apartadoBalance = (id) => {
    const asignado = ingresos.reduce((s, i) => s + (i.allocations || []).filter((a) => a.apartadoId === id).reduce((x, a) => x + a.monto, 0), 0);
    const gastado = egresos.filter((e) => e.apartadoId === id).reduce((s, e) => s + e.monto, 0);
    return asignado - gastado;
  };

  const ahorroApartado = apartados.find((a) => a.id === "ahorro");
  const ahorroBalance = apartadoBalance("ahorro");
  const ahorroPct = ahorroApartado?.meta ? Math.round((ahorroBalance / ahorroApartado.meta) * 100) : 0;

  const activosRow = proyRow.filter((p) => p.estado === "Activo").length;
  const tareasAbiertas = tareas.filter((t) => !t.hecho);

  const pendienteCobrar = proyNuestros.filter((p) => p.estado === "Activo").reduce((s, p) => s + Math.max(0, (p.montoTotal || 0) - (p.anticipos || 0)), 0);

  const proximaVacacion = [...salud.vacaciones].sort((a, b) => a.fecha.localeCompare(b.fecha)).find((v) => v.fecha >= todayISO()) || salud.vacaciones[0];

  /* -------- derived (row) -------- */
  const avanceRow = (p) => (p.eventos.length ? Math.max(...p.eventos.map((e) => e.avance)) : 0);
  const gastadoProyecto = (p) => (p.gastos || []).reduce((s, g) => s + g.monto, 0);
  const cobradoProyecto = (p) => (p.ingresosProyecto || []).reduce((s, i) => s + i.monto, 0);
  const cuentaPorCobrar = (p) => Math.max(0, (p.montoProyecto || 0) - cobradoProyecto(p));
  const cuentaPorPagar = (p) => (p.proveedores || []).reduce((s, pr) => s + pr.montoAdeudado, 0);

  const proyRowActivos = proyRow.filter((p) => p.estado === "Activo");
  const gastadoRowActivo = proyRowActivos.reduce((s, p) => s + gastadoProyecto(p), 0);
  const presupuestoRowActivo = proyRowActivos.reduce((s, p) => s + (p.montoProyecto || 0), 0);
  const gastadoRowPct = presupuestoRowActivo ? Math.round((gastadoRowActivo / presupuestoRowActivo) * 100) : 0;

  const proveedoresResumen = () => {
    const res = {};
    proyRow.forEach((p) => {
      (p.proveedores || []).forEach((pr) => {
        if (pr.montoAdeudado <= 0) return;
        if (!res[pr.nombre]) res[pr.nombre] = [];
        res[pr.nombre].push({ proyecto: p.proyecto || p.cliente, monto: pr.montoAdeudado });
      });
    });
    return res;
  };

  const detalleProyecto = proyRow.find((p) => p.id === detalleProyectoId);

  /* -------- add handlers (personal) -------- */
  const addIngreso = () => {
    if (!form.monto || !form.categoria) return;
    setIngresos([{ id: uid(), monto: Number(form.monto), categoria: form.categoria, fecha: form.fecha || todayISO(), allocations: form.allocations || [] }, ...ingresos]);
    closeModal();
  };
  const addEgreso = () => {
    if (!form.monto || !form.categoria) return;
    setEgresos([{ id: uid(), monto: Number(form.monto), categoria: form.categoria, fecha: form.fecha || todayISO(), apartadoId: form.apartadoId || null, presupuesto: !!form.presupuesto }, ...egresos]);
    closeModal();
  };
  const addApartado = () => {
    if (!form.nombre) return;
    setApartados([...apartados, { id: uid(), nombre: form.nombre.trim(), meta: form.meta ? Number(form.meta) : null }]);
    closeModal();
  };
  const addInversionLog = () => {
    if (!form.monto || !form.tipo) return;
    setInversionesLog([{ id: uid(), monto: Number(form.monto), tipo: form.tipo, fecha: form.fecha || todayISO() }, ...inversionesLog]);
    closeModal();
  };

  const addAllocRow = () => setForm({ ...form, allocations: [...(form.allocations || []), { apartadoId: apartados[0].id, monto: "" }] });
  const setAllocRow = (i, field, value) => {
    const rows = [...(form.allocations || [])];
    rows[i] = { ...rows[i], [field]: value };
    setForm({ ...form, allocations: rows });
  };
  const removeAllocRow = (i) => setForm({ ...form, allocations: (form.allocations || []).filter((_, idx) => idx !== i) });
  const allocSum = (form.allocations || []).reduce((s, a) => s + (Number(a.monto) || 0), 0);

  const addProyNuestro = () => {
    if (!form.cliente) return;
    setProyNuestros([{
      id: uid(), cliente: form.cliente, inicio: form.inicio || todayISO(), fin: form.fin || todayISO(),
      avance: Number(form.avance) || 0, montoTotal: Number(form.montoTotal) || 0, anticipos: Number(form.anticipos) || 0,
      proveedores: [], estado: "Activo",
    }, ...proyNuestros]);
    closeModal();
  };
  const addProveedorDeuda = (proyectoId) => {
    if (!form.nombreProveedor || !form.montoProveedor) return;
    setProyNuestros(proyNuestros.map((p) => p.id === proyectoId ? { ...p, proveedores: [...p.proveedores, { id: uid(), nombre: form.nombreProveedor, monto: Number(form.montoProveedor) }] } : p));
    closeModal();
  };

  /* -------- add handlers (row) -------- */
  const addProyRow = () => {
    if (!form.cliente) return;
    setProyRow([{
      id: uid(), cliente: form.cliente, proyecto: form.proyecto || "",
      montoProyecto: Number(form.montoProyecto) || 0, estado: "Activo",
      eventos: [], proveedores: [], gastos: [], ingresosProyecto: [],
    }, ...proyRow]);
    closeModal();
  };
  const addEvento = (proyectoId) => {
    if (!form.inicio || !form.fin || form.avance === undefined) return;
    setProyRow(proyRow.map((p) => p.id === proyectoId ? { ...p, eventos: [...p.eventos, { id: uid(), inicio: form.inicio, fin: form.fin, avance: Number(form.avance) }] } : p));
    closeModal();
  };
  const addGastoRow = (proyectoId) => {
    if (!form.monto || !form.categoriaGasto) return;
    setProyRow(proyRow.map((p) => {
      if (p.id !== proyectoId) return p;
      const nuevoGasto = { id: uid(), monto: Number(form.monto), categoria: form.categoriaGasto, fecha: form.fecha || todayISO(), nota: form.nota || "" };
      let proveedoresActualizados = p.proveedores;
      if (form.categoriaGasto === "Proveedores" && form.proveedorId) {
        proveedoresActualizados = p.proveedores.map((pr) => pr.id === form.proveedorId ? { ...pr, montoAdeudado: Math.max(0, pr.montoAdeudado - Number(form.monto)) } : pr);
      }
      return { ...p, gastos: [nuevoGasto, ...p.gastos], proveedores: proveedoresActualizados };
    }));
    closeModal();
  };
  const addIngresoRow = (proyectoId) => {
    if (!form.monto) return;
    setProyRow(proyRow.map((p) => p.id === proyectoId ? { ...p, ingresosProyecto: [{ id: uid(), monto: Number(form.monto), fecha: form.fecha || todayISO(), nota: form.nota || "" }, ...p.ingresosProyecto] } : p));
    closeModal();
  };
  const addProveedorRow = (proyectoId) => {
    if (!form.nombreProveedor || !form.montoProveedor) return;
    setProyRow(proyRow.map((p) => {
      if (p.id !== proyectoId) return p;
      const nombre = form.nombreProveedor.trim();
      const existente = p.proveedores.find((pr) => pr.nombre.toLowerCase() === nombre.toLowerCase());
      if (existente) {
        return { ...p, proveedores: p.proveedores.map((pr) => pr.id === existente.id ? { ...pr, montoAdeudado: pr.montoAdeudado + Number(form.montoProveedor) } : pr) };
      }
      return { ...p, proveedores: [...p.proveedores, { id: uid(), nombre, montoAdeudado: Number(form.montoProveedor) }] };
    }));
    closeModal();
  };

  const addTarea = () => {
    if (!form.texto) return;
    const categoria = profile === "row" ? "row" : form.categoria || "personal";
    setTareas([{ id: uid(), texto: form.texto, categoria, hecho: false }, ...tareas]);
    closeModal();
  };
  const toggleTarea = (id) => setTareas(tareas.map((t) => (t.id === id ? { ...t, hecho: !t.hecho } : t)));
  const deleteTarea = (id) => setTareas(tareas.filter((t) => t.id !== id));

  const addSalud = () => {
    if (saludSub === "ejercicio" && form.tipo) setSalud({ ...salud, ejercicio: [{ id: uid(), tipo: form.tipo, duracion: Number(form.duracion) || 0, fecha: form.fecha || todayISO() }, ...salud.ejercicio] });
    else if (saludSub === "alimentacion" && form.nota) setSalud({ ...salud, alimentacion: [{ id: uid(), nota: form.nota, fecha: form.fecha || todayISO() }, ...salud.alimentacion] });
    else if (saludSub === "vacaciones" && form.destino) setSalud({ ...salud, vacaciones: [{ id: uid(), destino: form.destino, fecha: form.fecha || todayISO(), estado: form.estado || "Planeado" }, ...salud.vacaciones] });
    else return;
    closeModal();
  };

  const fabAction = () => {
    if (profile === "personal") {
      if (tab === "finanzas") setModal(finSub === "ingresos" ? "ingreso" : finSub === "egresos" ? "egreso" : finSub === "inversiones" ? "inversionLog" : finSub === "apartados" ? "apartado" : null);
      else if (tab === "proyectos") setModal("proyNuestro");
      else if (tab === "pendientes") setModal("tarea");
      else if (tab === "salud") setModal("salud");
    } else {
      if (tab === "proyectos") setModal("proyRow");
      else if (tab === "pendientes") setModal("tarea");
    }
  };
  const fabVisible = (() => {
    if (tab === "inicio" || tab === "proveedores") return false;
    if (profile === "personal") {
      if (tab === "finanzas") return finSub !== null;
      if (tab === "salud") return saludSub !== null;
      if (tab === "pendientes") return taskFilter !== null;
      if (tab === "proyectos") return true;
      return false;
    }
    return tab === "proyectos" || tab === "pendientes";
  })();

  const personalNav = [
    { key: "inicio", icon: Home, label: "Inicio" },
    { key: "finanzas", icon: Wallet, label: "Finanzas" },
    { key: "proyectos", icon: Briefcase, label: "Proyectos" },
    { key: "salud", icon: Heart, label: "Salud" },
    { key: "pendientes", icon: CheckSquare, label: "Tareas" },
  ];
  const rowNav = [
    { key: "inicio", icon: Home, label: "Inicio" },
    { key: "proyectos", icon: Briefcase, label: "Proyectos" },
    { key: "proveedores", icon: Building2, label: "Proveedores" },
    { key: "pendientes", icon: CheckSquare, label: "Tareas" },
  ];
  const navItems = profile === "personal" ? personalNav : rowNav;

  const pageTitle =
    tab === "inicio" ? (profile === "personal" ? "Nuestro día a día" : "Panorama") :
    tab === "finanzas" ? "Finanzas" : tab === "proyectos" ? "Proyectos" : tab === "salud" ? "Salud" :
    tab === "proveedores" ? "Proveedores" : "Pendientes";

  const openDetalle = (id) => { setDetalleProyectoId(id); setDetalleSub(null); };
  const closeDetalle = () => { setDetalleProyectoId(null); setDetalleSub(null); };

  if (!spaceCode) return <SpaceGate onEnter={enterSpace} configured={!!supabase} />;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        .display { font-family: 'Space Grotesk', system-ui, sans-serif; letter-spacing: -0.01em; }
        @keyframes slideup { from { transform: translateY(24px); opacity: 0.6 } to { transform: translateY(0); opacity: 1 } }
        .animate-slideup { animation: slideup 0.22s ease-out; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div className="mx-auto relative" style={{ maxWidth: 448, minHeight: "100dvh", background: C.bg }}>
        {/* Header */}
        <div className="px-5" style={{ paddingTop: "calc(20px + env(safe-area-inset-top))" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center display font-bold text-[15px] flex-shrink-0"
                style={{ background: accent, color: C.surface }}>
                {profile === "personal" ? "L" : "RE"}
              </div>
              <div>
                <p className="text-xs" style={{ color: C.inkSoft }}>{profile === "personal" ? "Hola," : "Empresa"}</p>
                <p className="font-bold display text-[15px]" style={{ color: C.ink }}>{profile === "personal" ? "Luis" : "Row Energy"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setModal("config")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                <Settings size={16} />
              </button>
              <div className="flex gap-1 p-1 rounded-full" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <button onClick={() => switchProfile("personal")} className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: profile === "personal" ? C.personal : "transparent" }}>
                <Home size={16} color={profile === "personal" ? C.surface : C.inkSoft} />
              </button>
              <button onClick={() => switchProfile("row")} className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: profile === "row" ? C.row : "transparent" }}>
                <Briefcase size={16} color={profile === "row" ? C.surface : C.inkSoft} />
              </button>
            </div>
            </div>
          </div>
          <h1 className="display text-2xl font-bold mb-4" style={{ color: C.ink }}>{pageTitle}</h1>
        </div>

        <div className="px-4" style={{ paddingBottom: 130 }}>
          {/* ============ PERSONAL: INICIO ============ */}
          {profile === "personal" && tab === "inicio" && (
            <>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <SectionLabel>Plan de ahorro</SectionLabel>
                    <p className="text-xs" style={{ color: C.inkSoft }}>Ahorrado</p>
                    <p className="display text-2xl font-bold" style={{ color: C.ink }}>{fmt(ahorroBalance)}</p>
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>Meta {fmt(ahorroApartado?.meta)}</p>
                  </div>
                  <Donut value={ahorroPct} color={C.personal}>
                    <span className="display text-xl font-bold" style={{ color: C.ink }}>{ahorroPct}%</span>
                    <PiggyBank size={13} color={C.personal} className="mt-0.5" />
                  </Donut>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Card style={{ marginBottom: 0 }}>
                  <IconBadge Icon={Wallet} color={C.row} />
                  <p className="text-xs mt-3" style={{ color: C.inkSoft }}>Disponible</p>
                  <p className="display text-lg font-bold" style={{ color: C.ink }}>{fmt(balanceGeneral)}</p>
                </Card>
                <Card style={{ marginBottom: 0 }}>
                  <IconBadge Icon={ArrowUpRight} color={C.good} />
                  <p className="text-xs mt-3" style={{ color: C.inkSoft }}>Por cobrar</p>
                  <p className="display text-lg font-bold" style={{ color: C.ink }}>{fmt(pendienteCobrar)}</p>
                </Card>
              </div>

              <SectionLabel>Apartados</SectionLabel>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {["emma", "esposa", "luis"].map((id) => {
                  const a = apartados.find((x) => x.id === id);
                  const Icon = id === "emma" ? Baby : User;
                  return (
                    <Card key={id} style={{ marginBottom: 0, padding: 12, textAlign: "center" }}>
                      <Icon size={16} color={accent} className="mx-auto mb-1.5" />
                      <p className="text-[11px]" style={{ color: C.inkSoft }}>{a.nombre}</p>
                      <p className="text-[13px] font-bold" style={{ color: C.ink }}>{fmt(apartadoBalance(id))}</p>
                    </Card>
                  );
                })}
              </div>

              {proximaVacacion && (
                <Card style={{ background: C.ink, border: "none" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Plane size={15} color={C.surface} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: alpha("#FFFFFF", 0.6) }}>Próximas vacaciones</span>
                  </div>
                  <p className="display text-lg font-bold" style={{ color: C.surface }}>{proximaVacacion.destino}</p>
                  <p className="text-xs" style={{ color: alpha("#FFFFFF", 0.6) }}>{proximaVacacion.fecha} · {proximaVacacion.estado}</p>
                </Card>
              )}

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-bold display" style={{ color: C.ink }}>Próximas tareas</span>
                  <button onClick={() => goTab("pendientes")} style={{ color: C.inkFaint }}><ChevronRight size={18} /></button>
                </div>
                {tareasAbiertas.filter((t) => t.categoria !== "row").length === 0 && <p className="text-sm" style={{ color: C.inkSoft }}>Sin pendientes. Buen trabajo.</p>}
                {tareasAbiertas.filter((t) => t.categoria !== "row").slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 py-2">
                    <button onClick={() => toggleTarea(t.id)} className="w-5 h-5 rounded-md border-2 flex-shrink-0" style={{ borderColor: catColors[t.categoria] }} />
                    <span className="text-sm flex-1" style={{ color: C.ink }}>{t.texto}</span>
                    <Badge color={catColors[t.categoria]}>{catLabels[t.categoria]}</Badge>
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* ============ PERSONAL: FINANZAS ============ */}
          {profile === "personal" && tab === "finanzas" && (
            <>
              {finSub === null && (
                <div className="grid grid-cols-2 gap-3">
                  <NavCard Icon={ArrowUpRight} color={C.good} title="Ingresos" subtitle={fmt(totalIngresos)} onClick={() => setFinSub("ingresos")} />
                  <NavCard Icon={Wallet} color={C.personal} title="Egresos" subtitle={fmt(totalEgresos)} onClick={() => setFinSub("egresos")} />
                  <NavCard Icon={PiggyBank} color={C.row} title="Apartados" subtitle={`${apartados.length} apartados`} onClick={() => setFinSub("apartados")} />
                  <NavCard Icon={Coins} color="#7A6CD4" title="Inversiones" subtitle={fmt(inversionesLog.reduce((s, i) => s + i.monto, 0))} onClick={() => setFinSub("inversiones")} />
                </div>
              )}

              {finSub !== null && <BackButton onClick={() => setFinSub(null)} />}

              {finSub === "ingresos" && (
                <>
                  <Card>
                    <SectionLabel>Total ingresos</SectionLabel>
                    <p className="display text-2xl font-bold" style={{ color: C.good }}>{fmt(totalIngresos)}</p>
                  </Card>
                  {ingresos.map((i) => (
                    <Card key={i.id} style={{ padding: 14 }}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <IconBadge Icon={ArrowUpRight} color={C.good} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: C.ink }}>{i.categoria}</p>
                            <p className="text-xs" style={{ color: C.inkSoft }}>{i.fecha}</p>
                            {i.allocations && i.allocations.length > 0 && (
                              <p className="text-[11px] mt-1" style={{ color: C.inkFaint }}>
                                {i.allocations.map((a) => `${apartados.find((x) => x.id === a.apartadoId)?.nombre}: ${fmt(a.monto)}`).join(" · ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-bold display" style={{ color: C.good }}>+{fmt(i.monto)}</span>
                      </div>
                    </Card>
                  ))}
                </>
              )}

              {finSub === "egresos" && (
                <>
                  <Card>
                    <div className="flex justify-between items-start">
                      <div>
                        <SectionLabel>Total egresos</SectionLabel>
                        <p className="display text-2xl font-bold" style={{ color: C.ink }}>{fmt(totalEgresos)}</p>
                      </div>
                      <div className="text-right">
                        <SectionLabel>Presupuesto del mes</SectionLabel>
                        <p className="display text-lg font-bold" style={{ color: C.personal }}>{fmt(presupuestoMes)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <SectionLabel>Gastos por categoría</SectionLabel>
                    <CategoryBreakdown data={egresosPorCategoria()} total={totalEgresos} />
                  </Card>
                  {egresos.map((i) => (
                    <Card key={i.id} style={{ padding: 14 }}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <IconBadge Icon={Wallet} color={C.personal} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: C.ink }}>{i.categoria}</p>
                              {i.presupuesto && <Badge color={C.personal}>Presupuesto</Badge>}
                            </div>
                            <p className="text-xs" style={{ color: C.inkSoft }}>{i.fecha}{i.apartadoId ? ` · ${apartados.find((a) => a.id === i.apartadoId)?.nombre}` : ""}</p>
                          </div>
                        </div>
                        <span className="font-bold display" style={{ color: C.ink }}>-{fmt(i.monto)}</span>
                      </div>
                    </Card>
                  ))}
                </>
              )}

              {finSub === "apartados" && (
                <>
                  {apartados.map((a) => (
                    <Card key={a.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold display" style={{ color: C.ink }}>{a.nombre}</span>
                        <span className="font-bold display" style={{ color: C.ink }}>{fmt(apartadoBalance(a.id))}</span>
                      </div>
                      {a.meta && (
                        <>
                          <div className="mt-2"><ProgressBar value={Math.round((apartadoBalance(a.id) / a.meta) * 100)} color={C.personal} /></div>
                          <p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>Meta {fmt(a.meta)}</p>
                        </>
                      )}
                    </Card>
                  ))}
                  <button className="text-[13px] font-semibold flex items-center gap-1.5 px-1 mb-3" style={{ color: C.row }} onClick={() => { resetForm(); setModal("apartado"); }}>
                    <Plus size={15} /> Nuevo apartado
                  </button>
                  <p className="text-xs text-center mt-1 px-4" style={{ color: C.inkFaint }}>
                    Asigna dinero a un apartado al registrar un ingreso, y descuéntalo eligiéndolo al registrar un egreso.
                  </p>
                </>
              )}

              {finSub === "inversiones" && (
                <>
                  <Card>
                    <SectionLabel>Total invertido</SectionLabel>
                    <p className="display text-2xl font-bold" style={{ color: C.ink }}>{fmt(inversionesLog.reduce((s, i) => s + i.monto, 0))}</p>
                  </Card>
                  {inversionesLog.map((i) => (
                    <Card key={i.id} style={{ padding: 14 }}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <IconBadge Icon={Coins} color={C.row} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: C.ink }}>{i.tipo}</p>
                            <p className="text-xs" style={{ color: C.inkSoft }}>{i.fecha}</p>
                          </div>
                        </div>
                        <span className="font-bold display" style={{ color: C.ink }}>{fmt(i.monto)}</span>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </>
          )}

          {/* ============ PERSONAL: PROYECTOS ============ */}
          {profile === "personal" && tab === "proyectos" && (
            <>
              {proyNuestros.map((p) => (
                <Card key={p.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold display" style={{ color: C.ink }}>{p.cliente}</p>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{p.inicio} — {p.fin}</p>
                    </div>
                    <Badge color={C.personal}>{p.estado}</Badge>
                  </div>
                  <ProgressBar value={p.avance} color={C.personal} />
                  <p className="text-xs mt-1.5 mb-3" style={{ color: C.inkSoft }}>{p.avance}% de avance</p>
                  <div className="flex justify-between text-xs mb-3" style={{ color: C.inkSoft }}>
                    <span>Total <b className="display" style={{ color: C.ink }}>{fmt(p.montoTotal)}</b></span>
                    <span>Anticipos <b className="display" style={{ color: C.ink }}>{fmt(p.anticipos)}</b></span>
                    <span>Por cobrar <b className="display" style={{ color: C.ink }}>{fmt(Math.max(0, p.montoTotal - p.anticipos))}</b></span>
                  </div>
                  {p.proveedores.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {p.proveedores.map((prov) => (
                        <div key={prov.id} className="flex justify-between text-xs px-3 py-2 rounded-xl" style={{ background: C.soft }}>
                          <span style={{ color: C.inkSoft }}>Se le debe a {prov.nombre}</span>
                          <span className="display" style={{ color: C.ink, fontWeight: 700 }}>{fmt(prov.monto)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: accent }} onClick={() => { resetForm(); setModal({ deuda: p.id }); }}>
                    <Plus size={15} /> Agregar deuda a proveedor
                  </button>
                </Card>
              ))}
            </>
          )}

          {/* ============ PERSONAL: SALUD ============ */}
          {profile === "personal" && tab === "salud" && (
            <>
              {saludSub === null && (
                <div className="grid grid-cols-2 gap-3">
                  <NavCard Icon={Dumbbell} color={C.row} title="Ejercicio" subtitle={`${salud.ejercicio.length} registros`} onClick={() => setSaludSub("ejercicio")} />
                  <NavCard Icon={Utensils} color={C.good} title="Alimentación" subtitle={`${salud.alimentacion.length} registros`} onClick={() => setSaludSub("alimentacion")} />
                  <NavCard Icon={Plane} color={C.personal} title="Vacaciones" subtitle={proximaVacacion ? proximaVacacion.destino : "Sin planes"} onClick={() => setSaludSub("vacaciones")} full />
                </div>
              )}

              {saludSub !== null && <BackButton onClick={() => setSaludSub(null)} />}

              {saludSub === "ejercicio" && salud.ejercicio.map((e) => (
                <Card key={e.id} style={{ padding: 14 }}>
                  <div className="flex items-center gap-3">
                    <IconBadge Icon={Dumbbell} color={C.row} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.ink }}>{e.tipo}</p>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{e.duracion} min · {e.fecha}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {saludSub === "alimentacion" && salud.alimentacion.map((a) => (
                <Card key={a.id} style={{ padding: 14 }}>
                  <div className="flex items-center gap-3">
                    <IconBadge Icon={Utensils} color={C.good} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.ink }}>{a.nota}</p>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{a.fecha}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {saludSub === "vacaciones" && salud.vacaciones.map((v) => (
                <Card key={v.id} style={{ padding: 14 }}>
                  <div className="flex items-center gap-3">
                    <IconBadge Icon={Plane} color={C.personal} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.ink }}>{v.destino}</p>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{v.fecha}</p>
                    </div>
                    <Badge color={C.personal}>{v.estado}</Badge>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ============ ROW: INICIO ============ */}
          {profile === "row" && tab === "inicio" && (
            <>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <SectionLabel>Gastado vs presupuesto</SectionLabel>
                    <p className="text-xs" style={{ color: C.inkSoft }}>Gastado</p>
                    <p className="display text-xl font-bold" style={{ color: C.ink }}>{fmt(gastadoRowActivo)}</p>
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>Balance {fmt(presupuestoRowActivo - gastadoRowActivo)}</p>
                  </div>
                  <Donut value={gastadoRowPct} color={C.row}>
                    <span className="display text-xl font-bold" style={{ color: C.ink }}>{gastadoRowPct}%</span>
                    <TrendingUp size={13} color={C.row} className="mt-0.5" />
                  </Donut>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Card style={{ marginBottom: 0 }}>
                  <IconBadge Icon={Briefcase} color={C.row} />
                  <p className="text-xs mt-3" style={{ color: C.inkSoft }}>Proyectos activos</p>
                  <p className="display text-lg font-bold" style={{ color: C.ink }}>{activosRow}</p>
                </Card>
                <Card style={{ marginBottom: 0 }}>
                  <IconBadge Icon={Wallet} color={C.personal} />
                  <p className="text-xs mt-3" style={{ color: C.inkSoft }}>Presupuesto</p>
                  <p className="display text-base font-bold" style={{ color: C.ink }}>{fmt(presupuestoRowActivo)}</p>
                </Card>
              </div>

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-bold display" style={{ color: C.ink }}>Pendientes</span>
                  <button onClick={() => goTab("pendientes")} style={{ color: C.inkFaint }}><ChevronRight size={18} /></button>
                </div>
                {tareasAbiertas.filter((t) => t.categoria === "row").length === 0 && <p className="text-sm" style={{ color: C.inkSoft }}>Sin pendientes de Row Energy.</p>}
                {tareasAbiertas.filter((t) => t.categoria === "row").slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 py-2">
                    <button onClick={() => toggleTarea(t.id)} className="w-5 h-5 rounded-md border-2 flex-shrink-0" style={{ borderColor: C.row }} />
                    <span className="text-sm flex-1" style={{ color: C.ink }}>{t.texto}</span>
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* ============ ROW: PROYECTOS ============ */}
          {profile === "row" && tab === "proyectos" && (
            <>
              {proyRow.map((p) => (
                <Card key={p.id} onClick={() => openDetalle(p.id)}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-bold display" style={{ color: C.ink }}>{p.proyecto || p.cliente}</p>
                      <p className="text-xs flex items-center gap-1" style={{ color: C.inkSoft }}><Users size={12} />{p.cliente}</p>
                    </div>
                    <Badge color={C.row}>{p.estado}</Badge>
                  </div>
                  <div className="mt-2"><ProgressBar value={avanceRow(p)} color={C.row} /></div>
                  <p className="text-xs mt-1.5 mb-3" style={{ color: C.inkSoft }}>{avanceRow(p)}% de avance</p>
                  <div className="flex justify-between text-xs mb-3" style={{ color: C.inkSoft }}>
                    <span>Monto <b className="display" style={{ color: C.ink }}>{fmt(p.montoProyecto)}</b></span>
                    <span>Gastado <b className="display" style={{ color: C.ink }}>{fmt(gastadoProyecto(p))}</b></span>
                  </div>
                  <div className="flex gap-2.5 mb-3">
                    <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: C.soft }}>
                      <p className="text-[10px]" style={{ color: C.inkSoft }}>Por cobrar</p>
                      <p className="text-sm font-bold display" style={{ color: C.good }}>{fmt(cuentaPorCobrar(p))}</p>
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: C.soft }}>
                      <p className="text-[10px]" style={{ color: C.inkSoft }}>Por pagar</p>
                      <p className="text-sm font-bold display" style={{ color: C.personal }}>{fmt(cuentaPorPagar(p))}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: accent }} onClick={(e) => { e.stopPropagation(); resetForm(); setModal({ evento: p.id }); }}>
                      <Plus size={15} /> Evento de avance
                    </button>
                    <button className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: C.inkSoft }} onClick={(e) => { e.stopPropagation(); openDetalle(p.id); }}>
                      <Receipt size={15} /> Ver detalle
                    </button>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ============ ROW: PROVEEDORES ============ */}
          {profile === "row" && tab === "proveedores" && (
            <>
              {Object.entries(proveedoresResumen()).length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: C.inkSoft }}>Aún no registras deudas con proveedores.</p>
              )}
              {Object.entries(proveedoresResumen()).map(([nombre, items]) => (
                <Card key={nombre}>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <IconBadge Icon={Truck} color={C.row} />
                      <span className="font-bold display" style={{ color: C.ink }}>{nombre}</span>
                    </div>
                    <span className="font-bold display" style={{ color: C.personal }}>{fmt(items.reduce((s, x) => s + x.monto, 0))}</span>
                  </div>
                  <SectionLabel>Cuentas por pagar</SectionLabel>
                  <div className="space-y-1.5">
                    {items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs px-3 py-2 rounded-xl" style={{ background: C.soft }}>
                        <span style={{ color: C.inkSoft }}>{it.proyecto}</span>
                        <span className="display" style={{ color: C.ink, fontWeight: 700 }}>{fmt(it.monto)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ============ PENDIENTES (ambos) ============ */}
          {tab === "pendientes" && (
            <>
              {profile === "personal" && taskFilter === null && (
                <div className="grid grid-cols-2 gap-3">
                  <NavCard Icon={CheckSquare} color={accent} title="Todas"
                    subtitle={`${tareasAbiertas.filter((t) => t.categoria !== "row").length} abiertas`}
                    onClick={() => setTaskFilter("todas")} full />
                  <NavCard Icon={User} color={catColors.personal} title="Personal"
                    subtitle={`${tareasAbiertas.filter((t) => t.categoria === "personal").length} abiertas`}
                    onClick={() => setTaskFilter("personal")} />
                  <NavCard Icon={Briefcase} color={catColors.nuestros} title="Nuestros proyectos"
                    subtitle={`${tareasAbiertas.filter((t) => t.categoria === "nuestros").length} abiertas`}
                    onClick={() => setTaskFilter("nuestros")} />
                </div>
              )}

              {profile === "personal" && taskFilter !== null && <BackButton onClick={() => setTaskFilter(null)} />}

              {(profile === "row" || taskFilter !== null) && tareas
                .filter((t) => (profile === "row" ? t.categoria === "row" : t.categoria !== "row" && (taskFilter === "todas" || t.categoria === taskFilter)))
                .map((t) => (
                  <Card key={t.id} style={{ padding: 14, opacity: t.hecho ? 0.6 : 1 }}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTarea(t.id)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: catColors[t.categoria], background: t.hecho ? catColors[t.categoria] : "transparent" }}>
                        {t.hecho && <Check size={14} color={C.surface} />}
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: t.hecho ? C.inkSoft : C.ink, textDecoration: t.hecho ? "line-through" : "none" }}>{t.texto}</p>
                        {profile === "personal" && <div className="mt-1"><Badge color={catColors[t.categoria]}>{catLabels[t.categoria]}</Badge></div>}
                      </div>
                      <button onClick={() => deleteTarea(t.id)} style={{ color: C.inkFaint }}><Trash2 size={16} /></button>
                    </div>
                  </Card>
                ))}
            </>
          )}
        </div>

        {/* FAB + Bottom nav (anchored to the app column, centered on any screen) */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-40">
          <div className="relative w-full" style={{ maxWidth: 448 }}>
            {fabVisible && (
              <button onClick={fabAction}
                className="absolute rounded-full flex items-center justify-center pointer-events-auto transition-transform active:scale-95"
                style={{ width: 54, height: 54, right: 20, bottom: 82, background: accent, color: C.surface, boxShadow: `0 8px 24px ${alpha(accent, 0.4)}` }}>
                <Plus size={24} />
              </button>
            )}
            <div className="px-4 pointer-events-auto" style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom))" }}>
              <div className="flex justify-around items-center py-2 px-2 rounded-full"
                style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 6px 24px rgba(21,27,35,0.1)" }}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.key;
                  return (
                    <button key={item.key} onClick={() => goTab(item.key)} className="flex flex-col items-center px-2 py-1.5">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ background: active ? accent : "transparent" }}>
                        <Icon size={19} color={active ? C.surface : C.inkFaint} strokeWidth={active ? 2.4 : 2} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ============ PROJECT DETAIL (Row) — three big cards ============ */}
        {detalleProyecto && (
          <SidePanel title={detalleProyecto.proyecto || detalleProyecto.cliente} subtitle={detalleProyecto.cliente} onClose={closeDetalle}>
            {/* MENU: three large cards */}
            {detalleSub === null && (
              <div className="space-y-3">
                <button onClick={() => setDetalleSub("gastos")} className="w-full text-left">
                  <Card style={{ marginBottom: 0 }}>
                    <div className="flex items-center gap-3.5">
                      <IconBadge Icon={Receipt} color={C.row} />
                      <div className="flex-1">
                        <p className="font-bold display text-[15px]" style={{ color: C.ink }}>Historial de gastos</p>
                        <p className="text-xs" style={{ color: C.inkSoft }}>Total gastado {fmt(gastadoProyecto(detalleProyecto))}</p>
                      </div>
                      <ChevronRight size={20} color={C.inkFaint} />
                    </div>
                  </Card>
                </button>

                <button onClick={() => setDetalleSub("pagar")} className="w-full text-left">
                  <Card style={{ marginBottom: 0 }}>
                    <div className="flex items-center gap-3.5">
                      <IconBadge Icon={CreditCard} color={C.personal} />
                      <div className="flex-1">
                        <p className="font-bold display text-[15px]" style={{ color: C.ink }}>Cuentas por pagar</p>
                        <p className="text-xs" style={{ color: C.inkSoft }}>Total por pagar {fmt(cuentaPorPagar(detalleProyecto))}</p>
                      </div>
                      <ChevronRight size={20} color={C.inkFaint} />
                    </div>
                  </Card>
                </button>

                <button onClick={() => setDetalleSub("cobrar")} className="w-full text-left">
                  <Card style={{ marginBottom: 0 }}>
                    <div className="flex items-center gap-3.5">
                      <IconBadge Icon={Coins} color={C.good} />
                      <div className="flex-1">
                        <p className="font-bold display text-[15px]" style={{ color: C.ink }}>Cuentas por cobrar</p>
                        <p className="text-xs" style={{ color: C.inkSoft }}>Pendiente {fmt(cuentaPorCobrar(detalleProyecto))}</p>
                      </div>
                      <ChevronRight size={20} color={C.inkFaint} />
                    </div>
                  </Card>
                </button>

                {/* progress events summary */}
                {detalleProyecto.eventos.length > 0 && (
                  <Card style={{ marginBottom: 0 }}>
                    <SectionLabel>Eventos de avance</SectionLabel>
                    <div className="space-y-1.5">
                      {detalleProyecto.eventos.map((e) => (
                        <div key={e.id} className="flex justify-between text-xs px-3 py-2 rounded-xl" style={{ background: C.soft }}>
                          <span style={{ color: C.inkSoft }}>{e.inicio} → {e.fin}</span>
                          <span className="display" style={{ color: C.ink, fontWeight: 700 }}>{e.avance}%</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* back control when inside a section */}
            {detalleSub !== null && (
              <button onClick={() => setDetalleSub(null)} className="flex items-center gap-1.5 text-[13px] font-semibold mb-3" style={{ color: C.inkSoft }}>
                <ArrowLeft size={16} /> Volver
              </button>
            )}

            {detalleSub === "gastos" && (
              <>
                <Card>
                  <SectionLabel>Total gastado</SectionLabel>
                  <p className="display text-2xl font-bold" style={{ color: C.ink }}>{fmt(gastadoProyecto(detalleProyecto))}</p>
                </Card>
                {detalleProyecto.gastos.length === 0 && <p className="text-sm text-center py-3" style={{ color: C.inkSoft }}>Sin gastos registrados.</p>}
                {detalleProyecto.gastos.map((g) => (
                  <Card key={g.id} style={{ padding: 14 }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge color={gastoCatColors[g.categoria]}>{g.categoria}</Badge>
                        <p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>{g.fecha}{g.nota ? ` · ${g.nota}` : ""}</p>
                      </div>
                      <span className="font-bold display" style={{ color: C.ink }}>-{fmt(g.monto)}</span>
                    </div>
                  </Card>
                ))}
                <button className="text-[13px] font-semibold flex items-center gap-1.5 mt-1 px-1" style={{ color: C.row }}
                  onClick={() => { resetForm(); setModal({ gastoRow: detalleProyecto.id }); }}>
                  <Plus size={15} /> Agregar gasto
                </button>
              </>
            )}

            {detalleSub === "pagar" && (
              <>
                <Card>
                  <SectionLabel>Total por pagar</SectionLabel>
                  <p className="display text-2xl font-bold" style={{ color: C.personal }}>{fmt(cuentaPorPagar(detalleProyecto))}</p>
                </Card>
                {detalleProyecto.proveedores.length === 0 && <p className="text-sm text-center py-3" style={{ color: C.inkSoft }}>Sin proveedores registrados.</p>}
                {detalleProyecto.proveedores.map((prov) => (
                  <Card key={prov.id} style={{ padding: 14 }}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold" style={{ color: C.ink }}>{prov.nombre}</span>
                      <span className="font-bold display" style={{ color: C.ink }}>{fmt(prov.montoAdeudado)}</span>
                    </div>
                  </Card>
                ))}
                <button className="text-[13px] font-semibold flex items-center gap-1.5 mt-1 px-1" style={{ color: C.personal }}
                  onClick={() => { resetForm(); setModal({ proveedorRow: detalleProyecto.id }); }}>
                  <Plus size={15} /> Agregar proveedor / deuda
                </button>
              </>
            )}

            {detalleSub === "cobrar" && (
              <>
                <Card>
                  <SectionLabel>Pendiente por cobrar</SectionLabel>
                  <p className="display text-2xl font-bold" style={{ color: C.good }}>{fmt(cuentaPorCobrar(detalleProyecto))}</p>
                  <p className="text-xs mt-1" style={{ color: C.inkSoft }}>De un total de {fmt(detalleProyecto.montoProyecto)}</p>
                </Card>
                {detalleProyecto.ingresosProyecto.length === 0 && <p className="text-sm text-center py-3" style={{ color: C.inkSoft }}>Sin pagos registrados.</p>}
                {detalleProyecto.ingresosProyecto.map((ing) => (
                  <Card key={ing.id} style={{ padding: 14 }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.ink }}>{ing.nota || "Pago recibido"}</p>
                        <p className="text-xs" style={{ color: C.inkSoft }}>{ing.fecha}</p>
                      </div>
                      <span className="font-bold display" style={{ color: C.good }}>+{fmt(ing.monto)}</span>
                    </div>
                  </Card>
                ))}
                <button className="text-[13px] font-semibold flex items-center gap-1.5 mt-1 px-1" style={{ color: C.good }}
                  onClick={() => { resetForm(); setModal({ ingresoRow: detalleProyecto.id }); }}>
                  <Plus size={15} /> Registrar ingreso
                </button>
              </>
            )}
          </SidePanel>
        )}

        {/* ============ MODALS ============ */}
        {modal === "ingreso" && (
          <Modal title="Nuevo ingreso" onClose={closeModal}>
            <Field label="Monto"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Field>
            <Field label="Categoría"><input style={inputStyle} placeholder="Sueldo, proyecto, etc." onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></Field>
            <Field label="Fecha"><input type="date" style={inputStyle} defaultValue={todayISO()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <Field label="Asignar a apartados (opcional)">
              {(form.allocations || []).map((row, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <select style={{ ...inputStyle, flex: 1.4 }} value={row.apartadoId} onChange={(e) => setAllocRow(i, "apartadoId", e.target.value)}>
                    {apartados.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  <input type="number" style={{ ...inputStyle, flex: 1 }} placeholder="Monto" value={row.monto} onChange={(e) => setAllocRow(i, "monto", e.target.value)} />
                  <button onClick={() => removeAllocRow(i)} style={{ color: C.inkSoft }}><X size={18} /></button>
                </div>
              ))}
              <button onClick={addAllocRow} className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: C.personal }}><Plus size={15} /> Agregar apartado</button>
              {form.monto && <p className="text-xs mt-2" style={{ color: C.inkSoft }}>Sin asignar {fmt(Number(form.monto) - allocSum)}</p>}
            </Field>
            <PrimaryButton onClick={addIngreso} color={C.good}>Guardar ingreso</PrimaryButton>
          </Modal>
        )}

        {modal === "egreso" && (
          <Modal title="Nuevo egreso" onClose={closeModal}>
            <Field label="Monto"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Field>
            <Field label="Categoría"><input style={inputStyle} placeholder="Renta, despensa, etc." onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></Field>
            <Field label="Apartado (opcional)">
              <select style={inputStyle} value={form.apartadoId || ""} onChange={(e) => setForm({ ...form, apartadoId: e.target.value || null })}>
                <option value="">General (sin apartado)</option>
                {apartados.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </Field>
            <Field label="Fecha"><input type="date" style={inputStyle} defaultValue={todayISO()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <Field label="¿Parte del presupuesto mensual?">
              <div className="flex gap-2">
                {[["Sí", true], ["No", false]].map(([lbl, val]) => (
                  <button key={lbl} onClick={() => setForm({ ...form, presupuesto: val })} className="px-3 py-2 rounded-xl text-xs font-semibold flex-1"
                    style={{ background: !!form.presupuesto === val ? C.personal : C.soft, color: !!form.presupuesto === val ? C.surface : C.ink, border: `1px solid ${C.line}` }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: C.inkFaint }}>Incluye renta, despensa, servicios y gastos de Emma. Excluye gastos personales.</p>
            </Field>
            <PrimaryButton onClick={addEgreso} color={C.personal}>Guardar egreso</PrimaryButton>
          </Modal>
        )}

        {modal === "apartado" && (
          <Modal title="Nuevo apartado" onClose={closeModal}>
            <Field label="Nombre"><input style={inputStyle} placeholder="Ej. Escuela, Emergencias, Auto" onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
            <Field label="Meta de ahorro (opcional)"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, meta: e.target.value })} /></Field>
            <PrimaryButton onClick={addApartado} color={C.row}>Guardar apartado</PrimaryButton>
          </Modal>
        )}

        {modal === "config" && (
          <Modal title="Configuración" onClose={closeModal}>
            <div className="mb-3">
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Contraseña compartida</p>
              <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                Tú y tu esposa usan la misma contraseña para ver y editar la misma información. Cámbienla solo si quieren empezar un espacio nuevo y en blanco.
              </p>
            </div>
            <div className="rounded-xl px-3 py-2.5 mb-4 flex items-center justify-between" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
              <span className="text-sm display" style={{ color: C.ink }}>{"•".repeat(Math.min(10, (spaceCode || "").length))}</span>
              <span className="text-[11px] flex items-center gap-1" style={{ color: syncState === "ready" ? C.good : syncState === "error" ? C.personal : C.inkSoft }}>
                <Cloud size={13} />
                {syncState === "ready" ? "Sincronizado" : syncState === "saving" ? "Guardando…" : syncState === "loading" ? "Cargando…" : syncState === "error" ? "Sin conexión" : "—"}
              </span>
            </div>
            <button onClick={() => { leaveSpace(); closeModal(); }} className="w-full py-3.5 rounded-2xl font-semibold text-[15px]" style={{ background: C.soft, color: C.personal, border: `1px solid ${C.line}` }}>
              Cerrar sesión en este dispositivo
            </button>
            <p className="text-[11px] text-center mt-3" style={{ color: C.inkFaint }}>Tus datos siguen guardados en la nube; solo se cierra aquí.</p>
          </Modal>
        )}

        {modal === "inversionLog" && (
          <Modal title="Nueva inversión" onClose={closeModal}>
            <Field label="Monto"><input type="number" style={inputStyle} placeholder="500" onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Field>
            <Field label="Tipo"><input style={inputStyle} placeholder="Cetes, fondo, etc." onChange={(e) => setForm({ ...form, tipo: e.target.value })} /></Field>
            <Field label="Fecha"><input type="date" style={inputStyle} defaultValue={todayISO()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <PrimaryButton onClick={addInversionLog} color={C.row}>Guardar inversión</PrimaryButton>
          </Modal>
        )}

        {modal === "proyNuestro" && (
          <Modal title="Nuevo proyecto propio" onClose={closeModal}>
            <Field label="Cliente"><input style={inputStyle} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></Field>
            <div className="flex gap-2">
              <Field label="Inicio"><input type="date" style={inputStyle} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></Field>
              <Field label="Fin"><input type="date" style={inputStyle} onChange={(e) => setForm({ ...form, fin: e.target.value })} /></Field>
            </div>
            <Field label="Avance (%)"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, avance: e.target.value })} /></Field>
            <div className="flex gap-2">
              <Field label="Monto total"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, montoTotal: e.target.value })} /></Field>
              <Field label="Anticipos"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, anticipos: e.target.value })} /></Field>
            </div>
            <PrimaryButton onClick={addProyNuestro} color={C.personal}>Guardar proyecto</PrimaryButton>
          </Modal>
        )}

        {modal && typeof modal === "object" && modal.deuda && (
          <Modal title="Agregar deuda a proveedor" onClose={closeModal}>
            <Field label="Proveedor"><input style={inputStyle} onChange={(e) => setForm({ ...form, nombreProveedor: e.target.value })} /></Field>
            <Field label="Monto adeudado"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, montoProveedor: e.target.value })} /></Field>
            <PrimaryButton onClick={() => addProveedorDeuda(modal.deuda)} color={C.personal}>Guardar</PrimaryButton>
          </Modal>
        )}

        {modal === "proyRow" && (
          <Modal title="Nuevo proyecto Row Energy" onClose={closeModal}>
            <Field label="Cliente"><input style={inputStyle} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></Field>
            <Field label="Nombre del proyecto"><input style={inputStyle} onChange={(e) => setForm({ ...form, proyecto: e.target.value })} /></Field>
            <Field label="Monto del proyecto"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, montoProyecto: e.target.value })} /></Field>
            <PrimaryButton onClick={addProyRow} color={C.row}>Guardar proyecto</PrimaryButton>
          </Modal>
        )}

        {modal && typeof modal === "object" && modal.evento && (
          <Modal title="Agregar evento de avance" onClose={closeModal}>
            <div className="flex gap-2">
              <Field label="Inicio"><input type="date" style={inputStyle} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></Field>
              <Field label="Fin"><input type="date" style={inputStyle} onChange={(e) => setForm({ ...form, fin: e.target.value })} /></Field>
            </div>
            <Field label="Avance acumulado (%)"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, avance: e.target.value })} /></Field>
            <PrimaryButton onClick={() => addEvento(modal.evento)} color={C.row}>Guardar evento</PrimaryButton>
          </Modal>
        )}

        {modal && typeof modal === "object" && modal.gastoRow && (
          <Modal title="Nuevo gasto del proyecto" onClose={closeModal}>
            <Field label="Categoría">
              <div className="flex gap-2 flex-wrap">
                {gastoCategorias.map((cat) => (
                  <button key={cat} onClick={() => setForm({ ...form, categoriaGasto: cat })} className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: form.categoriaGasto === cat ? gastoCatColors[cat] : C.soft, color: form.categoriaGasto === cat ? C.surface : C.ink, border: `1px solid ${C.line}` }}>
                    {cat}
                  </button>
                ))}
              </div>
            </Field>
            {form.categoriaGasto === "Proveedores" && (
              <Field label="Proveedor">
                <select style={inputStyle} value={form.proveedorId || ""} onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}>
                  <option value="">Selecciona un proveedor</option>
                  {(proyRow.find((p) => p.id === modal.gastoRow)?.proveedores || []).map((pr) => (
                    <option key={pr.id} value={pr.id}>{pr.nombre} (debe {fmt(pr.montoAdeudado)})</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Monto"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Field>
            <Field label="Nota (opcional)"><input style={inputStyle} placeholder="Detalle del gasto" onChange={(e) => setForm({ ...form, nota: e.target.value })} /></Field>
            <Field label="Fecha"><input type="date" style={inputStyle} defaultValue={todayISO()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <PrimaryButton onClick={() => addGastoRow(modal.gastoRow)} color={C.row}>Guardar gasto</PrimaryButton>
          </Modal>
        )}

        {modal && typeof modal === "object" && modal.proveedorRow && (
          <Modal title="Agregar proveedor / deuda" onClose={closeModal}>
            <Field label="Proveedor"><input style={inputStyle} placeholder="Nombre del proveedor" onChange={(e) => setForm({ ...form, nombreProveedor: e.target.value })} /></Field>
            <Field label="Monto adeudado"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, montoProveedor: e.target.value })} /></Field>
            <PrimaryButton onClick={() => addProveedorRow(modal.proveedorRow)} color={C.personal}>Guardar</PrimaryButton>
          </Modal>
        )}

        {modal && typeof modal === "object" && modal.ingresoRow && (
          <Modal title="Registrar ingreso del proyecto" onClose={closeModal}>
            <Field label="Monto"><input type="number" style={inputStyle} placeholder="0" onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Field>
            <Field label="Nota (opcional)"><input style={inputStyle} placeholder="Anticipo, pago final, etc." onChange={(e) => setForm({ ...form, nota: e.target.value })} /></Field>
            <Field label="Fecha"><input type="date" style={inputStyle} defaultValue={todayISO()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <PrimaryButton onClick={() => addIngresoRow(modal.ingresoRow)} color={C.good}>Guardar ingreso</PrimaryButton>
          </Modal>
        )}

        {modal === "tarea" && (
          <Modal title="Nueva tarea" onClose={closeModal}>
            <Field label="Descripción"><input style={inputStyle} placeholder="¿Qué hay que hacer?" onChange={(e) => setForm({ ...form, texto: e.target.value })} /></Field>
            {profile === "personal" && (
              <Field label="Categoría">
                <div className="flex gap-2">
                  {["personal", "nuestros"].map((k) => (
                    <button key={k} onClick={() => setForm({ ...form, categoria: k })} className="px-3 py-2 rounded-xl text-xs font-semibold flex-1"
                      style={{ background: form.categoria === k ? catColors[k] : C.soft, color: form.categoria === k ? C.surface : C.ink, border: `1px solid ${C.line}` }}>
                      {catLabels[k]}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <PrimaryButton onClick={addTarea} color={accent}>Guardar tarea</PrimaryButton>
          </Modal>
        )}

        {modal === "salud" && (
          <Modal title={`Registrar ${saludSub}`} onClose={closeModal}>
            {saludSub === "ejercicio" && (
              <>
                <Field label="Tipo de ejercicio"><input style={inputStyle} placeholder="Caminata, gym, etc." onChange={(e) => setForm({ ...form, tipo: e.target.value })} /></Field>
                <Field label="Duración (min)"><input type="number" style={inputStyle} placeholder="30" onChange={(e) => setForm({ ...form, duracion: e.target.value })} /></Field>
              </>
            )}
            {saludSub === "alimentacion" && <Field label="Nota"><input style={inputStyle} placeholder="¿Qué comieron hoy?" onChange={(e) => setForm({ ...form, nota: e.target.value })} /></Field>}
            {saludSub === "vacaciones" && (
              <>
                <Field label="Destino"><input style={inputStyle} onChange={(e) => setForm({ ...form, destino: e.target.value })} /></Field>
                <Field label="Estado"><input style={inputStyle} placeholder="Planeado, confirmado, etc." onChange={(e) => setForm({ ...form, estado: e.target.value })} /></Field>
              </>
            )}
            <Field label="Fecha"><input type="date" style={inputStyle} defaultValue={todayISO()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <PrimaryButton onClick={addSalud} color={C.personal}>Guardar</PrimaryButton>
          </Modal>
        )}
      </div>
    </div>
  );
}
