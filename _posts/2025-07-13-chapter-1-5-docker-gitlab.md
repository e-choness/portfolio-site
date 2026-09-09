---
layout: "post"
title: "Chapter 1.5 - Setting Up and Managing GitLab with Docker"
date: "2025-07-13"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "This guide provides a comprehensive guide to setting up, managing, and maintaining a GitLab instance using Docker, Docker Compose, and Docker Swarm. It covers essential topics such as installation, backup and restore procedures, GitLab Runner configuration, and troubleshooting common issues."
---

## Setting Up and Managing GitLab with Docker

### Download GitLab Image

First, you'll need to download the GitLab Community Edition (CE) Docker image.

```bash
docker pull gitlab/gitlab-ce:latest
```

### Run GitLab Container

To run the GitLab container, execute the following command. This command maps necessary ports and volumes for persistent data.

```bash
sudo docker run \
  --hostname gitlab.example.com \
  --publish 8443:443 \
  --publish 8081:80 \
  --publish 2222:22 \
  --name gitlab \
  --restart always \
  --volume $HOME/_docker/gitlab/config:/etc/gitlab \
  --volume $HOME/_docker/gitlab/logs:/var/log/gitlab \
  --volume $HOME/_docker/gitlab/data:/var/opt/gitlab \
  -v /etc/localtime:/etc/localtime:ro \
  -d \
  gitlab/gitlab-ce:latest
```

Note on Port Conflicts:

The example above maps port 2222 on the host to port 22 in the container to avoid potential conflicts with the host's SSH service.

If you prefer to keep GitLab's SSH port as `22` and change your host's SSH daemon port instead:

1. **Modify Host SSH Port:** Edit `/etc/ssh/sshd_config` on your host machine. Uncomment `Port 22` and change `22` to `2222`.

   ```bash
   # /etc/ssh/sshd_config
   Port 2222
   ```

2. **Restart SSH Service:**

   ```bash
   sudo systemctl restart sshd
   ```

3. **Update Firewall Rules:** Add rules to your firewall to allow connections on port `2222`.

   ```bash
   sudo iptables -A INPUT -p tcp --dport 2222 -j ACCEPT
   sudo iptables -A OUTPUT -p tcp --sport 2222 -j ACCEPT
   ```

   Verify the rules have been added:

   ```bash
   sudo iptables -L -n
   ```

   After changing the host SSH port, you can use the standard port `22` for GitLab in the `docker run` command:

   ```bash
   # ...
   --publish 22:22 \
   # ...
   ```

   When cloning repositories, you would then use the standard SSH URL:

   ```bash
   git clone git@gitlab.example.com:myuser/awesome-project.git
   ```

   If you keep the host's SSH port at `22` and map GitLab to `2222` as in the initial `docker run` command, you'll need to specify the port when cloning:

   ```bash
   git clone ssh://git@gitlab.example.com:2222/myuser/awesome-project.git
   ```

---

### Fixing Container Permissions

If your GitLab container fails to start due to permission issues, you can try fixing them by executing:

```bash
docker exec -it gitlab update-permissions
docker restart gitlab
```

---

### Manual Container Backup

There are two primary methods for manually backing up your GitLab data:

1. **Entering the Container:**

   ```bash
   docker exec -it gitlab bash
   gitlab-rake gitlab:backup:create
   exit
   ```

2. **Executing Directly from Host:**

   ```bash
   docker exec gitlab gitlab-rake gitlab:backup:create
   ```

If you encounter a `Errno::EACCES: Permission denied @ dir_s_mkdir - /var/opt/gitlab/backups/db` error, it indicates incorrect permissions or ownership. You need to grant the correct permissions and change the owner to `git`. Run these commands inside the container:

```bash
docker exec -it gitlab bash
chmod -R 755 /var/opt/gitlab/backups
chown -R git:git /var/opt/gitlab/backups
exit
```

---

### Automated Backup

You can automate backups using a `cron` job on the host machine.

1. Create a Backup Script:

   Create a file named gitlab.backup.sh in $HOME/\_docker/gitlab/ (or your preferred location) and add the following content:

   ```bash
   #!/bin/bash
   docker exec gitlab gitlab-rake gitlab:backup:create
   ```

   Make the script executable:

   ```bash
   chmod +x $HOME/_docker/gitlab/gitlab.backup.sh
   ```

