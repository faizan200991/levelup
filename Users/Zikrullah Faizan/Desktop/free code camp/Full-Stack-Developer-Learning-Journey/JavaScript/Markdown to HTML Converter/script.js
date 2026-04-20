// Markdown to HTML Converter
function convertMarkdown() {
  const input = document.getElementById('markdown-input').value;

  // Helper to recursively convert markdown for inner content
  function parseInline(md) {
    // Images
    md = md.replace(/!\[([^\]]+)\]\(([^\)]+)\)/g, '<img alt="$1" src="$2">');
    // Links
    md = md.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
    // Bold (**text** or __text__), non-greedy and recursive
    md = md.replace(/\*\*(.+?)\*\*/g, function(match, p1) {
      return '<strong>' + parseInline(p1) + '</strong>';
    });
    md = md.replace(/__(.+?)__/g, function(match, p1) {
      return '<strong>' + parseInline(p1) + '</strong>';
    });
    // Italic (*text* or _text_), non-greedy and recursive
    md = md.replace(/\*(.+?)\*/g, function(match, p1) {
      return '<em>' + parseInline(p1) + '</em>';
    });
    md = md.replace(/_(.+?)_/g, function(match, p1) {
      return '<em>' + parseInline(p1) + '</em>';
    });
    return md;
  }

  let html = input;

  // Blockquotes (must be at start of line, not after other text)
  html = html.replace(/^> ([^\n]+)$/gm, function(match, p1) {
    return '<blockquote>' + parseInline(p1) + '</blockquote>';
  });

  // Headings (must be at start of line, not after other text)
  html = html.replace(/^### ([^\n]+)$/gm, function(match, p1) {
    return '<h3>' + parseInline(p1) + '</h3>';
  });
  html = html.replace(/^## ([^\n]+)$/gm, function(match, p1) {
    return '<h2>' + parseInline(p1) + '</h2>';
  });
  html = html.replace(/^# ([^\n]+)$/gm, function(match, p1) {
    return '<h1>' + parseInline(p1) + '</h1>';
  });

  // Inline markdown for the rest
  html = parseInline(html);

  return html;
}

// Event listener for input
const markdownInput = document.getElementById('markdown-input');
const htmlOutput = document.getElementById('html-output');
const preview = document.getElementById('preview');

function updateOutput() {
  const html = convertMarkdown();
  htmlOutput.textContent = html;
  preview.innerHTML = html;
}

markdownInput.addEventListener('input', updateOutput);

// Initial render
updateOutput();
