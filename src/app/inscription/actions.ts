"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Enregistre une demande d'inscription d'école (formulaire public, sans compte).
export async function envoyerDemande(formData: FormData) {
  // Piège anti-bot (honeypot) : un champ caché que seuls les robots remplissent.
  // S'il est rempli, on fait semblant d'accepter (pour ne pas aider le bot) sans
  // rien enregistrer.
  const piege = String(formData.get("site_web") ?? "").trim();
  if (piege) redirect("/inscription?succes=1");

  const nomEcole = String(formData.get("nom_ecole") ?? "").trim();
  const prenom = String(formData.get("contact_prenom") ?? "").trim();
  const nom = String(formData.get("contact_nom") ?? "").trim();
  const email = String(formData.get("contact_email") ?? "").trim().toLowerCase();
  const telephone = String(formData.get("contact_telephone") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const echec = (msg: string) =>
    redirect("/inscription?erreur=" + encodeURIComponent(msg));

  if (!nomEcole || !prenom || !nom || !email) {
    echec("Merci de remplir le nom de l'école et vos coordonnées.");
  }
  // Validation d'email simple mais réelle (un @, un point après, pas d'espace).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    echec("L'adresse email ne semble pas valide.");
  }
  // Plafonds de longueur : coupe court aux payloads de spam.
  if (
    nomEcole.length > 150 ||
    prenom.length > 80 ||
    nom.length > 80 ||
    email.length > 150 ||
    telephone.length > 40 ||
    ville.length > 80 ||
    message.length > 1000
  ) {
    echec("Un des champs est trop long.");
  }

  // Client anonyme (visiteur non connecté) : la RLS autorise l'insertion d'une
  // demande « en_attente ».
  const supabase = await createClient();
  const { error } = await supabase.from("demandes_inscription").insert({
    nom_ecole: nomEcole,
    contact_prenom: prenom,
    contact_nom: nom,
    contact_email: email,
    contact_telephone: telephone || null,
    ville: ville || null,
    message: message || null,
  });

  if (error) {
    echec("Impossible d'envoyer la demande pour le moment. Réessayez plus tard.");
  }

  redirect("/inscription?succes=1");
}
