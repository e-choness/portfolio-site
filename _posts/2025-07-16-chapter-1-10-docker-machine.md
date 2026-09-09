---
layout: "post"
title: "Chapter 1.10 - Docker Machine - A Guide to Orchestrating Docker Environments"
date: "2025-07-16"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "Docker Machine is an official Docker orchestration project designed to swiftly set up Docker environments across various platforms. Built with Go, it's maintained on GitHub and serves as a powerful tool for installing Docker on remote machines, or directly within virtual machines on your host, all while managing them via the `docker-machine` command. This guide covers the installation and usage of Docker Machine, updated for the latest versions and best practices."
---

## Installation

Docker Machine can be installed on Linux, macOS, and Windows.

### macOS and Windows

For macOS and Windows users, **Docker Desktop** (formerly Docker for Mac/Windows) bundles the `docker-machine` binary. After installing Docker Desktop, you can immediately use Docker Machine.

To verify your installation and check the version:

```bash
docker-machine -v
```

### Linux

Installing Docker Machine on Linux is straightforward. You can download the pre-compiled binary directly from the official GitHub Releases page.

For a 64-bit Linux system, use the following commands to download and make the binary executable:

```bash
sudo curl -L https://github.com/docker/machine/releases/download/v0.16.2/docker-machine-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-machine
sudo chmod +x /usr/local/bin/docker-machine
```

Once completed, verify the installation:

```bash
docker-machine -v
```

---

## Usage

Docker Machine supports various backend drivers, including virtualizers, local hosts, and cloud platforms.

### Creating a Local Host Instance with the VirtualBox Driver

To create a Docker host named `test` using the `virtualbox` driver:

```bash
docker-machine create -d virtualbox test
```

You can customize the host or its Docker daemon during creation with additional parameters:

- `--engine-opt dns=8.8.8.8`: Configures the Docker daemon's default DNS. Using `8.8.8.8` (Google's Public DNS) is a common and reliable choice.
- `--engine-registry-mirror https://docker.mirror.aliyuncs.com`: Configures a Docker registry mirror to speed up image pulls, especially useful in regions with slow access to Docker Hub. Replace with a mirror appropriate for your location if needed.
- `--virtualbox-memory 2048`: Allocates 2048 MB (2 GB) of RAM to the virtual machine.
- `--virtualbox-cpu-count 2`: Allocates 2 CPUs to the virtual machine.

For a comprehensive list of parameters, use:

```bash
docker-machine create --driver virtualbox --help
```

### Using the Generic Driver

The `generic` driver is useful for connecting to existing machines (physical or virtual) that already have SSH access.

```bash
docker-machine create -d generic \
    --generic-ip-address=123.59.188.19 \
    --generic-ssh-user=root \
    --generic-ssh-key ~/.ssh/id_rsa \
    dev
```

### macOS xhyve Driver

The `xhyve` driver (GitHub: `https://github.com/zchee/docker-machine-driver-xhyve`) is a lightweight virtualization engine for macOS, offering better performance than the VirtualBox driver.

First, install the driver:

```bash
brew install docker-machine-driver-xhyve
```

Then, create a Docker Machine instance:

```bash
docker-machine create \
      -d xhyve \
      --engine-opt dns=8.8.8.8 \
      --engine-registry-mirror https://docker.mirror.aliyuncs.com \
      --xhyve-memory-size 2048 \
      --xhyve-rawdisk \
      --xhyve-cpu-count 2 \
      xhyve
```

**Note:** For subsequent creations, it's recommended to include `--xhyve-boot2docker-url ~/.docker/machine/cache/boot2docker.iso` to avoid re-downloading the ISO image from GitHub every time.

For more parameters, use:

```bash
docker-machine create --driver xhyve --help
```

### Windows 10 Hyper-V Driver

On Windows 10, if you have Docker Desktop installed, you might not be able to use VirtualBox concurrently. In such cases, the `hyperv` driver is a suitable alternative.

```bash
docker-machine create --driver hyperv vm
```

For more parameters, use:

```bash
docker-machine create --driver hyperv --help
```

---

## Getting Started with Your Docker Host

After creating your Docker host, you can view a list of all managed hosts:

```bash
docker-machine ls
```

You'll see output similar to this:

```txt
NAME      ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER       ERRORS
test      -        virtualbox   Running   tcp://192.168.99.187:2376           v19.03.12-ce
```

To configure your shell to interact with the target Docker host, use the `env` command. This sets the necessary environment variables.

```bash
docker-machine env test
```

Follow the instructions provided in the output to set the environment variables in your current shell (usually by running `eval $(docker-machine env test)`). Once done, any `docker` commands you run will be executed on the `test` host.

You can also directly SSH into the host:

```bash
docker-machine ssh test
```

Once connected, you can use Docker commands directly on the remote host:

```bash
docker@test:~$ docker --version
Docker version 19.03.12-ce, build 48a66213fe
```

---

## Official Supported Drivers

Docker Machine supports a wide array of drivers, which you can specify with the `-d` option:

- `amazonec2`
- `azure`
- `digitalocean`
- `exoscale`
- `generic`
- `google`
- `hyperv`
- `none` (for local Docker daemons)
- `openstack`
- `rackspace`
- `softlayer`
- `virtualbox`
- `vmwarevcloudair`
- `vmwarefusion`
- `vmwarevsphere`

---

## Common Docker Machine Commands

Here's a list of common `docker-machine` commands:

- **`active`**: Displays the active Docker host.
- **`config`**: Outputs connection configuration information for a host.
- **`create`**: Creates a Docker host.
- **`env`**: Displays the environment variables needed to connect to a host.
- **`inspect`**: Displays detailed information about a host.
- **`ip`**: Gets the IP address of a host.
- **`kill`**: Stops a host without a graceful shutdown.
- **`ls`**: Lists all managed hosts.
- **`provision`**: Reprovisions an existing host.
- **`regenerate-certs`**: Regenerates TLS certificates for a host.
- **`restart`**: Restarts a host.
- **`rm`**: Deletes one or more hosts.
- **`ssh`**: Executes an SSH command on a host.
- **`scp`**: Copies files between the local machine and a host, or between hosts.
- **`mount`**: Mounts a host directory to the local system (less commonly used directly with `docker-machine`).
- **`start`**: Starts a host.
- **`status`**: Displays the status of a host.
- **`stop`**: Stops a host gracefully.
- **`upgrade`**: Upgrades a host's Docker version to the latest stable release.
- **`url`**: Gets the URL of a host.
- **`version`**: Displays the Docker Machine version information.
- **`help`**: Displays help information.

To view the specific usage and parameters for any command, use:

```bash
docker-machine COMMAND --help
```
