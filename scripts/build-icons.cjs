const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const sizes = [16, 32, 48, 64, 128, 256, 512]
const input = path.join(__dirname, '../logo.png')
const outputDir = path.join(__dirname, '../build/icons')

fs.mkdirSync(outputDir, { recursive: true })

async function build() {
  for (const size of sizes) {
    await sharp(input)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `${size}x${size}.png`))
  }
  console.log('Icons built:', sizes.join(', '))
}

build().catch(console.error)
