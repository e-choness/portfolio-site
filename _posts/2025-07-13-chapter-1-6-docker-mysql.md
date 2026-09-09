---
layout: "post"
title: "Chapter 1.6 - Deploying MySQL with Docker to Best Practices"
date: "2025-07-13"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "This guide provides a comprehensive overview of how to deploy and manage MySQL using Docker, incorporating the latest standards and best practices for data persistence, configuration, and security. Learn to leverage Docker volumes, optimize my.cnf, and implement essential security measures for a robust database environment."
---

MySQL is the world's most popular open-source relational database management system (RDBMS), widely used for web applications. It is a product of Oracle.

This guide provides a comprehensive overview of how to deploy and manage MySQL using Docker, incorporating the latest standards and best practices.

### 1. Downloading the Docker Image

To begin, you need to pull the official MySQL Docker image. It's highly recommended to use the latest stable or Long Term Support (LTS) version for enhanced features, performance, and security. As of July 2025, MySQL 8.4 is the latest LTS release.

You can pull the image using the `docker pull` command:

```bash
# Or for the absolute latest version:
docker pull mysql:latest
# Or for the latest Long Term Support release:
# docker pull mysql:latest-lts
```

This command fetches the specified MySQL image from Docker Hub.

### 2. Running the MySQL Container

When running a database in Docker, data persistence is crucial. Docker **named volumes** are the recommended way to manage data, ensuring your database files are not lost when the container is stopped, removed, or updated.

Here's an updated `docker run` command incorporating best practices:

```bash
docker volume create mysql_data

docker run --name mysql-server \
  -p 3306:3306 \
  -v mysql_data:/var/lib/mysql \
  -v /path/to/your/custom/my.cnf:/etc/mysql/conf.d/my.cnf:ro \
  -e MYSQL_ROOT_PASSWORD=your_strong_password \
  -e TZ=America/Edmonton \
  -d mysql:latest
```

Let's break down each option:

- `--name mysql-server`: Assigns a descriptive name to your container (`mysql-server`), making it easier to reference.

- `-p 3306:3306`: Maps port 3306 (default MySQL port) from the container to port 3306 on your host machine. This allows external applications to connect to your MySQL instance.

- `-v mysql_data:/var/lib/mysql`: This creates and mounts a **named Docker volume** called `mysql_data` to `/var/lib/mysql` inside the container. This directory is where MySQL stores its data files, ensuring data persistence.

- `-v /path/to/your/custom/my.cnf:/etc/mysql/conf.d/my.cnf:ro`: This mounts a custom `my.cnf` configuration file from your host machine (`/path/to/your/custom/my.cnf`) into the container's configuration directory. The `:ro` flag ensures it's mounted as read-only, preventing accidental modifications from within the container. This is the preferred way to manage MySQL configurations.

- `-e MYSQL_ROOT_PASSWORD=your_strong_password`: Sets the password for the `root` user within MySQL. **Always use a strong, unique password for production environments.**

- `-e TZ=America/Edmonton`: Sets the container's timezone to "America/Edmonton" (current location). This is generally a better approach than setting `default-time_zone` in `my.cnf` for Docker containers, as it ensures consistency across the container's environment.

- `-d`: Runs the container in detached mode (in the background).

Note on Bind Mounts vs. Named Volumes:

While the original article used bind mounts (-v $HOME/\_docker/mysql/data:/var/lib/mysql), Docker named volumes (-v mysql_data:/var/lib/mysql) are generally preferred for database persistence. Named volumes are fully managed by Docker, are easier to back up, and ensure better portability.

### 3. Accessing the Container and Viewing Logs

You can execute commands inside your running MySQL container using `docker exec`.

To get a bash shell inside the `mysql-server` container:

```bash
docker exec -it mysql-server bash
```

To view the MySQL Server logs, which are streamed to Docker's standard output:

```bash
docker logs mysql-server
```

### 4. Configuring MySQL

For advanced configurations, create a custom `my.cnf` file on your host machine and mount it into the container as shown in the `docker run` command. Below are common configurations that should be included in your `my.cnf` (e.g., at `/path/to/your/custom/my.cnf`):

```yaml
# For advice on how to change settings please see
# https://dev.mysql.com/doc/refman/8.4/en/server-configuration-defaults.html

[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Ignore case sensitivity of database table names (common for development/testing, but consider implications for production)
lower_case_table_names = 1

# Set server ID for replication (must be unique in a replication topology)
server-id = 1

# Enable binary logging for replication and point-in-time recovery
log_bin = /var/lib/mysql/mysql-bin.log
binlog_format = ROW # Recommended format for reliability in replication
max_binlog_size = 100M # Maximum size of each binary log file
binlog_expire_logs_seconds = 864000 # Expire binary logs after 10 days (864000 seconds)

# Basic InnoDB settings (adjust based on your server's RAM)
# innodb_buffer_pool_size = 70% of your RAM for dedicated server, else 10%
# Example for a server with 2GB RAM:
# innodb_buffer_pool_size = 1400M

# Data directory and socket path (usually handled by Docker image, but can be specified)
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock

# Disabling symbolic-links is recommended to prevent assorted security risks
symbolic-links=0

# Error log path (optional, Docker logs are usually sufficient)
# log-error=/var/log/mysqld.log

# PID file path (usually handled by Docker image)
# pid-file=/var/run/mysqld/mysqld.pid
```

