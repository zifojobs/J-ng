import "server-only";
import { Resend } from "resend";

// Envoi d'emails via Resend. UNIQUEMENT côté serveur (la clé est secrète).
// La clé et l'expéditeur viennent de .env.local (RESEND_API_KEY, EMAIL_EXPEDITEUR).

const EXPEDITEUR = process.env.EMAIL_EXPEDITEUR ?? "Jàng <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jang-theta.vercel.app";

// Email de bienvenue envoyé au directeur quand sa demande d'inscription est validée.
// Contient ses identifiants de connexion. Renvoie un message d'erreur, ou null si OK.
export async function envoyerEmailBienvenueDirecteur(params: {
  email: string;
  prenom: string;
  nomEcole: string;
  motDePasse: string;
  slug: string;
}): Promise<string | null> {
  const { email, prenom, nomEcole, motDePasse, slug } = params;

  // Si la clé n'est pas configurée, on ne bloque pas : on signale juste.
  if (!process.env.RESEND_API_KEY) {
    return "RESEND_API_KEY absente : email non envoyé.";
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const bonjour = prenom ? `Bonjour ${prenom},` : "Bonjour,";

  const html = `
<div style="margin:0;padding:24px;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:12px;background:#22c55e;color:#0f172a;font-size:24px;font-weight:bold;">J</span>
      <h1 style="margin:12px 0 4px;font-size:22px;color:#ffffff;">Bienvenue sur Jàng</h1>
    </div>
    <div style="background:rgba(30,41,59,0.6);border:1px solid #334155;border-radius:16px;padding:24px;">
      <p style="margin:0 0 16px;">${bonjour}</p>
      <p style="margin:0 0 16px;">
        L'école <strong style="color:#ffffff;">${nomEcole}</strong> a bien été créée sur Jàng.
        Voici vos identifiants de connexion en tant qu'administrateur :
      </p>
      <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;margin:0 0 16px;">
        <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;">Adresse du site</p>
        <p style="margin:0 0 16px;"><a href="${SITE_URL}/login" style="color:#22c55e;">${SITE_URL}/login</a></p>
        <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;">Identifiant (onglet « Email »)</p>
        <p style="margin:0 0 16px;color:#ffffff;font-weight:bold;">${email}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;">Mot de passe provisoire</p>
        <p style="margin:0;color:#ffffff;font-weight:bold;">${motDePasse}</p>
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;">
        Pensez à changer ce mot de passe après votre première connexion.
        Le « code école » de votre établissement (utile pour vos élèves) est :
        <strong style="color:#e2e8f0;">${slug}</strong>.
      </p>
      <p style="margin:0;">À très vite,<br/>L'équipe Jàng</p>
    </div>
  </div>
</div>`;

  const texte = `${bonjour}

L'école ${nomEcole} a bien été créée sur Jàng. Voici vos identifiants d'administrateur :

Site : ${SITE_URL}/login
Identifiant (onglet « Email ») : ${email}
Mot de passe provisoire : ${motDePasse}

Pensez à changer ce mot de passe après votre première connexion.
Code école (utile pour vos élèves) : ${slug}

À très vite,
L'équipe Jàng`;

  const { error } = await resend.emails.send({
    from: EXPEDITEUR,
    to: email,
    subject: `Bienvenue sur Jàng — accès administrateur de ${nomEcole}`,
    html,
    text: texte,
  });

  if (error) {
    return error.message;
  }
  return null;
}
