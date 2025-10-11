import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Seeding sample trackers...')

  // First, get some users to assign trackers to
  const users = await prisma.user.findMany()
  
  if (users.length === 0) {
    console.log('⚠️  No users found. Please run seed-users.js first!')
    return
  }

  console.log(`Found ${users.length} users`)

  // Get maps from EP10 and EP11
  const ep10Maps = await prisma.map.findMany({
    where: { episodeNumber: 10 }
  })

  const ep11Maps = await prisma.map.findMany({
    where: { episodeNumber: 11 }
  })

  if (ep10Maps.length === 0 || ep11Maps.length === 0) {
    console.log('⚠️  No maps found. Please run seed.js first!')
    return
  }

  console.log(`Found ${ep10Maps.length} maps in EP10 and ${ep11Maps.length} maps in EP11`)

  // Sample tracker data
  const sampleTrackers = [
    // EP10 Trackers
    {
      nickname: users[0]?.nickname || 'Admin User',
      userId: users[0]?.id,
      mapId: ep10Maps[0]?.id, // 大教堂懺悔路 (Lv80)
      episodeNumber: 10,
      channelId: 1,
      level: 80,
      status: 4.5 // Almost done
    },
    {
      nickname: users[1]?.nickname || 'Editor One',
      userId: users[1]?.id,
      mapId: ep10Maps[1]?.id, // 大教堂正殿 (Lv81)
      episodeNumber: 10,
      channelId: 2,
      level: 81,
      status: 3.2
    },
    {
      nickname: users[2]?.nickname || 'Editor Two',
      userId: users[2]?.id,
      mapId: ep10Maps[2]?.id, // 大教堂大迴廊 (Lv82)
      episodeNumber: 10,
      channelId: 3,
      level: 82,
      status: 2.8
    },
    {
      nickname: users[0]?.nickname || 'Admin User',
      userId: users[0]?.id,
      mapId: ep10Maps[3]?.id, // 大教堂至聖所 (Lv83)
      episodeNumber: 10,
      channelId: 1,
      level: 83,
      status: 5 // Complete (ON)
    },

    // EP11 Trackers
    {
      nickname: users[1]?.nickname || 'Editor One',
      userId: users[1]?.id,
      mapId: ep11Maps[0]?.id, // 拉烏基美濕地 (Lv85)
      episodeNumber: 11,
      channelId: 5,
      level: 85,
      status: 1.5
    },
    {
      nickname: users[2]?.nickname || 'Editor Two',
      userId: users[2]?.id,
      mapId: ep11Maps[1]?.id, // 堤拉修道院 (Lv86)
      episodeNumber: 11,
      channelId: 6,
      level: 86,
      status: 2
    },
    {
      nickname: users[3]?.nickname || 'Chatter One',
      userId: users[3]?.id,
      mapId: ep11Maps[2]?.id, // 貝拉伊森林 (Lv87)
      episodeNumber: 11,
      channelId: 7,
      level: 87,
      status: 3.5
    },
    {
      nickname: users[0]?.nickname || 'Admin User',
      userId: users[0]?.id,
      mapId: ep11Maps[3]?.id, // 潔拉哈 (Lv88)
      episodeNumber: 11,
      channelId: 8,
      level: 88,
      status: 4
    },
    {
      nickname: users[1]?.nickname || 'Editor One',
      userId: users[1]?.id,
      mapId: ep11Maps[4]?.id, // 世伊魯森林 (Lv89)
      episodeNumber: 11,
      channelId: 10,
      level: 89,
      status: 0.5 // Just started
    },

    // Some additional variety on different channels
    {
      nickname: users[2]?.nickname || 'Editor Two',
      userId: users[2]?.id,
      mapId: ep10Maps[0]?.id, // 大教堂懺悔路
      episodeNumber: 10,
      channelId: 5,
      level: 80,
      status: 2
    },
    {
      nickname: users[3]?.nickname || 'Chatter One',
      userId: users[3]?.id,
      mapId: ep11Maps[0]?.id, // 拉烏基美濕地
      episodeNumber: 11,
      channelId: 2,
      level: 85,
      status: 4.2
    },
    {
      nickname: users[4]?.nickname || 'Chatter Two',
      userId: users[4]?.id,
      mapId: ep11Maps[2]?.id, // 貝拉伊森林
      episodeNumber: 11,
      channelId: 3,
      level: 87,
      status: 1
    }
  ]

  // Create trackers
  let created = 0
  for (const tracker of sampleTrackers) {
    try {
      await prisma.tracker.create({
        data: tracker
      })
      created++
      console.log(`✅ Created tracker: ${tracker.nickname} - Lv${tracker.level} Ch${tracker.channelId} (${tracker.status}/5)`)
    } catch (err) {
      console.error(`❌ Failed to create tracker:`, err.message)
    }
  }

  console.log(`\n🎉 Successfully created ${created} sample trackers!`)
  console.log('\n📊 Summary:')
  
  const ep10Count = await prisma.tracker.count({ where: { episodeNumber: 10 } })
  const ep11Count = await prisma.tracker.count({ where: { episodeNumber: 11 } })
  
  console.log(`  EP10 trackers: ${ep10Count}`)
  console.log(`  EP11 trackers: ${ep11Count}`)
  console.log(`  Total: ${ep10Count + ep11Count}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })