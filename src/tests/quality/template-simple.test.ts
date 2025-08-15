import { describe, it, expect, beforeAll } from 'vitest';
import { TemplateRenderer } from '../../services/TemplateRenderer';

describe('Template Quality Tests - Simple', () => {
  let templateRenderer: TemplateRenderer;

  beforeAll(() => {
    templateRenderer = new TemplateRenderer();
  });

  it('should create TemplateRenderer instance', () => {
    expect(templateRenderer).toBeDefined();
    expect(templateRenderer).toBeInstanceOf(TemplateRenderer);
  });

  it('should have renderTemplate method', () => {
    expect(typeof templateRenderer.renderTemplate).toBe('function');
  });

  it('should have generateImageGallery method', () => {
    expect(typeof templateRenderer.generateImageGallery).toBe('function');
  });
});