import { createDecipheriv } from 'node:crypto'
import { BYOK_KEY_VERSION, getMasterKey } from './master-key'

// Server-only. AES-256-GCM decrypt. The auth tag is set before `final()`
// so a tampered ciphertext (or the wrong master key) surfaces as a
// thrown `Unsupported state or unable to authenticate data` from
// Node — we re-throw with a stable message.

export type EncryptedKeyInput = {
  ciphertext: Buffer
  iv: Buffer
  authTag: Buffer
  keyVersion: number
}

export function decryptKey(input: EncryptedKeyInput): string {
  if (input.keyVersion !== BYOK_KEY_VERSION) {
    throw new Error(
      `BYOK key_version ${input.keyVersion} does not match runtime version ${BYOK_KEY_VERSION}`,
    )
  }
  const master = getMasterKey()
  if (master === null) {
    throw new Error('BYOK master key is not configured')
  }
  const decipher = createDecipheriv('aes-256-gcm', master, input.iv)
  decipher.setAuthTag(input.authTag)
  try {
    const plaintext = Buffer.concat([
      decipher.update(input.ciphertext),
      decipher.final(),
    ])
    return plaintext.toString('utf8')
  } catch {
    throw new Error('BYOK decrypt failed: auth tag mismatch')
  }
}
