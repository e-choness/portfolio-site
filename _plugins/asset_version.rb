require 'digest'

# Cache-busting version for os.css, games.js and every EchoOS module (the import
# map in _includes/importmap.html): a hash of the scripts and styles, so it
# changes whenever one of them does and unchanged builds stay cached. Content
# from _data reaches the browser through content.json, which is versioned per
# build instead.
Jekyll::Hooks.register :site, :post_read do |site|
  digest = Digest::SHA256.new
  paths = %w[assets/js/**/*.js assets/css/**/* _sass/**/*.scss].flat_map do |pattern|
    Dir.glob(File.join(site.source, pattern))
  end
  paths.select { |path| File.file?(path) }.sort.each do |path|
    digest.update(path.delete_prefix(site.source))
    digest.update(File.binread(path))
  end
  site.config['asset_version'] = digest.hexdigest[0, 16]
end
