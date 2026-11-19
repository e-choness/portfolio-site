require 'json'

# Window JSON: the rendered body of every post and project, fetched by the Blog
# and Projects windows when one is opened.
#
#   assets/data/posts/<slug>.json      { title, date, html, excerpt?, image? }
#   assets/data/projects/<slug>.json   { title, html }
#
# Each file is a page of the site, so `jekyll serve` writes, serves and cleans
# it like any other output. The generator adds them empty; once the documents
# are rendered (Jekyll renders documents before pages), a post_render hook
# fills each one from its document's `content`, which is the converted HTML
# without the layout.
module EchoOS
  class WindowJSON < Jekyll::PageWithoutAFile
    attr_reader :doc

    def initialize(site, dir, doc)
      @doc = doc
      slug = doc.data['slug'] || doc.basename_without_ext.sub(/\A\d{4}-\d{2}-\d{2}-/, '')
      super(site, site.source, dir, "#{slug}.json")
      data['layout'] = nil
    end

    def payload
      base = site.baseurl.to_s.chomp('/')
      html = doc.content
      if doc.collection.label == 'projects'
        # Write-ups reference media as ../assets/… so they also resolve on
        # GitHub. In the OS that path resolves against the page, dropping the
        # baseurl on Pages (/portfolio-site/), so pin it to the baseurl.
        html = html.gsub(%r{(src|href|poster)="(?:\.\./)*/?assets/}) { %(#{Regexp.last_match(1)}="#{base}/assets/) }
        return { 'title' => doc.data['title'], 'html' => html }
      end

      out = { 'title' => doc.data['title'], 'date' => doc.date.strftime('%b %-d, %Y'), 'html' => html }
      # A front-matter excerpt (a String; Jekyll's automatic excerpt is an
      # object that only repeats the first paragraph) is the reader's lede.
      excerpt = doc.data['excerpt']
      out['excerpt'] = excerpt.strip if excerpt.is_a?(String)
      image = doc.data['image']
      out['image'] = "#{base}/#{image.delete_prefix('/')}" if image.is_a?(String) && !image.empty?
      out
    end
  end

  class WindowJSONGenerator < Jekyll::Generator
    safe true

    def generate(site)
      site.posts.docs.each { |doc| site.pages << WindowJSON.new(site, 'assets/data/posts', doc) }
      site.collections['projects']&.docs&.each { |doc| site.pages << WindowJSON.new(site, 'assets/data/projects', doc) }
    end
  end
end

Jekyll::Hooks.register :pages, :post_render do |page|
  page.output = JSON.generate(page.payload) if page.is_a?(EchoOS::WindowJSON)
end
