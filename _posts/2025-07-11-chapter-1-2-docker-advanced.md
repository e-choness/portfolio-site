---
layout: "post"
title: "Chapter 1.2 - Mastering Docker - Container Operations and Management"
date: "2025-07-11"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "This guide delves into Docker operations, building upon a previous tutorial that covered basic container management commands."
---

## Container Management

Think of a **container** as an instance of a class.

Here are some essential commands for managing containers:

- **`docker ps`** (or `docker container ls`): Lists all **running** containers on your local machine.

- **`docker ps -a`** (or `docker container container ls --all`): Lists **all containers**, including those that have stopped.

- **`docker start [CONTAINER_ID/NAMES]`**: Starts one or more stopped containers.

- **`docker stop [CONTAINER_ID/NAMES]`**: Stops one or more running containers gracefully.

- **`docker rm [CONTAINER_ID/NAMES]`**: Removes one or more stopped containers. To remove a running container, you need to stop it first or use the `-f` (force) flag.

- **`docker logs [CONTAINER_ID/NAMES]`**: Displays the logs of a container.

- **`docker exec -it [CONTAINER_ID/NAMES] /bin/bash`**: Executes a command in a running container. The `-it` flags provide an interactive terminal.

- **`docker cp [CONTAINER_ID]:[/path/to/file] .`**: Copies a file from a running Docker container to your local machine. The `.` at the end means "copy to the current directory."

- **`docker cp . [CONTAINER_ID]:[/path/to/file]`**: Copies a file from your local machine into a running container.

Here are some common `docker run` commands and related operations:

- **`docker run centos echo "hello world"`**: Runs a simple command "hello world" inside a new `centos` container. The container will exit immediately after the command completes.

- **`docker run centos yum install -y wget`**: Runs a `yum install -y wget` command inside a new `centos` container to install the `wget` package. This container will also exit after the command finishes.

- **`docker logs my-nginx`**: Views the logs of the container named `my-nginx`.

- **`docker run -it centos /bin/bash`**: Starts a new `centos` container in interactive mode with a TTY, and opens a Bash shell. This is useful for exploring the container's environment.

- **`docker inspect centos`**: Displays detailed low-level information about a Docker object (in this case, the `centos` image or a running container named `centos`).

- **`docker commit [CONTAINER_ID] [NEW_IMAGE_NAME]`**: Creates a new image from a container's changes. For example, `docker commit 8bd centos-modified` creates a new image named `centos-modified` from the container with ID `8bd`.

- **`docker commit -m "nginx changed" my-nginx my-nginx-image`**: Creates a new image named `my-nginx-image` from the `my-nginx` container, with a commit message "nginx changed".

- **`docker inspect -f {{.State.Pid}} [CONTAINER_ID]`**: Retrieves the PID (Process ID) of the main process running inside a specific container (e.g., `44fc0f0582d9`).

- **`docker pull gitlab/gitlab-ce:11.2.3-ce.0`**: Downloads a specific version of a Docker image (in this case, GitLab Community Edition version `11.2.3-ce.0`).

---

## Container Service Management

These commands are used for managing the lifecycle of your containers:

- **`docker run -itd --name my-nginx2 nginx`**: **Creates and starts** a new container named `my-nginx2` from the `nginx` image.

  - `-i`: Interactive (keeps STDIN open).

  - `-t`: Allocates a pseudo-TTY.

  - `-d`: Runs the container in detached mode (in the background).

  - `--name my-nginx2`: Assigns the name `my-nginx2` to the container.

- **`docker start my-nginx --restart=always`**: **Starts** an existing container named `my-nginx` with a **restart policy**.

  - **Restart Policies:**

    - **`no`**: The container will not automatically restart.

    - **`on-failure`**: The container will restart only if it exits with a non-zero status (indicating an error).

    - **`always`**: The container will always restart when it stops, regardless of the exit status, and also on Docker daemon startup.

    - **`unless-stopped`**: The container will always restart unless it is explicitly stopped.

- **`docker start my-nginx`**: **Starts** an existing container named `my-nginx`.

- **`docker restart my-nginx`**: **Restarts** a running container named `my-nginx`.

- **`docker stop my-nginx`**: **Stops** a running container named `my-nginx` gracefully.

- **`docker kill my-nginx`**: **Forcefully kills** a running container named `my-nginx`. Use this when `docker stop` doesn't work.

- **`docker rename my-nginx new-nginx`**: **Renames** a container from `my-nginx` to `new-nginx`.

