export const highlight = (text: string, query: string): string => {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  const escaped = text.replace(/[&<>"']/g, (m: string) => {
    return map[m as keyof typeof map];
  });
  if (!query) {
    return escaped;
  }

  const index = escaped.toLowerCase().indexOf(query.toLowerCase());
  if (index > -1) {
    return (
      escaped.substring(0, index) +
      '<mark class="mark">' +
      escaped.substring(index, index + query.length) +
      "</mark>" +
      escaped.substring(index + query.length, escaped.length)
    );
  } else {
    return escaped;
  }
};
