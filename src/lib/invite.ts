import { customAlphabet } from 'nanoid'

// Human-friendly alphabet: no 0/O, 1/I/l confusion
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8)

export function generateInviteCode(): string {
  return nanoid()
}
