/**
 * The subset of the formweave `FormDocument` format used by widget settings.
 * Documents written against this type are valid formweave documents, so the
 * real engine can render them unchanged once it is installed.
 */
export interface FormText {
  en: string
  fa?: string
}

export interface FormOption {
  value: string
  label: FormText
}

interface FieldBase {
  key: string
  label: FormText
  help?: FormText
  width?: 'half' | 'full'
}

export type FormField =
  | (FieldBase & { type: 'shortText'; settings?: { maxLength?: number } })
  | (FieldBase & { type: 'longText'; settings?: { maxLength?: number } })
  | (FieldBase & { type: 'number'; settings?: { min?: number; max?: number; integer?: boolean } })
  | (FieldBase & { type: 'switch' })
  | (FieldBase & { type: 'select'; settings: { options: FormOption[] } })
  | (FieldBase & { type: 'radio'; settings: { options: FormOption[] } })

export interface FormDocument {
  schemaVersion: 1
  id: string
  title: FormText
  locales: { default: 'en'; supported: ['en', 'fa'] }
  steps: { key: string; fields: FormField[] }[]
}

export type FormValues = Record<string, unknown>
