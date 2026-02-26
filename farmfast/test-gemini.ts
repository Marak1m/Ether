// Create a temp file: test-gemini.ts
// Run with: npx ts-node test-gemini.ts

import { gradeProduceImage } from './lib/gemini'
import fs from 'fs'
import path from 'path'

// Download any vegetable image from google, save as test-tomato.jpg
const imageBuffer = fs.readFileSync(path.join(__dirname, 'test-tomato.jpg'))
const base64 = imageBuffer.toString('base64')

gradeProduceImage(base64).then(result => {
  console.log('✅ Gemini working:', JSON.stringify(result, null, 2))
}).catch(err => {
  console.error('❌ Gemini failed:', err.message)
})
