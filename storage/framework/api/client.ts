/* eslint-disable */
/**
 * Stacks API client, generated from OpenAPI.
 * Do not edit; run buddy generate:openapi.
 * No imports or dependencies.
 */


export type ApiResult<T> =
  | { ok: true, status: number, data: T, headers: Headers }
  | { ok: false, status: number, error: unknown, headers: Headers }

export interface ClientConfig {
  baseUrl: string
  token?: string
  headers?: Record<string, string>
  fetch?: typeof fetch
}
export interface RequestOptions {
  signal?: AbortSignal
  headers?: Record<string, string>
  /** Select one of the operation's declared request media types. */
  contentType?: string
}
interface Parameter {
  name: string
  in: string
  required: boolean
  group?: string
  style?: string
  explode?: boolean
}
interface BodyDescription { required: boolean, content: string[] }

function parameterValue(input: Record<string, unknown>, parameter: Parameter): unknown {
  const fields = parameter.group ? input[parameter.group] : input
  if (parameter.in === 'header' && fields && typeof fields === 'object') {
    const entries = Object.entries(fields).filter(([key]) => key.toLowerCase() === parameter.name.toLowerCase())
    return entries.at(-1)?.[1]
  }
  return fields && typeof fields === 'object' && Object.hasOwn(fields, parameter.name)
    ? (fields as Record<string, unknown>)[parameter.name] : undefined
}
function scalar(value: unknown): string {
  if (typeof value === 'object' && value !== null) throw new TypeError('Nested parameter values require an explicit supported serialization')
  return String(value)
}
function queryParameter(url: URL, parameter: Parameter, value: unknown): void {
  const style = parameter.style ?? 'form'
  const explode = parameter.explode ?? style === 'form'
  if (style === 'deepObject') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('deepObject requires an object')
    for (const [key, item] of Object.entries(value)) url.searchParams.append(parameter.name + '[' + key + ']', scalar(item))
  }
  else if (Array.isArray(value)) {
    if (style === 'form' && explode) {
      for (const item of value) url.searchParams.append(parameter.name, scalar(item))
    }
    else url.searchParams.append(parameter.name, value.map(scalar).join(style === 'spaceDelimited' ? ' ' : style === 'pipeDelimited' ? '|' : ','))
  }
  else if (value && typeof value === 'object') {
    if (style !== 'form') throw new TypeError('Object queries require form or deepObject style')
    if (explode) for (const [key, item] of Object.entries(value)) url.searchParams.append(key, scalar(item))
    else url.searchParams.append(parameter.name, Object.entries(value).flatMap(([key, item]) => [key, scalar(item)]).join(','))
  }
  else url.searchParams.append(parameter.name, scalar(value))
}
function simpleParameter(value: unknown, explode: boolean, encode: (value: string) => string): string {
  if (Array.isArray(value)) return value.map(item => encode(scalar(item))).join(',')
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => encode(key) + (explode ? '=' : ',') + encode(scalar(item))).join(',')
  return encode(scalar(value))
}
function buildUrl(config: ClientConfig, route: string, input: Record<string, unknown>, parameters: Parameter[], headers: Headers): string {
  const path = new Map<string, string>()
  for (const parameter of parameters) {
    const value = parameterValue(input, parameter)
    if (value === undefined || value === null) {
      if (parameter.required) throw new TypeError('Missing required ' + parameter.in + ' parameter: ' + parameter.name)
      continue
    }
    if (parameter.in === 'path') {
      const segment = simpleParameter(value, parameter.explode ?? false, encodeURIComponent)
      if (segment === '.' || segment === '..') throw new TypeError('Dot-only path parameters are not allowed')
      path.set(parameter.name, segment)
    }
    else if (parameter.in === 'header') headers.set(parameter.name, simpleParameter(value, parameter.explode ?? false, value => value))
  }
  const filled = route.replace(/\{([^{}]+)\}/g, (_, key: string) => {
    const value = path.get(key)
    if (value === undefined) throw new TypeError('Missing path parameter: ' + key)
    return value
  })
  const url = new URL(filled.replace(/^\/+/, '/'), config.baseUrl.endsWith('/') ? config.baseUrl : config.baseUrl + '/')
  for (const parameter of parameters) {
    const value = parameterValue(input, parameter)
    if (parameter.in === 'query' && value !== undefined && value !== null) queryParameter(url, parameter, value)
  }
  return url.toString()
}
function isJson(type: string): boolean { return type === 'application/json' || type.endsWith('+json') }
function mediaType(type: string): string { return type.split(';')[0]!.trim().toLowerCase() }
function requestBody(value: unknown, description: BodyDescription | null, headers: Headers, options?: RequestOptions): BodyInit | undefined {
  if (!description) return undefined
  if (value === undefined) {
    if (description.required) throw new TypeError('Missing required request body')
    return undefined
  }
  const declared = description.content
  const selected = options?.contentType ?? headers.get('content-type') ?? declared.find(isJson) ?? declared[0]
  if (!selected || !declared.some(type => mediaType(type) === mediaType(selected))) throw new TypeError('Request media type is not declared by this operation')
  const type = mediaType(selected)
  headers.set('content-type', selected)
  if (isJson(type)) return JSON.stringify(value)
  if (type === 'application/x-www-form-urlencoded' || type === 'multipart/form-data') {
    if (type === 'multipart/form-data' && value instanceof FormData) { headers.delete('content-type'); return value }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Form bodies require an object')
    if (type === 'application/x-www-form-urlencoded') {
      const form = new URLSearchParams()
      for (const [name, field] of Object.entries(value)) {
        for (const item of Array.isArray(field) ? field : [field]) if (item != null) form.append(name, scalar(item))
      }
      return form.toString()
    }
    const form = new FormData()
    for (const [name, field] of Object.entries(value)) {
      for (const item of Array.isArray(field) ? field : [field]) {
        if (item == null) continue
        form.append(name, item instanceof Blob ? item : typeof item === 'object' ? JSON.stringify(item) : String(item))
      }
    }
    headers.delete('content-type')
    return form
  }
  if (value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return value as BodyInit
  if (typeof value === 'string') return value
  throw new TypeError('Non-JSON request bodies require text or binary data')
}
async function request<T>(config: ClientConfig, method: string, route: string, input: Record<string, unknown>, parameters: Parameter[], description: BodyDescription | null, accept: string, binary: string[], options?: RequestOptions): Promise<ApiResult<T>> {
  const headers = new Headers({ Accept: accept })
  for (const [name, value] of Object.entries(config.headers ?? {})) headers.set(name, value)
  if (config.token) headers.set('authorization', 'Bearer ' + config.token)
  for (const [name, value] of Object.entries(options?.headers ?? {})) headers.set(name, value)
  const url = buildUrl(config, route, input, parameters, headers)
  const body = requestBody(input.body, description, headers, options)
  const response = await (config.fetch ?? fetch)(url, { method, headers, body, signal: options?.signal })
  const type = mediaType(response.headers.get('content-type') ?? '')
  let parsed: unknown
  if (method === 'HEAD' || response.status === 204 || response.status === 205) parsed = null
  else if (binary.includes(type)) parsed = await response.blob()
  else {
    const text = await response.text()
    // Keep malformed JSON available as evidence, without parsing other media as JSON.
    if (!text.length) parsed = type.startsWith('text/') ? '' : null
    else if (isJson(type)) { try { parsed = JSON.parse(text) } catch { parsed = text } }
    else parsed = text
  }
  return response.ok
    ? { ok: true, status: response.status, data: parsed as T, headers: response.headers }
    : { ok: false, status: response.status, error: parsed, headers: response.headers }
}

export interface components {
  schemas: {
    "Area": { "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "ChecklistItem": { "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Heading": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Note": { "id": number; "uuid": string; "title"?: string; "snippet"?: string; "body"?: string; "pinned"?: boolean; "user_id"?: number; "note_folder_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }
    "NoteFolder": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Project": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Prompt": { "id": number; "uuid": string; "title": string; "description"?: string; "body"?: string; "model"?: string; "tags"?: string; "favorite"?: boolean; "uses"?: number; "version"?: number; "user_id"?: number; "prompt_library_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }
    "PromptLibrary": { "id": number; "uuid": string; "title": string; "description"?: string; "icon"?: string; "color"?: string; "share_token"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "PromptVersion": { "id": number; "uuid": string; "version"?: number; "title"?: string; "body"?: string; "user_id"?: number; "prompt_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Share": { "id": number; "uuid": string; "resource_type": "library" | "note" | "project"; "resource_id": number; "shared_with_user_id"?: number; "email"?: string; "role"?: "viewer" | "editor"; "accepted_at"?: unknown; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Team": { "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string }
    "TeamInvitation": { "id": number; "uuid": string; "team_id": number; "email": string; "role": "admin" | "member" | "viewer"; "invited_by_user_id"?: number; "accepted_by_user_id"?: number; "status": "pending" | "accepted" | "revoked" | "expired"; "delivery_status": "pending" | "sent" | "failed"; "expires_at": unknown; "delivered_at"?: unknown; "accepted_at"?: unknown; "created_at"?: string; "updated_at"?: string }
    "TeamMember": { "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string }
    "Todo": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }
    "User": { "id": number; "uuid": string; "name"?: string; "email"?: string; "avatar"?: string; "created_at"?: string; "updated_at"?: string }
  }
  requestSchemas: {
    "Area": { "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "ChecklistItem": { "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Heading": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Note": { "id": number; "uuid": string; "title"?: string; "snippet"?: string; "body"?: string; "pinned"?: boolean; "user_id"?: number; "note_folder_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }
    "NoteFolder": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Project": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Prompt": { "id": number; "uuid": string; "title": string; "description"?: string; "body"?: string; "model"?: string; "tags"?: string; "favorite"?: boolean; "uses"?: number; "version"?: number; "user_id"?: number; "prompt_library_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }
    "PromptLibrary": { "id": number; "uuid": string; "title": string; "description"?: string; "icon"?: string; "color"?: string; "share_token"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "PromptVersion": { "id": number; "uuid": string; "version"?: number; "title"?: string; "body"?: string; "user_id"?: number; "prompt_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Share": { "id": number; "uuid": string; "resource_type": "library" | "note" | "project"; "resource_id": number; "shared_with_user_id"?: number; "email"?: string; "role"?: "viewer" | "editor"; "accepted_at"?: unknown; "user_id"?: number; "created_at"?: string; "updated_at"?: string }
    "Team": { "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string }
    "TeamInvitation": { "id": number; "uuid": string; "team_id": number; "email": string; "role": "admin" | "member" | "viewer"; "invited_by_user_id"?: number; "accepted_by_user_id"?: number; "status": "pending" | "accepted" | "revoked" | "expired"; "delivery_status": "pending" | "sent" | "failed"; "expires_at": unknown; "delivered_at"?: unknown; "accepted_at"?: unknown; "created_at"?: string; "updated_at"?: string }
    "TeamMember": { "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string }
    "Todo": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }
    "User": { "id": number; "uuid": string; "name"?: string; "email"?: string; "avatar"?: string; "created_at"?: string; "updated_at"?: string }
  }
}

export function createClient(config: ClientConfig) {
  return {
    config,
  /**
   * GET /.well-known/oauth-authorization-server
   */
  getWellKnownOauthAuthorizationServer(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/.well-known/oauth-authorization-server", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /_stacks/mail/preview
   */
  getStacksMailPreview(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/_stacks/mail/preview", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /_stacks/mail/preview/{name}
   */
  getStacksMailPreviewName(input: { "name": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/_stacks/mail/preview/{name}", input ?? {}, [{"name":"name","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /_stacks/mail/preview/{name}/raw
   */
  getStacksMailPreviewNameRaw(input: { "name": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/_stacks/mail/preview/{name}/raw", input ?? {}, [{"name":"name","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/account/delete
   */
  postAccountDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/account/delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/areas
   */
  getAreas(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/areas", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/areas
   */
  postAreas(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/areas", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/areas/bulk-delete
   */
  postAreasBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/areas/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/areas/{id}
   */
  getAreasId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/areas/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/areas/{id}
   */
  putAreasId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/areas/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/areas/{id}
   */
  deleteAreasId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/areas/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/areas/{id}
   */
  patchAreasId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "icon"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/areas/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/checklist-items
   */
  getChecklistItems(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/checklist-items", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/checklist-items
   */
  postChecklistItems(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/checklist-items", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/checklist-items/bulk-delete
   */
  postChecklistItemsBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/checklist-items/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/checklist-items/{id}
   */
  getChecklistItemsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/checklist-items/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/checklist-items/{id}
   */
  putChecklistItemsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/checklist-items/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/checklist-items/{id}
   */
  deleteChecklistItemsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/checklist-items/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/checklist-items/{id}
   */
  patchChecklistItemsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "done"?: boolean; "sort_order"?: number; "user_id"?: number; "todo_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/checklist-items/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/complete
   */
  postComplete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/complete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/headings
   */
  getHeadings(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/headings", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/headings
   */
  postHeadings(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/headings", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/headings/bulk-delete
   */
  postHeadingsBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/headings/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/headings/{id}
   */
  getHeadingsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/headings/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/headings/{id}
   */
  putHeadingsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/headings/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/headings/{id}
   */
  deleteHeadingsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/headings/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/headings/{id}
   */
  patchHeadingsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "archived_at"?: unknown; "user_id"?: number; "project_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/headings/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/hello
   */
  getHello(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/hello", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/lists/{list}
   */
  getListsList(input: { "list": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/lists/{list}", input ?? {}, [{"name":"list","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/note-folders
   */
  getNoteFolders(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/note-folders", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/note-folders
   */
  postNoteFolders(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/note-folders", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/note-folders/bulk-delete
   */
  postNoteFoldersBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/note-folders/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/note-folders/{id}
   */
  getNoteFoldersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/note-folders/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/note-folders/{id}
   */
  putNoteFoldersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/note-folders/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/note-folders/{id}
   */
  deleteNoteFoldersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/note-folders/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/note-folders/{id}
   */
  patchNoteFoldersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/note-folders/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/notes
   */
  getNotes(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title"?: string; "snippet"?: string; "body"?: string; "pinned"?: boolean; "user_id"?: number; "note_folder_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }> }>> {
    return request(config, "GET", "/api/notes", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/notes
   */
  postNotes(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title"?: string; "snippet"?: string; "body"?: string; "pinned"?: boolean; "user_id"?: number; "note_folder_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "POST", "/api/notes", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/notes/bulk-delete
   */
  postNotesBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/notes/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/notes/trash
   */
  getNotesTrash(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/notes/trash", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/notes/{id}
   */
  getNotesId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title"?: string; "snippet"?: string; "body"?: string; "pinned"?: boolean; "user_id"?: number; "note_folder_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "GET", "/api/notes/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/notes/{id}
   */
  putNotesId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title"?: string; "snippet"?: string; "body"?: string; "pinned"?: boolean; "user_id"?: number; "note_folder_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "PUT", "/api/notes/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/notes/{id}
   */
  deleteNotesId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title"?: string; "snippet"?: string; "body"?: string; "pinned"?: boolean; "user_id"?: number; "note_folder_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "DELETE", "/api/notes/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/notes/{id}/purge
   */
  deleteNotesIdPurge(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "DELETE", "/api/notes/{id}/purge", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/notes/{id}/restore
   */
  postNotesIdRestore(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/notes/{id}/restore", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/projects
   */
  getProjects(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/projects", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/projects
   */
  postProjects(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/projects", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/projects/bulk-delete
   */
  postProjectsBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/projects/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/projects/{id}
   */
  getProjectsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/projects/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/projects/{id}
   */
  putProjectsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/projects/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/projects/{id}
   */
  deleteProjectsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/projects/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/projects/{id}
   */
  patchProjectsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/projects/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/prompt-libraries
   */
  getPromptLibraries(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "description"?: string; "icon"?: string; "color"?: string; "share_token"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/prompt-libraries", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/prompt-libraries
   */
  postPromptLibraries(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "description"?: string; "icon"?: string; "color"?: string; "share_token"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/prompt-libraries", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/prompt-libraries/bulk-delete
   */
  postPromptLibrariesBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/prompt-libraries/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * PUT /api/prompt-libraries/{id}
   */
  putPromptLibrariesId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "description"?: string; "icon"?: string; "color"?: string; "share_token"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/prompt-libraries/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/prompt-libraries/{id}
   */
  deletePromptLibrariesId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "description"?: string; "icon"?: string; "color"?: string; "share_token"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/prompt-libraries/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/prompt-libraries/{id}
   */
  patchPromptLibrariesId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "description"?: string; "icon"?: string; "color"?: string; "share_token"?: string; "sort_order"?: number; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/prompt-libraries/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/prompt-libraries/{id}/link
   */
  postPromptLibrariesIdLink(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/prompt-libraries/{id}/link", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/prompt-libraries/{id}/prompts
   */
  getPromptLibrariesIdPrompts(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/prompt-libraries/{id}/prompts", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/prompt-libraries/{id}/shares
   */
  getPromptLibrariesIdShares(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/prompt-libraries/{id}/shares", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/prompt-libraries/{id}/shares
   */
  postPromptLibrariesIdShares(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/prompt-libraries/{id}/shares", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/prompt-versions
   */
  getPromptVersions(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "version"?: number; "title"?: string; "body"?: string; "user_id"?: number; "prompt_id"?: number; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/prompt-versions", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/prompt-versions/{id}
   */
  getPromptVersionsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "version"?: number; "title"?: string; "body"?: string; "user_id"?: number; "prompt_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/prompt-versions/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/prompts
   */
  getPrompts(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "description"?: string; "body"?: string; "model"?: string; "tags"?: string; "favorite"?: boolean; "uses"?: number; "version"?: number; "user_id"?: number; "prompt_library_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }> }>> {
    return request(config, "GET", "/api/prompts", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/prompts
   */
  postPrompts(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "description"?: string; "body"?: string; "model"?: string; "tags"?: string; "favorite"?: boolean; "uses"?: number; "version"?: number; "user_id"?: number; "prompt_library_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "POST", "/api/prompts", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/prompts/bulk-delete
   */
  postPromptsBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/prompts/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * PUT /api/prompts/{id}
   */
  putPromptsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "description"?: string; "body"?: string; "model"?: string; "tags"?: string; "favorite"?: boolean; "uses"?: number; "version"?: number; "user_id"?: number; "prompt_library_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "PUT", "/api/prompts/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/prompts/{id}
   */
  deletePromptsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "description"?: string; "body"?: string; "model"?: string; "tags"?: string; "favorite"?: boolean; "uses"?: number; "version"?: number; "user_id"?: number; "prompt_library_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "DELETE", "/api/prompts/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/prompts/{id}/use
   */
  postPromptsIdUse(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/prompts/{id}/use", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/prompts/{id}/versions
   */
  getPromptsIdVersions(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/prompts/{id}/versions", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/shared/{token}
   */
  getSharedToken(input: { "token": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/shared/{token}", input ?? {}, [{"name":"token","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/shares/bulk-delete
   */
  postSharesBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/shares/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * DELETE /api/shares/{id}
   */
  deleteSharesId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "resource_type": "library" | "note" | "project"; "resource_id": number; "shared_with_user_id"?: number; "email"?: string; "role"?: "viewer" | "editor"; "accepted_at"?: unknown; "user_id"?: number; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/shares/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/sidebar
   */
  getSidebar(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/sidebar", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/team-invitations
   */
  getTeamInvitations(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "team_id": number; "email": string; "role": "admin" | "member" | "viewer"; "invited_by_user_id"?: number; "accepted_by_user_id"?: number; "status": "pending" | "accepted" | "revoked" | "expired"; "delivery_status": "pending" | "sent" | "failed"; "expires_at": unknown; "delivered_at"?: unknown; "accepted_at"?: unknown; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/team-invitations", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/team-invitations/bulk-delete
   */
  postTeamInvitationsBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/team-invitations/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/team-invitations/{id}
   */
  getTeamInvitationsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "team_id": number; "email": string; "role": "admin" | "member" | "viewer"; "invited_by_user_id"?: number; "accepted_by_user_id"?: number; "status": "pending" | "accepted" | "revoked" | "expired"; "delivery_status": "pending" | "sent" | "failed"; "expires_at": unknown; "delivered_at"?: unknown; "accepted_at"?: unknown; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/team-invitations/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/team-invitations/{id}
   */
  deleteTeamInvitationsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "team_id": number; "email": string; "role": "admin" | "member" | "viewer"; "invited_by_user_id"?: number; "accepted_by_user_id"?: number; "status": "pending" | "accepted" | "revoked" | "expired"; "delivery_status": "pending" | "sent" | "failed"; "expires_at": unknown; "delivered_at"?: unknown; "accepted_at"?: unknown; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/team-invitations/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/team-members
   */
  getTeamMembers(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/team-members", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/team-members
   */
  postTeamMembers(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/team-members", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/team-members/bulk-delete
   */
  postTeamMembersBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/team-members/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/team-members/{id}
   */
  getTeamMembersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/team-members/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/team-members/{id}
   */
  putTeamMembersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/team-members/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/team-members/{id}
   */
  deleteTeamMembersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/team-members/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/team-members/{id}
   */
  patchTeamMembersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "team_id": number; "user_id": number; "role": "owner" | "admin" | "member" | "viewer"; "status": "active" | "suspended"; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/team-members/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/teams
   */
  getTeams(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/teams", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/teams
   */
  postTeams(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/teams", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/teams/bulk-delete
   */
  postTeamsBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/teams/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/teams/{id}
   */
  getTeamsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/teams/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/teams/{id}
   */
  putTeamsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PUT", "/api/teams/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/teams/{id}
   */
  deleteTeamsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "DELETE", "/api/teams/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/teams/{id}
   */
  patchTeamsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "name"?: string; "description"?: string; "member_count"?: number; "status"?: string; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "PATCH", "/api/teams/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/todos
   */
  getTodos(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null }> }>> {
    return request(config, "GET", "/api/todos", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/todos
   */
  postTodos(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "POST", "/api/todos", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/todos/bulk-delete
   */
  postTodosBulkDelete(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/todos/bulk-delete", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/todos/{id}
   */
  getTodosId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "GET", "/api/todos/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PUT /api/todos/{id}
   */
  putTodosId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "PUT", "/api/todos/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * DELETE /api/todos/{id}
   */
  deleteTodosId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "DELETE", "/api/todos/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * PATCH /api/todos/{id}
   */
  patchTodosId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "title": string; "notes"?: string; "when"?: "inbox" | "today" | "evening" | "anytime" | "someday"; "start_date"?: string; "deadline"?: string; "tags"?: string; "repeat"?: "none" | "daily" | "weekly" | "monthly" | "yearly"; "sort_order"?: number; "completed_at"?: unknown; "canceled_at"?: unknown; "user_id"?: number; "area_id"?: number; "project_id"?: number; "heading_id"?: number; "created_at"?: string; "updated_at"?: string; "deleted_at"?: string | null } }>> {
    return request(config, "PATCH", "/api/todos/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/todos/{id}/complete
   */
  postTodosIdComplete(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/todos/{id}/complete", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /api/todos/{id}/reopen
   */
  postTodosIdReopen(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/api/todos/{id}/reopen", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/updates/files/{channel}/{target}/{version}/{file}
   */
  getUpdatesFilesChannelTargetVersionFile(input: { "channel": string; "target": string; "version": string; "file": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/updates/files/{channel}/{target}/{version}/{file}", input ?? {}, [{"name":"channel","in":"path","required":true},{"name":"target","in":"path","required":true},{"name":"version","in":"path","required":true},{"name":"file","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/updates/{platform}/{arch}
   */
  getUpdatesPlatformArch(input: { "platform": string; "arch": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/api/updates/{platform}/{arch}", input ?? {}, [{"name":"platform","in":"path","required":true},{"name":"arch","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /api/users
   */
  getUsers(options?: RequestOptions): Promise<ApiResult<{ "data": Array<{ "id": number; "uuid": string; "name"?: string; "email"?: string; "avatar"?: string; "created_at"?: string; "updated_at"?: string }> }>> {
    return request(config, "GET", "/api/users", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /api/users
   */
  postUsers(options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "name"?: string; "email"?: string; "avatar"?: string; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "POST", "/api/users", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /api/users/{id}
   */
  getUsersId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<{ "data": { "id": number; "uuid": string; "name"?: string; "email"?: string; "avatar"?: string; "created_at"?: string; "updated_at"?: string } }>> {
    return request(config, "GET", "/api/users/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /auth/abilities
   */
  getAuthAbilities(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/auth/abilities", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/magic-link
   */
  postAuthMagicLink(input: { body: { "email": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/magic-link", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * POST /auth/magic-link/consume
   */
  postAuthMagicLinkConsume(input: { body: { "token": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/magic-link/consume", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * GET /auth/oauth/clients
   */
  getAuthOauthClients(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/auth/oauth/clients", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/oauth/clients
   */
  postAuthOauthClients(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/oauth/clients", {}, [], null, "application/json", [], options)
  },

  /**
   * PATCH /auth/oauth/clients/{id}
   */
  patchAuthOauthClientsId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "PATCH", "/auth/oauth/clients/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /auth/oauth/clients/{id}/disable
   */
  postAuthOauthClientsIdDisable(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/oauth/clients/{id}/disable", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /auth/oauth/clients/{id}/rotate-secret
   */
  postAuthOauthClientsIdRotateSecret(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/oauth/clients/{id}/rotate-secret", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /auth/oauth/connections
   */
  getAuthOauthConnections(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/auth/oauth/connections", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/oauth/connections/{id}/disconnect
   */
  postAuthOauthConnectionsIdDisconnect(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/oauth/connections/{id}/disconnect", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * GET /auth/passkeys
   */
  getAuthPasskeys(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/auth/passkeys", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/passkeys/authentication
   */
  postAuthPasskeysAuthentication(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/passkeys/authentication", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/passkeys/authentication/options
   */
  postAuthPasskeysAuthenticationOptions(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/passkeys/authentication/options", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/passkeys/registration
   */
  postAuthPasskeysRegistration(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/passkeys/registration", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/passkeys/registration/options
   */
  postAuthPasskeysRegistrationOptions(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/passkeys/registration/options", {}, [], null, "application/json", [], options)
  },

  /**
   * DELETE /auth/passkeys/{id}
   */
  deleteAuthPasskeysId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "DELETE", "/auth/passkeys/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /auth/refresh
   */
  postAuthRefresh(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/refresh", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /auth/token
   */
  postAuthToken(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/auth/token", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /auth/tokens
   */
  getAuthTokens(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/auth/tokens", {}, [], null, "application/json", [], options)
  },

  /**
   * DELETE /auth/tokens/{id}
   */
  deleteAuthTokensId(input: { "id": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "DELETE", "/auth/tokens/{id}", input ?? {}, [{"name":"id","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /disable-two-factor
   */
  postDisableTwoFactor(input: { body: { "password": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/disable-two-factor", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * POST /enable-two-factor
   */
  postEnableTwoFactor(input: { body: { "code": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/enable-two-factor", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * GET /generate-authentication-options
   */
  getGenerateAuthenticationOptions(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/generate-authentication-options", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /generate-registration-options
   */
  getGenerateRegistrationOptions(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/generate-registration-options", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /generate-two-factor-secret
   */
  postGenerateTwoFactorSecret(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/generate-two-factor-secret", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /locale/{locale}
   */
  getLocaleLocale(input: { "locale": string }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/locale/{locale}", input ?? {}, [{"name":"locale","in":"path","required":true}], null, "application/json", [], options)
  },

  /**
   * POST /login
   */
  postLogin(input: { body: { "email": string; "password": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/login", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * POST /logout
   */
  postLogout(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/logout", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /logout-all
   */
  postLogoutAll(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/logout-all", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /me
   */
  getMe(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/me", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /me/data-export
   */
  getMeDataExport(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/me/data-export", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /oauth/authorize
   */
  getOauthAuthorize(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/oauth/authorize", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /oauth/authorize
   */
  postOauthAuthorize(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/oauth/authorize", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /oauth/introspect
   */
  postOauthIntrospect(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/oauth/introspect", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /oauth/revoke
   */
  postOauthRevoke(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/oauth/revoke", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /oauth/token
   */
  postOauthToken(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/oauth/token", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /password/forgot
   */
  postPasswordForgot(input: { body: { "email": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/password/forgot", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * POST /password/reset
   */
  postPasswordReset(input: { body: { "email": string; "token": string; "password": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/password/reset", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * POST /password/verify-token
   */
  postPasswordVerifyToken(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/password/verify-token", {}, [], null, "application/json", [], options)
  },

  /**
   * GET /referrals
   */
  getReferrals(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/referrals", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /referrals/code
   */
  postReferralsCode(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/referrals/code", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /register
   */
  postRegister(input: { body: { "email": string; "password": string; "name": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/register", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },

  /**
   * GET /robots.txt
   */
  getRobotsTxt(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "GET", "/robots.txt", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /verify-authentication
   */
  postVerifyAuthentication(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/verify-authentication", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /verify-registration
   */
  postVerifyRegistration(options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/verify-registration", {}, [], null, "application/json", [], options)
  },

  /**
   * POST /verify-two-factor-login
   */
  postVerifyTwoFactorLogin(input: { body: { "challenge_token": string; "code": string } }, options?: RequestOptions): Promise<ApiResult<Record<string, unknown>>> {
    return request(config, "POST", "/verify-two-factor-login", input ?? {}, [], {"required":true,"content":["application/json"]}, "application/json", [], options)
  },
  }
}
export type Client = ReturnType<typeof createClient>
