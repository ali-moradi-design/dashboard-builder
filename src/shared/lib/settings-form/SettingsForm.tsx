import { createRegistry } from '@formcanvas/engine'
import { allFields } from '@formcanvas/engine/fields/all'
import { createRenderers, Form } from '@formcanvas/react'
import { basicRenderers } from '@formcanvas/react/fields'
import '@formcanvas/react/styles.css'

import type { Lang } from '../../model'
import type { FormDocument, FormValues } from './document'
import './theme.css'

/*
 * Adapter for widget settings forms, rendered by the formcanvas engine from the
 * user's form-builder project (@formcanvas/* packages from npm, pinned versions).
 */
export interface SettingsFormProps {
  document: FormDocument
  values: FormValues
  onChange: (values: FormValues, name: string | undefined) => void
  locale: Lang
  digits?: 'native' | 'latin'
}

const registry = createRegistry(allFields)
const renderers = createRenderers(basicRenderers)

/** Live settings form: no buttons, every change is reported. */
export function SettingsForm({
  document,
  values,
  onChange,
  locale,
  digits = 'native',
}: SettingsFormProps) {
  return (
    <Form
      className="fc-form settings-form"
      schema={document}
      registry={registry}
      renderers={renderers}
      locale={locale}
      digits={digits}
      defaultValues={values}
      actions={false}
      onChange={onChange}
    />
  )
}
