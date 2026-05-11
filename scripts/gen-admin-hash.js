import bcrypt from 'bcryptjs'
import readline from 'readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question('Enter admin password: ', async (pwd) => {
  const hash = await bcrypt.hash(pwd, 12)
  console.log('\nHash:')
  console.log(hash)
  console.log('\nAdd this to .env.local as ADMIN_PASSWORD_HASH, AND to Vercel env vars on the Vercel dashboard.')
  rl.close()
})
