# Chroma - Jekyll Portfolio Website with Blog

*A modern, responsive portfolio website built with Jekyll and deployable to GitHub Pages. Features smooth animations, dark/light theme toggle, a professional design, and a comprehensive blog section.*

<div align="center">

[![GitHub Pages Deployment](https://github.com/e-choness/portfolio-site/actions/workflows/pages.yml/badge.svg)](https://github.com/e-choness/portfolio-site/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Jekyll](https://img.shields.io/badge/Jekyll-Static_Site-CC342D?logo=jekyll&logoColor=white)](https://jekyllrb.com/)
[![GitHub last commit](https://img.shields.io/github/last-commit/e-choness/portfolio-site)](https://github.com/e-choness/portfolio-site)
[![GitHub repo size](https://img.shields.io/github/repo-size/e-choness/portfolio-site)](https://github.com/e-choness/portfolio-site)

**[View Live Demo](https://e-choness.github.io/portfolio-site/)** • **[Report Bug](https://github.com/e-choness/portfolio-site/issues)** • **[Request Feature](https://github.com/e-choness/portfolio-site/issues)**

</div>

## 🚀 Features

- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🌓 **Dark/Light Theme**: Toggle between themes with smooth transitions
- ✨ **Smooth Animations**: Scroll-triggered animations using AOS library
- 🖱️ **Interactive Elements**: Typing animation, animated counters, and skill bars
- 🔍 **Project Filtering**: Filter projects by technology or category
- ✍️ **Blog System**: Full-featured blog with posts, categories, and pagination
- 🚀 **SEO Optimized**: Meta tags, Open Graph, and structured data
- ⚡ **Fast Loading**: Optimized images and CSS for better performance
- 🌐 **GitHub Pages Ready**: Easy deployment with GitHub Pages

## 📁 Project Structure

```bash
├── _config.yml              # Jekyll configuration
├── _layouts/                # Layout templates
├── _data/                   # Data files (YAML)
├── _posts/                  # Blog posts (Markdown)
├── _projects/               # Individual project pages
├── blog/                    # Blog index and pages
├── assets/                  # Static assets (images, css, js)
├── .github/workflows/       # GitHub Actions
├── index.html               # Main portfolio page
└── Gemfile                  # Ruby dependencies
```
Customize the site easily by editing the YAML files in the `_data/` directory:
|**File**|**Purpose**|
|---|---|
|`profile.yml`|Personal info (name, title, email, social links)|
|`experience.yml`|Work experience timeline|
|`projects.yml`|Portfolio projects and tech stacks|
|`skills.yml`|Skill categories and progress bars|
|`blog.yml`|Blog specific settings (categories, pagination limits)|

## 🛠️ Setup & Installation

### Prerequisites

- Ruby (2.7 or higher)
- Bundler gem
- Git

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

2. **Install dependencies**

```bash
bundle install
```

3. **Run the development server**

```bash
bundle exec jekyll serve
```

4. **Open your browser**
   Navigate to `http://localhost:4000`

### GitHub Pages Deployment

1. **Create a new repository**

   - Repository name must be: `yourusername.github.io`
   - Make sure it's public

2. **Push your code**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

3. **Enable GitHub Pages**

   - Go to repository Settings
   - Scroll to Pages section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click Save

4. **Access your site**
   - Portfolio: `https://yourusername.github.io`
   - Blog: `https://yourusername.github.io/blog/`
   - It may take a few minutes to deploy

## ⚙️ Customization

### Personal Information

Edit `_data/profile.yml`:

```yaml
name: "Your Name"
title: "Your Title"
email: "your.email@example.com"
# ... other settings
```

### Work Experience

Edit `_data/experience.yml`:

```yaml
- position: "Your Position"
  company: "Company Name"
  duration: "2020 - Present"
  description: "Your job description"
  # ... other details
```

### Projects

Edit `_data/projects.yml`:

```yaml
- title: "Project Name"
  description: "Project description"
  technologies:
    - React
    - Node.js
  # ... other details
```

### Skills

Edit `_data/skills.yml`:

```yaml
categories:
  - name: "Frontend Development"
    skills:
      - name: "JavaScript"
        level: 95
      # ... other skills
```

### Blog Configuration

Edit `_data/blog.yml`:

```yaml
title: "Blog"
description: "Your blog description"
posts_per_page: 6
categories:
  - name: "JavaScript"
    slug: "javascript"
    color: "#f7df1e"
  # ... other categories
```

## 📝 Writing Blog Posts

### Creating a New Post

1. Create a new file in `_posts/` with the format: `YYYY-MM-DD-post-title.md`

2. Add front matter at the top:

```yaml
---
layout: post
title: "Your Post Title"
date: 2025-01-15 10:00:00 -0000
category: javascript
tags: [javascript, react, frontend]
author: "Your Name"
image: "https://example.com/image.jpg"
excerpt: "Brief description of your post"
---
```

3. Write your content in Markdown below the front matter

### Post Front Matter Options

- `title`: Post title (required)
- `date`: Publication date (required)
- `category`: Single category (optional)
- `tags`: Array of tags (optional)
- `author`: Author name (optional)
- `image`: Featured image URL (optional)
- `excerpt`: Custom excerpt (optional, auto-generated if not provided)

### Markdown Features

The blog supports:

- **Syntax highlighting** with Prism.js
- **Tables**
- **Blockquotes**
- **Links and images**
- **Lists** (ordered and unordered)
- **Code blocks** with language specification

Example code block:

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```
````

## 🎨 Blog Styling

### Categories and Tags

Categories are displayed as colored badges. You can customize colors in `_data/blog.yml`:

```yaml
categories:
  - name: "JavaScript"
    slug: "javascript"
    color: "#f7df1e"
```

### Custom Styling

The blog inherits the main site's theme system. You can customize:

- **Colors**: Edit CSS variables in the blog layout
- **Typography**: Modify font families and sizes
- **Layout**: Adjust grid systems and spacing
- **Animations**: Customize AOS animations

## 📊 Blog Features

### Automatic Features

- **Reading time calculation**: Based on word count
- **Responsive images**: Automatic optimization
- **SEO optimization**: Meta tags and Open Graph
- **Pagination**: Automatic post pagination
- **Navigation**: Previous/next post links
- **Archive**: Organized by date and category

### Interactive Features

- **Search functionality** (can be added)
- **Category filtering**
- **Tag system**
- **Social sharing** (configurable)
- **Comments system** (can be integrated)

## 🔧 Advanced Blog Configuration

### Pagination Settings

In `_config.yml`:

```yaml
paginate: 6
paginate_path: "/blog/page:num/"
```

### Custom Collections

You can create custom collections for different content types:

```yaml
collections:
  tutorials:
    output: true
    permalink: /:collection/:name/
```

### RSS Feed

The blog automatically generates an RSS feed at `/feed.xml` using the jekyll-feed plugin.

## 📱 Responsive Design

The blog is fully responsive with breakpoints:

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px

## 🎯 SEO Best Practices

The blog includes:

- **Structured data** for articles
- **Open Graph tags** for social sharing
- **Twitter Cards** for Twitter sharing
- **Canonical URLs** for duplicate content prevention
- **Meta descriptions** for better search results

## 🚀 Performance Optimization

### Blog-Specific Optimizations

- **Lazy loading** for post images
- **Syntax highlighting** loaded only when needed
- **Pagination** to limit posts per page
- **Optimized fonts** with font-display: swap
- **Minified CSS and JavaScript**

## 📈 Analytics Integration

Add Google Analytics to track blog performance:

1. Add your tracking ID in `_config.yml`:

```yaml
google_analytics: UA-XXXXXXXXX-X
```

2. The analytics code will be automatically included

## 🤝 Contributing Blog Content

### Guest Posts

To accept guest posts:

1. Create author profiles in `_data/authors.yml`
2. Reference authors in post front matter
3. Display author information in post layout

### Content Guidelines

- Write clear, actionable content
- Include code examples when relevant
- Use proper heading hierarchy
- Optimize images for web
- Proofread before publishing

## 🐛 Troubleshooting

### Common Blog Issues

1. **Posts not showing**

   - Check file naming convention (`YYYY-MM-DD-title.md`)
   - Verify front matter syntax
   - Ensure date is not in the future

2. **Pagination not working**

   - Check `paginate` setting in `_config.yml`
   - Verify `jekyll-paginate` plugin is installed

3. **Images not loading**

   - Use absolute URLs for images
   - Check image paths and permissions
   - Optimize image sizes for web

4. **Syntax highlighting issues**
   - Verify language specification in code blocks
   - Check Prism.js configuration
   - Test with different themes

## 📞 Support

If you have questions about the blog system:

- Check the Jekyll documentation
- Review the Liquid templating guide
- Open an issue for bugs or feature requests
- Join the Jekyll community for help

Happy blogging! 🎉

<div align="center">

<p>Made with ❤️ using Jekyll and GitHub Pages</p>

<p>This project is open source and available under the <a href="LICENSE">MIT License</a>.</p>

</div>
