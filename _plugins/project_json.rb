require 'json'
require 'fileutils'

# Emit per-project window JSON for the Projects app (mirrors post_json.rb).
# Each _projects doc becomes assets/data/projects/<slug>.json: { title, html }.
Jekyll::Hooks.register :site, :post_write do |site|
  converter = site.find_converter_instance(Jekyll::Converters::Markdown)
  col = site.collections['projects']
  next unless col

  dir = File.join(site.dest, 'assets', 'data', 'projects')
  FileUtils.mkdir_p(dir)
  col.docs.each do |doc|
    slug = doc.data['slug'] || File.basename(doc.path, '.*')
    payload = {
      'title' => doc.data['title'],
      'html'  => converter.convert(doc.content)
    }
    File.write(File.join(dir, "#{slug}.json"), JSON.generate(payload))
  end
end
