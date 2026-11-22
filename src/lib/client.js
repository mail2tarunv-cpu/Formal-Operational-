import { createClient } from '@supabase/supabase-js';

export const backendConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const supabase = backendConfigured ? createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
) : null;

export function requireClient() {
  if (!supabase) throw new Error('Doodl needs a dedicated Supabase project connected to Vercel.');
  return supabase;
}

export function explainError(error) {
  if (!error) return '';
  return error.message || String(error);
}

export function check(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function signedArtUrl(path, expiresIn = 3600) {
  if (!path) return '';
  const data = check(await requireClient().storage.from('doodl-art').createSignedUrl(path, expiresIn));
  return data.signedUrl;
}

export async function signedAvatarUrl(path, expiresIn = 3600) {
  if (!path) return '';
  const data = check(await requireClient().storage.from('doodl-avatars').createSignedUrl(path, expiresIn));
  return data.signedUrl;
}

export function groupDate(timezone, date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).reduce((acc, entry) => {
    if (entry.type !== 'literal') acc[entry.type] = entry.value;
    return acc;
  }, {});
}

export const THEMES = [
  { name:'A CITY ON MARS', category:'World building', prompt:['The skyline','The Martian sky','The locals','Getting around','The landscape'], description:['Design the buildings of a new Martian city.','Imagine the sky, moons and weather over this city.','Draw who or what lives here.','Invent the vehicle people use to move around.','Draw the terrain, plants or mysterious craters.'] },
  { name:'UNDERWATER FUTURE', category:'World building', prompt:['Ocean architecture','The surface above','Deep-sea residents','Water transport','The ocean floor'], description:['Design buildings that exist deep underwater.','Imagine the colors and sunlight seen underwater.','Draw the creatures who live in this future city.','Invent a way to travel in an underwater city.','Draw the coral and scenery around the city.'] },
  { name:'THE LAST ARCADE', category:'Create a place', prompt:['Arcade machines','The atmosphere','The characters','The details','Outside the arcade'], description:['Draw the games and machines in the arcade.','Imagine the signs, lights, posters and ambiance.','Draw people or creatures who hang out here.','Add some surprising small details.','Show what the surrounding neighborhood looks like.'] }
];
