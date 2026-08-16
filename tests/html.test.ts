import { describe, expect, it } from 'vitest';
import { htmlToBlocks } from '../src/lib/html';

describe('htmlToBlocks', () => {
  it('converts paragraphs, formatting and entities to plain text', () => {
    expect(htmlToBlocks('<p>Привет, <b>мир</b> &mdash; тест&nbsp;!</p>')).toEqual([
      { type: 'text', text: 'Привет, мир — тест !' },
    ]);
  });

  it('keeps images in their source order', () => {
    expect(
      htmlToBlocks('<p>До</p><img src="https://example.com/a.jpg"><p>После</p>'),
    ).toEqual([
      { type: 'text', text: 'До' },
      { type: 'image', url: 'https://example.com/a.jpg' },
      { type: 'text', text: 'После' },
    ]);
  });

  it('decodes numeric entities and preserves unknown named ones', () => {
    expect(htmlToBlocks('&#1040; &#x411; &custom;')).toEqual([
      { type: 'text', text: 'А Б &custom;' },
    ]);
  });
});
