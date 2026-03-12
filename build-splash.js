import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const args = process.argv.slice(2)
const sourceImg = args[0]
const outDir = 'public/splash'

if (!sourceImg) {
  console.error('Please provide source image path')
  process.exit(1)
}

const sizes = [
  { w: 2048, h: 2732, name: 'ipadpro3_splash.png' },
  { w: 1668, h: 2388, name: 'ipadpro2_splash.png' },
  { w: 1536, h: 2048, name: 'ipad_splash.png' },
  { w: 1125, h: 2436, name: 'iphonex_splash.png' },
  { w: 1242, h: 2688, name: 'iphonexsmax_splash.png' },
  { w: 828, h: 1792, name: 'iphonexr_splash.png' },
  { w: 1242, h: 2208, name: 'iphoneplus_splash.png' },
  { w: 750, h: 1334, name: 'iphone6_splash.png' },
]

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

sizes.forEach(({w, h, name}) => {
  console.log(`Generating ${name} (${w}x${h})...`)
  // sips -z height width (Note sips takes height first then width)
  execSync(`sips -z ${h} ${w} "${sourceImg}" --out "${path.join(outDir, name)}"`)
})

console.log('Done generating splash screens!')
