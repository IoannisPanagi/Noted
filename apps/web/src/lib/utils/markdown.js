import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Notes are broadcast to everyone in the workspace, so the HTML is always
// sanitised before it reaches {@html}. `breaks` keeps single newlines, which is
// how notes were written before markdown existed
export function renderMarkdown(text = '') {
	return DOMPurify.sanitize(marked.parse(text, { gfm: true, breaks: true, async: false }));
}
