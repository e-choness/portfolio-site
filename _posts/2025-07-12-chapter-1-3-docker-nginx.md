---
layout: "post"
title: "Chapter 1.3 - Nginx - A High-Performance HTTP Server in Docker"
date: "2025-07-12"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "The guide will walk you through setting up Nginx with Docker, covering image management, container execution with custom configurations and SSL, and integrating with GitLab's Container Registry for robust web service deployment."
---

Nginx is a performance-oriented HTTP server capable of reverse proxying HTTP, HTTPS, and mail-related protocols (SMTP, POP3, IMAP). It also provides load balancing and HTTP caching. Its design fully utilizes an asynchronous event model, reducing context-switching overhead and improving server concurrency. With its modular design, it offers a rich set of official and third-party modules.

Key characteristics of Nginx include: **Asynchronous**, **Event-driven**, **Modular**, **High-performance**, **High-concurrency**, **Reverse Proxy**, and **Load Balancing**.

Below, we'll explore Nginx's application within Docker. For a general introduction to Nginx, please refer to introductory tutorials.

### Finding Images

Search for Nginx-related images on Docker Hub:

```bash
docker search nginx
```

This command will display a list of images, including the official Nginx image (`docker.io/nginx`) and various community-contributed images like `docker.io/jwilder/nginx-proxy`.

### Pulling Images

To download the official Nginx image:

```bash
docker pull nginx:latest
```

It's good practice to explicitly specify a tag like `latest` or a specific version (e.g., `nginx:1.25.3`) to ensure consistency.

### Starting a Container

To start a new container from the Nginx image:

```bash
docker run --name my-nginx -d -p 8080:80 nginx
```

- `--name my-nginx`: Assigns the name `my-nginx` to the container.

- `-d`: Runs the container in detached mode (in the background).

- `-p 8080:80`: Maps port 8080 on the host machine to port 80 inside the container. This allows you to access Nginx via `http://localhost:8080`.

- `nginx`: Specifies the Docker image to use.

**Note:** The original command included `/bin/bash` which would replace the default Nginx entrypoint, leading to the Nginx server not starting automatically. The corrected command above allows Nginx to run as intended.

### Viewing Logs

To check the container's runtime logs:

```bash
docker logs my-nginx
```

### Running a Container Example One (With Custom Configuration and Static Files)

To run a more complex Nginx example, mounting a custom `nginx.conf` and static web pages:

```bash
docker run --name my-nginx-custom \
    -v /host/path/nginx.conf:/etc/nginx/nginx.conf:ro \
    -v /some/html:/usr/share/nginx/html:ro \
    -p 8080:80 \
    -d nginx
```

- `-v host_dir:container_dir[:ro|rw]`: The `-v` parameter (volume mount) syntax.

- `/host/path/nginx.conf:/etc/nginx/nginx.conf:ro`: Mounts a local `nginx.conf` file into the container as read-only (`ro`).

- `/some/html:/usr/share/nginx/html:ro`: Mounts a local directory containing static HTML files into the container as read-only (`ro`).

- `--name`: Assigns a name to the container.

- `-p`: Maps ports (e.g., `8080` on host to `80` in container).

- `-d`: Runs the container in detached mode.

### Running a Container Example Two (With SSL Certificates and Multiple Volumes)

For a scenario where the Nginx container needs to load free SSL certificates from Let's Encrypt and serve static resources from multiple directories:

1. **Create local directories for Nginx configurations and static content:**

   ```bash
   mkdir -p ~/_docker/nginx/conf.d
   mkdir -p ~/_docker/nginx/html
   ```

2. **It's better practice to create your `default.conf` (or other server blocks) and static content directly in your host directories rather than copying from a running container.** If you need an initial configuration, you can pull it from the official Nginx Docker image documentation or create a basic one.

   _Example `default.conf` for `/etc/nginx/conf.d/` on your host, before mounting:_

   ```nginx
   server {
       listen 80;
       server_name your_domain.com www.your_domain.com; # Replace with your domain

       location / {
           root /usr/share/nginx/html;
           index index.html index.htm;
       }

       # Redirect HTTP to HTTPS
       if ($scheme = http) {
           return 301 https://$host$request_uri;
       }
   }

   server {
       listen 443 ssl;
       server_name your_domain.com www.your_domain.com; # Replace with your domain

       ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem; # Replace with your domain
       ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem; # Replace with your domain

       include /etc/letsencrypt/options-ssl-nginx.conf;
       ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # If you generate this

       location / {
           root /usr/share/nginx/html;
           index index.html index.htm;
       }
   }
   ```

