import React, { useEffect } from 'react';

/**
 * Componente reutilizable para administrar metadatos SEO y esquemas JSON-LD dinámicos.
 *
 * @param {Object} props
 * @param {string} [props.title] - Título de la página
 * @param {string} [props.description] - Descripción meta
 * @param {string} [props.canonical] - URL Canónica
 * @param {Object|Array} [props.schema] - Objeto o array de esquemas JSON-LD (Schema.org)
 */
export default function SeoHead({ title, description, canonical, schema }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = description;
        document.head.appendChild(metaDesc);
      }
    }

    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (linkCanonical) {
        linkCanonical.setAttribute('href', canonical);
      } else {
        linkCanonical = document.createElement('link');
        linkCanonical.rel = 'canonical';
        linkCanonical.href = canonical;
        document.head.appendChild(linkCanonical);
      }
    }
  }, [title, description, canonical]);

  if (!schema) return null;

  const schemasToRender = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemasToRender.map((schemaItem, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItem) }}
        />
      ))}
    </>
  );
}
