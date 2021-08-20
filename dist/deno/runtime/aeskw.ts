import type { AesKwUnwrapFunction, AesKwWrapFunction } from './interfaces.d.ts'
import bogusWebCrypto from './bogus.ts'
import crypto, { isCryptoKey } from './webcrypto.ts'
import invalidKeyInput from './invalid_key_input.ts'

function checkKeySize(key: CryptoKey, alg: string) {
  // @ts-ignore
  if ((<AesKeyAlgorithm>key.algorithm).length !== parseInt(alg.substr(1, 3), 10)) {
    throw new TypeError(`invalid key size for alg: ${alg}`)
  }
}

function getCryptoKey(key: unknown, usage: KeyUsage) {
  if (isCryptoKey(key)) {
    return key
  }

  if (key instanceof Uint8Array) {
    return crypto.subtle.importKey('raw', key, 'AES-KW', true, [usage])
  }

  throw new TypeError(invalidKeyInput(key, 'CryptoKey', 'Uint8Array'))
}

export const wrap: AesKwWrapFunction = async (alg: string, key: unknown, cek: Uint8Array) => {
  const cryptoKey = await getCryptoKey(key, 'wrapKey')

  checkKeySize(cryptoKey, alg)

  // we're importing the cek to end up with CryptoKey instance that can be wrapped, the algorithm used is irrelevant
  const cryptoKeyCek = await crypto.subtle.importKey('raw', cek, ...bogusWebCrypto)

  // @ts-ignore
  return new Uint8Array(await crypto.subtle.wrapKey('raw', cryptoKeyCek, cryptoKey, 'AES-KW'))
}

export const unwrap: AesKwUnwrapFunction = async (
  alg: string,
  key: unknown,
  encryptedKey: Uint8Array,
) => {
  const cryptoKey = await getCryptoKey(key, 'unwrapKey')

  checkKeySize(cryptoKey, alg)

  // @ts-ignore
  const cryptoKeyCek = await crypto.subtle.unwrapKey(
    'raw',
    encryptedKey,
    cryptoKey,
    'AES-KW',
    ...bogusWebCrypto,
  )

  // @ts-ignore
  return new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKeyCek))
}
