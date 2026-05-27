interface Props {
  componentTypes: string[];
}

const TYPE_LABELS: Record<string, string> = {
  header: 'Header',
  hero: 'Hero Banner',
  'text-block': 'Text Block',
  'text-image': 'Text + Image',
  'card-grid': 'Card Grid',
  stats: 'Statistics',
  'cta-banner': 'Call to Action',
  testimonial: 'Testimonial',
  gallery: 'Gallery',
  form: 'Form',
  newsletter: 'Newsletter',
  footer: 'Footer',
  'generic-section': 'Section',
};

export function ComponentList({ componentTypes }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Detected Components
      </h3>
      <div className="flex flex-wrap gap-2">
        {componentTypes.map((type, i) => (
          <span
            key={i}
            className="rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200"
          >
            {TYPE_LABELS[type] || type}
          </span>
        ))}
      </div>
    </div>
  );
}
