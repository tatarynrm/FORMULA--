import { sanitizeRichText } from './sanitize-html.js';

describe('sanitizeRichText', () => {
  it('keeps the formatting the editor can produce', () => {
    const html =
      '<h2>Title</h2><p>H<sub>2</sub>O is <strong>water</strong>, x<sup>2</sup>.</p><ul><li>one</li></ul>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it('removes scripts, event handlers and javascript links', () => {
    const cleaned = sanitizeRichText(
      '<p onclick="steal()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><iframe src="//evil"></iframe>',
    );
    expect(cleaned).not.toMatch(/script|onclick|javascript|iframe|evil/i);
    expect(cleaned).toContain('hi');
  });

  it('opens links safely in a new tab', () => {
    const cleaned = sanitizeRichText('<a href="https://example.com">site</a>');
    expect(cleaned).toContain('target="_blank"');
    expect(cleaned).toContain('rel="noopener noreferrer nofollow"');
  });

  it('only allows pictures from our own file endpoint', () => {
    const own = 'http://localhost:4000/api/v1/files/0b6f2f64-9a5f-4a8e-bb3b-2f5d2c0f6a11';
    expect(sanitizeRichText(`<img src="${own}" alt="scheme">`)).toContain(own);
    expect(sanitizeRichText('<p>a</p><img src="https://evil.example/x.png">')).toBe('<p>a</p>');
    expect(sanitizeRichText('<img src="/api/v1/files/not-a-uuid">')).toBe('');
  });
});