2. Schedule with Crontab:

   Open your crontab for editing:

   ```bash
   crontab -e
   ```

   Add the following line to schedule a daily backup at 2 AM:

   ```bash
   0 2 * * * $HOME/_docker/gitlab/gitlab.backup.sh
   ```

   **Crontab Field Reference:**

   - `*`: Minute (0-59)

   - `*`: Hour (0-23, 0 is midnight)

   - `*`: Day of month (1-31)

   - `*`: Month (1-12)

   - `*`: Day of week (0-6, 0 is Sunday)

   - `command`: The command to execute

   After saving, reload the cron service:

   ```bash
   sudo systemctl reload cron.service # Or service crond reload on older systems
   ```

---

### Backup Retention Policy

To retain backups for a specific duration (e.g., 7 days), edit the GitLab configuration file `gitlab.rb` located in your mounted volume (`$HOME/_docker/gitlab/config/gitlab.rb` in this setup).

Find the line `gitlab_rails['backup_keep_time']` and uncomment it, then set its value to the desired retention time in seconds (7 days = 604800 seconds).

```ruby
# /etc/gitlab/gitlab.rb
gitlab_rails['backup_keep_time'] = 604800
```

After modifying `gitlab.rb`, reconfigure the GitLab container for the changes to take effect:

```bash
docker exec gitlab gitlab-ctl reconfigure
```

---

### Backup Restoration

To restore a GitLab backup, you'll need the timestamp of the backup file. The format of backup files has changed in recent GitLab versions.

For older versions, you might see timestamps like 1406691018.

For newer versions, the format is TIMESTAMP_DATE_VERSION_gitlab_backup.tar, for example, 1721392543_2024_07_19_17.0.1.

```bash
# Example for an older backup timestamp
docker exec gitlab gitlab-rake gitlab:backup:restore BACKUP=1406691018

# Example for a newer backup file name (replace with your actual backup file name, excluding the _gitlab_backup.tar extension)
docker exec gitlab gitlab-rake gitlab:backup:restore BACKUP=1721392543_2024_07_19_17.0.1
```

---

### Container Management

Here are some common Docker commands for managing your GitLab container:

- **Stop Container:**

  ```bash
  docker stop gitlab
  ```

- **Remove Container:**

  ```bash
  docker rm gitlab
  ```

- **Start Container:**

  ```bash
  docker start gitlab
  ```

- **Edit GitLab Configuration (inside container):**

  ```bash
  docker exec -it gitlab vi /etc/gitlab/gitlab.rb
  ```

- **Restart GitLab Container:**

  ```bash
  docker restart gitlab
  ```

---

### Installing GitLab with Docker Compose

Docker Compose simplifies the setup, installation, and upgrades of Docker-based GitLab instances.

1. **Install Docker Compose:** Follow the official Docker documentation to install Docker Compose.

2. **Create `docker-compose.yml`:** Create a `docker-compose.yml` file and add the following configuration. This example includes common settings like `external_url`, `time_zone`, and `backup_keep_time`.

   ```yaml
   version: "3.8" # Use a recent Docker Compose file format version
   services:
     gitlab:
       image: "gitlab/gitlab-ce:latest"
       restart: always
       hostname: "gitlab.example.com"
       environment:
         GITLAB_OMNIBUS_CONFIG: |
           external_url 'https://gitlab.example.com'
           gitlab_rails['time_zone'] = 'Asia/Shanghai'
           gitlab_rails['backup_keep_time'] = 259200 # 3 days in seconds
           # registry_external_url 'http://192.168.188.222:5008' # Uncomment and configure if using an external Docker Registry
           # Add any other configurations as needed
       ports:
         - "8081:80"
         - "8443:443"
         - "22:22"
       volumes:
         - ./gitlab-data/config:/etc/gitlab
         - ./gitlab-data/logs:/var/log/gitlab
         - ./gitlab-data/data:/var/opt/gitlab
         - /etc/localtime:/etc/localtime:ro # Read-only mount for timezone
   ```

3. Start GitLab:

   Navigate to the directory containing your docker-compose.yml file and run:

   ```bash
   docker compose up -d
   ```

   (Note: `docker compose` is the newer command; `docker-compose` also works but is considered legacy.)

---

### Using Docker Swarm

For a highly available and scalable GitLab deployment, you can use Docker Swarm.

