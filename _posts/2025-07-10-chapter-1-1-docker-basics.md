---
layout: "post"
title: "Chapter 1.1 - Docker Streamlining Development with Containers"
date: "2025-07-10"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "Tired of "it works on my machine"? Docker solves environment headaches by packaging apps and dependencies into isolated containers. Learn how this lightweight virtualization accelerates development, simplifies deployment, and revolutionizes software delivery."
---

## The Challenge of Environment Configuration

One of the biggest headaches in software development is **environment configuration**. Every user's computer environment is different, so how can you be sure your software will run on all of them?

Users need to ensure two things: correct operating system settings and the proper installation of various libraries and components. Only when these are correct will the software run. For example, to install a Python application, the computer must have the Python interpreter, all its dependencies, and potentially configured environment variables.

Things get even more complicated if older modules are incompatible with the current environment. Developers often say, "**It works on my machine**," implying it might not work anywhere else.

Environment configuration is so troublesome that you have to repeat the process every time you switch machines, which is time-consuming. This led many to wonder: can we fundamentally solve this problem? Can software be installed with its environment? In other words, when installing, can the original environment be replicated exactly?

---

## Virtual Machines

**Virtual machines (VMs)** offered a solution for "installing with the environment." A VM allows you to run one operating system inside another, for example, running Linux within a Windows system. Applications are completely unaware of this, as the VM looks identical to a real system. To the underlying system, the VM is just a regular file that can be deleted when no longer needed, without affecting other parts.

While VMs can replicate the software's original environment, this solution has several drawbacks:

1. **High Resource Usage:** VMs monopolize a portion of memory and disk space. When running, other programs cannot use these resources. Even if the application inside the VM only uses 1MB of memory, the VM itself might require hundreds of MB to operate.
2. **Redundant Steps:** A VM is a complete operating system, and system-level operations, like user login, often cannot be skipped.
3. **Slow Startup:** Starting a VM takes as long as starting an operating system, possibly several minutes before the application can actually run.

---

## Linux Containers

Due to these limitations of virtual machines, Linux developed another virtualization technology: **Linux Containers (LXC)**.

Linux containers don't simulate a complete operating system. Instead, they isolate processes. Think of it as wrapping a protective layer around a normal process. For the process inside the container, all the resources it interacts with are virtual, achieving isolation from the underlying system.

Because containers operate at the process level, they offer significant advantages over virtual machines:

1. **Fast Startup:** The application inside a container is directly a process of the underlying system, not a process inside a VM. Therefore, starting a container is like starting a local process, not an operating system, making it much faster.
2. **Low Resource Usage:** Containers only use the resources they need, not those that are unused. VMs, being complete operating systems, inevitably consume all resources. Additionally, multiple containers can share resources, whereas VMs each monopolize resources.
3. **Small Size:** Containers only need to include the necessary components, while VMs package an entire operating system. Consequently, container files are much smaller than VM files.

In short, containers are like lightweight virtual machines that provide a virtualized environment with significantly less overhead.

---

## What is Docker?

**Docker** is a popular platform that leverages Linux container technology, providing a simple and user-friendly interface for working with containers. It's currently the most widely adopted container solution.

Docker packages an application and its dependencies into a single file, known as a **Docker image**. Running this image creates a virtual container. The application runs within this virtual container as if it were running on a real physical machine. With Docker, you no longer need to worry about environment issues.

Overall, Docker's interface is quite straightforward, allowing users to easily create and use containers, and put their applications inside them. Containers can also be version-controlled, copied, shared, and modified, just like managing regular code.

---

## Uses of Docker

Docker currently has three main use cases:

1. **Providing Disposable Environments:** For instance, testing third-party software locally, or providing environments for unit testing and building during continuous integration.
2. **Offering Elastic Cloud Services:** Because Docker containers can be started and stopped quickly, they are well-suited for dynamic scaling up and down.
3. **Building Microservices Architectures:** With multiple containers, a single machine can run several services, allowing you to simulate a microservices architecture locally.

---

## Installing Docker

Docker is an open-source commercial product available in two editions: **Community Edition (CE)** and **Enterprise Edition (EE)**. The Enterprise Edition includes some paid services that individual developers typically don't need. The following discussion focuses on the Community Edition.

Please refer to the official documentation for Docker CE installation:1

