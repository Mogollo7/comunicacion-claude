/**
 * Envío del código de 6 dígitos con Resend (pantallas 02b y 03b–03h).
 * Usa la plantilla publicada `anura-codigo` (alias) del dominio juanlabs.me.
 *
 *   npm install resend
 *   RESEND_API_KEY=...   (variable de entorno, nunca en el repo)
 *   RESEND_FROM="ANURA <no-responder@juanlabs.me>"   (opcional)
 */
import { Resend } from 'resend';

export type PropositoCodigo = 'verificar_correo' | 'recuperar_contrasena';

const TEXTOS: Record<PropositoCodigo, { titulo: string; instruccion: string; aviso: string }> = {
  verificar_correo: {
    titulo: 'Activa tu cuenta',
    instruccion: 'Escribe este código en la app para confirmar tu correo.',
    aviso: 'Si no creaste una cuenta en ANURA, ignora este correo. Nunca te pediremos este código por chat o llamada.',
  },
  recuperar_contrasena: {
    titulo: 'Recupera tu contraseña',
    instruccion: 'Escribe este código en la app para crear una contraseña nueva.',
    aviso: 'Si no lo pediste, ignora este correo: tu contraseña no cambia. Nunca te pediremos este código por chat o llamada.',
  },
};

// El nombre lo escribe el usuario: se escapa antes de entrar al HTML de la plantilla.
const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const conEspacio = (c: string) => (c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c);

export async function enviarCodigo(p: {
  email: string;
  nombre?: string;
  codigo: string; // 6 dígitos en claro, solo en memoria: en base de datos va el hash
  proposito: PropositoCodigo;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Falta RESEND_API_KEY');
  const resend = new Resend(apiKey);
  const t = TEXTOS[p.proposito];
  const codigo = conEspacio(p.codigo);

  // Resend no lanza excepción en errores de API: devuelve { data, error }.
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'ANURA <no-responder@juanlabs.me>',
    to: p.email,
    subject: `Tu código de ANURA: ${codigo}`,
    template: {
      id: 'anura-codigo',
      variables: {
        ASUNTO: `Tu código de ANURA: ${codigo}`,
        PREHEADER: `Tu código de ANURA es ${codigo}. Vence en 10 minutos y sirve una sola vez.`,
        TITULO: t.titulo,
        NOMBRE: escapar(p.nombre?.trim() || 'observador'),
        INSTRUCCION: t.instruccion,
        CODIGO: codigo,
        AVISO: t.aviso,
      },
    },
  });
  if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
  return data; // { id } para auditar el envío (sin guardar el código)
}