1. Create docker-compose.yml for Swarm:

   Create a docker-compose.yml file with the following Swarm-specific configurations. This example also includes a GitLab Runner service.

   ```yaml
   version: "3.8" # Use a recent Docker Compose file format version
   services:
     gitlab:
       image: gitlab/gitlab-ce:latest
       container_name: gitlab
       ports:
         - "22:22"
         - "80:80"
         - "443:443"
       volumes:
         - /srv/gitlab/data:/var/opt/gitlab
         - /srv/gitlab/logs:/var/log/gitlab
         - /srv/gitlab/config:/etc/gitlab
         - /etc/localtime:/etc/localtime:ro
       environment:
         GITLAB_OMNIBUS_CONFIG: "from_file('/omnibus_config.rb')"
       configs:
         - source: gitlab_config
           target: /omnibus_config.rb
       secrets:
         - gitlab_root_password
     gitlab-runner:
       image: gitlab/gitlab-runner:alpine
       container_name: gitlab-runner
       deploy:
         mode: replicated
         replicas: 1 # Adjust replica count as needed
       volumes: # Mount Docker socket for Docker executor
         - /var/run/docker.sock:/var/run/docker.sock
         - gitlab_runner_config:/etc/gitlab-runner # Volume for runner config
   configs:
     gitlab_config: # Renamed for clarity and to avoid conflict with service name
       file: ./gitlab.rb
   secrets:
     gitlab_root_password:
       file: ./root_password.txt
   volumes: # Define volumes for GitLab Runner config
     gitlab_runner_config:
   ```

2. Create gitlab.rb (for Swarm):

   Create a gitlab.rb file in the same directory as your docker-compose.yml.

   ```ruby
   external_url 'https://my.domain.com/'
   gitlab_rails['initial_root_password'] = File.read('/run/secrets/gitlab_root_password')
   gitlab_rails['backup_keep_time'] = 604800
   gitlab_rails['time_zone'] = 'Asia/Shanghai'

   # If you're running GitLab Runner and encountering SSL issues,
   # and plan to handle SSL termination externally (e.g., with a load balancer),
   # you might set these, but generally it's recommended to configure SSL directly in GitLab if possible.
   # For a Swarm setup, often an external proxy handles SSL, in which case these might not be needed
   # or should point to the correct certs if GitLab is responsible for SSL termination.
   # nginx['redirect_http_to_https'] = false
   # nginx['ssl_certificate'] = "/etc/gitlab/ssl/fullchain.pem"
   # nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/privkey.pem"
   ```

3. Create root_password.txt:

   Create a root_password.txt file with your desired initial root password.

   ```bash
   MySuperSecretAndSecurePass0rd! #Use your imagination here
   ```

4. Deploy the Stack:

   Ensure you are in the same directory as your docker-compose.yml and gitlab.rb files, then deploy the stack:

   ```bash
   docker stack deploy --compose-file docker-compose.yml gitlab
   ```

---

### Registering GitLab Runner

After deploying the GitLab Runner service, you need to register it with your GitLab instance. Refer to the official GitLab Runner registration documentation for the most up-to-date instructions.

You can register the runner interactively:

```bash
docker run --rm -it -v gitlab_runner_config:/etc/gitlab-runner gitlab/gitlab-runner register
```

Follow the prompts:

- **Enter the GitLab instance URL:** (e.g., `https://gitlab.example.com/`)

- **Enter the registration token:** Get this from your GitLab instance under `Admin Area > CI/CD > Runners` or `Project > Settings > CI/CD > Runners`.

- **Enter a description for the runner:** (e.g., `My Docker Runner`)

- **Enter tags for the runner:** (e.g., `docker,linux`) - **Important:** If you leave this blank, the runner will pick up any untagged jobs. If you add tags, jobs must have matching tags to be picked up.

- **Enter an executor:** Choose `docker` for running jobs in Docker containers.

- **Enter the default Docker image:** (e.g., `ubuntu:latest`)

---

### Updating Runner Configuration

If you modify the `config.toml` file for your GitLab Runner, you'll need to restart the runner container for the changes to take effect. Always restart the entire container, not just the `gitlab-runner restart` command inside the container.

```bash
docker restart gitlab-runner
```

---

### Upgrading GitLab Runner

To upgrade your GitLab Runner to the latest version (or a specific tag):

1. **Pull the latest image:**

   ```bash
   docker pull gitlab/gitlab-runner:latest
   ```

2. **Stop and remove the existing container:**

   ```bash
   docker stop gitlab-runner && docker rm gitlab-runner
   ```

3. **Start the container with the updated image (using your original `docker run` command):**

   ```bash
   docker run -d --name gitlab-runner --restart always \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -v gitlab_runner_config:/etc/gitlab-runner \
     gitlab/gitlab-runner:latest
   ```

   (Note: Replace `gitlab_runner_config` with the actual volume name or host path you are using for the runner configuration.)

---

### GitLab CI Templates and Configuration

Here's an example of a `config.toml` for a Docker executor:

```toml
concurrent = 1
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "My Project Runner"
  url = "https://g.example.com/" # Your GitLab instance URL
  token = "xxx-y1vb" # Runner token from GitLab
  executor = "docker"

  [runners.docker]
    # environment = ['GIT_SSL_NO_VERIFY=true'] # Use with caution, disables SSL verification
    tls_verify = false # Use with caution, disables TLS verification for Docker daemon
    image = "node:20-alpine" # Use a modern Node.js version, e.g., 20 or latest LTS
    privileged = false
    pull_policy = "if-not-present" # Pulls image only if it doesn't exist locally
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"] # /var/run/docker.sock for Docker-in-Docker functionality
    shm_size = 0

  [runners.cache]
    # Configure cache if needed (e.g., S3, GCS, Azure)
    # [runners.cache.s3]
    # [runners.cache.gcs]
    # [runners.cache.azure]
```

Important volumes Configuration:

The volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"] configuration is crucial for enabling Docker-in-Docker (dind) functionality within your CI jobs. It allows your CI jobs to build and push Docker images. Without it, you might encounter errors like:

```bash
ERROR: error during connect: Get http://docker:2375/v1.40/info: dial tcp: lookup docker on 8.8.8.8:53: no such host
```

`pull_policy = "if-not-present":`

This policy optimizes image pulling by only downloading the Docker image if it's not already present locally.

"This job is stuck because the project doesn't have any runners online assigned to it."

This error typically means your job's tags don't match your runner's tags, or your runner has tags and your job doesn't.

To resolve this:

- Ensure your CI jobs are configured with the correct `tags` that match your runner's tags in `config.toml`.

- Alternatively, if you want your runner to pick up all jobs, ensure the runner has **no tags** assigned during registration or in its `config.toml`.

---

### Building and Pushing Docker Images in CI

Here's an updated example of a `.gitlab-ci.yml` template for building and pushing Docker images to a registry, including a `docker:dind` service for Docker-in-Docker:

```yaml
# Use a recent Docker image for building, e.g., 25.x
image: docker:25.0.3-git

variables:
  # Define your CI/CD variables for registry access
  # These should be set as CI/CD variables in your GitLab project settings
  # CI_REGISTRY_USER: Your GitLab username or deploy token username
  # CI_REGISTRY_PASSWORD: Your GitLab personal access token or deploy token password
  # CI_REGISTRY: Your Docker registry URL (e.g., registry.gitlab.com or your custom registry)
  # CI_REGISTRY_IMAGE: The full image path including registry, group/project, and image name

stages:
  - build
  - deploy

.docker_build_template:
  stage: build
  services:
    - docker:25.0.3-dind # Use the corresponding dind version
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build --pull -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"

docker-build-master:
  extends: .docker_build_template
  variables:
    # For master/main branch, tag with 'latest' and commit SHA
    IMAGE_TAG: latest
  script:
    - docker build --pull -t "$CI_REGISTRY_IMAGE:$IMAGE_TAG" -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$IMAGE_TAG"
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
    # Example: Run service after building (adjust for your deployment strategy)
    # - if [ $(docker ps -aq --filter name=docker-service-name) ]; then docker rm -f docker-service-name;fi
    # - docker run -itd -p 5000:5000 --name docker-service-name "$CI_REGISTRY_IMAGE:$IMAGE_TAG"
  rules:
    - if: "$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH"

docker-build-branch:
  extends: .docker_build_template
  rules:
    - if: "$CI_COMMIT_BRANCH != $CI_DEFAULT_BRANCH"
```

**Explanation of Variables:**

