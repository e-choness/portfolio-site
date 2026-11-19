source "https://rubygems.org"

# Built only on Linux: the Docker image (Dockerfile) and GitHub Actions
# (.github/workflows/pages.yml), both on the Ruby in .ruby-version.
# Sass (sass-embedded) and the stdlib gems Ruby 3.4+ unbundled (csv, base64,
# bigdecimal, logger) arrive as dependencies of jekyll and its converters.
gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-feed",    "~> 0.17"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-seo-tag", "~> 2.9"
end
