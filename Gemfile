source "https://rubygems.org"

gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-feed",     "~> 0.17"
  gem "jekyll-sitemap",  "~> 1.4"
  gem "jekyll-seo-tag",  "~> 2.8"
end

# Gems unbundled from Ruby 3.4+ stdlib that Jekyll's deps still expect
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"

# Faster, actively maintained Sass implementation used by jekyll-sass-converter 3.x
gem "sass-embedded"

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.2", :platforms => [:mingw, :x64_mingw, :mswin]
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