- **`docker rm new-nginx`**: **Deletes** a stopped container named `new-nginx`.

---

## Entering a Container

To interact with a running container, you often need to "enter" it.

First, create a detached (daemon) Docker container:

```bash
docker run -itd my-nginx /bin/bash
```

Then, use `docker ps` to find its details:

```bash
docker ps
# Example Output:
# CONTAINER ID  IMAGE  COMMAND      CREATED          STATUS          PORTS    NAMES
# 6bd0496da64f  nginx  "/bin/bash"  20 seconds ago   Up 18 seconds   80/tcp   high_shirley
```

Now, you can use the `docker exec` command to enter the running container:

```bash
docker exec -it 6bd0496da64f /bin/bash
```

While other methods exist, **`docker exec` is the recommended way to enter a Docker container**, especially since Docker version 1.3 and later.

Other methods you might encounter (and why `exec` is preferred):

- **`docker attach`**: Attaches to the main process of a running container. If that process dies, your session will also terminate. This is generally not recommended for interactive shells.

- **SSH**: Running an SSH daemon inside a Docker container is generally discouraged as it goes against the "one process per container" philosophy and adds unnecessary overhead and complexity.

- **`nsenter`**: A low-level tool for entering namespaces. While powerful, it's more complex than `docker exec` and often overkill for simple interactive access.

---

## File Copying

You can easily copy files between your host machine and Docker containers.

- **Copy from host to container**:

  ```bash
  docker cp [HOST_PATH] [CONTAINER_ID]:[CONTAINER_PATH]
  ```

  Example: `docker cp my_local_file.txt my-nginx:/app/`

- **Copy from container to host**:

  ```bash
  docker cp [CONTAINER_ID]:[CONTAINER_PATH] [HOST_PATH]
  ```

  Example: `docker cp my-nginx:/var/log/nginx/access.log .`

---

## Docker Private Registry Setup

You can set up your own private Docker registry to store and manage your Docker images. The official `registry` image is a simple way to achieve this. For a more robust solution with features like user authentication, web UI, and vulnerability scanning, consider a full-fledged registry management tool like Harbor.

### Using `registry`

1. **Pull the `registry` image**:

   ```bash
   docker pull registry:2
   ```

   _(Note: `2.6.2` is an older specific version; `2` will pull the latest `2.x.x` version.)_

2. **Create and run the `registry` container**:

   ```bash
   docker run -d \
     -p 5000:5000 \
     --restart=always \
     --name registry \
     registry:2
   ```

   This command runs the registry in detached mode, maps port 5000 on your host to port 5000 in the container, sets it to always restart, and names the container `registry`.

   To verify if the registry is running, you can access `http://localhost:5000/v2/`. If you get an empty JSON object (`{}`), it's working. _(Note: The IP `192.168.99.100` from the original text is often used in older Docker Toolbox setups. On modern Docker Desktop or Linux installations, `localhost` or your host's IP address will be more relevant.)_

   Customize Storage Location:

   To persist your registry data outside the container, mount a volume:

   ```bash
   docker run -d \
     -p 5000:5000 \
     --restart=always \
     --name registry \
     -v $HOME/docker/registry_data:/var/lib/registry \
     registry:2
   ```

   This mounts `$HOME/docker/registry_data` on your host to `/var/lib/registry` inside the container.

   Using a Custom Configuration File:

   You can also provide a custom config.yml:

   ```bash
   docker run -d -p 5000:5000 --restart=always --name registry \
       -v "$(pwd)"/config.yml:/etc/docker/registry/config.yml \
       registry:2
   ```

### Pushing Images to Your Private Registry