- `CI_REGISTRY_USER`: Your GitLab username or a [Deploy Token username](https://docs.gitlab.com/ee/user/project/deploy_tokens/).

- `CI_REGISTRY_PASSWORD`: The password for your GitLab user or the Deploy Token. **Always use a [Personal Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) (PAT) with `write_registry` scope or a [Deploy Token](https://www.google.com/search?q=https://docs.gitlab.com/ee/user/project/deploy_tokens.html) instead of your actual GitLab password for automation.**

- `CI_REGISTRY`: The address of your Docker registry (e.g., `registry.gitlab.com` for GitLab's built-in registry or `192.168.188.222:8070` for a custom registry).

- `CI_REGISTRY_IMAGE`: The full path to your image in the registry (e.g., `registry.gitlab.com/my-group/my-project/my-image` or `192.168.188.222:5008/docker/docker-static-service-template`).

---

### Error Handling: "Uploading artifacts to coordinator... too large archive"

This error indicates that the artifacts generated by your CI job exceed the maximum allowed size.

1. GitLab Instance Setting:

   As a GitLab administrator, go to Admin Area > Settings > CI/CD and increase the Maximum artifacts size (MB) value.

2. Nginx Proxy Configuration:

   If you are using an Nginx proxy in front of GitLab, you may also need to increase the client_max_body_size in your Nginx configuration. For example:

   ```nginx
   client_max_body_size 100m; # Adjust to a suitable size, e.g., 100m
   ```

   After modifying Nginx configuration, remember to reload or restart your Nginx service.

---

### Upgrading GitLab Versions

Upgrading GitLab can be complex, especially across major versions. GitLab enforces specific upgrade paths to ensure data integrity. Always consult the [official GitLab upgrade documentation](https://docs.gitlab.com/ee/update/) for the most accurate and up-to-date upgrade paths.

The provided examples illustrate a multi-step upgrade process:

- **Example Path 1:** `13.9.2` -> `13.12.12` -> `14.0.11` -> `14.1.6`

- **Example Path 2:** `12.9.2` -> `12.10.14` -> `13.0.14` -> `13.1.11` -> `13.8.8` -> `13.12.10`

- **Example Path 3:** `11.5.0` -> `11.11.8` -> `12.0.12` -> `12.1.17` -> `12.10.14` -> `13.0.14` -> `13.1.11` -> `13.2.10`

**General Upgrade Steps for Docker Installations:**

1. **Backup your current GitLab instance** before any upgrade.

2. **Identify the correct upgrade path** from your current version to your target version using the official GitLab documentation.

3. **Pull the necessary intermediate Docker images** for each step in your upgrade path. For instance, if upgrading from `13.9.2` to `14.1.6` via `13.12.12` and `14.0.11`:

   ```bash
   docker pull gitlab/gitlab-ce:13.12.12-ce.0
   docker pull gitlab/gitlab-ce:14.0.11-ce.0
   docker pull gitlab/gitlab-ce:14.1.6-ce.0
   # ... and any other versions in your specific path
   ```

   _Note:_ The `-ce.0` suffix might vary based on specific releases; typically, `gitlab/gitlab-ce:X.Y.Z` is sufficient.

4. **Stop your current GitLab container.**

   ```bash
   docker stop gitlab
   ```

5. **Run the container with the _next_ version in your upgrade path.** You will likely need to adjust your `docker run` command or `docker-compose.yml` to specify the exact version tag.

   ```bash
   # Example: Upgrade from 13.9.2 to 13.12.12
   docker run \
     --hostname gitlab.example.com \
     --publish 8443:443 --publish 8081:80 -p 2222:22 \
     --name gitlab \
     --restart always \
     --volume $HOME/_docker/gitlab/config:/etc/gitlab \
     --volume $HOME/_docker/gitlab/logs:/var/log/gitlab \
     --volume $HOME/_docker/gitlab/data:/var/opt/gitlab \
     -v /etc/localtime:/etc/localtime:ro \
     -d \
     gitlab/gitlab-ce:13.12.12-ce.0 # Specify the target version
   ```

6. **Monitor the logs** (`docker logs -f gitlab`) for any upgrade-related messages, especially during the `gitlab-ctl reconfigure` phase that runs automatically.

7. **Address any configuration changes** required by the new version. For instance, in the example given, GitLab 14.0 deprecated and removed Unicorn in favor of Puma. You might need to edit `gitlab.rb` to remove old Unicorn settings and ensure Puma is configured correctly.

   If an error like "Removed configurations found in gitlab.rb. Aborting reconfigure." appears, it means you have old configurations that are no longer supported. You must revert to the previous working version, modify `gitlab.rb` to remove the deprecated settings, run `gitlab-ctl reconfigure` on the _previous_ version to apply the changes, and then attempt the upgrade to the next version.

   ```bash
   # If the upgrade fails due to config, stop the failed container
   docker stop gitlab
   docker rm gitlab

   # Rerun the container with the *previous working version*
   docker run ... gitlab/gitlab-ce:13.9.2-ce.0 # Or your previous version

   # Once the previous version is running, go inside and fix the config
   docker exec -it gitlab vi /etc/gitlab/gitlab.rb
   # Remove/comment out Unicorn-related settings or other deprecated items

   # Reconfigure the previous version to ensure config is valid
   docker exec gitlab gitlab-ctl reconfigure

   # Stop and remove the previous version container
   docker stop gitlab
   docker rm gitlab

   # Now, attempt to run the container with the next version in the path again
   docker run ... gitlab/gitlab-ce:13.12.12-ce.0
   ```

8. **Repeat** steps 5-7 for each intermediate version in your upgrade path until you reach your final target version.
