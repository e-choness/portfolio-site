require 'open3'

# Build-time facts for the Stats app (content.json → "site"): commit count and
# the date of the last commit. Git isn't guaranteed where the site is built (the
# dev container may lack it, and CI needs fetch-depth: 0 for a full count), so
# any failure just leaves the value out.
Jekyll::Hooks.register :site, :post_read do |site|
  git = lambda do |*args|
    out, status = Open3.capture2('git', '-C', site.source, *args)
    status.success? ? out.strip : nil
  rescue StandardError
    nil
  end

  site.config['build_stats'] = {
    'commits' => git.call('rev-list', '--count', 'HEAD')&.to_i,
    'last_commit' => git.call('log', '-1', '--format=%cI'),
  }
end
