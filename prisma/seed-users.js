import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧑 Seeding test users...')

  const users = [
    {
      username: 'chicken',
      password: 'hamster',
      nickname: '小嘰',
      role: 'ADMIN'
    },
    {
      username: 'editor1',
      password: 'editor123',
      nickname: 'Editor One',
      role: 'EDITOR'
    },
    {
      username: 'editor2',
      password: 'editor123',
      nickname: 'Editor Two',
      role: 'EDITOR'
    },
    {
      username: 'chatter1',
      password: 'chatter123',
      nickname: 'Chatter One',
      role: 'CHATTER'
    },
    {
      username: 'chatter2',
      password: 'chatter123',
      nickname: 'Chatter Two',
      role: 'CHATTER'
    },
    {
      username: 'viewer1',
      password: 'viewer123',
      nickname: 'Viewer One',
      role: 'VIEWER'
    },
    {
      username: 'viewer2',
      password: 'viewer123',
      nickname: 'Viewer Two',
      role: 'VIEWER'
    }
  ]

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    const created = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password: hashedPassword,
        nickname: user.nickname,
        role: user.role
      }
    })

    console.log(`✅ Created ${created.role}: ${created.username} (${created.nickname})`)
  }

  console.log('\n🎉 User seed completed!')
  console.log('\n📋 Test Accounts:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('ADMIN (full access):')
  console.log('  username: admin     | password: admin123')
  console.log('\nEDITOR (can add/edit trackers):')
  console.log('  username: editor1   | password: editor123')
  console.log('  username: editor2   | password: editor123')
  console.log('\nCHATTER (can chat):')
  console.log('  username: chatter1  | password: chatter123')
  console.log('  username: chatter2  | password: chatter123')
  console.log('\nVIEWER (read-only):')
  console.log('  username: viewer1   | password: viewer123')
  console.log('  username: viewer2   | password: viewer123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })