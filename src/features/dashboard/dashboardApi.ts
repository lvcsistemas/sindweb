import { supabase } from "../../lib/supabase";

const supabaseUnsafe = supabase as any;

export async function countEmpresas() {
  const { count, error } = await supabaseUnsafe
    .from("empresas")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function countAssociados() {
  const { count, error } = await supabaseUnsafe
    .from("associados")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}
