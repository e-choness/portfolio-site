---
layout: "post"
title: "Chapter 1.7 - Dockerizing Redis - Deployment and Management"
date: "2025-07-14"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "Just starting out with Redis and Docker? This guide aims to gently walk you through the essentials. We'll cover how to get Redis up and running in a Docker container, how to use your own configuration files, and crucially, how to keep your data safe. When the day comes to update your Redis version, we'll show you how to do it without fear. Consider this your friendly companion in the world of Dockerized Redis."
---

## Redis: Docker Deployment and Management

### Overview

Redis (Remote Dictionary Server) is an open-source, in-memory, and persistent Key-Value database written in ANSI C. It supports networked operations, provides various language APIs, and features a log-structured persistence model.

### 1. Downloading the Redis Docker Image

To get started, pull the specific Redis Docker image you intend to use. For example, to pull the latest stable version (8.0.3):

```bash
docker pull redis:8.0.3
```

For the latest official stable release, you can often use the `latest` tag:

```bash
docker pull redis:latest
```

However, for production environments, it's highly recommended to pin to a specific version to ensure predictable deployments.

### 2. Running a Basic Redis Container

You can quickly run a Redis container for testing or basic use. The `--rm` flag ensures the container is removed upon exit, and `--appendonly yes` enables AOF persistence.

```bash
docker run -d --rm -p 6389:6379 --name redis-dev redis:8.0.3 redis-server --appendonly yes
```

- `-d`: Runs the container in detached mode (in the background).
- `--rm`: Automatically removes the container when it exits.
- `-p 6389:6379`: Maps port `6389` on your host to Redis's default port `6379` inside the container.
- `--name redis-dev`: Assigns the name `redis-dev` to your container. Using a distinct name like `redis-dev` is good practice for temporary or development instances to avoid conflicts with persistent ones.
- `redis:8.0.3`: Specifies the Docker image to use (replace with your desired version).
- `redis-server --appendonly yes`: The command executed inside the container to start Redis with AOF persistence enabled.

### 3. Running Redis with Custom Configuration

For production or more controlled environments, it's best practice to run Redis with your own configuration file and persistent data.

#### Option A: Building a Custom Docker Image (Recommended for Immutable Infrastructure)

This method embeds your `redis.conf` directly into a new Docker image.

1. **Create `redis.conf`:** First, obtain a copy of the official Redis configuration file. You can do this by running a temporary container and copying the default config:

   ```bash
   # Run a temporary Redis container
   docker run -d --name temp-redis redis:8.0.3

   # Copy the default redis.conf from the container to your host
   docker cp temp-redis:/usr/local/etc/redis/redis.conf $HOME/_docker/redis/conf/redis.conf

   # Stop and remove the temporary container
   docker stop temp-redis
   docker rm temp-redis
   ```

   **Note:** The default path for `redis.conf` inside the official Redis Docker images has changed over versions. For Redis 8.x, it's typically `/usr/local/etc/redis/redis.conf`. Always verify this path for the specific Redis image version you are using.

   Now, modify `$HOME/_docker/redis/conf/redis.conf` to suit your needs. A key change for persistence is setting `dir /data` to ensure data is saved to a mounted volume.

2. **Create a `Dockerfile`:** In the same directory as your `redis.conf`, create a `Dockerfile`:

   ```dockerfile
   FROM redis:8.0.3
   RUN mkdir -p /etc/redis

   # Set timezone (adjust to your needs, e.g., America/New_York)
   ENV TZ=America/Edmonton
   RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

   # Copy your custom redis.conf into the image
   COPY ./redis.conf /etc/redis/redis.conf

   # Specify the command to run Redis with your config
   CMD [ "redis-server", "/etc/redis/redis.conf" ]

   # Expose the default Redis port
   EXPOSE 6379
   ```

   **Note:** The timezone environment variable is commonly `TZ` rather than `TimeZone`.

3. **Build the Docker Image:** Build your custom image, tagging it appropriately:

   ```bash
   docker image build -t my-redis:8.0.3 .
   ```

   (Replace `my-redis` with your preferred image name).

#### Option B: Mounting Configuration and Data Volumes (Recommended for Flexible Management)

This approach uses volume mounts to provide your configuration file and persistent data directory to a standard Redis image. This is often preferred as it allows you to update configurations without rebuilding the image.

1. **Prepare Directories and Configuration:**

   - Create host directories for Redis data and configuration:

     ```bash
     mkdir -p $HOME/_docker/redis/data
     mkdir -p $HOME/_docker/redis/conf
     ```

   - Copy the `redis.conf` file (obtained as described in Option A, step 1) into `$HOME/_docker/redis/conf/redis.conf`.
   - Edit `$HOME/_docker/redis/conf/redis.conf` and set the `dir` directive to `/data`. This ensures Redis uses the mounted data volume for persistence. Ensure `appendonly yes` is set within the `redis.conf` if you intend to use AOF persistence.

