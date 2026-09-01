# Resolve build-time counts in _data/apps.yml titles (IMPLEMENTATION-PLAN §5).
# Jekyll does not render Liquid inside .yml data files, so interpolate the
# `{{ posts_count }}` / `{{ exp_count }}` placeholders here instead. Never
# hardcode counts in the YAML.
Jekyll::Hooks.register :site, :post_read do |site|
  apps = site.data["apps"]
  next unless apps.is_a?(Array)

  posts = site.posts.docs.size
  roles = site.data.dig("experience").to_a.size

  apps.each do |app|
    next unless app.is_a?(Hash) && app["title"].is_a?(String)
    app["title"] = app["title"]
      .gsub("{{ posts_count }}", posts.to_s)
      .gsub("{{ exp_count }}", roles.to_s)
  end
end
