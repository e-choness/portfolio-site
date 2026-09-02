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
    # Include image if present in frontmatter, prefixed with baseurl
    if post.data["image"]
      payload["image"] = File.join(site.config["baseurl"].to_s, post.data["image"].sub(%r{\A/}, ''))
    end
    File.write(File.join(dir, "#{post.data["slug"]}.json"), JSON.generate(payload))
  end
end
