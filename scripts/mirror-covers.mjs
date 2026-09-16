import fs from 'node:fs/promises'
import path from 'node:path'

const supabaseUrl = 'https://wubthvvtncflzkblgtzh.supabase.co'
const publishableKey = 'sb_publishable_8kcCqGxfrFkWMuk9Oy8kaQ_2Axv3GuQ'
const outputDirectory = path.resolve('preview/covers')

const catalogResponse = await fetch(
  `${supabaseUrl}/rest/v1/catalog_editions?select=ean,cover_source_url&cover_source_url=not.is.null&order=ean.asc`,
  { headers: { apikey: publishableKey } },
)

if (!catalogResponse.ok) {
  throw new Error(`catalog request failed: ${catalogResponse.status} ${await catalogResponse.text()}`)
}

const editions = await catalogResponse.json()
await fs.mkdir(outputDirectory, { recursive: true })

const failures = []
async function mirrorCover(edition, index) {
  try {
    const response = await fetch(edition.cover_source_url, {
      headers: { 'User-Agent': 'Ediouro catalog cover mirror/1.0' },
      signal: AbortSignal.timeout(90_000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/jpeg' || contentType === 'image/jpg' ? 'jpg' : null
    if (!extension) throw new Error(`unsupported content type: ${contentType || 'missing'}`)

    const bytes = new Uint8Array(await response.arrayBuffer())
    if (!bytes.length) throw new Error('empty response')
    await fs.writeFile(path.join(outputDirectory, `${edition.ean}.${extension}`), bytes)
    console.log(`[${index + 1}/${editions.length}] ${edition.ean}.${extension}`)
  } catch (error) {
    failures.push({ ean: edition.ean, error: error instanceof Error ? error.message : String(error) })
  }
}

for (let index = 0; index < editions.length; index += 12) {
  await Promise.all(
    editions.slice(index, index + 12).map((edition, batchIndex) => mirrorCover(edition, index + batchIndex)),
  )
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2))
  process.exitCode = 1
} else {
  console.log(`Mirrored ${editions.length} covers.`)
}
