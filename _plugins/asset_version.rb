require 'digest'

# Cache-busting version for os.css, games.js and every EchoOS module (the import
# map in _layouts/os.html). It changes whenever an asset changes, or _data does,
# since some modules bake data in; unchanged builds stay cached.
Jekyll::Hooks.register :site, :post_read do |site|
  digest = Digest::SHA256.new
  paths = %w[assets/js/**/*.js assets/css/**/* _sass/**/*.scss _data/**/*].flat_map do |pattern|
    Dir.glob(File.join(site.source, pattern))
  end
  paths.select { |path| File.file?(path) }.sort.each do |path|
    digest.update(path.delete_prefix(site.source))
    digest.update(File.binread(path))
  end
  site.config['asset_version'] = digest.hexdigest[0, 16]
end
