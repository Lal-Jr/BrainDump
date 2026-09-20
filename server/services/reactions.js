// Lightweight post reactions. There are no accounts, so a "voter" is a keyed hash of IP + user
// agent: enough to stop one person adding the same reaction repeatedly, without storing anything
// that identifies them.
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { REACTIONS_DIR, JWT_SECRET } from '../config.js';
import { withLock } from './lock.js';
import { writeFileAtomic, readJson } from './fsutil.js';

export const REACTION_TYPES = ['helpful', 'loved', 'thoughtful'];
const MAX_VOTERS = 5000;

export const voterId = (ip, userAgent = '') =>
  crypto.createHmac('sha256', JWT_SECRET).update(`${ip}|${userAgent}`).digest('hex').slice(0, 16);

const fileFor = (postId) => path.join(REACTIONS_DIR, `${postId}.json`);
const blank = () => ({ counts: Object.fromEntries(REACTION_TYPES.map((t) => [t, 0])), voters: {} });

async function read(postId) {
  await fs.mkdir(REACTIONS_DIR, { recursive: true });
  const data = await readJson(fileFor(postId), null);
  return data?.counts && data?.voters ? data : blank();
}

const view = (data, voter) => ({ counts: data.counts, mine: data.voters[voter] ?? [] });

export async function getReactions(postId, voter) {
  return view(await read(postId), voter);
}

export function setReaction(postId, voter, type, on) {
  return withLock(`reactions:${postId}`, async () => {
    const data = await read(postId);
    const mine = new Set(data.voters[voter] ?? []);
    if (on && !mine.has(type)) {
      if (!(voter in data.voters) && Object.keys(data.voters).length >= MAX_VOTERS) return view(data, voter);
      mine.add(type);
      data.counts[type] = (data.counts[type] ?? 0) + 1;
    } else if (!on && mine.has(type)) {
      mine.delete(type);
      data.counts[type] = Math.max(0, (data.counts[type] ?? 0) - 1);
    }
    if (mine.size) data.voters[voter] = [...mine];
    else delete data.voters[voter];
    await writeFileAtomic(fileFor(postId), JSON.stringify(data));
    return view(data, voter);
  });
}
