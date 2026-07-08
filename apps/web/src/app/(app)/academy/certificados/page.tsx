'use client';

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  GraduationCap,
  MapPin,
  Plus,
  Printer,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState, type ClipboardEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useAcademyDashboard } from '@/features/academy/api';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function fechaHoy(): string {
  const h = new Date();
  return `${h.getDate()} de ${MESES[h.getMonth()]} del ${h.getFullYear()}`;
}

export default function CertificadosPage(): ReactNode {
  const { data } = useAcademyDashboard();
  const programas = data?.programs ?? [];
  const alumnos = data?.students ?? [];

  const [programId, setProgramId] = useState('');
  const [taller, setTaller] = useState('');
  const [horas, setHoras] = useState('');
  const [modalidad, setModalidad] = useState('Presencial');
  const [fecha, setFecha] = useState(fechaHoy());
  const [participantes, setParticipantes] = useState<string[]>(['']);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const nombres = useMemo(
    () => participantes.map((n) => n.trim()).filter(Boolean),
    [participantes],
  );

  // Cuántos alumnos inscritos tiene el programa elegido (para el botón de carga).
  const inscritos = useMemo(
    () =>
      programId ? alumnos.filter((s) => s.enrollments.some((e) => e.program.id === programId)) : [],
    [alumnos, programId],
  );

  function elegirPrograma(id: string): void {
    setProgramId(id);
    const p = programas.find((x) => x.id === id);
    if (!p) return;
    setTaller(p.title);
    if (p.duration) setHoras(p.duration.match(/\d+/)?.[0] ?? p.duration);
    if (p.modality) setModalidad(p.modality);
  }

  function cargarInscritos(): void {
    const names = inscritos.map((s) => `${s.firstName} ${s.lastName ?? ''}`.trim()).filter(Boolean);
    setParticipantes(names.length > 0 ? names : ['']);
  }

  function setNombre(i: number, val: string): void {
    setParticipantes((prev) => prev.map((n, j) => (j === i ? val : n)));
  }
  function agregarEn(i: number): void {
    setParticipantes((prev) => {
      const c = [...prev];
      c.splice(i + 1, 0, '');
      return c;
    });
    setTimeout(() => inputsRef.current[i + 1]?.focus(), 0);
  }
  function quitar(i: number): void {
    setParticipantes((prev) => (prev.length === 1 ? [''] : prev.filter((_, j) => j !== i)));
  }
  function pegar(i: number, e: ClipboardEvent<HTMLInputElement>): void {
    const text = e.clipboardData.getData('text');
    if (!/\r?\n/.test(text)) return; // pegado de una sola línea → comportamiento normal
    e.preventDefault();
    const lineas = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lineas.length === 0) return;
    setParticipantes((prev) => {
      const c = [...prev];
      c.splice(i, 1, ...lineas);
      return c.filter((v, j) => v !== '' || j === c.length - 1);
    });
  }

  function imprimirCertificados(): void {
    openCertificatesPrintWindow({
      nombres,
      taller,
      horas,
      modalidad,
      fecha,
      origin: window.location.origin,
    });
  }

  return (
    <div className="space-y-6">
      {/* Formulario (no se imprime) */}
      <div className="print:hidden">
        <Link
          href="/academy"
          className="inline-flex items-center gap-1.5 text-sm text-content-muted transition hover:text-brand-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Academia
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-3xl text-content">Certificados</h1>
              <p className="text-sm text-content-muted">
                Genera certificados de participación de tus talleres, en lote.
              </p>
            </div>
          </div>
          <Button
            variant="brand"
            size="lg"
            onClick={imprimirCertificados}
            disabled={nombres.length === 0}
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF ({nombres.length})
          </Button>
        </div>

        {/* Datos del taller */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1 sm:grid-cols-2">
          {programas.length > 0 && (
            <Campo label="Programa (opcional — precarga los datos)" className="sm:col-span-2">
              <select
                value={programId}
                onChange={(e) => elegirPrograma(e.target.value)}
                className={inputClass}
              >
                <option value="">— Escribir manualmente —</option>
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Campo>
          )}
          <Campo label="Taller / Tema" className="sm:col-span-2">
            <input
              value={taller}
              onChange={(e) => setTaller(e.target.value)}
              placeholder="Negociación y cierre de ventas inmobiliarias"
              className={inputClass}
            />
          </Campo>
          <Campo label="Duración (horas académicas)">
            <input
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="6"
              className={inputClass}
            />
          </Campo>
          <Campo label="Modalidad">
            <input
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              placeholder="Presencial"
              className={inputClass}
            />
          </Campo>
          <Campo label="Fecha del taller" className="sm:col-span-2">
            <input
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              placeholder="10 de junio del 2023"
              className={inputClass}
            />
          </Campo>
        </div>

        {/* Participantes */}
        <div className="mt-4 rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-content">Participantes</span>
            <div className="flex items-center gap-2">
              {programId && inscritos.length > 0 && (
                <button
                  type="button"
                  onClick={cargarInscritos}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 px-3 py-1 text-xs font-semibold text-brand-deep transition hover:bg-brand-tint"
                >
                  <Users className="h-3.5 w-3.5" />
                  Cargar {inscritos.length} alumno{inscritos.length === 1 ? '' : 's'} inscrito
                  {inscritos.length === 1 ? '' : 's'}
                </button>
              )}
              <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-semibold text-brand-deep">
                {nombres.length} certificado{nombres.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <ul className="space-y-2">
            {participantes.map((n, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand">
                  {i + 1}
                </span>
                <input
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  value={n}
                  onChange={(e) => setNombre(i, e.target.value)}
                  onPaste={(e) => pegar(i, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarEn(i);
                    }
                  }}
                  placeholder="Nombre completo del participante"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  title="Quitar"
                  aria-label="Quitar participante"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-content-muted transition hover:bg-danger/10 hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => agregarEn(participantes.length - 1)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong py-2.5 text-sm font-medium text-content-secondary transition hover:border-brand hover:text-brand-deep"
          >
            <Plus className="h-4 w-4" />
            Agregar participante
          </button>
          <p className="mt-2 text-xs text-content-muted">
            Tip: pega una lista de nombres (uno por línea) y se reparte sola. Presiona{' '}
            <b className="text-content-secondary">Enter</b> para añadir otro.
          </p>
        </div>

        {nombres.length > 0 && (
          <h2 className="mb-2 mt-8 text-sm font-semibold text-content-muted">Vista previa</h2>
        )}
      </div>

      {/* Certificados (uno por participante) */}
      <div className="space-y-6 print:space-y-0">
        {nombres.map((nombre, i) => (
          <div
            key={i}
            className="cert-page mx-auto w-full max-w-[980px] overflow-hidden rounded-xl shadow-elevation-2 print:max-w-none print:rounded-none print:shadow-none"
          >
            <Certificado
              nombre={nombre}
              taller={taller}
              horas={horas}
              modalidad={modalidad}
              fecha={fecha}
            />
          </div>
        ))}
        {nombres.length === 0 && (
          <p className="rounded-xl border border-dashed border-border-strong p-10 text-center text-sm text-content-muted print:hidden">
            Agrega participantes arriba para ver los certificados.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface CertificatesPrintPayload {
  nombres: string[];
  taller: string;
  horas: string;
  modalidad: string;
  fecha: string;
  origin: string;
}

function openCertificatesPrintWindow(payload: CertificatesPrintPayload): void {
  const popup = window.open('', '_blank', 'width=1200,height=840');
  if (!popup) {
    window.print();
    return;
  }

  popup.document.write(buildCertificatesPrintHtml(payload));
  popup.document.close();
}

function buildCertificatesPrintHtml({
  nombres,
  taller,
  horas,
  modalidad,
  fecha,
  origin,
}: CertificatesPrintPayload): string {
  const bg = `${origin}/brand/certificate-bg.png`;
  const logo = `${origin}/brand/logo-monogram.png`;
  const pages = nombres
    .map((nombre) =>
      certificatePrintPage({
        nombre,
        taller: taller || 'Nombre del taller',
        horas: horas || '-',
        modalidad: modalidad || '-',
        fecha: fecha || '-',
        bg,
        logo,
      }),
    )
    .join('');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Certificados Academia FV</title>
    <style>
      @page { size: A4 landscape; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #eee8dc; color: ${INK}; }
      body { font-family: Arial, Helvetica, sans-serif; }
      .toolbar {
        position: sticky; top: 0; z-index: 10; display: flex; justify-content: center; gap: 10px;
        padding: 12px; background: #faf7f0; border-bottom: 1px solid #d8cebb;
      }
      .toolbar button {
        border: 0; border-radius: 8px; padding: 10px 16px; cursor: pointer;
        background: ${GOLD}; color: white; font-weight: 700; font-size: 14px;
      }
      .toolbar .muted { background: #f2ece0; color: ${INK}; }
      .cert-page {
        width: 297mm; height: 210mm; margin: 12px auto; position: relative; overflow: hidden;
        background: ${CREAM}; page-break-after: always; break-after: page;
        box-shadow: 0 10px 35px rgba(27, 26, 24, .18);
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .cert-page:last-child { page-break-after: auto; break-after: auto; }
      .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: left center; }
      .wash, .glow { position: absolute; inset: 0; pointer-events: none; }
      .wash { background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.08) 24%, rgba(255,255,255,.2) 52%, rgba(255,255,255,.18) 100%); }
      .glow { background: radial-gradient(58% 64% at 62% 48%, rgba(255,255,255,.36) 0%, rgba(255,255,255,.2) 52%, rgba(255,255,255,0) 82%); }
      .frame { position: absolute; inset: 5.5mm; border: .35mm solid ${GOLD}; }
      .bottom-rule {
        position: absolute; left: 5.5mm; right: 51mm; bottom: 5.5mm; height: .35mm;
        background: linear-gradient(90deg, transparent 0%, ${GOLD} 18%, ${GOLD} 82%, transparent 100%);
        opacity: .7;
      }
      .flourish { position: absolute; width: 48mm; height: 48mm; opacity: .45; }
      .flourish.top { top: 7mm; right: 7mm; }
      .flourish.bottom { bottom: 7mm; left: 7mm; transform: rotate(180deg); }
      .content {
        position: absolute; inset: 7mm 21mm 9mm 74mm; display: flex; flex-direction: column;
        align-items: center; justify-content: space-between; text-align: center;
      }
      .logo { width: 27mm; height: 21mm; object-fit: contain; filter: drop-shadow(0 2px 2px rgba(0,0,0,.1)); }
      .brand { margin-top: 1mm; font-family: Georgia, 'Times New Roman', serif; font-size: 6.1mm; letter-spacing: .28em; padding-left: .28em; }
      .subbrand { display: flex; align-items: center; gap: 2.4mm; margin-top: 1.5mm; color: ${GOLD_DEEP}; font-size: 2.7mm; letter-spacing: .42em; padding-left: .42em; }
      .subbrand span { width: 7mm; height: .18mm; background: ${GOLD}; }
      h1 {
        margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 18.5mm;
        line-height: 1; letter-spacing: .1em; padding-left: .1em; font-weight: 400;
      }
      .participacion { display: flex; align-items: center; justify-content: center; gap: 3mm; margin-top: 2mm; color: ${GOLD_DEEP}; font-size: 4.4mm; letter-spacing: .34em; padding-left: .34em; }
      .dash { display: inline-flex; align-items: center; gap: 1mm; }
      .dash:before { content: ''; width: 7mm; height: .22mm; background: ${GOLD}; display: block; }
      .diamond { width: 1.6mm; height: 1.6mm; background: ${GOLD}; transform: rotate(45deg); display: inline-block; }
      .lead { margin: 9mm 0 0; color: ${INK_SOFT}; font-size: 4mm; }
      .name {
        margin: 1.5mm 0 2mm; font-family: Georgia, 'Times New Roman', serif; color: ${GOLD};
        font-weight: 700; line-height: 1.05; letter-spacing: .05em; white-space: nowrap;
      }
      .divider { display: flex; align-items: center; gap: 2mm; width: 70%; }
      .divider:before, .divider:after { content: ''; flex: 1; height: .25mm; background: ${GOLD}; opacity: .6; }
      .text { color: ${INK_SOFT}; font-size: 3.85mm; line-height: 1.45; }
      .workshop { margin: 1.5mm 0; max-width: 92%; font-family: Georgia, 'Times New Roman', serif; font-size: 5.9mm; font-weight: 700; line-height: 1.12; text-transform: uppercase; }
      .description { max-width: 78%; }
      .details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; width: 74%; margin-top: 7mm; }
      .detail { display: flex; align-items: center; gap: 2.4mm; text-align: left; min-width: 0; }
      .detail-icon { width: 8mm; height: 8mm; display: grid; place-items: center; color: ${GOLD}; font-size: 6mm; }
      .detail strong { display: block; font-size: 3.3mm; color: ${INK}; }
      .detail span { display: block; font-size: 3.1mm; color: ${INK_SOFT}; }
      .signature-row { width: 100%; display: flex; align-items: flex-end; justify-content: space-between; padding-top: 2mm; }
      .signature-space { width: 54mm; }
      .signature { text-align: center; transform: translateX(6mm); }
      .script { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size: 10mm; line-height: 1; }
      .sig-line { width: 54mm; height: .3mm; background: ${INK}; opacity: .7; margin: .8mm auto 1.6mm; }
      .sig-name { font-family: Georgia, 'Times New Roman', serif; font-size: 3.7mm; font-weight: 700; letter-spacing: .12em; }
      .sig-role { margin-top: .9mm; color: ${GOLD_DEEP}; font-size: 2.8mm; letter-spacing: .24em; }
      .seal {
        width: 38mm; height: 38mm; border: .7mm solid ${GOLD}; border-radius: 50%;
        display: grid; place-items: center; color: ${GOLD}; font-family: Georgia, 'Times New Roman', serif;
        position: relative;
      }
      .seal:before { content: ''; position: absolute; inset: 3.5mm; border: .3mm solid ${GOLD}; border-radius: 50%; opacity: .7; }
      .seal-main { font-size: 15mm; font-weight: 700; z-index: 1; }
      @media print {
        html, body { width: 297mm; min-height: 210mm; background: white; }
        .toolbar { display: none; }
        .cert-page { margin: 0; box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button onclick="window.print()">Guardar como PDF / Imprimir</button>
      <button class="muted" onclick="window.close()">Cerrar</button>
    </div>
    ${pages}
    <script>
      async function readyToPrint() {
        const imgs = Array.from(document.images);
        await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
          img.onload = resolve; img.onerror = resolve;
        })));
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        setTimeout(() => { window.focus(); window.print(); }, 250);
      }
      window.addEventListener('load', readyToPrint);
    </script>
  </body>
</html>`;
}

function certificatePrintPage({
  nombre,
  taller,
  horas,
  modalidad,
  fecha,
  bg,
  logo,
}: {
  nombre: string;
  taller: string;
  horas: string;
  modalidad: string;
  fecha: string;
  bg: string;
  logo: string;
}): string {
  const safeName = escapeHtml(nombre);
  const nameSize = Math.max(7.2, Math.min(14.4, 260 / Math.max(nombre.length, 1)));

  return `<section class="cert-page">
    <img class="bg" src="${escapeAttribute(bg)}" alt="">
    <div class="wash"></div>
    <div class="glow"></div>
    <div class="frame"></div>
    <div class="bottom-rule"></div>
    ${flourishSvg('top')}
    ${flourishSvg('bottom')}
    <div class="content">
      <header>
        <img class="logo" src="${escapeAttribute(logo)}" alt="Faviola Velarde">
        <div class="brand">FAVIOLA VELARDE</div>
        <div class="subbrand"><span></span>ASESORIA PATRIMONIAL<span></span></div>
      </header>
      <main>
        <h1>CERTIFICADO</h1>
        <div class="participacion"><span class="dash"></span><span>DE PARTICIPACION</span><span class="dash"><i class="diamond"></i></span></div>
        <p class="lead">Se otorga el presente certificado a:</p>
        <p class="name" style="font-size: ${nameSize}mm;">${safeName}</p>
        <div class="divider"><span class="diamond"></span></div>
        <p class="text" style="margin-top: 6mm;">Por haber participado en el taller:</p>
        <p class="workshop">${escapeHtml(taller)}</p>
        <p class="text description">Desarrollado por Faviola Velarde - Asesoria Patrimonial, con una duracion de ${escapeHtml(horas)} horas academicas.</p>
        <div class="details">
          <div class="detail"><div class="detail-icon">▣</div><div><strong>Fecha:</strong><span>${escapeHtml(fecha)}</span></div></div>
          <div class="detail"><div class="detail-icon">○</div><div><strong>Duracion:</strong><span>${escapeHtml(horas)} horas academicas</span></div></div>
          <div class="detail"><div class="detail-icon">⌖</div><div><strong>Modalidad:</strong><span>${escapeHtml(modalidad)}</span></div></div>
        </div>
      </main>
      <footer class="signature-row">
        <div class="signature-space"></div>
        <div class="signature">
          <div class="script">Faviola Velarde</div>
          <div class="sig-line"></div>
          <div class="sig-name">FAVIOLA VELARDE</div>
          <div class="sig-role">ASESORA PATRIMONIAL</div>
        </div>
        <div class="signature-space" style="display:flex; justify-content:flex-end;"><div class="seal"><div class="seal-main">FV</div></div></div>
      </footer>
    </div>
  </section>`;
}

function flourishSvg(position: 'top' | 'bottom'): string {
  return `<svg class="flourish ${position}" viewBox="0 0 120 120" fill="none" stroke="${GOLD}" stroke-width=".8">
    <path d="M120 0 C70 8 30 30 8 78"></path>
    <path d="M120 12 C76 20 40 42 20 88"></path>
    <path d="M120 24 C84 32 52 54 34 96"></path>
    <path d="M120 36 C92 44 66 64 50 100"></path>
  </svg>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function Campo({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-content-secondary">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

/* ── El certificado (recreación de marca Faviola Velarde) ──────────────
   Colores fijos (crema/dorado) para que se imprima idéntico incluso en
   modo oscuro. Escala con unidades de contenedor (cqw) según su ancho. */
const GOLD = '#a9884e';
const GOLD_DEEP = '#8a6a38';
const INK = '#1b1a18';
const INK_SOFT = '#5c5647';
const CREAM = '#faf7f0';

function Certificado({
  nombre,
  taller,
  horas,
  modalidad,
  fecha,
}: {
  nombre: string;
  taller: string;
  horas: string;
  modalidad: string;
  fecha: string;
}): ReactNode {
  const display = nombre || 'Nombre del participante';
  const nameSize = Math.max(2.3, Math.min(4.6, 82 / display.length));

  const rootStyle: React.CSSProperties = {
    containerType: 'size',
    aspectRatio: '297 / 210',
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans), Georgia, serif',
    color: INK,
    background: CREAM,
    printColorAdjust: 'exact',
    WebkitPrintColorAdjust: 'exact',
  };

  return (
    <div style={rootStyle}>
      {/* Fondo de marca */}
      <Image
        src="/brand/certificate-bg.png"
        alt=""
        fill
        sizes="980px"
        style={{
          objectFit: 'cover',
          objectPosition: 'left center',
          opacity: 1,
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 24%, rgba(255,255,255,0.2) 52%, rgba(255,255,255,0.18) 100%)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(58% 64% at 62% 48%, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.2) 52%, rgba(255,255,255,0) 82%)',
          zIndex: 0,
        }}
      />

      {/* Marco dorado */}
      <div
        style={{
          position: 'absolute',
          inset: '1.8cqw',
          border: `0.12cqw solid ${GOLD}`,
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '1.8cqw',
          right: '17cqw',
          bottom: '1.8cqw',
          height: '0.12cqw',
          background: `linear-gradient(90deg, transparent 0%, ${GOLD} 18%, ${GOLD} 82%, transparent 100%)`,
          opacity: 0.7,
          zIndex: 1,
        }}
      />

      {/* Filigranas de esquina */}
      <CornerFlourish style={{ top: '2.4cqw', right: '2.4cqw' }} />
      <CornerFlourish style={{ bottom: '2.4cqw', left: '2.4cqw', transform: 'rotate(180deg)' }} />

      {/* Contenido */}
      <div
        style={{
          position: 'absolute',
          inset: '2.4cqw 7cqw 3cqw 25cqw',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
        }}
      >
        {/* Cabecera de marca */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '9cqw', height: '7cqw' }}>
            <Image
              src="/brand/logo-monogram.png"
              alt="Faviola Velarde"
              fill
              style={{ objectFit: 'contain' }}
              sizes="120px"
            />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: '2.05cqw',
              letterSpacing: '0.28em',
              color: INK,
              marginTop: '0.45cqw',
              paddingLeft: '0.28em',
            }}
          >
            FAVIOLA VELARDE
          </p>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.8cqw', marginTop: '0.5cqw' }}
          >
            <span style={{ width: '2.4cqw', height: '0.06cqw', background: GOLD }} />
            <span
              style={{
                fontSize: '0.9cqw',
                letterSpacing: '0.42em',
                color: GOLD_DEEP,
                paddingLeft: '0.42em',
              }}
            >
              ASESORÍA PATRIMONIAL
            </span>
            <span style={{ width: '2.4cqw', height: '0.06cqw', background: GOLD }} />
          </div>
        </div>

        {/* Cuerpo */}
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: '6.2cqw',
              lineHeight: 1,
              letterSpacing: '0.1em',
              color: INK,
              paddingLeft: '0.1em',
            }}
          >
            CERTIFICADO
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1cqw', marginTop: '0.7cqw' }}>
            <Dashes />
            <span
              style={{
                fontSize: '1.5cqw',
                letterSpacing: '0.34em',
                color: GOLD_DEEP,
                fontWeight: 500,
                paddingLeft: '0.34em',
              }}
            >
              DE PARTICIPACIÓN
            </span>
            <Dashes flip />
          </div>

          <p style={{ fontSize: '1.35cqw', color: INK_SOFT, marginTop: '1.8cqw' }}>
            Se otorga el presente certificado a:
          </p>

          <p
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: `${nameSize}cqw`,
              lineHeight: 1.05,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: '0.05em',
              margin: '0.5cqw 0 0.7cqw',
              whiteSpace: 'nowrap',
            }}
          >
            {display}
          </p>

          {/* Divisor con rombo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7cqw', width: '70%' }}>
            <span style={{ flex: 1, height: '0.08cqw', background: GOLD, opacity: 0.6 }} />
            <span
              style={{
                width: '0.7cqw',
                height: '0.7cqw',
                background: GOLD,
                transform: 'rotate(45deg)',
              }}
            />
            <span style={{ flex: 1, height: '0.08cqw', background: GOLD, opacity: 0.6 }} />
          </div>

          <p style={{ fontSize: '1.3cqw', color: INK_SOFT, marginTop: '1.4cqw' }}>
            Por haber participado en el taller:
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: '2cqw',
              fontWeight: 700,
              color: INK,
              margin: '0.5cqw 0',
              maxWidth: '90%',
              lineHeight: 1.12,
              textTransform: 'uppercase',
            }}
          >
            {taller || 'Nombre del taller'}
          </p>
          <p
            style={{
              fontSize: '1.25cqw',
              color: INK_SOFT,
              marginTop: '0.3cqw',
              maxWidth: '76%',
              lineHeight: 1.5,
            }}
          >
            Desarrollado por Faviola Velarde — Asesoría Patrimonial, con una duración de{' '}
            {horas || '—'} horas académicas.
          </p>

          {/* Datos: fecha · duración · modalidad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '2.6cqw',
              marginTop: '2cqw',
              width: '72%',
            }}
          >
            <InfoItem icon={<CalendarDays />} label="Fecha:" value={fecha || '—'} />
            <InfoItem
              icon={<Clock />}
              label="Duración:"
              value={`${horas || '—'} horas académicas`}
            />
            <InfoItem icon={<MapPin />} label="Modalidad:" value={modalidad || '—'} />
          </div>
        </div>

        {/* Firma + sello */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: '0.7cqw',
          }}
        >
          <div style={{ width: '18cqw' }} />
          <div style={{ textAlign: 'center', transform: 'translateX(2cqw)' }}>
            <span
              style={{
                fontFamily: 'var(--font-script), cursive',
                fontSize: '3.2cqw',
                lineHeight: 1,
                color: INK,
              }}
            >
              Faviola Velarde
            </span>
            <div
              style={{
                width: '18cqw',
                height: '0.1cqw',
                background: INK,
                opacity: 0.7,
                margin: '0.2cqw auto 0.6cqw',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                fontSize: '1.25cqw',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: INK,
              }}
            >
              FAVIOLA VELARDE
            </p>
            <p style={{ fontSize: '0.95cqw', letterSpacing: '0.24em', color: GOLD_DEEP }}>
              ASESORA PATRIMONIAL
            </p>
          </div>
          <div style={{ width: '18cqw', display: 'flex', justifyContent: 'flex-end' }}>
            <Seal />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}): ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8cqw' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.6cqw',
          height: '2.6cqw',
          color: GOLD,
        }}
      >
        <span style={{ width: '1.9cqw', height: '1.9cqw', display: 'block' }}>{icon}</span>
      </span>
      <span style={{ textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: '1.1cqw', fontWeight: 700, color: INK }}>
          {label}
        </span>
        <span style={{ display: 'block', fontSize: '1.05cqw', color: INK_SOFT }}>{value}</span>
      </span>
    </div>
  );
}

