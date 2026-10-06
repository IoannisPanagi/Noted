import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Notes reach everyone in the workspace, so the HTML is always sanitised.
// `breaks` keeps single newlines, how notes were written before markdown
export function renderMarkdown(text = '') {
	return DOMPurify.sanitize(marked.parse(text, { gfm: true, breaks: true, async: false }));
}
