---
layout: "post"
title: "Chapter 1.9 - Mastering Docker Compose - A Modern, Best-Practices Guide"
date: "2025-07-16"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "Learn to define and manage multi-container applications with this updated Docker Compose guide. We cover the latest commands, best practices, and a hands-on Python and Redis project to simplify your development and deployment workflow."
---

## Introduction

**Docker Compose** is an official and powerful tool from Docker for defining and running multi-container applications. It simplifies the management of complex application stacks by allowing you to configure all of your application's services, networks, and volumes in a single declarative YAML file.

The code is open-source and available on GitHub: [https://github.com/docker/compose](https://github.com/docker/compose).

While a `Dockerfile` is used to build an image for a single container, real-world applications are often composed of multiple, interconnected services. For example, a web application might consist of a frontend web server, a backend API, a database, and a caching layer. Each of these components would run in its own container.

Docker Compose allows you to manage this entire stack as a single unit. You use a YAML file, conventionally named `compose.yml` or `docker-compose.yml`, to define the project.

There are two core concepts in Docker Compose:

- **Services (`services`):** A service defines the configuration for a specific container in your application. This includes the Docker image to use, ports to expose, volumes to mount, environment variables to set, and networks to connect to. When you scale a service, you are creating more container instances running with that same configuration.
- **Project (`project`):** A project is the entire multi-container application stack defined by your `compose.yml` file. Compose manages the lifecycle of this entire project, including creating, starting, stopping, and deleting all the services, networks, and volumes associated with it.

Originally a Python project called Fig, Compose has been rewritten and is now integrated directly into the Docker CLI as a plugin. This guide focuses on the modern `docker compose` command (with a space), which is the current best practice.

---

## Installation

As of Docker Engine v20.10, Docker Compose is included as a plugin, `docker compose`, directly within the Docker CLI. The older, standalone Python version (`docker-compose`) is now deprecated.

### Docker Desktop (macOS, Windows, and Linux)

If you have installed Docker Desktop, you already have Docker Compose. It is bundled by default. You can verify the installation by running:

```bash
docker compose version
```

This should output the version of the Docker Compose plugin, for example: `Docker Compose version v2.27.0`.

### Linux Server

On Linux, if you installed Docker Engine without Docker Desktop, you may need to install the Compose plugin separately.

#### 1. Install using Docker's repository (Recommended)

The easiest way is to install it from Docker's official package repository.

**For Debian/Ubuntu:**

```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

**For CentOS/RHEL/Fedora:**

```bash
sudo dnf install docker-compose-plugin
```

#### 2. Manual Binary Installation

If you cannot use the package manager, you can install the plugin by downloading its binary from the official [GitHub Releases page](https://github.com/docker/compose/releases).

1. Download the appropriate binary for your system architecture. For Linux x86-64:

   ```bash
   # Set the version you want to install
   COMPOSE_VERSION="v2.27.0"

   # Create the directory for CLI plugins
   mkdir -p ~/.docker/cli-plugins/

   # Download the binary
   curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o ~/.docker/cli-plugins/docker-compose
   ```

2. Make the binary executable:

   ```bash
   chmod +x ~/.docker/cli-plugins/docker-compose
   ```

3. Verify the installation:

   ```bash
   docker compose version
   ```

### Bash Command Completion (Optional but recommended)

To make using `docker compose` easier, you can install command completion scripts.

```bash
# For bash on Ubuntu/Debian
sudo apt-get install bash-completion

# For other systems, you may need to download it manually
# sudo curl -L https://raw.githubusercontent.com/docker/compose/v2/contrib/completion/bash/docker-compose -o /etc/bash_completion.d/docker-compose
```

---

## How to Uninstall

- If you installed using a package manager (`apt`, `dnf`), use it to uninstall:

  ```bash
  # For Debian/Ubuntu
  sudo apt-get remove docker-compose-plugin

  # For CentOS/RHEL/Fedora
  sudo dnf remove docker-compose-plugin
  ```

- If you installed the binary manually, simply delete the file:

  ```bash
  rm ~/.docker/cli-plugins/docker-compose
  ```

---

## Example Project: A Simple Web Counter

Let's build a simple web application that uses Flask and Redis to count the number of times a page has been visited.

First, create a new directory for your project and navigate into it.

### 1. The Python Application (`app.py`)

Create a file named `app.py` with the following content. This script sets up a simple web server and connects to a Redis service named `redis`.

```python
import time
import redis
from flask import Flask

app = Flask(__name__)
# The hostname 'redis' is used to connect to the Redis container
# because Docker's internal networking will resolve it.
cache = redis.Redis(host='redis', port=6379)

def get_hit_count():
    """Connects to Redis and increments the 'hits' counter."""
    retries = 5
    while True:
        try:
            # The 'incr' command is atomic, ensuring thread safety.
            return cache.incr('hits')
        except redis.exceptions.ConnectionError as exc:
            if retries == 0:
                raise exc
            retries -= 1
            time.sleep(0.5)

@app.route('/')
def hello():
    count = get_hit_count()
    return f'Hello from Docker! I have been seen {count} times.\n'

if __name__ == "__main__":
    # Host 0.0.0.0 makes the server accessible from outside the container.
    app.run(host="0.0.0.0", port=5000, debug=True)
```

### 2. The Dockerfile (`Dockerfile`)

Next, create a `Dockerfile` to containerize the Python application. Using a `-slim` base image is a good practice as it provides a good balance between size and compatibility.

```dockerfile
# Use a specific and recent version of Python for reproducibility.
FROM python:3.11-slim-bookworm

# Set a working directory inside the container.
WORKDIR /code

# Copy dependency file and install dependencies.
# This leverages Docker's layer caching.
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Command to run the application.
CMD ["python", "app.py"]
```

Create a `requirements.txt` file for the Python dependencies:

```txt
flask
redis
```

### 3. The Compose File (`compose.yml`)

This is the main file where you define your services. Create a file named `compose.yml`. This version introduces best practices like named volumes for data persistence and a dedicated network for communication.

```yaml
# compose.yml
services:
  # The Python web application service
  web:
    build: .
    ports:
      - "8000:5000" # Expose port 8000 on the host and map it to 5000 in the container
    volumes:
      - .:/code # Bind mount for live code changes during development
    networks:
      - counter-net
    depends_on:
      - redis # Ensures redis starts before the web service

  # The Redis service
  redis:
    image: "redis:7-alpine" # Use a specific version of the Redis image
    volumes:
      - redis-data:/data # Use a named volume to persist Redis data
    networks:
      - counter-net

# Define the network
networks:
  counter-net:
    driver: bridge

# Define the named volume
volumes:
  redis-data:
```

### 4. Running the Project

Now, from your project directory, run the following command:

```bash
docker compose up --build
```

- `docker compose up` will create and start all services defined in your `compose.yml`.
- The `--build` flag forces Docker to build the `web` service image before starting.

You will see logs from both the `web` and `redis` services in your terminal. Open your web browser and navigate to `http://localhost:8000`. You should see "Hello from Docker! I have been seen 1 times." Each time you refresh the page, the counter will increment.

To stop and remove all the project's containers and networks, press `Ctrl-C` in the terminal, and then run:

```bash
# The --volumes flag also removes the named volume (redis-data)
docker compose down --volumes
```

---

## Common Docker Compose Commands

The basic syntax is `docker compose [OPTIONS] [COMMAND]`. Here are the most essential commands:

### Project Lifecycle Commands

- `up`
  - **Usage:** `docker compose up [OPTIONS] [SERVICE...]`
  - **Description:** Builds, (re)creates, starts, and attaches to containers for a project. If you run `docker compose up` on an existing project, it will only recreate services where the configuration or image has changed.
  - **Key Options:**
    - `-d`, `--detach`: Run containers in the background. This is standard for production or CI/CD.
    - `--build`: Always build images before starting containers.
    - `--force-recreate`: Recreate all containers, even if they haven't changed.
    - `--no-recreate`: Don't recreate containers that already exist.
    - `--scale SERVICE=NUM`: Scale a specific service to `NUM` instances. For example, `docker compose up --scale web=3 -d`.
- `down`
  - **Usage:** `docker compose down [OPTIONS]`
  - **Description:** Stops and removes all containers, networks, and default volumes created by `up`.
  - **Key Options:**
    - `--volumes`: Removes named volumes declared in the `volumes` section of your `compose.yml`.
    - `--rmi all`: Removes all images used by the services.
- `start`, `stop`, `restart`
  - **Usage:** `docker compose [start|stop|restart] [SERVICE...]`
  - **Description:** These commands control the lifecycle of existing containers in a project without removing them. `stop` gracefully stops them, `start` starts them again, and `restart` does both.
- `ps`
  - **Usage:** `docker compose ps [OPTIONS] [SERVICE...]`
  - **Description:** Lists all the containers running for the current project, including their status, ports, and command.

### Service Management Commands

- `exec`
  - **Usage:** `docker compose exec [OPTIONS] SERVICE COMMAND [ARGS...]`
  - **Description:** Executes a command inside a running container. This is extremely useful for debugging.
  - **Example:** To open a shell inside the `web` container:

    ```bash
    docker compose exec web /bin/sh
    ```

- `run`
  - **Usage:** `docker compose run [OPTIONS] SERVICE [COMMAND] [ARGS...]`
  - **Description:** Runs a one-off command in a _new_ container for a service. This is useful for tasks like database migrations or running tests. Unlike `exec`, this creates a new container.
  - **Key Options:**
    - `--rm`: Automatically removes the container after the command exits.
    - `--no-deps`: Don't start linked services.
- `logs`
  - **Usage:** `docker compose logs [OPTIONS] [SERVICE...]`
  - **Description:** Displays log output from your services.
  - **Key Options:**
    - `-f`, `--follow`: Follow the log output in real-time.
    - `-t`, `--timestamps`: Show timestamps.
    - `--tail="50"`: Only show the last 50 lines of logs.

### Image and Build Commands

- `build`
  - **Usage:** `docker compose build [OPTIONS] [SERVICE...]`
  - **Description:** Builds or rebuilds the images for services that have a `build` configuration.
  - **Key Options:**
    - `--no-cache`: Do not use the cache when building the image.
    - `--pull`: Always attempt to pull a newer version of the base image.
- `pull`
  - **Usage:** `docker compose pull [OPTIONS] [SERVICE...]`
  - **Description:** Pulls the latest images for the services defined in `compose.yml`.
- `push`
  - **Usage:** `docker compose push [OPTIONS] [SERVICE...]`
  - **Description:** Pushes the images for your services to a container registry like Docker Hub.

### Configuration and Cleanup

- `config`
  - **Usage:** `docker compose config [OPTIONS]`
  - **Description:** Validates and views the final, interpolated configuration file after applying environment variables and other transformations. This is great for debugging your `compose.yml`.
- `rm`
  - **Usage:** `docker compose rm [OPTIONS] [SERVICE...]`
  - **Description:** Removes stopped service containers. It is generally safer and more comprehensive to use `docker compose down`.
  - **Key Options:**
    - `-f`, `--force`: Force removal.
    - `-s`, `--stop`: Stop the containers before removing them.
    - `-v`: Remove anonymous volumes attached to containers.
