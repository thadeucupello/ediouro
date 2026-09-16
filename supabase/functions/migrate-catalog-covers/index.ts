const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

async function migrateCover(edition: Edition): Promise<MigrationResult> {
  try {
    const sourceResponse = await fetch(edition.cover_source_url, {
      headers: { 'User-Agent': 'Ediouro catalog cover migration/1.0' },
      signal: AbortSignal.timeout(60_000),
    })

    if (!sourceResponse.ok) {
      throw new Error(`source returned ${sourceResponse.status}`)
    }

    const rawMime = sourceResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    const mime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime
    const extension = mime ? mimeExtensions[mime] : undefined

    if (!mime || !extension) {
      throw new Error(`unsupported content type: ${rawMime || 'missing'}`)
    }

    const image = await sourceResponse.arrayBuffer()
    if (!image.byteLength) throw new Error('source returned an empty file')
    if (image.byteLength > 10 * 1024 * 1024) throw new Error('cover exceeds 10 MB')

    const safeEan = edition.ean.replace(/[^0-9A-Za-z_-]/g, '-')
    const storagePath = `${safeEan}.${extension}`
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/catalog-covers/${encodeURIComponent(storagePath)}`,
      {
        method: 'POST',
        headers: {
          ...adminHeaders,
          'Content-Type': mime,
          'x-upsert': 'true',
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
