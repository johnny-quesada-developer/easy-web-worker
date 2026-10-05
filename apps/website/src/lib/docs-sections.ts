export const DOC_SECTIONS = ['Start here', 'Core concepts', 'API reference', 'Guides', 'Quality', 'Platform'] as const;

export type DocSection = (typeof DOC_SECTIONS)[number];
