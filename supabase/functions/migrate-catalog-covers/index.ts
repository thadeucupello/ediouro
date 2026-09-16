const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const WINDOWS_SYNC_TOKEN_HASH = '944d266727f3b6b4b382bcc8309b349cfeee617499c7dcd30d1d7ee0e260e4d9'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Supabase server credentials are unavailable')
}

const adminHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
}

const mimeExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

type Edition = {
  id: string
  ean: string
  cover_source_url: string
}

type MigrationResult = {
  id: string
  status: 'migrated' | 'failed'
  error?: string
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function hasValidSignature(image: ArrayBuffer, mime: string) {
  const bytes = new Uint8Array(image)
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    return bytes.length >= signature.length && signature.every((byte, index) => bytes[index] === byte)
  }
  return false
}

async function storeCover(edition: Edition, image: ArrayBuffer, mime: string, upsert: boolean) {
  const extension = mimeExtensions[mime]
  if (!extension) throw new Error(`unsupported content type: ${mime}`)
  if (!image.byteLength) throw new Error('source returned an empty file')
  if (image.byteLength > 10 * 1024 * 1024) throw new Error('cover exceeds 10 MB')
  if (!hasValidSignature(image, mime)) throw new Error('file signature does not match its image type')

  const safeEan = edition.ean.replace(/[^0-9A-Za-z_-]/g, '-')
  const storagePath = `${safeEan}.${extension}`
  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/catalog-covers/${encodeURIComponent(storagePath)}`,
    {
      method: 'POST',
      headers: {
        ...adminHeaders,
        'Content-Type': mime,
        'x-upsert': String(upsert),
      },
      body: image,
    },
  )

  if (!uploadResponse.ok) {
    throw new Error(`storage upload returned ${uploadResponse.status}: ${await uploadResponse.text()}`)
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/catalog-covers/${encodeURIComponent(storagePath)}`
  const updateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/catalog_editions?id=eq.${encodeURIComponent(edition.id)}`,
    {
      method: 'PATCH',
      headers: {
        ...adminHeaders,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        cover_storage_path: storagePath,
        cover_url: publicUrl,
        updated_at: new Date().toISOString(),
      }),
    },
  )

  if (!updateResponse.ok) {
    throw new Error(`edition update returned ${updateResponse.status}: ${await updateResponse.text()}`)
  }

  return { storagePath, publicUrl }
}

async function receiveWindowsUpload(request: Request) {
  const token = request.headers.get('x-sync-token') ?? ''
  if ((await sha256(token)) !== WINDOWS_SYNC_TOKEN_HASH) {
    return Response.json({ error: 'invalid sync credential' }, { status: 403 })
  }

  const ean = request.headers.get('x-ean') ?? ''
  if (!/^[0-9]{13}$/.test(ean)) {
    return Response.json({ error: 'invalid EAN' }, { status: 400 })
  }

  const rawMime = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  const mime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime
  if (mime !== 'image/jpeg' && mime !== 'image/png') {
    return Response.json({ error: 'only JPEG and PNG covers are accepted' }, { status: 415 })
  }

  const editionResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/catalog_editions?select=id,ean,cover_source_url,cover_storage_path&ean=eq.${ean}&limit=1`,
    { headers: adminHeaders },
  )
  if (!editionResponse.ok) {
    return Response.json({ error: 'catalog lookup failed' }, { status: 502 })
  }

  const editions = await editionResponse.json() as Array<Edition & { cover_storage_path: string | null }>
  const edition = editions[0]
  if (!edition?.cover_source_url) {
    return Response.json({ error: 'EAN has no approved cover source' }, { status: 404 })
  }
  if (edition.cover_storage_path) {
    return Response.json({ status: 'already_stored', ean, storagePath: edition.cover_storage_path })
  }

  try {
    const image = await request.arrayBuffer()
    const stored = await storeCover(edition, image, mime, false)
    return Response.json({ status: 'migrated', ean, ...stored })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 422 },
    )
  }
}

async function migrateCover(edition: Edition): Promise<MigrationResult> {
  try {
    const sourceResponse = await fetch(edition.cover_source_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        Referer: 'https://ediouro-preview.vercel.app/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
      signal: AbortSignal.timeout(60_000),
    })

    if (!sourceResponse.ok) {
      throw new Error(`source returned ${sourceResponse.status}`)
    }

    const rawMime = sourceResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    const mime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime
    if (!mime || !mimeExtensions[mime]) {
      throw new Error(`unsupported content type: ${rawMime || 'missing'}`)
    }

    const image = await sourceResponse.arrayBuffer()
    await storeCover(edition, image, mime, true)

    return { id: edition.id, status: 'migrated' }
  } catch (error) {
    return {
      id: edition.id,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
  }

  if (request.headers.get('x-upload-mode') === 'windows-sync') {
    return receiveWindowsUpload(request)
  }

  let requestedLimit = 10
  let requestedEan: string | null = null
  try {
    const body = await request.json()
    if (Number.isInteger(body?.limit)) requestedLimit = body.limit
    if (typeof body?.ean === 'string' && /^[0-9]{13}$/.test(body.ean)) requestedEan = body.ean
  } catch {
    // An empty body uses the default batch size.
  }
  const limit = Math.min(Math.max(requestedLimit, 1), 3)

  const eanFilter = requestedEan ? `&ean=eq.${requestedEan}` : ''
  const editionsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/catalog_editions?select=id,ean,cover_source_url&cover_source_url=not.is.null&cover_storage_path=is.null${eanFilter}&order=id.asc&limit=${limit}`,
    { headers: adminHeaders },
  )

  if (!editionsResponse.ok) {
    return Response.json(
      { error: `catalog query returned ${editionsResponse.status}` },
      { status: 502 },
    )
  }

  const editions = (await editionsResponse.json()) as Edition[]
  const results: MigrationResult[] = []

  for (let index = 0; index < editions.length; index += 3) {
    results.push(...await Promise.all(editions.slice(index, index + 3).map(migrateCover)))
  }

  return Response.json({
    selected: editions.length,
    migrated: results.filter(result => result.status === 'migrated').length,
    failed: results.filter(result => result.status === 'failed'),
  })
})
