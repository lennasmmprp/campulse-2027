const nodemailer = require('nodemailer');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const line = s => String(s || '').replace(/[\r\n]+/g, ' ').trim();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  const { nom, email, statut, message, website } = req.body || {};
  if (website) return res.status(200).json({ ok: true }); // honeypot : on fait semblant

  const n = line(nom).slice(0, 100), e = line(email).slice(0, 200), s = line(statut).slice(0, 50);
  const m = String(message || '').trim().slice(0, 5000);
  if (!n || !m || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'Champs invalides' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  try {
    await transporter.sendMail({
      from: `"Site CAMPULSE" <${process.env.GMAIL_USER}>`,
      to: 'mmdc2paris@gmail.com',
      replyTo: { name: n, address: e },
      subject: `[CAMPULSE] Message de ${n} — ${s}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#251F63;max-width:600px">
<h2 style="margin:0 0 16px">Nouveau message via le site CAMPULSE</h2>
<table style="border-collapse:collapse;margin-bottom:16px">
<tr><td style="padding:4px 12px 4px 0;color:#666">Nom</td><td><b>${esc(n)}</b></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666">E-mail</td><td><a href="mailto:${esc(e)}">${esc(e)}</a></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666">Statut</td><td>${esc(s)}</td></tr>
</table>
<div style="background:#F5F2FE;border-radius:8px;padding:16px;white-space:pre-wrap">${esc(m)}</div>
</div>`,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Échec de l'envoi" });
  }
};