**Key Configuration Details:**

- **`utf8mb4` Character Set:** `utf8mb4` is the recommended character set for full Unicode support, including emojis. The configuration ensures that both client and server use this character set.

- **`lower_case_table_names`:** Setting this to `1` makes table names case-insensitive. Be consistent with this setting across all MySQL instances in a replication setup.

- **Time Zone (`default-time_zone`):** While the original article set `default-time_zone=+8:00` in `my.cnf`, it's generally more robust to set the `TZ` environment variable in the `docker run` command as shown above. This affects the entire container, not just MySQL. If you still prefer setting it in `my.cnf`, ensure the value is appropriate (e.g., `+08:00` or a named timezone like `Asia/Shanghai` if timezone tables are loaded).

- **Binary Logging (`log_bin`, `binlog_format`, `max_binlog_size`, `binlog_expire_logs_seconds`):** Binary logs are essential for data recovery, point-in-time recovery, and replication.

  - `server-id`: A unique identifier for the MySQL server in a replication topology.

  - `log_bin`: Enables binary logging and specifies the path to the log files.

  - `binlog_format`: `ROW` format is generally preferred for its deterministic nature and data integrity during replication.

  - `max_binlog_size`: Controls the maximum size of individual binary log files.

  - `binlog_expire_logs_seconds`: (MySQL 8.0+) Defines how long binary log files are retained before being automatically purged. For MySQL 5.7, use `expire_logs_days`.

- **`innodb_buffer_pool_size`:** This is one of the most critical settings for InnoDB performance, defining the amount of memory allocated for caching data and indexes. Adjust this value based on your available RAM.

### 5. Applying Configuration Changes and Restarting

After modifying your `my.cnf` file on the host, you need to restart the MySQL container for the changes to take effect:

```bash
docker restart mysql-server
```

### 6. Entering the Database and Verification

To connect to your MySQL database inside the container:

```bash
# Enter the mysql container's bash shell
docker exec -it mysql-server bash

# Then, login to MySQL as root (you'll be prompted for the password)
mysql -uroot -p
```

Once logged into the MySQL prompt, you can verify your configurations:

- **Check binary logs status:**

  ```sql
  SHOW BINARY LOGS;
  ```

- **Check server ID:**

  ```sql
  SHOW VARIABLES LIKE '%server_id%';
  ```

- **Check character set and collation:**

  ```sql
  SHOW VARIABLES LIKE 'character_set_%';
  SHOW VARIABLES LIKE 'collation_%';
  ```

- **Check timezone:**

  ```sql
  SELECT @@GLOBAL.time_zone, @@SESSION.time_zone;
  SHOW VARIABLES LIKE '%time_zone%';
  ```

### 7. Additional Best Practices

- **Security:**

  - **Strong Passwords:** Always use complex passwords for all MySQL users.

  - **Least Privilege:** Create dedicated users for specific applications with only the necessary privileges. Avoid using `root` for application connections.

  - **Network Isolation:** Use Docker networks (`docker network create`) to isolate your database container from other services that don't need direct access.

  - **Regular Updates:** Keep your Docker daemon and MySQL images updated to receive the latest security patches.

- **Monitoring:** Implement monitoring solutions (e.g., Prometheus, Grafana) to track MySQL performance metrics within your Docker containers.

- **Backup and Recovery:** Regularly back up your MySQL data (the `mysql_data` volume) and, critically, **test your restore process** to ensure data integrity. Binary logs are essential for point-in-time recovery.

- **Resource Allocation:** In production, consider setting resource limits (CPU, memory) for your MySQL container to prevent it from consuming all host resources.

### 8. Troubleshooting

- **Container Fails to Start:** Check `docker logs mysql-server` for error messages. Common issues include incorrect `MYSQL_ROOT_PASSWORD`, port conflicts, or malformed `my.cnf`.

- **Data Loss:** If you didn't use a persistent volume, your data will be lost when the container is removed. Always use named volumes for databases.

- **Connection Issues:** Ensure the port mapping (`-p`) is correct and no firewall rules are blocking the connection.

### Conclusion

By leveraging Docker for your MySQL deployments, you gain significant advantages in terms of portability, isolation, and simplified management. Adhering to the best practices outlined in this guide, from utilizing named volumes for data persistence and carefully configuring `my.cnf` to prioritizing strong security measures and regular backups will ensure a robust, scalable, and maintainable MySQL environment. Continuously monitor your database performance and keep your Docker images updated to maintain optimal operation and security.
