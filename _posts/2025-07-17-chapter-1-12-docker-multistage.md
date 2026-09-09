---
layout: "post"
title: "Chapter 1.12 Leverage Docker Multi-Stage for Optimized and Secure Docker Images"
date: "2025-07-17"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "This guide explains how to leverage Docker's multi-stage builds to create optimized and secure Docker images for Go applications. It addresses the common challenge of minimizing image size and preventing source code inclusion in production images, particularly for compiled languages like Go."
---

## The Problem: Large Images and Exposed Source Code

Docker's promise is "Build, Ship, and Run Any App, Anywhere." While it largely delivers, a common pitfall when building applications, especially with compiled languages like Go, is including the entire source code in the final image. For Go, only the compiled binary is needed at runtime. Packaging the source code introduces several risks:

- **Increased Image Size:** Unnecessary files bloat the image, leading to longer download times and higher storage consumption.
- **Security Vulnerabilities:** Exposing source code in production images can create attack vectors if not properly secured.
- **Unnecessary Dependencies:** Build-time tools and dependencies, even for scripting languages, often get included, further increasing image size.

---

## Example: A Simple Go Service

Let's consider a basic Go service that we want to package into a minimal Docker image. Here's the source code ( `main.go`):

```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	router := gin.Default()
	router.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "PONG")
	})
	router.Run(":8080")
}
```

---

## The Solution: Multi-Stage Builds

The ultimate goal is to place the final executable file into the smallest possible image (e.g., based on Alpine Linux). How do we get that compiled file efficiently?

Initially, a common approach involved:

1. **Compiling in a "Builder" Container:** Using a standard container (like Ubuntu or a `golang` image) to set up the compilation environment and compile the application.
2. **Extracting and Copying:** Transferring the compiled binary from the builder container to the host machine using Docker volumes, and then mounting that binary into a minimal runtime image (like Alpine).

While theoretically feasible, this method is cumbersome. It requires a two-step build process and a separate script to orchestrate the steps. Furthermore, ensuring compatibility of the compiled binary between different base images (e.g., a binary compiled in Ubuntu running in Alpine) can be tricky.

---

## Multi-Stage Builds to the Rescue

Docker 17.05 introduced **Multi-Stage Builds**, a significantly simpler and more efficient way to achieve our goal. With multi-stage builds, you can use multiple `FROM` statements within a single `Dockerfile`. Each `FROM` instruction starts a new build stage, optionally using a different base image. You can then easily copy artifacts from one stage to another, ensuring only the necessary files are included in the final image.

Let's update our `Dockerfile` to leverage multi-stage builds. We'll use **Go 1.22** and the latest **Docker best practices**.

```dockerfile
# Stage 1: Build the Go application
FROM golang:1.22-alpine AS build-env

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files first to leverage Docker's build cache
COPY go.mod go.sum ./

# Download Go module dependencies
# This step is cached as long as go.mod and go.sum don't change
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the application
# CGO_ENABLED=0 is crucial for static binaries when building for Alpine
# -ldflags="-s -w" reduces the binary size by stripping debug information
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o /usr/local/bin/app-server .

---

# Stage 2: Create the minimal runtime image
# Use a minimal base image like scratch for the smallest possible image
# or alpine for a slightly larger but still very small image with basic utilities.
# For most Go applications, scratch is ideal if you only need the binary.
FROM scratch

# Set the working directory (optional for scratch, as it's just the root)
WORKDIR /

# Copy the compiled binary from the 'build-env' stage
COPY --from=build-env /usr/local/bin/app-server /usr/local/bin/app-server

# Expose the port the application listens on
EXPOSE 8080

# Define the command to run the application when the container starts
CMD ["/usr/local/bin/app-server"]
```

### Explanation and Best Practices:

- **`FROM golang:1.22-alpine AS build-env`**:
  - We use `golang:1.22-alpine` as the base image for the build stage. Alpine is chosen because it's a very small Linux distribution, which helps keep the intermediate build image smaller, though its size doesn't affect the final image directly.
  - `AS build-env` gives this stage a name, making it easy to reference later.
- **`WORKDIR /app`**: Sets `/app` as the working directory for subsequent commands in this stage.
- **`COPY go.mod go.sum ./` followed by `RUN go mod download`**: This is a crucial **Docker build cache optimization**. By copying only the module files first and downloading dependencies, Docker can cache this layer. If your `go.mod` and `go.sum` files don't change, subsequent builds will reuse this cached layer, speeding up the process significantly.
- **`COPY . .`**: Copies the rest of your application's source code into the working directory.
- **`RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o /usr/local/bin/app-server .`**:
  - **`CGO_ENABLED=0`**: Disables Cgo, which is essential for building static Go binaries. This ensures the binary doesn't rely on C libraries present in the build environment but potentially missing in the minimal runtime environment (like `scratch` or Alpine).
  - **`GOOS=linux`**: Explicitly sets the target operating system to Linux, which is appropriate for Docker containers.
  - **`-a -installsuffix cgo`**: These flags are often used together when building static binaries. `-a` forces rebuilding of packages that are already up-to-date. `-installsuffix cgo` is used to differentiate the package path from the default for Cgo builds.
  - **`-ldflags="-s -w"`**: These linker flags reduce the size of the final executable:
    - `-s`: Omits the symbol table.
    - `-w`: Omits DWARF debugging information.
  - **`-o /usr/local/bin/app-server .`**: Specifies the output path and name for the compiled binary. `/usr/local/bin` is a standard location for executables.
- **`FROM scratch`**:
  - This is the most minimal Docker base image possible. It contains literally nothing, not even an operating system. It's perfect for statically compiled binaries like those produced by Go when `CGO_ENABLED=0`.
  - Alternatively, you could use `FROM alpine:latest` if your application needs some basic shell utilities or other system libraries not included in a `scratch` image. For most Go applications, `scratch` is preferred for maximum minimization.
- **`WORKDIR /`**: Sets the working directory in the final image. For `scratch`, this effectively means the root.
- **`COPY --from=build-env /usr/local/bin/app-server /usr/local/bin/app-server`**: This is the core of multi-stage builds. It copies the compiled `app-server` binary from the `build-env` stage (which is in `/usr/local/bin/app-server` within that stage) to `/usr/local/bin/app-server` in our final `scratch` image.
- **`EXPOSE 8080`**: Informs Docker that the container listens on port 8080 at runtime. This is purely informational and doesn't publish the port.
- **`CMD ["/usr/local/bin/app-server"]`**: Defines the default command to execute when the container starts. We specify the full path to our compiled binary. Using the exec form (square brackets) is a best practice.

---

## Building and Running the Image

With this single `Dockerfile`, you can now build your Docker image:

```bash
docker build -t cnych/docker-multi-stage-demo:latest .
```

This command builds the image, tagging it as `cnych/docker-multi-stage-demo:latest`. Docker automatically handles the stages, ensuring only the final minimal image is produced.

To run the container and test it:

```bash
docker run --rm -p 8080:8080 cnych/docker-multi-stage-demo:latest
```

- `--rm`: Automatically removes the container when it exits.
- `-p 8080:8080`: Maps port 8080 on your host to port 8080 inside the container.

Once the container is running, open your browser and navigate to `http://127.0.0.1:8080/ping`. You should see "PONG" returned, confirming your application is running successfully within a highly optimized Docker image.

---

This approach drastically simplifies the build process, reduces image size, and improves the security posture of your Dockerized Go applications by eliminating unnecessary build tools and source code from the final production image.
