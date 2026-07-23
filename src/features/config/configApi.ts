import { supabase } from "../../lib/supabase";
import type { Config, ConfigUpdate } from "../../types/database";

const supabaseUnsafe = supabase as any;

export async function getConfig() {
  const { data, error } = await supabaseUnsafe
    .from("config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data as Config;
}

export async function saveConfig(values: ConfigUpdate) {
  const payload = {
    id: 1,
    ultima_matricula: Number(values.ultima_matricula || 0)
  };

  const { data, error } = await supabaseUnsafe
    .from("config")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data as Config;
}