function Dashes({ flip = false }: { flip?: boolean }): ReactNode {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35cqw',
        flexDirection: flip ? 'row-reverse' : 'row',
      }}
    >
      <span style={{ width: '2.2cqw', height: '0.08cqw', background: GOLD }} />
      <span
        style={{ width: '0.5cqw', height: '0.5cqw', background: GOLD, transform: 'rotate(45deg)' }}
      />
    </span>
  );
}

function CornerFlourish({ style }: { style: React.CSSProperties }): ReactNode {
  return (
    <svg
      viewBox="0 0 120 120"
      style={{ position: 'absolute', width: '16cqw', height: '16cqw', opacity: 0.45, ...style }}
      fill="none"
      stroke={GOLD}
      strokeWidth={0.8}
    >
      <path d="M120 0 C70 8 30 30 8 78" />
      <path d="M120 12 C76 20 40 42 20 88" />
      <path d="M120 24 C84 32 52 54 34 96" />
      <path d="M120 36 C92 44 66 64 50 100" />
    </svg>
  );
}

function Seal(): ReactNode {
  return (
    <svg viewBox="0 0 200 200" style={{ width: '13cqw', height: '13cqw' }}>
      <defs>
        <path id="sealTop" d="M28,100 A72,72 0 0 1 172,100" fill="none" />
        <path id="sealBottom" d="M32,100 A68,68 0 0 0 168,100" fill="none" />
      </defs>
      <circle cx="100" cy="100" r="95" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <circle cx="100" cy="100" r="82" fill="none" stroke={GOLD} strokeWidth="1" opacity={0.7} />
      <text
        fill={GOLD_DEEP}
        style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '3px' }}
        fontSize="13"
        fontWeight={600}
      >
        <textPath href="#sealTop" startOffset="50%" textAnchor="middle">
          FAVIOLA VELARDE
        </textPath>
      </text>
      <text
        fill={GOLD_DEEP}
        style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '2.5px' }}
        fontSize="10"
        fontWeight={500}
      >
        <textPath href="#sealBottom" startOffset="50%" textAnchor="middle">
          ASESORÍA PATRIMONIAL
        </textPath>
      </text>
      <text x="42" y="106" fill={GOLD} fontSize="14">
        ✦
      </text>
      <text x="150" y="106" fill={GOLD} fontSize="14">
        ✦
      </text>
      <text
        x="100"
        y="120"
        textAnchor="middle"
        fill={GOLD}
        style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
        fontSize="52"
        fontWeight={700}
      >
        FV
      </text>
    </svg>
  );
}