- [Mac2](https://docs.docker.com/desktop/install/mac-install/)
- [Windows3](https://docs.docker.com/desktop/install/windows-install/)
- [Ubuntu4](https://docs.docker.com/engine/install/ubuntu/)
- [Debian5](https://docs.docker.com/engine/install/debian/)
- [CentOS](https://docs.docker.com/engine/install/centos/)
- [Fedora](https://docs.docker.com/engine/install/fedora/)
- [Other Linux distributions](https://docs.docker.com/engine/install/)

After installation, run the following commands to verify a successful installation:

```bash
$ docker version
# Or
$ docker info
```

Docker requires `sudo` privileges. To avoid typing `sudo` before every command, you can add your user to the `docker` user group (refer to the [official documentation](https://docs.docker.com/engine/install/linux-postinstall/)).

```bash
$ sudo usermod -aG docker $USER
```

Docker operates on a client-server architecture. When running `docker` commands from the command line, the Docker daemon (service) needs to be running on your machine. If the service isn't started, you can use the following commands to start it (refer to the [official documentation](https://docs.docker.com/config/daemon/start/)):

```bash
# Using service command
$ sudo service docker start

# Using systemctl command (common on modern Linux)
$ sudo systemctl start docker
```

---

## Docker Images

Docker packages applications and their dependencies into an **image file**. This file is what generates a Docker container. An image file can be thought of as a **template** for containers. Docker uses an image file to create instances of containers. The same image file can generate multiple container instances running concurrently.

Images are binary files. In practical development, an image file is often created by inheriting from another image and adding personalized settings. For example, you can build your image by adding an Apache server on top of an Ubuntu base image.

```bash
# List all image files on your machine.
$ docker image ls

# Delete an image file
$ docker image rm [imageName]
```

Image files are universal; an image file copied from one machine to another can still be used. Generally, to save time, you should try to use pre-built image files from others instead of creating your own from scratch. Even if you need customization, it's better to process an existing image rather than starting from zero.

For easy sharing, once an image file is created, it can be uploaded to an online **registry**. Docker's official registry, **Docker Hub**, is the most important and commonly used image registry. Additionally, it's possible to sell your custom-built image files.

---

## Example: Hello World

Let's experience Docker with the simplest image file, "hello-world."

**Note:** Connecting to Docker's official registry from certain regions can be slow or encounter disconnections. You might need to configure a domestic mirror site. If needed, you can look up how to modify the default registry.

First, run the following command to pull the image file from the registry to your local machine:

```bash
$ docker image pull library/hello-world
```

In the command above, `docker image pull` is the command to fetch an image file. `library/hello-world` specifies the image's location in the registry, where `library` is the image's group, and `hello-world` is the image's name.

Since official Docker images are generally in the `library` group, it's the default and can be omitted. Thus, the command can be simplified to:

```bash
$ docker image pull hello-world
```

After a successful pull, you can see this image file on your machine:

```bash
$ docker image ls
```

Now, run this image file:

```bash
$ docker container run hello-world
```

The `docker container run` command creates a running container instance from an image file.

**Important:** The `docker container run` command has an automatic image pulling feature. If it doesn't find the specified image file locally, it will automatically pull it from the registry. Therefore, the preceding `docker image pull` command isn't always a mandatory step.

If successful, you will see the following output on your screen:

```bash
$ docker container run hello-world

Hello from Docker!
This message shows that your installation appears to be working correctly....
```

After displaying this message, the `hello-world` container will stop running and automatically terminate.

Some containers won't automatically terminate because they provide services. For example, if you run the Ubuntu image, you can experience the Ubuntu system directly in your command line.

```bash
$ docker container run -it ubuntu bash
```

For containers that don't terminate automatically, you must manually stop them using the `docker container kill` command:

```bash
$ docker container kill [containerID]
```

---

## Container Files

A container instance generated from an image file is itself a file, referred to as a **container file**. This means that once a container is generated, two files will exist simultaneously: the image file and the container file. Closing a container does not delete the container file; it merely stops the container from running.

```bash
# List running containers on your machine
$ docker container ls

# List all containers on your machine, including stopped ones
$ docker container ls --all
```

The output of the above commands includes the container's ID. This ID is required in many places, such as the `docker container kill` command discussed in the previous section.

Stopped container files still occupy disk space and can be deleted using the `docker container rm` command:

```bash
$ docker container rm [containerID]
```

After running the above command, if you use `docker container ls --all` again, you'll find that the deleted container file has disappeared.

You can also use the `--rm` parameter with the `docker container run` command to automatically delete the container file when it stops running:

```bash
$ docker container run --rm -p 8000:3000 -it koa-demo /bin/bash
```

---

## Dockerfile

Once you've learned to use image files, the next question is how to create them yourself. If you want to distribute your own software, you'll inevitably need to build your own image files.

This is where the **Dockerfile** comes in. It's a text file used to configure an image. Docker uses this file to build the binary image file.

Let's walk through an example of how to write a Dockerfile.

---

## Example: Building Your Own Docker Container

Using the `koa-demos` project as an example, I'll demonstrate how to write a Dockerfile to allow users to run the Koa framework within a Docker container.

As preparation, please download the source code:

```bash
$ git clone https://github.com/ruanyf/koa-demos.git
$ cd koa-demos
```

### 10.1 Writing the Dockerfile

First, in the project's root directory, create a new text file named `.dockerignore` and add the following content:

```dockerfile
.git
node_modules
npm-debug.log
```

The above lines indicate that these three paths should be excluded and not packaged into the image file. If you don't have any paths to exclude, you don't need to create this file.

Next, in the project's root directory, create a new text file named `Dockerfile` and add the following content:

```dockerfile
FROM node:18-alpine # Recommended to use a more recent and smaller base image
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npm.taobao.org # Adjust registry if not in China
EXPOSE 3000
```

The above `Dockerfile` consists of five lines with the following meanings:

- `FROM node:18-alpine`: This image file inherits from the official Node.js image, with `18-alpine` as the tag, indicating Node.js version 18 based on Alpine Linux (a smaller base image).
- `COPY . /app`: Copies all files from the current directory (excluding paths specified in `.dockerignore`) into the `/app` directory within the image.
- `WORKDIR /app`: Sets the subsequent working directory within the container to `/app`.
- `RUN npm install --registry=https://registry.npm.taobao.org`: Executes the `npm install` command in the `/app` directory to install dependencies. Note that all installed dependencies will be packaged into the image file. (Adjust the `--registry` if you are not in China or don't need a custom registry).
- `EXPOSE 3000`: Declares that the container's port 3000 will be exposed, allowing external connections to this port. This is for documentation and network configuration.

### 10.2 Building the Image File

With the Dockerfile created, you can now use the `docker image build` command to create the image file:

```bash
$ docker image build -t koa-demo .
# Or, to specify a version tag
$ docker image build -t koa-demo:0.0.1 .
```

In the command above:

- The `-t` parameter is used to specify the image file's name. You can also specify a tag using a colon (`:`). If no tag is specified, the default tag is `latest`.
- The final `.` indicates the path to the Dockerfile, which is the current directory in this example.

If the build is successful, you can see the newly generated `koa-demo` image file:

```bash
$ docker image ls
```

### 10.3 Generating a Container

The `docker container run` command generates a container from an image file:

```bash
$ docker container run -p 8000:3000 -it koa-demo /bin/bash
# Or, if you used a version tag:
$ docker container run -p 8000:3000 -it koa-demo:0.0.1 /bin/bash
```

The parameters in the command above have the following meanings:

- `-p 8000:3000`: Maps the container's port 3000 to the host machine's port 8000.
- `-it`: This combines `-i` (interactive) and `-t` (pseudo-TTY). It maps the container's shell to your current shell, so commands you type in your local terminal are passed into the container.
- `koa-demo:0.0.1`: The name of the image file (if a tag is provided, it must be included; `latest` is the default tag).
- `/bin/bash`: The first command to be executed inside the container after it starts. Here, it starts Bash, ensuring the user can interact with the shell.

If everything is normal, after running the above command, you will be presented with a command prompt similar to:

```bash
root@66d80f4aaf1e:/app#
```

This indicates you are now inside the container, and the prompt is the container's internal shell prompt. Execute the following command:

```bash
root@66d80f4aaf1e:/app# node demos/01.js
```

At this point, the Koa framework should be running. Open your local browser and visit `http://127.0.0.1:8000`. The page might display "Not Found" because this specific demo doesn't have a route defined.

In this example, the Node.js process runs within Docker's virtual environment. The file system and network interfaces the process interacts with are virtualized and isolated from the host machine's file system and network interfaces. Therefore, it's necessary to define port mappings between the container and the physical machine.

Now, in the container's command line, press `Ctrl + c` to stop the Node.js process, then `Ctrl + d` (or type `exit`) to exit the container. Alternatively, you can use `docker container kill` to terminate the container's execution:

```bash
# In another terminal window on your host machine, find the container ID
$ docker container ls

# Stop the specified container
$ docker container kill [containerID]
```

After the container stops running, it doesn't disappear. Use the following commands to delete the container file:

```bash
# Find the container ID
$ docker container ls --all

# Delete the specified container file
$ docker container rm [containerID]
```

### 10.4 CMD Instruction

In the previous example, after the container started, you had to manually type `node demos/01.js`. We can include this command directly in the Dockerfile so that it executes automatically when the container starts, eliminating the need for manual input.

Dockerfile

```dockerfile
FROM node:18-alpine
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npm.taobao.org
EXPOSE 3000
CMD node demos/01.js
```

The Dockerfile above includes an additional line at the end: `CMD node demos/01.js`. This indicates that `node demos/01.js` will automatically execute when the container starts.

You might ask, what's the difference between the `RUN` instruction and the `CMD` instruction? Simply put, `RUN` commands are executed during the image build phase, and their results are packaged into the image file. `CMD` commands, on the other hand, are executed when the container starts. Also, a Dockerfile can contain multiple `RUN` instructions, but only one `CMD` instruction.

**Note:** If you specify a `CMD` instruction, the `docker container run` command cannot append another command (like `/bin/bash` from before), as it would override the `CMD` instruction. Now, to start the container, you can use the following command:

```bash
$ docker container run --rm -p 8000:3000 -it koa-demo:0.0.1
```

### 10.5 Publishing the Image File

Once the container runs successfully, confirming the image file's validity, you can consider sharing the image file online for others to use.

First, register an account on [hub.docker.com](https://hub.docker.com/) or [cloud.docker.com](https://cloud.docker.com/). Then, log in using the following command:

```bash
$ docker login
```

Next, tag your local image with your Docker username and a repository/tag:

```bash
$ docker image tag [imageName] [username]/[repository]:[tag]

# Example
$ docker image tag koa-demos:0.0.1 yourusername/koa-demos:0.0.1
```

Alternatively, you can rebuild the image directly with the username:

```bash
$ docker image build -t [username]/[repository]:[tag] .
```

Finally, publish the image file:

```bash
$ docker image push [username]/[repository]:[tag]
```

After successful publication, you can log in to [hub.docker.com](https://hub.docker.com/) to see your published image file.

---

## Other Useful Commands

While the primary Docker usage is covered above, several other commands are also very useful.

### `docker container start`

The preceding `docker container run` command creates a _new_ container; each time you run it, a new container is generated. Running the same command twice will create two identical container files. If you want to reuse a container that has already been created and stopped, use the `docker container start` command:

```bash
$ docker container start [containerID]
```

### `docker container stop`

The `docker container kill` command forcefully terminates a container's execution, equivalent to sending a `SIGKILL` signal to the container's main process. The `docker container stop` command also stops a container, but it's a more graceful shutdown: it sends a `SIGTERM` signal to the container's main process, allowing the application to perform cleanup, and then after a timeout, it sends a `SIGKILL` if the process hasn't exited.

```bash
$ docker container stop [containerID]
```

The difference between these signals is that an application can gracefully perform cleanup when it receives a `SIGTERM` signal (or ignore it). If it receives a `SIGKILL` signal, it's forcibly terminated immediately, and any ongoing operations will be lost.

### `docker container logs`

The `docker container logs` command is used to view the output of a Docker container, specifically the container's standard output (from its Shell). If you didn't use the `-it` parameter when running the container with `docker run`, you'll need this command to view its output.

```bash
$ docker container logs [containerID]
```

### `docker container exec`

The `docker container exec` command is used to enter a running Docker container. If you didn't use the `-it` parameter when running the container with `docker run`, you'll need this command to get inside it. Once inside the container, you can execute commands in its shell.

```bash
$ docker container exec -it [containerID] /bin/bash
```

### `docker container cp`

The `docker container cp` command is used to copy files from a running Docker container to your local machine. Here's how to copy a file to the current directory:

```bash
$ docker container cp [containerID]:[/path/to/file] .
```
