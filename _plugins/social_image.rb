# Front matter writes `image: "assets/images/…"` with no leading slash, which
# jekyll-seo-tag resolves against the page URL, so og:image pointed at
# /projects/<slug>/assets/… Root it here once instead of in every file; the
# other readers (relative_url, post_json.rb, content.json) accept either form.
Jekyll::Hooks.register :site, :post_read do |site|
  (site.posts.docs + site.collections['projects'].docs).each do |doc|
    image = doc.data['image']
    next unless image.is_a?(String) && !image.empty? && image !~ %r{\A(/|[a-z][a-z0-9+.-]*://)}i
    doc.data['image'] = "/#{image}"
  end
end
