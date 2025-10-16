import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Checking if database needs seeding...')

  // Check if data already exists
  const episodeCount = await prisma.episode.count()
  const mapCount = await prisma.map.count()
  const channelCount = await prisma.channel.count()

  if (episodeCount > 0 && mapCount > 0 && channelCount > 0) {
    console.log('✅ Database already seeded (Episodes: ' + episodeCount + ', Maps: ' + mapCount + ', Channels: ' + channelCount + ')')
    console.log('⏭️  Skipping seed to prevent duplicates')
    return
  }

  console.log('🌱 Seeding database...')

  // Create Episodes
  const ep1 = await prisma.episode.upsert({
    where: { episodeId: 1 },
    update: {},
    create: {
      episodeId: 1,
      name: 'LEVEL 1-9 地圖'
    }
  })

  const ep2 = await prisma.episode.upsert({
    where: { episodeId: 2 },
    update: {},
    create: {
      episodeId: 2,
      name: 'LEVEL 10-19 地圖'
    }
  })

  const ep3 = await prisma.episode.upsert({
    where: { episodeId: 3 },
    update: {},
    create: {
      episodeId: 3,
      name: 'LEVEL 20-28 地圖'
    }
  })

  const ep4 = await prisma.episode.upsert({
    where: { episodeId: 4 },
    update: {},
    create: {
      episodeId: 4,
      name: 'LEVEL 30-38 地圖'
    }
  })

  const ep5 = await prisma.episode.upsert({
    where: { episodeId: 5 },
    update: {},
    create: {
      episodeId: 5,
      name: 'LEVEL 40-48 地圖'
    }
  })

  const ep6 = await prisma.episode.upsert({
    where: { episodeId: 6 },
    update: {},
    create: {
      episodeId: 6,
      name: 'LEVEL 50-59 地圖'
    }
  })

  const ep7 = await prisma.episode.upsert({
    where: { episodeId: 7 },
    update: {},
    create: {
      episodeId: 7,
      name: 'LEVEL 60-68 地圖'
    }
  })

  const ep8 = await prisma.episode.upsert({
    where: { episodeId: 8 },
    update: {},
    create: {
      episodeId: 8,
      name: 'LEVEL 70-74 地圖'
    }
  })

  const ep9 = await prisma.episode.upsert({
    where: { episodeId: 9 },
    update: {},
    create: {
      episodeId: 9,
      name: 'LEVEL 75-79 地圖'
    }
  })

  const ep10 = await prisma.episode.upsert({
    where: { episodeId: 10 },
    update: {},
    create: {
      episodeId: 10,
      name: 'LEVEL 80-83 地圖'
    }
  })

  const ep11 = await prisma.episode.upsert({
    where: { episodeId: 11 },
    update: {},
    create: {
      episodeId: 11,
      name: 'LEVEL 85-89 地圖'
    }
  })

  console.log('✅ Episodes created:', ep1.name, ep2.name, ep3.name, ep4.name, ep5.name, ep6.name, ep7.name, ep8.name, ep9.name, ep10.name, ep11.name)

  // Create Maps for Episode 1
  await prisma.map.createMany({
    data: [
      { name: '夏奧雷伊礦山村莊', level: 7, episodeNumber: 1 },
      { name: '水晶礦山', level: 9, episodeNumber: 1 },
    ],
    skipDuplicates: true
  })

  // Create Maps for Episode 2
  await prisma.map.createMany({
    data: [
      { name: '奈普里塔斯懸崖', level: 12, episodeNumber: 2 },
      { name: '泰內花園', level: 13, episodeNumber: 2 },
      { name: '泰內聖堂地下1層', level: 15, episodeNumber: 2 },
      { name: '泰內聖堂地上1層', level: 17, episodeNumber: 2 },
      { name: '泰內聖堂地上2層', level: 19, episodeNumber: 2 },
    ],
    skipDuplicates: true
  })

    // Create Maps for Episode 3
  await prisma.map.createMany({
      data: [
        { name: '達旦森林', level: 22, episodeNumber: 3 },
        { name: '諾巴哈公會所', level: 24, episodeNumber: 3 },
        { name: '諾巴哈別館', level: 26, episodeNumber: 3 },
        { name: '諾巴哈本院', level: 28, episodeNumber: 3 }
    ],
      skipDuplicates: true
  })

  // Create Maps for Episode 4
  await prisma.map.createMany({
      data: [
        { name: '科博爾特森林', level: 32, episodeNumber: 4 },
        { name: '賽堤尼山溝', level: 34, episodeNumber: 4 },
        { name: '培爾克神殿', level: 36, episodeNumber: 4 },
        { name: '安森塔水源地', level: 38, episodeNumber: 4 }
      ],
      skipDuplicates: true
    })

  // Create Maps for Episode 5
  await prisma.map.createMany({
    data: [
      { name: '德慕爾佃農村', level: 44, episodeNumber: 5 },
      { name: '德慕爾莊園', level: 46, episodeNumber: 5 },
      { name: '德慕爾外城', level: 48, episodeNumber: 5 }
    ],
    skipDuplicates: true
  })

  // Create Maps for Episode 6
  await prisma.map.createMany({
    data: [
      { name: '烏奇斯耕作地', level: 52, episodeNumber: 6 },
      { name: '春光樹林', level: 53, episodeNumber: 6 },
      { name: '關口路', level: 55, episodeNumber: 6 },
      { name: '史爾特凱拉森林', level: 57, episodeNumber: 6},
      { name: '克巴伊拉斯森林', level: 59, episodeNumber: 6 }
    ],
    skipDuplicates: true
  })

  // Create Maps for Episode 7
  await prisma.map.createMany({
    data: [
      { name: '扎卡里耶爾交叉路', level: 62, episodeNumber: 7 },
      { name: '王陵1層', level: 64, episodeNumber: 7 },
      { name: '王陵2層', level: 66, episodeNumber: 7 },
      { name: '王陵3層', level: 68, episodeNumber: 7}
    ],
    skipDuplicates: true
  })

  // Create Maps for Episode 8
  await prisma.map.createMany({
    data: [
      { name: '水路橋地區', level: 70, episodeNumber: 8 },
      { name: '阿雷魯諾男爵領', level: 70, episodeNumber: 8 },
      { name: '魔族收監所第1區', level: 71, episodeNumber: 8 },
      { name: '魔族收監所第3區', level: 72, episodeNumber: 8},
      { name: '魔族收監所第4區', level: 73, episodeNumber: 8 },
      { name: '魔族收監所第5區', level: 74, episodeNumber: 8}
    ],
    skipDuplicates: true
  })

  // Create Maps for Episode 9
  await prisma.map.createMany({
    data: [
      { name: '女神的古院', level: 75, episodeNumber: 9 },
      { name: '佩迪米安外城', level: 76, episodeNumber: 9 },
      { name: '魔法師之塔一層', level: 77, episodeNumber: 9 },
      { name: '魔法師之塔二層', level: 78, episodeNumber: 9},
      { name: '魔法師之塔三層', level: 79, episodeNumber: 9 }
    ],
    skipDuplicates: true
  })

  // Create Maps for Episode 10
  await prisma.map.createMany({
    data: [
      { name: '大教堂懺悔路', level: 80, episodeNumber: 10 },
      { name: '大教堂正殿', level: 81, episodeNumber: 10 },
      { name: '大教堂大迴廊', level: 82, episodeNumber: 10 },
      { name: '大教堂至聖所', level: 83, episodeNumber: 10}
    ],
    skipDuplicates: true
  })

  // Create Maps for Episode 11
  await prisma.map.createMany({
    data: [
      { name: '拉烏基美濕地', level: 85, episodeNumber: 11 },
      { name: '堤拉修道院', level: 86, episodeNumber: 11 },
      { name: '貝拉伊森林', level: 87, episodeNumber: 11 },
      { name: '潔拉哈', level: 88, episodeNumber: 11},
      { name: '世伊魯森林', level: 89, episodeNumber: 11 }
    ],
    skipDuplicates: true
  })

  console.log('✅ Maps created')

  // Create Channels
  await prisma.channel.createMany({
    data: [
      { name: 'Ch 1' },
      { name: 'Ch 2' },
      { name: 'Ch 3' },
      { name: 'Ch 4' },
      { name: 'Ch 5' },
      { name: 'Ch 6' },
      { name: 'Ch 7' },
      { name: 'Ch 8' },
      { name: 'Ch 9' },
      { name: 'Ch 10' }
    ],
    skipDuplicates: true
  })

  console.log('✅ Channels created')
  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })