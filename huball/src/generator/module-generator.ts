import type { DetectedComponent, ComponentType } from '../types/crawl-result';
import type { ModuleDefinition, ModuleMeta, HubSpotField } from '../types/hubspot-theme';
import { componentTypeLabel } from '../analyzer/component-classifier';

/**
 * Generate a HubSpot module from a detected component.
 */
export function generateModule(
  component: DetectedComponent,
  index: number,
  prefix: string,
): ModuleDefinition {
  const type = component.type;
  const dirName = `${type}.module`;
  const label = componentTypeLabel(type);

  const metaJson: ModuleMeta = {
    label,
    is_available_for_new_content: true,
    content_types: ['PAGE', 'LANDING_PAGE'],
  };

  const { fields, html, css } = buildModuleContent(component, prefix);

  return {
    dirName,
    label,
    metaJson,
    fieldsJson: fields,
    moduleHtml: html,
    moduleCss: css,
  };
}

interface ModuleContent {
  fields: HubSpotField[];
  html: string;
  css: string;
}

function buildModuleContent(
  component: DetectedComponent,
  prefix: string,
): ModuleContent {
  switch (component.type) {
    case 'header':
      return buildHeaderModule(component, prefix);
    case 'hero':
      return buildHeroModule(component, prefix);
    case 'text-block':
      return buildTextBlockModule(component, prefix);
    case 'text-image':
      return buildTextImageModule(component, prefix);
    case 'card-grid':
      return buildCardGridModule(component, prefix);
    case 'cta-banner':
      return buildCtaBannerModule(component, prefix);
    case 'testimonial':
      return buildTestimonialModule(component, prefix);
    case 'stats':
      return buildStatsModule(component, prefix);
    case 'form':
      return buildFormModule(component, prefix);
    case 'newsletter':
      return buildNewsletterModule(component, prefix);
    case 'footer':
      return buildFooterModule(component, prefix);
    case 'gallery':
      return buildGalleryModule(component, prefix);
    default:
      return buildGenericModule(component, prefix);
  }
}

// ---- Header Module ----

function buildHeaderModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const fields: HubSpotField[] = [
    { type: 'image', name: 'logo', label: 'Logo', default: { src: '', alt: 'Logo' } },
    {
      type: 'group',
      name: 'nav_items',
      label: 'Navigation Items',
      children: [
        { type: 'text', name: 'label', label: 'Label', default: 'Link' },
        { type: 'url', name: 'url', label: 'URL', default: '#' },
      ],
    },
    {
      type: 'group',
      name: 'cta',
      label: 'CTA Button',
      children: [
        { type: 'text', name: 'text', label: 'Button Text', default: comp.buttons[0]?.text || 'Get Started' },
        { type: 'url', name: 'url', label: 'Button URL', default: comp.buttons[0]?.href || '#' },
      ],
    },
  ];

  const html = `<header class="${prefix}-header">
  <div class="${prefix}-container">
    <div class="${prefix}-header__inner">
      {% if module.logo.src %}
        <a href="/" class="${prefix}-header__logo">
          <img src="{{ module.logo.src }}" alt="{{ module.logo.alt }}" loading="eager">
        </a>
      {% endif %}

      <nav class="${prefix}-header__nav" role="navigation">
        {% for item in module.nav_items %}
          <a href="{{ item.url }}" class="${prefix}-header__link">{{ item.label }}</a>
        {% endfor %}
      </nav>

      {% if module.cta.text %}
        <a href="{{ module.cta.url }}" class="${prefix}-btn ${prefix}-btn--primary ${prefix}-header__cta">
          {{ module.cta.text }}
        </a>
      {% endif %}

      <button class="${prefix}-header__toggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>`;

  const css = `.${prefix}-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--${prefix}-background);
  border-bottom: 1px solid rgba(0,0,0,0.08);
  transition: box-shadow 0.3s ease;
}
.${prefix}-header.is-scrolled {
  box-shadow: 0 2px 20px rgba(0,0,0,0.1);
}
.${prefix}-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  gap: 2rem;
}
.${prefix}-header__logo img {
  height: 40px;
  width: auto;
}
.${prefix}-header__nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.${prefix}-header__link {
  color: var(--${prefix}-text_primary);
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s;
}
.${prefix}-header__link:hover {
  color: var(--${prefix}-primary);
}
.${prefix}-header__cta {
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
}
.${prefix}-header__toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.${prefix}-header__toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--${prefix}-text_primary);
  transition: transform 0.3s;
}
@media (max-width: 767px) {
  .${prefix}-header__nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: var(--${prefix}-background);
    padding: 1rem;
    border-bottom: 1px solid rgba(0,0,0,0.08);
  }
  .${prefix}-header__nav.is-open { display: flex; }
  .${prefix}-header__toggle { display: flex; }
  .${prefix}-header__cta { display: none; }
}`;

  return { fields, html, css };
}

// ---- Hero Module ----

function buildHeroModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const heading = comp.headings.find((h) => h.level === 1) || comp.headings[0];
  const subtext = comp.paragraphs[0] || '';
  const btn = comp.buttons[0];

  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: heading?.text || 'Welcome' },
    { type: 'richtext', name: 'subtext', label: 'Subtext', default: `<p>${subtext}</p>` },
    { type: 'image', name: 'background_image', label: 'Background Image', default: { src: comp.backgroundImageUrl || '', alt: '' } },
    {
      type: 'group',
      name: 'cta',
      label: 'CTA Button',
      children: [
        { type: 'text', name: 'text', label: 'Button Text', default: btn?.text || 'Learn More' },
        { type: 'url', name: 'url', label: 'Button URL', default: btn?.href || '#' },
      ],
    },
  ];

  const html = `<section class="${prefix}-hero" {% if module.background_image.src %}style="background-image: url('{{ module.background_image.src }}')"{% endif %}>
  <div class="${prefix}-hero__overlay"></div>
  <div class="${prefix}-container">
    <div class="${prefix}-hero__content ${prefix}-reveal">
      {% if module.heading %}
        <h1 class="${prefix}-hero__heading">{{ module.heading }}</h1>
      {% endif %}
      {% if module.subtext %}
        <div class="${prefix}-hero__subtext">{{ module.subtext }}</div>
      {% endif %}
      {% if module.cta.text %}
        <a href="{{ module.cta.url }}" class="${prefix}-btn ${prefix}-btn--primary ${prefix}-hero__cta">
          {{ module.cta.text }}
        </a>
      {% endif %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-hero {
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  background-size: cover;
  background-position: center;
  background-color: var(--${prefix}-text_primary);
  color: #ffffff;
  overflow: hidden;
}
.${prefix}-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
}
.${prefix}-hero__content {
  position: relative;
  z-index: 1;
  max-width: 700px;
}
.${prefix}-hero__heading {
  color: #ffffff;
  margin-bottom: 1rem;
}
.${prefix}-hero__subtext {
  font-size: 1.15rem;
  line-height: 1.7;
  opacity: 0.9;
  margin-bottom: 2rem;
}
.${prefix}-hero__cta {
  font-size: 1.05rem;
  padding: 0.85rem 2rem;
}`;

  return { fields, html, css };
}

// ---- Text Block Module ----

function buildTextBlockModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const heading = comp.headings[0];

  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: heading?.text || 'Section Heading' },
    { type: 'richtext', name: 'content', label: 'Content', default: comp.paragraphs.map((p) => `<p>${p}</p>`).join('\n') || '<p>Content goes here.</p>' },
  ];

  const html = `<section class="${prefix}-text-block ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    {% if module.heading %}
      <h2 class="${prefix}-text-block__heading">{{ module.heading }}</h2>
    {% endif %}
    {% if module.content %}
      <div class="${prefix}-text-block__content">{{ module.content }}</div>
    {% endif %}
  </div>
</section>`;

  const css = `.${prefix}-text-block__heading {
  margin-bottom: 1.5rem;
}
.${prefix}-text-block__content {
  max-width: 800px;
  font-size: 1.05rem;
  line-height: 1.8;
}`;

  return { fields, html, css };
}

// ---- Text + Image Module ----

function buildTextImageModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const heading = comp.headings[0];
  const image = comp.images[0];

  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: heading?.text || 'Section Heading' },
    { type: 'richtext', name: 'content', label: 'Content', default: comp.paragraphs.map((p) => `<p>${p}</p>`).join('\n') || '<p>Content goes here.</p>' },
    { type: 'image', name: 'image', label: 'Image', default: { src: image?.url || '', alt: image?.alt || '' } },
    { type: 'boolean', name: 'image_right', label: 'Image on Right', default: true },
  ];

  const html = `<section class="${prefix}-text-image ${prefix}-section ${prefix}-reveal {% if module.image_right %}${prefix}-text-image--right{% else %}${prefix}-text-image--left{% endif %}">
  <div class="${prefix}-container">
    <div class="${prefix}-text-image__grid">
      <div class="${prefix}-text-image__text">
        {% if module.heading %}
          <h2>{{ module.heading }}</h2>
        {% endif %}
        {% if module.content %}
          <div class="${prefix}-text-image__body">{{ module.content }}</div>
        {% endif %}
      </div>
      {% if module.image.src %}
        <div class="${prefix}-text-image__media">
          <img src="{{ module.image.src }}" alt="{{ module.image.alt }}" loading="lazy">
        </div>
      {% endif %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-text-image__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
.${prefix}-text-image--left .${prefix}-text-image__media { order: -1; }
.${prefix}-text-image__body {
  font-size: 1.05rem;
  line-height: 1.8;
  margin-top: 1rem;
}
.${prefix}-text-image__media img {
  border-radius: var(--${prefix}-radius);
}
@media (max-width: 767px) {
  .${prefix}-text-image__grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .${prefix}-text-image__media { order: -1; }
}`;

  return { fields, html, css };
}

// ---- Card Grid Module ----

function buildCardGridModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const heading = comp.headings[0];
  const cardCount = Math.min(comp.childCount, 6);

  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Section Heading', default: heading?.text || 'Our Services' },
    {
      type: 'group',
      name: 'cards',
      label: 'Cards',
      children: [
        { type: 'image', name: 'image', label: 'Image', default: { src: '', alt: '' } },
        { type: 'text', name: 'title', label: 'Title', default: 'Card Title' },
        { type: 'richtext', name: 'description', label: 'Description', default: '<p>Card description goes here.</p>' },
        { type: 'url', name: 'link', label: 'Link URL' },
      ],
    },
  ];

  const html = `<section class="${prefix}-card-grid ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    {% if module.heading %}
      <h2 class="${prefix}-card-grid__heading">{{ module.heading }}</h2>
    {% endif %}
    <div class="${prefix}-card-grid__grid">
      {% for card in module.cards %}
        <div class="${prefix}-card">
          {% if card.image.src %}
            <div class="${prefix}-card__media">
              <img src="{{ card.image.src }}" alt="{{ card.image.alt }}" loading="lazy">
            </div>
          {% endif %}
          <div class="${prefix}-card__body">
            {% if card.title %}
              <h3 class="${prefix}-card__title">{{ card.title }}</h3>
            {% endif %}
            {% if card.description %}
              <div class="${prefix}-card__desc">{{ card.description }}</div>
            {% endif %}
            {% if card.link %}
              <a href="{{ card.link }}" class="${prefix}-card__link">Learn more &rarr;</a>
            {% endif %}
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-card-grid__heading {
  text-align: center;
  margin-bottom: 3rem;
}
.${prefix}-card-grid__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.${prefix}-card {
  background: var(--${prefix}-background);
  border-radius: var(--${prefix}-radius);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}
.${prefix}-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}
.${prefix}-card__media img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.${prefix}-card__body {
  padding: 1.5rem;
}
.${prefix}-card__title {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}
.${prefix}-card__desc {
  font-size: 0.95rem;
  color: var(--${prefix}-secondary);
  margin-bottom: 1rem;
}
.${prefix}-card__link {
  font-weight: 600;
  font-size: 0.9rem;
}`;

  return { fields, html, css };
}

// ---- CTA Banner Module ----

function buildCtaBannerModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const heading = comp.headings[0];
  const btn = comp.buttons[0];

  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: heading?.text || 'Ready to get started?' },
    { type: 'text', name: 'subtext', label: 'Subtext', default: comp.paragraphs[0] || '' },
    {
      type: 'group',
      name: 'button',
      label: 'Button',
      children: [
        { type: 'text', name: 'text', label: 'Text', default: btn?.text || 'Get Started' },
        { type: 'url', name: 'url', label: 'URL', default: btn?.href || '#' },
      ],
    },
    { type: 'color', name: 'bg_color', label: 'Background Color', default: { color: comp.computedStyles.backgroundColor || '#1a1a2e' } },
  ];

  const html = `<section class="${prefix}-cta-banner ${prefix}-section ${prefix}-reveal" style="background-color: {{ module.bg_color.color }}">
  <div class="${prefix}-container">
    <div class="${prefix}-cta-banner__content">
      {% if module.heading %}
        <h2 class="${prefix}-cta-banner__heading">{{ module.heading }}</h2>
      {% endif %}
      {% if module.subtext %}
        <p class="${prefix}-cta-banner__subtext">{{ module.subtext }}</p>
      {% endif %}
      {% if module.button.text %}
        <a href="{{ module.button.url }}" class="${prefix}-btn ${prefix}-btn--primary">
          {{ module.button.text }}
        </a>
      {% endif %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-cta-banner {
  text-align: center;
  color: #ffffff;
}
.${prefix}-cta-banner__content {
  max-width: 650px;
  margin: 0 auto;
}
.${prefix}-cta-banner__heading {
  color: #ffffff;
  margin-bottom: 1rem;
}
.${prefix}-cta-banner__subtext {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}`;

  return { fields, html, css };
}

// ---- Testimonial Module ----

function buildTestimonialModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Section Heading', default: comp.headings[0]?.text || 'What Our Clients Say' },
    {
      type: 'group',
      name: 'testimonials',
      label: 'Testimonials',
      children: [
        { type: 'richtext', name: 'quote', label: 'Quote', default: '<p>"Great experience working with this team."</p>' },
        { type: 'text', name: 'name', label: 'Name', default: 'John Doe' },
        { type: 'text', name: 'title', label: 'Title', default: 'CEO, Company' },
        { type: 'image', name: 'avatar', label: 'Photo' },
      ],
    },
  ];

  const html = `<section class="${prefix}-testimonials ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    {% if module.heading %}
      <h2 class="${prefix}-testimonials__heading">{{ module.heading }}</h2>
    {% endif %}
    <div class="${prefix}-testimonials__grid">
      {% for item in module.testimonials %}
        <div class="${prefix}-testimonial-card">
          <div class="${prefix}-testimonial-card__quote">{{ item.quote }}</div>
          <div class="${prefix}-testimonial-card__author">
            {% if item.avatar.src %}
              <img src="{{ item.avatar.src }}" alt="{{ item.name }}" class="${prefix}-testimonial-card__avatar">
            {% endif %}
            <div>
              <strong>{{ item.name }}</strong>
              {% if item.title %}<br><span>{{ item.title }}</span>{% endif %}
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-testimonials__heading {
  text-align: center;
  margin-bottom: 3rem;
}
.${prefix}-testimonials__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.${prefix}-testimonial-card {
  background: var(--${prefix}-surface);
  padding: 2rem;
  border-radius: var(--${prefix}-radius);
}
.${prefix}-testimonial-card__quote {
  font-style: italic;
  font-size: 1.05rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}
.${prefix}-testimonial-card__author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}
.${prefix}-testimonial-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}`;

  return { fields, html, css };
}

// ---- Stats Module ----

function buildStatsModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Section Heading', default: comp.headings[0]?.text || '' },
    {
      type: 'group',
      name: 'stats',
      label: 'Statistics',
      children: [
        { type: 'text', name: 'value', label: 'Value', default: '100+' },
        { type: 'text', name: 'label', label: 'Label', default: 'Clients' },
      ],
    },
  ];

  const html = `<section class="${prefix}-stats ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    {% if module.heading %}
      <h2 class="${prefix}-stats__heading">{{ module.heading }}</h2>
    {% endif %}
    <div class="${prefix}-stats__grid">
      {% for stat in module.stats %}
        <div class="${prefix}-stat">
          <div class="${prefix}-stat__value">{{ stat.value }}</div>
          <div class="${prefix}-stat__label">{{ stat.label }}</div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-stats__heading {
  text-align: center;
  margin-bottom: 3rem;
}
.${prefix}-stats__grid {
  display: flex;
  justify-content: center;
  gap: 4rem;
  flex-wrap: wrap;
}
.${prefix}-stat {
  text-align: center;
}
.${prefix}-stat__value {
  font-size: 2.5rem;
  font-weight: 700;
  font-family: var(--${prefix}-font-heading);
  color: var(--${prefix}-primary);
}
.${prefix}-stat__label {
  font-size: 0.95rem;
  color: var(--${prefix}-secondary);
  margin-top: 0.25rem;
}`;

  return { fields, html, css };
}

