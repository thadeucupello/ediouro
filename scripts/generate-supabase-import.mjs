import fs from 'node:fs'

const [catalogPath, importId, kind, offsetArg = '0', limitArg = '1000'] = process.argv.slice(2)
if (!catalogPath || !importId || !kind) {
  throw new Error('usage: node scripts/generate-supabase-import.mjs <catalog.json> <import-id> <kind> [offset] [limit]')
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
const offset = Number(offsetArg)
const limit = Number(limitArg)
const payload = '$catalog$'

const slice = values => values.slice(offset, offset + limit)
const json = value => {
  const result = JSON.stringify(value)
  if (result.includes(payload)) throw new Error('unexpected SQL delimiter in catalog data')
  return result
}

const common = data => `${payload}${json(data)}${payload}::jsonb`

const queries = {
  works() {
    const rows = slice(catalog.works).map(w => ({
      id: w.id,
      slug: w.slug,
      title: w.title,
      subtitle: w.subtitle ?? null,
      short_description: w.shortDescription ?? null,
      description: w.description ?? [],
      imprint: w.imprint,
      collections: w.collections ?? [],
      categories: w.categories ?? [],
      subjects: w.subjects ?? [],
      featured: w.featured ?? [],
      popularity: w.popularity ?? 0,
      seo_title: w.seoTitle ?? null,
      seo_description: w.seoDescription ?? null,
      series_slug: w.series ?? null,
      series_order: w.seriesOrder ?? null,
      credits: w.credits ?? [],
      source: w.source ?? {}
    }))
    return `with x as (
      select * from jsonb_to_recordset(${common(rows)}) as r(
        id text, slug text, title text, subtitle text, short_description text,
        description jsonb, imprint text, collections text[], categories text[], subjects text[],
        featured text[], popularity integer, seo_title text, seo_description text,
        series_slug text, series_order numeric, credits jsonb, source jsonb
      )
    )
    insert into public.catalog_works (
      id, slug, title, subtitle, short_description, description, imprint, collections,
      categories, subjects, featured, popularity, seo_title, seo_description,
      series_slug, series_order, credits, source, import_id
    ) select x.*, '${importId}'::uuid from x
    on conflict (id) do update set
      slug=excluded.slug, title=excluded.title, subtitle=excluded.subtitle,
      short_description=excluded.short_description, description=excluded.description,
      imprint=excluded.imprint, collections=excluded.collections, categories=excluded.categories,
      subjects=excluded.subjects, featured=excluded.featured, popularity=excluded.popularity,
      seo_title=excluded.seo_title, seo_description=excluded.seo_description,
      series_slug=excluded.series_slug, series_order=excluded.series_order,
      credits=excluded.credits, source=excluded.source, import_id=excluded.import_id,
      active=true, updated_at=now();`
  },

  editions() {
    const rows = slice(catalog.editions).map(e => ({
      id: e.id,
      work_slug: e.workSlug,
      label: e.label ?? null,
      format: e.format ?? null,
      publication_date: e.publicationDate || null,
      language: e.language ?? null,
      status: e.status ?? null,
      binding: e.binding ?? null,
      isbn: e.isbn || null,
      ean: e.ean,
      page_count: e.pageCount ?? null,
      dimensions: e.dimensions ?? null,
      cover_source_url: e.cover || null,
      cover_url: e.cover || null,
      gallery: e.gallery ?? [],
      price: e.price ?? null,
      currency: e.currency ?? 'BRL',
      credits: e.credits ?? [],
      display_priority: e.displayPriority ?? 0,
      retailer_links: e.retailerLinks ?? [],
      availability_note: null,
      source: {}
    }))
    return `with x as (
      select * from jsonb_to_recordset(${common(rows)}) as r(
        id text, work_slug text, label text, format text, publication_date date,
        language text, status text, binding text, isbn text, ean text, page_count integer,
        dimensions text, cover_source_url text, cover_url text, gallery jsonb,
        price numeric, currency text, credits jsonb, display_priority integer,
        retailer_links jsonb, availability_note text, source jsonb
      )
    )
    insert into public.catalog_editions (
      id, work_slug, label, format, publication_date, language, status, binding,
      isbn, ean, page_count, dimensions, cover_source_url, cover_url, gallery,
      price, currency, credits, display_priority, retailer_links, availability_note,
      source, import_id
    ) select x.*, '${importId}'::uuid from x
    on conflict (id) do update set
      work_slug=excluded.work_slug, label=excluded.label, format=excluded.format,
      publication_date=excluded.publication_date, language=excluded.language,
      status=excluded.status, binding=excluded.binding, isbn=excluded.isbn,
      ean=excluded.ean, page_count=excluded.page_count, dimensions=excluded.dimensions,
      cover_source_url=excluded.cover_source_url,
      cover_url=coalesce(public.catalog_editions.cover_url, excluded.cover_url),
      gallery=excluded.gallery, price=excluded.price, currency=excluded.currency,
      credits=excluded.credits, display_priority=excluded.display_priority,
      retailer_links=excluded.retailer_links, availability_note=excluded.availability_note,
      source=excluded.source, import_id=excluded.import_id, active=true, updated_at=now();`
  },

  contributors() {
    const rows = slice(catalog.contributors).map(c => ({
      slug: c.slug,
      name: c.name,
      roles: c.roles ?? [],
      short_bio: c.shortBio ?? null,
      bio: c.bio ?? [],
      metadata: { imprints: c.imprints ?? [] }
    }))
    return `with x as (
      select * from jsonb_to_recordset(${common(rows)}) as r(
        slug text, name text, roles text[], short_bio text, bio jsonb, metadata jsonb
      )
    )
    insert into public.catalog_contributors (slug, name, roles, short_bio, bio, metadata, import_id)
    select x.*, '${importId}'::uuid from x
    on conflict (slug) do update set
      name=excluded.name, roles=excluded.roles, short_bio=excluded.short_bio,
      bio=excluded.bio, metadata=excluded.metadata, import_id=excluded.import_id,
      updated_at=now();`
  },

  series() {
    const rows = slice(catalog.series).map(s => ({
      slug: s.slug,
      name: s.name,
      description: s.description ?? null,
      imprint: s.imprint ?? null,
      main_contributor: s.mainContributor ?? null,
      work_slugs: s.workSlugs ?? [],
      metadata: {}
    }))
    return `with x as (
      select * from jsonb_to_recordset(${common(rows)}) as r(
        slug text, name text, description text, imprint text, main_contributor text,
        work_slugs text[], metadata jsonb
      )
    )
    insert into public.catalog_series (
      slug, name, description, imprint, main_contributor, work_slugs, metadata, import_id
    ) select x.*, '${importId}'::uuid from x
    on conflict (slug) do update set
      name=excluded.name, description=excluded.description, imprint=excluded.imprint,
      main_contributor=excluded.main_contributor, work_slugs=excluded.work_slugs,
      metadata=excluded.metadata, import_id=excluded.import_id, updated_at=now();`
  }
}

if (!queries[kind]) throw new Error(`unsupported kind: ${kind}`)
process.stdout.write(queries[kind]())
