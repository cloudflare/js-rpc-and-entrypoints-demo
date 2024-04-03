const lookup = {
	"&": "&amp;",
	'"': "&quot;",
	"'": "&apos;",
	"<": "&lt;",
	">": "&gt;",
};

export const escape = (s: string) =>
	s.replace(/[&"'<>]/g, (c) => lookup[c as keyof typeof lookup]);