// ---- Form Module ----

function buildFormModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: comp.headings[0]?.text || 'Contact Us' },
    { type: 'richtext', name: 'description', label: 'Description', default: comp.paragraphs[0] ? `<p>${comp.paragraphs[0]}</p>` : '' },
    { type: 'text', name: 'form_id', label: 'HubSpot Form ID', help_text: 'Paste your HubSpot form ID here' },
  ];

  const html = `<section class="${prefix}-form-section ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    <div class="${prefix}-form-section__inner">
      <div class="${prefix}-form-section__text">
        {% if module.heading %}
          <h2>{{ module.heading }}</h2>
        {% endif %}
        {% if module.description %}
          <div class="${prefix}-form-section__desc">{{ module.description }}</div>
        {% endif %}
      </div>
      <div class="${prefix}-form-section__form">
        {% if module.form_id %}
          {% module "form" path="@hubspot/form" form_id="{{ module.form_id }}" %}
        {% else %}
          <p style="opacity: 0.6;">Configure a HubSpot form ID in the module settings.</p>
        {% endif %}
      </div>
    </div>
  </div>
</section>`;

  const css = `.${prefix}-form-section__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}
.${prefix}-form-section__desc {
  margin-top: 1rem;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--${prefix}-secondary);
}
@media (max-width: 767px) {
  .${prefix}-form-section__inner {
    grid-template-columns: 1fr;
  }
}`;

  return { fields, html, css };
}

// ---- Newsletter Module ----

function buildNewsletterModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: comp.headings[0]?.text || 'Stay Updated' },
    { type: 'text', name: 'subtext', label: 'Subtext', default: comp.paragraphs[0] || 'Subscribe to our newsletter.' },
    { type: 'text', name: 'form_id', label: 'HubSpot Form ID', help_text: 'Paste your newsletter form ID here' },
  ];

  const html = `<section class="${prefix}-newsletter ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    <div class="${prefix}-newsletter__inner">
      {% if module.heading %}
        <h2 class="${prefix}-newsletter__heading">{{ module.heading }}</h2>
      {% endif %}
      {% if module.subtext %}
        <p class="${prefix}-newsletter__subtext">{{ module.subtext }}</p>
      {% endif %}
      {% if module.form_id %}
        {% module "newsletter_form" path="@hubspot/form" form_id="{{ module.form_id }}" %}
      {% endif %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-newsletter {
  background: var(--${prefix}-surface);
  text-align: center;
}
.${prefix}-newsletter__inner {
  max-width: 600px;
  margin: 0 auto;
}
.${prefix}-newsletter__heading {
  margin-bottom: 0.5rem;
}
.${prefix}-newsletter__subtext {
  color: var(--${prefix}-secondary);
  margin-bottom: 1.5rem;
}`;

  return { fields, html, css };
}

// ---- Footer Module ----

function buildFooterModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const fields: HubSpotField[] = [
    { type: 'image', name: 'logo', label: 'Footer Logo' },
    { type: 'richtext', name: 'description', label: 'Description', default: comp.paragraphs[0] ? `<p>${comp.paragraphs[0]}</p>` : '<p>Company description.</p>' },
    {
      type: 'group',
      name: 'nav_columns',
      label: 'Navigation Columns',
      children: [
        { type: 'text', name: 'title', label: 'Column Title', default: 'Links' },
        {
          type: 'group',
          name: 'links',
          label: 'Links',
          children: [
            { type: 'text', name: 'label', label: 'Label', default: 'Link' },
            { type: 'url', name: 'url', label: 'URL', default: '#' },
          ],
        },
      ],
    },
    { type: 'text', name: 'copyright', label: 'Copyright', default: `© ${new Date().getFullYear()} Company Name. All rights reserved.` },
  ];

  const html = `<footer class="${prefix}-footer">
  <div class="${prefix}-container">
    <div class="${prefix}-footer__grid">
      <div class="${prefix}-footer__brand">
        {% if module.logo.src %}
          <img src="{{ module.logo.src }}" alt="{{ module.logo.alt }}" class="${prefix}-footer__logo">
        {% endif %}
        {% if module.description %}
          <div class="${prefix}-footer__desc">{{ module.description }}</div>
        {% endif %}
      </div>
      {% for col in module.nav_columns %}
        <div class="${prefix}-footer__col">
          {% if col.title %}
            <h4 class="${prefix}-footer__col-title">{{ col.title }}</h4>
          {% endif %}
          <ul class="${prefix}-footer__links">
            {% for link in col.links %}
              <li><a href="{{ link.url }}">{{ link.label }}</a></li>
            {% endfor %}
          </ul>
        </div>
      {% endfor %}
    </div>
    {% if module.copyright %}
      <div class="${prefix}-footer__bottom">
        <p>{{ module.copyright }}</p>
      </div>
    {% endif %}
  </div>
</footer>`;

  const css = `.${prefix}-footer {
  background: var(--${prefix}-text_primary);
  color: rgba(255,255,255,0.8);
  padding: 4rem 0 2rem;
}
.${prefix}-footer__grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
}
.${prefix}-footer__logo {
  height: 36px;
  width: auto;
  margin-bottom: 1rem;
}
.${prefix}-footer__desc {
  font-size: 0.9rem;
  line-height: 1.6;
  opacity: 0.7;
}
.${prefix}-footer__col-title {
  color: #ffffff;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}
.${prefix}-footer__links {
  list-style: none;
  padding: 0;
}
.${prefix}-footer__links li {
  margin-bottom: 0.5rem;
}
.${prefix}-footer__links a {
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  transition: color 0.2s;
}
.${prefix}-footer__links a:hover {
  color: #ffffff;
}
.${prefix}-footer__bottom {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 0.85rem;
  opacity: 0.6;
}
@media (max-width: 767px) {
  .${prefix}-footer__grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}`;

  return { fields, html, css };
}

// ---- Gallery Module ----

function buildGalleryModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: comp.headings[0]?.text || 'Gallery' },
    {
      type: 'group',
      name: 'images',
      label: 'Images',
      children: [
        { type: 'image', name: 'image', label: 'Image', default: { src: '', alt: '' } },
      ],
    },
  ];

  const html = `<section class="${prefix}-gallery ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    {% if module.heading %}
      <h2 class="${prefix}-gallery__heading">{{ module.heading }}</h2>
    {% endif %}
    <div class="${prefix}-gallery__grid">
      {% for item in module.images %}
        {% if item.image.src %}
          <div class="${prefix}-gallery__item">
            <img src="{{ item.image.src }}" alt="{{ item.image.alt }}" loading="lazy">
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</section>`;

  const css = `.${prefix}-gallery__heading {
  text-align: center;
  margin-bottom: 2rem;
}
.${prefix}-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.${prefix}-gallery__item img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: var(--${prefix}-radius);
}`;

  return { fields, html, css };
}

// ---- Generic Section (fallback) ----

function buildGenericModule(comp: DetectedComponent, prefix: string): ModuleContent {
  const heading = comp.headings[0];

  const fields: HubSpotField[] = [
    { type: 'text', name: 'heading', label: 'Heading', default: heading?.text || 'Section' },
    { type: 'richtext', name: 'content', label: 'Content', default: comp.paragraphs.map((p) => `<p>${p}</p>`).join('\n') || '<p>Section content.</p>' },
  ];

  if (comp.images.length > 0) {
    fields.push({
      type: 'image',
      name: 'image',
      label: 'Image',
      default: { src: comp.images[0]?.url || '', alt: comp.images[0]?.alt || '' },
    });
  }

  let imageHtml = '';
  if (comp.images.length > 0) {
    imageHtml = `
      {% if module.image.src %}
        <img src="{{ module.image.src }}" alt="{{ module.image.alt }}" class="${prefix}-generic__img" loading="lazy">
      {% endif %}`;
  }

  const html = `<section class="${prefix}-generic ${prefix}-section ${prefix}-reveal">
  <div class="${prefix}-container">
    {% if module.heading %}
      <h2>{{ module.heading }}</h2>
    {% endif %}
    {% if module.content %}
      <div class="${prefix}-generic__content">{{ module.content }}</div>
    {% endif %}${imageHtml}
  </div>
</section>`;

  const css = `.${prefix}-generic__content {
  max-width: 800px;
  font-size: 1.05rem;
  line-height: 1.8;
  margin-top: 1rem;
}
.${prefix}-generic__img {
  margin-top: 2rem;
  border-radius: var(--${prefix}-radius);
}`;

  return { fields, html, css };
}