1. **Pull an image from Docker Hub (if you don't have one locally)**:

   ```bash
   docker pull nginx:latest
   ```

2. Tag the image with your registry address:

   You need to tag the image with the address of your private registry, including the port. For example, if your registry is running on localhost:5000:

   ```bash
   docker tag nginx:latest localhost:5000/my-nginx:latest
   ```

3. **Push the tagged image to your private registry**:

   ```bash
   docker push localhost:5000/my-nginx:latest
   ```

   You might encounter an error like `Get https://localhost:5000/v1/_ping: http: server gave HTTP response to HTTPS client`. This happens because Docker clients default to using HTTPS, but your local `registry` is running over HTTP.

   **To resolve this, you have two main options:**

   - **Configure your registry for HTTPS (recommended for production).**

   - **Add your registry address to Docker's "insecure registries" list (suitable for development/testing).**

   We will use the second method for simplicity:

   **Modifying Docker Daemon Configuration for Insecure Registries:**

   - **Linux**: Edit or create `/etc/docker/daemon.json`.

     ```json
     {
       "insecure-registries": ["localhost:5000"]
     }
     ```

     _(Replace `localhost:5000` with your actual registry address if different.)_

   - **macOS (Docker Desktop)**: Go to **Docker Desktop Preferences** (or **Settings**) -> **Daemon** -> **Docker Engine**. Add the `insecure-registries` entry in the JSON configuration. After modifying, click **Apply & Restart**.

   After modifying `daemon.json`, you must **restart the Docker daemon** for the changes to take effect:

   - **Linux**: `sudo systemctl daemon-reload && sudo systemctl restart docker`

   If you encounter an "Internal Server Error" (HTTP 500) during the push, especially on Linux, it might be due to **SELinux** enforcing access control. You can temporarily disable SELinux for testing:

   ```bash
   sudo setenforce 0
   getenforce # Should output "Permissive"
   ```

   **Important**: Disabling SELinux compromises security. For production, configure SELinux policies to allow Docker access to the registry storage.

   **Stopping and Removing the `registry` container:**

   ```bash
   docker container stop registry && docker container rm -v registry
   ```

   The `-v` flag removes any anonymous volumes associated with the container.

### Harbor

For a more comprehensive private registry solution, **Harbor** is a popular choice. It provides features like a web UI, access control, replication, vulnerability scanning, and content trust. While the `registry` image is good for basic needs, Harbor is better suited for enterprise environments.

Other registry management tools include Humpback and Rancher (though Rancher is primarily a container management platform, not solely a registry).

---

## Docker REST API

Docker doesn't just work through the `docker` command-line interface; it also exposes a powerful **REST API** that allows you to programmatically control the Docker daemon over HTTP. By default, the Docker remote API listens on a Unix socket (`/var/run/docker.sock`) for security reasons and doesn't expose a TCP port. To enable remote HTTP access, you need to configure the Docker daemon to listen on a TCP port. **Be aware that enabling the unauthenticated TCP port (`2375`) is a significant security risk and should only be done in secure, isolated environments or with proper authentication and encryption (e.g., TLS).**

### Enabling Remote API on CentOS

1. **Edit the Docker service unit file**:

   ```bash
   sudo vim /usr/lib/systemd/system/docker.service
   ```

2. Locate the ExecStart line and add the TCP listener:

   Original:

   ```bash
   ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
   ```

   Modified to listen on TCP port `2375` on all interfaces (`0.0.0.0`) and retain the Unix socket:

   ```bash
   ExecStart=/usr/bin/dockerd -H fd:// -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375 --containerd=/run/containerd/containerd.sock
   ```

   For production in an internal network, you might want to specify a specific internal IP instead of `0.0.0.0` (e.g., `-H tcp://10.105.3.115:2375`). You can also change the port `2375` if needed.

3. **Reload systemd daemon and restart Docker service**:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

4. **Verify the port is listening**:

   ```bash
    netstat -nutlp | grep 2375
    # Example output:
    # tcp   0   0 0.0.0.0:2375   0.0.0.0:* LISTEN    [PID]/dockerd
   ```

### Enabling Remote API on macOS (Docker Desktop)

On Docker Desktop for Mac, you cannot directly modify the `docker.service` file. Instead, you can expose the Docker socket using a proxy container.

```bash
docker run -d -v /var/run/docker.sock:/var/run/docker.sock -p 127.0.0.1:2375:2375 bobrik/socat TCP-LISTEN:2375,fork UNIX-CONNECT:/var/run/docker.sock
```

This command runs a `socat` container that forwards connections from `127.0.0.1:2375` on your host to the Docker daemon's Unix socket (`/var/run/docker.sock`) inside the container. This makes the API available on `localhost:2375`.

### Testing the Remote API

Once enabled, you can test the API using `curl` or a web browser:

- **Docker Info**: `http://127.0.0.1:2375/info`

- **Docker Version**: `http://127.0.0.1:2375/version`

You can also use `curl` with the Unix socket directly (without exposing a TCP port):

```bash
curl --unix-socket /var/run/docker.sock http://localhost/info
```

Or simply:

Bash

```bash
docker info
```

---

## Docker Run Command Options

The `docker run` command is highly versatile and allows you to configure nearly every aspect of a new container. Here are some commonly used options:

- **`-d`, `--detach`**: Run container in background and print container ID.

- **`-i`, `--interactive`**: Keep STDIN open even if not attached.

- **`-t`, `--tty`**: Allocate a pseudo-TTY. Often used with `-i` for interactive shell sessions.

- **`-u`, `--user`**: Username or UID (format: `<name|uid>[:<group|gid>]`).

- **`-a`, `--attach`**: Attach to STDIN, STDOUT or STDERR.

- **`-w`, `--workdir`**: Working directory inside the container.

- **`-c`, `--cpu-shares`**: CPU shares (relative weight).

- **`-e`, `--env`**: Set environment variables (e.g., `-e MY_VAR=my_value`).

- **`-m`, `--memory`**: Memory limit (e.g., `512m`, `1g`).

- **`-P`, `--publish-all`**: Publish all exposed ports to random host ports.

- **`-p`, `--publish`**: Publish a container's port(s) to the host (e.g., `-p 80:8080` maps host port 80 to container port 8080).

- **`-h`, `--hostname`**: Container hostname.

- **`-v`, `--volume`**: Bind mount a volume.

  - **Caution**: Docker prevents mounting an _existing file_ on the host onto an _existing directory_ inside the container.

  - Syntax examples:

    - `--volume /host/path:/container/path` (bind mount)

    - `--volume my_volume:/container/path` (named volume)

- **`--volumes-from`**: Mount volumes from the specified container(s).

- **`--cap-add`**: Add Linux capabilities (e.g., `NET_ADMIN`).

- **`--cap-drop`**: Drop Linux capabilities.

- **`--cidfile`**: Write the container ID to the file.

- **`--cpuset-cpus`**: CPUs in which to allow execution (0-3, 0,1).

- **`--device`**: Add a host device to the container.

- **`--dns`**: Set custom DNS servers.

- **`--dns-search`**: Set custom DNS search domains.

- **`--entrypoint`**: Override the default ENTRYPOINT of the image.

- **`--env-file`**: Read environment variables from a file.

- **`--expose`**: Expose a port or a range of ports (without publishing them to the host).

- **`--link`**: (Deprecated) Link to another container. Use Docker networks instead.

- **`--name`**: Assign a name to the container.

- **`--network`**: Connect a container to a network.

  - **`bridge`**: Default network driver, creating a virtual network.

  - **`host`**: Use the host's network stack (container shares host's IP and ports).

  - **`container:[NAME_or_ID]`**: Use another container's network stack.

  - **`none`**: No network interface inside the container.

