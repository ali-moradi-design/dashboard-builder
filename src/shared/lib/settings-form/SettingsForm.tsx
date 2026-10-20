import { Switch } from 'radix-ui'
import { useEffect, useId } from 'react'
import { Controller, useForm } from 'react-hook-form'

import type { Lang } from '../../model'
import { cn } from '../cn'
import type { FormDocument, FormField, FormText, FormValues } from './document'

/*
 * Adapter for widget settings forms. Today it renders the documents with a
 * small built-in renderer (React Hook Form). When the formweave packages are
 * installed, only this file changes:
 *
 *   import { createRegistry } from '@formweave/engine'
 *   import { allFields } from '@formweave/engine/fields/all'
 *   import { createRenderers, Form } from '@formweave/react'
 *   import { basicRenderers } from '@formweave/react/fields'
 *   <Form schema={document} registry={registry} renderers={renderers} locale={locale}
 *         defaultValues={values} actions={false} onChange={onChange} />
 */
export interface SettingsFormProps {
  document: FormDocument
  values: FormValues
  onChange: (values: FormValues, name: string | undefined) => void
  locale: Lang
}

const text = (t: FormText | undefined, lang: Lang) =>
  t ? ((lang === 'fa' ? t.fa : undefined) ?? t.en) : ''

const control =
  'h-9 w-full rounded-lg border border-border bg-bg px-2.5 text-sm text-text placeholder:text-muted'

function Field({
  field,
  form,
  lang,
}: {
  field: FormField
  form: ReturnType<typeof useForm<FormValues>>
  lang: Lang
}) {
  const id = useId()
  const help = field.help ? (
    <p className="mt-1 text-xs text-muted">{text(field.help, lang)}</p>
  ) : null
  const label = (
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
      {text(field.label, lang)}
    </label>
  )
  switch (field.type) {
    case 'switch':
      return (
        <div className="flex items-center justify-between gap-3 py-1">
          <label htmlFor={id} className="text-sm">
            {text(field.label, lang)}
          </label>
          <Controller
            control={form.control}
            name={field.key}
            render={({ field: f }) => (
              <Switch.Root
                id={id}
                checked={Boolean(f.value)}
                onCheckedChange={f.onChange}
                className="relative h-5 w-9 shrink-0 rounded-full bg-border transition-colors data-[state=checked]:bg-accent"
              >
                <Switch.Thumb className="block size-3.5 translate-x-0.75 rounded-full bg-bg transition-transform data-[state=checked]:translate-x-4.75 rtl:-translate-x-0.75 rtl:data-[state=checked]:-translate-x-4.75" />
              </Switch.Root>
            )}
          />
        </div>
      )
    case 'select':
      return (
        <div>
          {label}
          <select id={id} className={control} {...form.register(field.key)}>
            {field.settings.options.map((o) => (
              <option key={o.value} value={o.value}>
                {text(o.label, lang)}
              </option>
            ))}
          </select>
          {help}
        </div>
      )
    case 'radio':
      return (
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-muted">{text(field.label, lang)}</legend>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {field.settings.options.map((o) => (
              <label
                key={o.value}
                className="cursor-pointer px-3 py-1.5 text-xs font-medium text-muted has-checked:bg-accent-soft has-checked:text-text"
              >
                <input
                  type="radio"
                  value={o.value}
                  className="sr-only"
                  {...form.register(field.key)}
                />
                {text(o.label, lang)}
              </label>
            ))}
          </div>
          {help}
        </fieldset>
      )
    case 'number':
      return (
        <div>
          {label}
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={field.settings?.min}
            max={field.settings?.max}
            step={field.settings?.integer ? 1 : 'any'}
            className={control}
            {...form.register(field.key, {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
          {help}
        </div>
      )
    case 'longText':
      return (
        <div>
          {label}
          <textarea
            id={id}
            rows={6}
            maxLength={field.settings?.maxLength}
            dir="auto"
            className={cn(control, 'h-auto py-2')}
            {...form.register(field.key)}
          />
          {help}
        </div>
      )
    case 'shortText':
      return (
        <div>
          {label}
          <input
            id={id}
            type="text"
            maxLength={field.settings?.maxLength}
            dir="auto"
            className={control}
            {...form.register(field.key)}
          />
          {help}
        </div>
      )
  }
}

/** Live settings form: no submit button, every change is reported. */
export function SettingsForm({ document, values, onChange, locale }: SettingsFormProps) {
  const form = useForm<FormValues>({ defaultValues: values })
  useEffect(() => {
    const sub = form.watch((all, { name }) => onChange(all, name))
    return () => sub.unsubscribe()
  }, [form, onChange])
  const fields = document.steps.flatMap((s) => s.fields)
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => e.preventDefault()}
      aria-label={text(document.title, locale)}
    >
      {fields.map((f) => (
        <div key={f.key} className={f.width === 'half' ? 'col-span-1' : 'col-span-2'}>
          <Field field={f} form={form} lang={locale} />
        </div>
      ))}
    </form>
  )
}
