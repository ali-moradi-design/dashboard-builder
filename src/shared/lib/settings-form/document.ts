// Widget settings forms are formcanvas documents; these are its own types.
import type { FieldNode, FormDocument, LocalizedText } from '@formcanvas/schema'

export type { FormDocument }
export type FormField = FieldNode
export type FormText = LocalizedText
export interface FormOption {
  value: string
  label: LocalizedText
}
export type FormValues = Record<string, unknown>
