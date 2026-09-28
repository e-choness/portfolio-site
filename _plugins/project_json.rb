require 'json'
require 'fileutils'

# Emit per-project window JSON for the Projects app (mirrors post_json.rb).
# Each _projects doc becomes assets/data/projects/<slug>.json: { title, html }.
Jekyll::Hooks.register :site, :post_write do |site|
  converter = site.find_converter_instance(Jekyll::Converters::Markdown)
  col = site.collections['projects']
  next unless col

  # Bodies reference media as ../assets/... so they also resolve when the .md
  # is viewed on GitHub. In the OS that path resolves against the page, which
  # drops the baseurl on Pages (/portfolio-site/), so pin it to baseurl here.
  base = site.config['baseurl'].to_s.chomp('/')

  dir = File.join(site.dest, 'assets', 'data', 'projects')
  FileUtils.mkdir_p(dir)
  col.docs.each do |doc|
    slug = doc.data['slug'] || File.basename(doc.path, '.*')
    html = converter.convert(doc.content)
      .gsub(%r{(src|href|poster)="(?:\.\./)*/?assets/}) { %(#{Regexp.last_match(1)}="#{base}/assets/) }
    payload = {
      'title' => doc.data['title'],
      'html'  => html
    }
    File.write(File.join(dir, "#{slug}.json"), JSON.generate(payload))
  end
end
