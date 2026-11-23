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
  {name:'A CITY ON MARS',category:'World building',prompt:['The skyline','The Martian sky','The locals','Getting around','The landscape'],description:['Design the buildings of a new Martian city.','Imagine the sky, moons and weather over this city.','Draw who or what lives here.','Invent how the locals travel.','Draw the landscape and craters.']},
  {name:'UNDERWATER FUTURE',category:'World building',prompt:['Ocean architecture','The surface above','Deep-sea residents','Water transport','The ocean floor'],description:['Design buildings deep underwater.','Draw the light coming through the sea.','Invent the creatures who live here.','Create underwater transport.','Draw coral and the ocean floor.']},
  {name:'THE LAST ARCADE',category:'Create a place',prompt:['Arcade machines','The atmosphere','The characters','The details','Outside the arcade'],description:['Invent the games in this arcade.','Draw the signs and glowing lights.','Draw who hangs out here.','Find a surprising small detail.','Draw the street outside.']},
  {name:'A FLOATING MARKET',category:'Invent a world',prompt:['The shops','The boats','A customer','The food','The view'],description:['Design a shop that floats.','Draw how vendors move.','Sketch someone buying something strange.','Imagine a signature market snack.','Show the market from far away.']},
  {name:'A TINY PLANET',category:'Invent a world',prompt:['The homes','The weather','A creature','A vehicle','The landscape'],description:['Draw the smallest homes imaginable.','Create unusual planetary weather.','Invent a resident of the planet.','Show how people get around.','Draw this planet from space.']},
  {name:'THE SECRET LIBRARY',category:'Create a place',prompt:['The entrance','The shelves','The librarian','A strange book','The reading corner'],description:['Hide the way into the library.','Draw a room of unusual shelves.','Imagine who works here.','Illustrate one impossible book.','Create the coziest reading spot.']},
  {name:'THE MOON CARNIVAL',category:'Invent a world',prompt:['The rides','The lights','A visitor','A game booth','The food'],description:['Design a ride in low gravity.','Light up the carnival at night.','Sketch a carnival-goer.','Make an unusual booth game.','Draw a snack only found on the moon.']},
  {name:'THE ROBOT GARDEN',category:'Invent a world',prompt:['The greenhouse','A robot','A flower','The pathways','The watering system'],description:['Design the greenhouse.','Invent a robot gardener.','Sketch an impossible flower.','Draw paths through the garden.','Show how the plants are watered.']},
  {name:'A FUTURE TRAIN',category:'Create a place',prompt:['The engine','A carriage','A passenger','The station','The landscape'],description:['Invent a train engine.','Design a passenger carriage.','Sketch someone on board.','Make an unusual station.','Draw what the train passes.']},
  {name:'MONSTER CAFE',category:'Create a place',prompt:['The storefront','The menu','A customer','The kitchen','The furniture'],description:['Draw the cafe from outside.','Illustrate a strange menu item.','Sketch a friendly monster customer.','Invent the kitchen equipment.','Design a chair for a monster.']},
  {name:'THE CLOUD CITY',category:'World building',prompt:['The buildings','The bridges','A resident','Transportation','The sky'],description:['Imagine buildings on clouds.','Connect floating neighborhoods.','Draw somebody who lives there.','Invent travel above the ground.','Paint the surrounding sky.']},
  {name:'MIDNIGHT MUSEUM',category:'Create a place',prompt:['The entrance','An exhibit','The guard','A corridor','The gift shop'],description:['Draw the museum after dark.','Create an exhibit that comes alive.','Design the night guard.','Sketch a mysterious hallway.','Invent a very strange souvenir.']}
];