2. **Run the Container with Volumes:**

   ```bash
   docker run -d \
     -p 6379:6379 \
     --name redis-prod \
     --restart always \
     -v $HOME/_docker/redis/data:/data \
     -v $HOME/_docker/redis/conf/redis.conf:/usr/local/etc/redis/redis.conf \
     -v /etc/localtime:/etc/localtime:ro \
     redis:8.0.3 redis-server /usr/local/etc/redis/redis.conf
   ```

   - `-p 6379:6379`: Mapping port `6379` on the host to the container's default Redis port. It's common to use the default port if only one Redis instance is on the host.
   - `--name redis-prod`: Assigning a more production-oriented name.
   - `--restart always`: Configures the container to restart automatically upon Docker daemon restart or container exit.
   - `-v $HOME/_docker/redis/data:/data`: Mounts your host's data directory to `/data` inside the container for persistent data storage.
   - `-v $HOME/_docker/redis/conf/redis.conf:/usr/local/etc/redis/redis.conf`: Mounts your custom configuration file. **Ensure the destination path within the container is correct for your Redis image version (e.g., `/usr/local/etc/redis/redis.conf` for Redis 8.x official images).**
   - `-v /etc/localtime:/etc/localtime:ro`: Mounts the host's timezone information for accurate logging timestamps.
   - `redis-server /usr/local/etc/redis/redis.conf`: Starts Redis using your mounted configuration file. It's best to control AOF (or RDB) persistence directly within the `redis.conf` file.

### 4. Modifying Configuration and Restarting

After making changes to your `redis.conf` file (e.g., `$HOME/_docker/redis/conf/redis.conf`), you need to restart the Redis container for the changes to take effect:

```bash
docker restart redis-prod
```

### 5. Upgrading Redis in a Docker Context

Upgrading Redis involves replacing the existing container with a new one running the desired Redis version, while ensuring data persistence.

**Important Considerations Before Upgrade:**

- **Backup Data:** Always back up your Redis data (`dump.rdb` and AOF files from your mounted `/data` volume) before any upgrade. While the volume mount preserves data, an explicit backup provides an additional safety net.
- **Version Compatibility:** Review the official Redis release notes for breaking changes or migration steps between your current version and the target version. Major version upgrades (e.g., 6.x to 8.x) often require careful planning and may involve data migration tools or specific upgrade paths. Pay close attention to license changes, especially when moving to Redis 8.0 or later.
- **Downtime:** Plan for potential downtime during the upgrade process. For zero-downtime upgrades, consider using Redis Sentinel or Cluster.

**Upgrade Steps (Example: Upgrading from 6.2.19 to 8.0.3):**

1. **Pull the New Redis Image:**

   First, pull the Docker image for the new Redis version you want to use.

   ```bash
   docker pull redis:8.0.3
   ```

2. **Stop the Current Redis Container:**

   Stop the running Redis container to ensure no new data is written during the upgrade.

   ```bash
   docker stop redis-prod
   ```

3. **Rename/Remove the Old Container (Optional but Recommended):**

   If you plan to reuse the container name, remove the old container. If you want to keep it for rollback, rename it.

   ```bash
   docker rm redis-prod # If you want to remove it
   # OR
   docker rename redis-prod redis-prod_old # If you want to keep it
   ```

4. **Update Your `redis.conf` (If Necessary):**

   If the new Redis version has introduced configuration changes or new best practices, update your `redis.conf` file (`$HOME/_docker/redis/conf/redis.conf`) to align with the new version's recommendations. This is critical for major version upgrades.

   **Important:** The location of the default `redis.conf` inside the container might change between major Redis versions (e.g., from `/etc/redis/redis.conf` in older versions to `/usr/local/etc/redis/redis.conf` in newer ones). Ensure your volume mount in the `docker run` command for the new container points to the correct _internal_ path for the new Redis image.

5. **Start a New Redis Container with the New Version:**

   Start a new container using the new Redis image and pointing to your existing data and configuration volumes. This is crucial for data persistence.

   ```bash
   docker run -d \
     -p 6379:6379 \
     --name redis-prod \
     --restart always \
     -v $HOME/_docker/redis/data:/data \
     -v $HOME/_docker/redis/conf/redis.conf:/usr/local/etc/redis/redis.conf \
     -v /etc/localtime:/etc/localtime:ro \
     redis:8.0.3 redis-server /usr/local/etc/redis/redis.conf
   ```

   Ensure that the volume mounts (`-v`) for data and configuration are identical to your previous setup, **with the correct internal path for the `redis.conf` based on the new Redis image version.**

6. **Verify the Upgrade:**

   After the new container starts, verify that Redis is running the correct version and that your data is intact. You can check the Redis version by connecting to it:

   ```bash
   docker exec redis-prod redis-cli INFO server | grep redis_version
   ```

   And check for your keys:

   ```bash
   docker exec redis-prod redis-cli KEYS "*"
   ```

This systematic approach minimizes downtime and ensures data integrity during Redis upgrades in a Docker environment.
