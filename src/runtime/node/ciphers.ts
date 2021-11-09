import { getCiphers } from 'crypto'

let ciphers: Set<string>
let chachaWarned = false

export default (algorithm: string) => {
  ciphers ||= new Set(getCiphers())
  if (!chachaWarned && algorithm.includes('chacha')) {
    chachaWarned = true
    process.emitWarning('TODO', 'DraftWarning')
  }
  return ciphers.has(algorithm)
}
