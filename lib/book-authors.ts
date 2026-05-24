export function splitBookAuthors(author: string) {
  return author
    .split(/\r?\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

