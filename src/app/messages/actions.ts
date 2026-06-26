"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";
import { destinatairesAutorises } from "@/lib/destinataires";

// Envoie un message à une autre personne de l'école.
// On vérifie que le destinataire fait partie des personnes autorisées OU qu'une
// conversation existe déjà avec lui (cas du prof qui répond à un parent).
export async function envoyerMessage(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (!profil.ecole_id) {
    redirect("/login");
  }

  const destinataireId = String(formData.get("destinataire_id") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();

  const base = "/messages/" + destinataireId;
  const echec = (msg: string) => redirect(base + "?erreur=" + encodeURIComponent(msg));

  if (!destinataireId) echec("Destinataire introuvable.");
  if (!contenu) echec("Écrivez un message.");
  if (contenu.length > 2000) echec("Le message est trop long (2000 caractères max).");

  // Le destinataire doit être autorisé, ou une conversation doit déjà exister.
  const autorises = await destinatairesAutorises(supabase, profil);
  const estAutorise = autorises.some((d) => d.id === destinataireId);

  if (!estAutorise) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .or(
        `and(expediteur_id.eq.${profil.id},destinataire_id.eq.${destinataireId}),` +
          `and(expediteur_id.eq.${destinataireId},destinataire_id.eq.${profil.id})`
      );
    if (!count || count === 0) {
      echec("Vous ne pouvez pas écrire à cette personne.");
    }
  }

  const { error } = await supabase.from("messages").insert({
    ecole_id: profil.ecole_id,
    expediteur_id: profil.id,
    destinataire_id: destinataireId,
    contenu,
  });

  if (error) {
    echec("Impossible d'envoyer le message.");
  }

  revalidatePath(base);
  redirect(base);
}
