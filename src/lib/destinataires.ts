import type { createClient } from "@/lib/supabase/server";
import type { Profil } from "@/lib/auth";

// Une personne à qui l'on peut écrire.
export type Destinataire = {
  id: string;
  prenom: string;
  nom: string;
  role: string;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

const LIBELLE_ROLE: Record<string, string> = {
  admin_ecole: "Administration",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export function libelleRole(role: string): string {
  return LIBELLE_ROLE[role] ?? role;
}

// Calcule la liste des personnes à qui `profil` a le droit d'écrire.
//   - admin   : tout le monde dans son école (sauf lui-même).
//   - prof    : l'administration + les élèves de SES classes.
//   - élève   : l'administration + les profs de SA classe.
//   - parent  : l'administration + les profs des classes de SES enfants.
// (Un prof peut toujours RÉPONDRE à un parent qui lui a écrit : la conversation
//  existe alors déjà, voir la page de discussion.)
export async function destinatairesAutorises(
  supabase: Supabase,
  profil: Profil
): Promise<Destinataire[]> {
  if (!profil.ecole_id) return [];

  // L'administration de l'école (commune à tous les rôles).
  const { data: admins } = await supabase
    .from("profils")
    .select("id, prenom, nom, role")
    .eq("role", "admin_ecole")
    .neq("id", profil.id)
    .returns<Destinataire[]>();

  // Admin : toute l'école sauf lui-même.
  if (profil.role === "admin_ecole") {
    const { data } = await supabase
      .from("profils")
      .select("id, prenom, nom, role")
      .neq("id", profil.id)
      .order("role", { ascending: true })
      .order("nom", { ascending: true })
      .returns<Destinataire[]>();
    return data ?? [];
  }

  // Prof : administration + élèves de ses classes.
  if (profil.role === "professeur") {
    const { data: aff } = await supabase
      .from("affectations")
      .select("classe_id")
      .eq("professeur_id", profil.id)
      .returns<{ classe_id: string }[]>();

    const classeIds = [...new Set((aff ?? []).map((a) => a.classe_id))];
    let eleves: Destinataire[] = [];
    if (classeIds.length > 0) {
      const { data } = await supabase
        .from("profils")
        .select("id, prenom, nom, role")
        .eq("role", "eleve")
        .in("classe_id", classeIds)
        .order("nom", { ascending: true })
        .returns<Destinataire[]>();
      eleves = data ?? [];
    }
    return [...(admins ?? []), ...eleves];
  }

  // Élève / parent : administration + profs des classes concernées.
  let classeIds: string[] = [];
  if (profil.role === "eleve") {
    const { data: moi } = await supabase
      .from("profils")
      .select("classe_id")
      .eq("id", profil.id)
      .single<{ classe_id: string | null }>();
    if (moi?.classe_id) classeIds = [moi.classe_id];
  } else if (profil.role === "parent") {
    const { data: liens } = await supabase
      .from("parents_eleves")
      .select("eleve:profils!parents_eleves_eleve_id_fkey ( classe_id )")
      .eq("parent_id", profil.id)
      .returns<{ eleve: { classe_id: string | null } | null }[]>();
    classeIds = [
      ...new Set(
        (liens ?? [])
          .map((l) => l.eleve?.classe_id)
          .filter((c): c is string => Boolean(c))
      ),
    ];
  } else {
    return admins ?? [];
  }

  let profs: Destinataire[] = [];
  if (classeIds.length > 0) {
    const { data: aff } = await supabase
      .from("affectations")
      .select("professeur:profils ( id, prenom, nom, role )")
      .in("classe_id", classeIds)
      .returns<{ professeur: Destinataire | null }[]>();

    // On dédoublonne les profs (un prof peut enseigner plusieurs matières).
    const parId = new Map<string, Destinataire>();
    for (const a of aff ?? []) {
      if (a.professeur) parId.set(a.professeur.id, a.professeur);
    }
    profs = [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom));
  }

  return [...(admins ?? []), ...profs];
}
