# _data/profile.yml is the single source for who the site is about. This hook
# copies it into the site config keys that templates and plugins read, so
# _config.yml keeps only site infrastructure:
#   jekyll-seo-tag  title, description, author, social (JSON-LD sameAs), twitter
#   feed.xml        title, description
# It also composes the title/description of pages that set `profile_meta`
# (the OS home and 404): "<name> — <title> · <profile_meta>".
Jekyll::Hooks.register :site, :post_read do |site|
  p = site.data['profile'] || {}
  social = p['social'] || {}
  city = p['location'].to_s.split(',').first
  description = "#{p['name']}, #{p['title']} in #{city}. #{p['tagline']}."

  site.config['title'] = p['name']
  site.config['email'] = p['email']
  site.config['description'] = description
  site.config['author'] = {
    'name' => p['name'],
    'url' => "#{site.config['url']}#{site.baseurl}/",
  }
  site.config['social'] = {
    'name' => p['name'],
    'links' => %w[github linkedin twitter].map { |k| social[k] }.compact,
  }
  handle = social['twitter'].to_s[%r{(?:x|twitter)\.com/([^/?#]+)}, 1]
  site.config['twitter'] = { 'username' => handle, 'card' => 'summary_large_image' } if handle

  site.pages.each do |page|
    label = page.data['profile_meta']
    next unless label
    page.data['title'] ||= "#{p['name']} — #{p['title']} · #{label}"
    page.data['description'] ||= [description, page.data['intro']].compact.join(' ')
  end
end
