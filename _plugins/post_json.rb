require 'json'
require 'fileutils'

# Emit per-post window JSON for the Blog app (IMPLEMENTATION-PLAN §6.2).
# Each post becomes assets/data/posts/<slug>.json: { title, date, html },
# where html is the post body rendered to markup (no layout wrapper).
Jekyll::Hooks.register :site, :post_write do |site|
  converter = site.find_converter_instance(Jekyll::Converters::Markdown)
  dir = File.join(site.dest, 'assets', 'data', 'posts')
  site.posts.docs.each do |post|
    FileUtils.mkdir_p(dir)
    payload = {
      "title" => post.data["title"],
      "date"  => post.date.strftime("%b %-d, %Y"),
      "html"  => converter.convert(post.content)
    }
    # Front-matter excerpt (a String; Jekyll's auto excerpt is an object and
    # would only repeat the first paragraph) becomes the reader's lede, untruncated.
    excerpt = post.data["excerpt"]
    payload["excerpt"] = excerpt.strip if excerpt.is_a?(String)
    # Include image if present in frontmatter, prefixed with baseurl
    if post.data["image"]
      payload["image"] = File.join(site.config["baseurl"].to_s, post.data["image"].sub(%r{\A/}, ''))
    end
    slug = post.data["slug"] || post.basename_without_ext.sub(/\A\d{4}-\d{2}-\d{2}-/, '')
    File.write(File.join(dir, "#{slug}.json"), JSON.generate(payload))
  end
end