- **`--privileged`**: Give extended privileges to this container.

- **`--restart`**: Restart policy to apply when a container exits (see "Container Service Management" section above for details).

- **`--rm`**: Automatically remove the container when it exits. Not compatible with `-d` for long-running containers.

- **`--sig-proxy`**: Proxy all received signals to the process in the container.

---

## Uninstalling Older Docker Versions

If you need to perform a clean installation or resolve issues, you might need to remove old Docker packages.

```bash
sudo yum remove docker \
  docker-client \
  docker-client-latest \
  docker-common \
  docker-latest \
  docker-latest-logrotate \
  docker-logrotate \
  docker-selinux \
  docker-engine-selinux \
  docker-engine
```

This command attempts to remove various Docker-related packages commonly found on CentOS/RHEL systems.

---

## Troubleshooting Common Docker Issues

### "Create more free space in thin pool or use dm.min_free_space option to change behavior"

This error often indicates that you're running out of space in the storage driver's data volume (especially if you're using devicemapper with loop-lvm).

Warning: Directly manipulating the thin pool or related storage can lead to data loss. Always back up your data before attempting advanced storage fixes.

Refer to the official Docker documentation or GitHub issues (like moby/moby#3182) for solutions, which often involve cleaning up unused images/containers/volumes (docker system prune) or reconfiguring the storage driver.

### Image Pull Failures / Slow Pulls

If you're having trouble pulling images or experiencing very slow downloads from Docker Hub, you can configure **registry mirrors** to pull images from closer or faster sources.

Edit the Docker daemon configuration file:

- **macOS (Docker Desktop)**: Docker Desktop Preferences -> Daemon -> Docker Engine.

- **Linux**: `/etc/docker/daemon.json`

Add or modify the `registry-mirrors` array:

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://registry.docker-cn.com"
  ],
  "insecure-registries": ["192.168.188.111:2021"]
}
```

_(The `insecure-registries` part is for your private HTTP registries, as discussed earlier.)_

After modifying `daemon.json`, remember to **restart the Docker daemon** for the changes to take effect.
