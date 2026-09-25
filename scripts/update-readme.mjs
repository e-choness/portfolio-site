// scripts/update-readme.mjs — regenerate the README's auto-updated sections
// from the site's own content, so they never drift:
//   <!-- LATEST-POSTS:START --> … <!-- LATEST-POSTS:END -->   newest posts
//   <!-- PROJECTS:START --> … <!-- PROJECTS:END -->            featured projects
// Links deep-link into the OS windows (#/blog/<slug>, #/proj/<slug>).
// Run by .github/workflows/readme.yml when posts or projects change; safe to
// run locally too: `node scripts/update-readme.mjs`.
import { readFile, readdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

// Just enough YAML for front matter: `key: value` scalars and `- item` lists.
function frontMatter(text) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
  const data = {};
  if (!m) return data;
  let listKey = null;
  for (const line of m[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = unquote(value);
      listKey = null;
    }
  }
  return data;
}
const unquote = (v) => v.trim().replace(/^(["'])(.*)\1$/, '$2');

const config = await read('_config.yml');
const url = (config.match(/^url:\s*"?([^"\s#]+)/m) || [])[1] || '';
const baseurl = (config.match(/^baseurl:\s*"?([^"\s#]*)/m) || [])[1] || '';
const site = `${url}${baseurl}/`;

// ---- latest posts ----------------------------------------------------------
const postFiles = (await readdir(new URL('_posts/', root))).filter((f) => f.endsWith('.md'));
const posts = [];
for (const file of postFiles) {
  const fm = frontMatter(await read(`_posts/${file}`));
  const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  const date = new Date(String(fm.date || file.slice(0, 10)).slice(0, 10) + 'T00:00:00Z');
  posts.push({ title: fm.title || slug, slug, date, category: fm.category || '' });
}
posts.sort((a, b) => b.date - a.date);
// Category names as the Blog window shows them.
const CATEGORY = { ai: 'AI', devops: 'DevOps', backend: 'Backend', networking: 'Networking' };
const catLabel = (c) => CATEGORY[c] || (c ? c[0].toUpperCase() + c.slice(1) : '');
const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const latest = posts
  .slice(0, 5)
  .map((p) => `- **[${p.title}](${site}#/blog/${p.slug})**  \n  <sub>${fmtDate(p.date)}${p.category ? ` · ${catLabel(p.category)}` : ''}</sub>`)
  .join('\n');

// ---- featured projects -----------------------------------------------------
const projectFiles = (await readdir(new URL('_projects/', root))).filter((f) => f.endsWith('.md'));
const projects = [];
for (const file of projectFiles) {
  const fm = frontMatter(await read(`_projects/${file}`));
  if (String(fm.featured) !== 'true') continue;
  projects.push({ ...fm, slug: file.replace(/\.md$/, ''), order: Number(fm.order) || 99 });
}
projects.sort((a, b) => a.order - b.order);
const firstSentence = (s = '') => {
  const i = s.indexOf('. ');
  return i > -1 ? s.slice(0, i + 1) : s;
};
const links = (p) =>
  [
    `[open in EchoOS](${site}#/proj/${p.slug})`,
    p.docs_url && `[docs](${p.docs_url})`,
    p.github_url && `[code](${p.github_url})`,
    p.live_url && `[${(p.live_label || 'live').toLowerCase()}](${p.live_url})`,
  ].filter(Boolean).join(' · ');
const projectRows = [
  '| Project | What it is | Stack | Links |',
  '|---|---|---|---|',
  ...projects.map((p) =>
    `| **${p.title}** | ${firstSentence(p.description)} | ${(p.technologies || []).slice(0, 4).join(', ')} | ${links(p)} |`),
].join('\n');

// ---- write -----------------------------------------------------------------
const replaceBlock = (text, name, body) => {
  const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(text)) throw new Error(`README is missing the ${name} markers`);
  return text.replace(re, `$1\n${body}\n$2`);
};

const readmeUrl = new URL('README.md', root);
const before = await readFile(readmeUrl, 'utf8');
const crlf = before.includes('\r\n');
let after = replaceBlock(before.replace(/\r\n/g, '\n'), 'LATEST-POSTS', latest);
after = replaceBlock(after, 'PROJECTS', projectRows);
if (crlf) after = after.replace(/\n/g, '\r\n');

if (after === before) {
  console.log('update-readme: already up to date');
} else {
  await writeFile(readmeUrl, after);
  console.log(`update-readme: ${Math.min(5, posts.length)} posts, ${projects.length} featured projects`);
}