3. **Run the Nginx container:**

   ```bash
   docker run -d --name webserver \
     --restart unless-stopped \
     -p 443:443 -p 80:80 \
     -v $HOME/_docker/nginx/html:/usr/share/nginx/html:ro \
     -v $HOME/_docker/nginx/conf.d:/etc/nginx/conf.d:ro \
     -v /etc/letsencrypt:/etc/letsencrypt:ro \
     -v /etc/localtime:/etc/localtime:ro \
     -v /home/www:/home/www:ro \
     nginx
   ```

   - `--restart unless-stopped`: This is a more robust restart policy than `always`, which ensures the container restarts unless explicitly stopped by the user.

   - `-p 443:443 -p 80:80`: Maps host ports 443 and 80 to the container's ports 443 and 80, respectively.

   - `-v`: Volume mounts for:

     - `$HOME/_docker/nginx/html:/usr/share/nginx/html:ro`: Static HTML content (read-only).

     - `$HOME/_docker/nginx/conf.d:/etc/nginx/conf.d:ro`: Custom Nginx configuration files (read-only).

     - `/etc/letsencrypt:/etc/letsencrypt:ro`: Let's Encrypt certificates (read-only). This directory is usually managed by Certbot on the host.

     - `/etc/localtime:/etc/localtime:ro`: Syncs the host's timezone into the container.

     - `/home/www:/home/www:ro`: Another directory for static resources (read-only).

   - `nginx`: The Nginx image.

### Interacting with the Container

To execute commands inside the running container (e.g., to debug or inspect files):

```bash
docker exec -it webserver /bin/bash
```

- `docker exec`: Executes a command in a running container.

- `-it`: Allocates a pseudo-TTY and keeps STDIN open, allowing interactive input.

- `webserver`: The name of your container.

- `/bin/bash`: The command to execute (starts a Bash shell).

### Reloading Nginx Configuration

After making changes to mounted configuration files, you can test and reload Nginx without restarting the container:

1. **Test Nginx configuration syntax:**

   ```bash
   docker exec -it webserver nginx -t
   ```

2. **Reload Nginx configuration:**

   ```bash
   docker exec -it webserver nginx -s reload
   ```

**Note:** `webserver` can be either the container name or its ID.

### Enabling GitLab Container Registry (Contextual Example)

This section details how to integrate Nginx (or a similar reverse proxy setup) with a GitLab Container Registry. This is often part of a larger CI/CD pipeline and involves configuring both GitLab and Docker.

1. Configure GitLab (if self-hosted):

   Edit /etc/gitlab/gitlab.rb and set registry_external_url to the desired URL for your Docker registry, typically including the IP and port where your registry will be accessible.

   ```ruby
   registry_external_url 'http://192.168.188.211:5008'
   ```

   This `registry_external_url` is the address clients will use to `docker pull` or `docker push` images. After restarting GitLab, you should see the "Container Registry" menu on the left panel.

2. Configure Docker Daemon for Insecure Registries (if using HTTP or self-signed HTTPS):

   If your registry is running on HTTP or uses self-signed certificates, you'll need to configure your Docker daemon to trust it as an "insecure registry." Create or modify ~/.docker/daemon.json (on the host machine where Docker client is running):

   ```json
   {
     "insecure-registries": ["192.168.188.211:5008"]
   }
   ```

   After modifying `daemon.json`, restart the Docker daemon (e.g., `sudo systemctl restart docker` on Linux) for changes to take effect.

3. Log in to the GitLab Registry:

   As prompted by GitLab, log in to the registry using your GitLab credentials.

   ```bash
   docker login 192.168.188.211:5008
   Username: <your_gitlab_username>
   Password: <your_personal_access_token>
   ```

   **Important:** The password here is a [Personal Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) generated in GitLab (`User Settings > Access Tokens > Add a personal access token`), not your regular GitLab account password. Ensure the token has the `read_registry` and `write_registry` scopes.

4. Build and Push an Image:

   Build a Docker image and tag it with the registry's address, then push it to your GitLab Container Registry.

   ```bash
   docker build -t 192.168.188.211:5008/docker/docker-static-service-template .
   docker push 192.168.188.211:5008/docker/docker-static-service-template
   ```

   This will build the image from the Dockerfile in your current directory (`.`) and then push it to the specified GitLab Registry path.
