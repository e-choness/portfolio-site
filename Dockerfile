# Dev server and build environment. Keep the Ruby version in step with
# .ruby-version, which GitHub Actions reads.
FROM ruby:4.0.10-slim

# build-essential: native gem extensions. git: commit facts for the Stats app
# (_plugins/site_stats.rb). nodejs: scripts/*.mjs and their unit tests.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && git config --system --add safe.directory /srv/jekyll

WORKDIR /srv/jekyll

COPY Gemfile Gemfile.lock ./
RUN bundle install

EXPOSE 4000 35729

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload", "--config", "_config.yml,_config_dev.yml"]
