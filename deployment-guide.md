# Jekyll Portfolio Website

A modern, responsive portfolio website built with Jekyll and deployable to GitHub Pages. Features smooth animations, dark/light theme toggle, and a professional design.

## 🚀 Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **Smooth Animations**: Scroll-triggered animations using AOS library
- **Interactive Elements**: Typing animation, animated counters, and skill bars
- **Project Filtering**: Filter projects by technology or category
- **SEO Optimized**: Meta tags, Open Graph, and structured data
- **Fast Loading**: Optimized images and CSS for better performance
- **GitHub Pages Ready**: Easy deployment with GitHub Pages

## 📁 Project Structure

```
├── _config.yml              # Jekyll configuration
├── _data/                   # Data files (YAML)
│   ├── profile.yml          # Personal information
│   ├── experience.yml       # Work experience
│   ├── education.yml        # Education background
│   ├── skills.yml           # Skills and proficiencies
│   └── projects.yml         # Project portfolio
├── _projects/               # Individual project pages
├── assets/                  # Static assets
│   ├── images/             # Images and photos
│   ├── css/                # Additional stylesheets
│   └── js/                 # Additional JavaScript
├── index.html              # Main portfolio page
├── Gemfile                 # Ruby dependencies
└── README.md               # This file
```

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
   - Your site will be available at: `https://yourusername.github.io`
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

### Colors & Styling

The website uses CSS custom properties (variables) for easy theme customization. Edit the `:root` section in `index.html`:

```css
:root {
  --primary-color: #2563eb; /* Main brand color */
  --secondary-color: #64748b; /* Secondary text color */
  --accent-color: #06b6d4; /* Accent/highlight color */
  /* ... other variables */
}
```

### Images

Replace placeholder images with your own:

- Profile photo: Update the `src` attribute in the hero section
- Project images: Update URLs in `_data/projects.yml`
- About section image: Update the `src` attribute in the about section

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px

## 🎨 Theme System

The website includes a dark/light theme toggle:

- Themes are stored in localStorage
- Automatic system preference detection
- Smooth transitions between themes
- All components respect the current theme

## 🔧 Performance Optimization

- **Lazy Loading**: Images load as they come into view
- **CSS Optimization**: Minified and optimized stylesheets
- **JavaScript Optimization**: Efficient event listeners and animations
- **Image Optimization**: Compressed images for faster loading

## 📊 Analytics & SEO

### Google Analytics (Optional)

Add your Google Analytics tracking ID in `_config.yml`:

```yaml
google_analytics: UA-XXXXXXXXX-X
```

### SEO Optimization

The site includes:

- Meta descriptions and keywords
- Open Graph tags for social media sharing
- Structured data for search engines
- Sitemap generation
- Robot.txt optimization

## 🚀 Advanced Features

### Adding New Sections

1. Create the HTML structure in `index.html`
2. Add corresponding data files in `_data/`
3. Update navigation menu
4. Add appropriate animations and styling

### Custom Animations

The site uses AOS (Animate On Scroll) library. Add animations by including data attributes:

```html
<div data-aos="fade-up" data-aos-delay="200">Content here</div>
```

### Project Pages

Create individual project pages in the `_projects/` directory:

```markdown
---
title: "Project Name"
description: "Project description"
---

Detailed project content here...
```

## 🐛 Troubleshooting

### Common Issues

1. **Site not loading on GitHub Pages**

   - Check repository name matches `yourusername.github.io`
   - Ensure main branch is selected in Pages settings
   - Wait a few minutes for deployment

2. **Local development server won't start**

   - Check Ruby version: `ruby --version`
   - Install missing gems: `bundle install`
   - Clear cache: `bundle exec jekyll clean`

3. **Images not loading**
   - Check file paths in data files
   - Ensure images are in the correct directory
   - Verify image URLs are accessible

### Performance Issues

1. **Slow loading**

   - Optimize image sizes
   - Minimize CSS and JavaScript
   - Use CDN for external libraries

2. **Animation lag**
   - Reduce animation duration
   - Use CSS transforms instead of changing layout properties
   - Test on lower-end devices

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you have questions or need help customizing your portfolio:

- Open an issue on GitHub
- Check the Jekyll documentation
- Review the code comments for guidance

## 🎯 Future Enhancements

- [ ] Blog section integration
- [ ] Contact form with backend
- [ ] Multi-language support
- [ ] Advanced project filtering
- [ ] Integration with CMS
- [ ] Progressive Web App features

---

Made with ❤️ using Jekyll and GitHub Pages
