// Widget settings forms are formweave documents; these are its own types.
import type { FieldNode, FormDocument, LocalizedText } from '@formweave/schema'

export type { FormDocument }
export type FormField = FieldNode
export type FormText = LocalizedText
export interface FormOption {
  value: string
  label: LocalizedText
}
export type FormValues = Record<string, unknown>
