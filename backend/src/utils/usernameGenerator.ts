import { User } from '../modules/users/user.model.js';

const ADJECTIVES = [
  'chouette', 'pingouin', 'licorne', 'panda', 'koala', 'wombat', 'narval', 'poulpe',
  'tigre', 'lion', 'aigle', 'faucon', 'loup', 'renard', 'ecureuil', 'castor',
  'dauphin', 'baleine', 'flamant', 'perroquet', 'toucan', 'colibri', 'papillon',
  'coccinelle', 'abeille', 'libellule', 'etoile', 'soleil', 'lune', 'nuage',
  'plume', 'coeur', 'aurore', 'zephyr', 'brise', 'ecume', 'vague', 'perle',
  'corail', 'saphir', 'rubis', 'emeraude', 'topaze', 'diamant',
];

function getRandomAdjective(): string {
  return ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
}

function getLastFourDigits(phone: string): string {
  return phone.slice(-4);
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const existing = await User.findOne({ username });
  return existing !== null;
}

export async function generateUsername(phone: string): Promise<string> {
  const adjective = getRandomAdjective();
  const lastFour = getLastFourDigits(phone);
  let username = `${adjective}_${lastFour}`;
  let suffix = 2;

  while (await isUsernameTaken(username)) {
    username = `${adjective}_${lastFour}_${suffix}`;
    suffix++;
  }

  return username;
}
