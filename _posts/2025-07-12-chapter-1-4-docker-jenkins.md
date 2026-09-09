---
layout: "post"
title: "Chapter 1.4 - Dockerized Jenkins - Linux Deployment and Pipeline Execution"
date: "2025-07-12"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter One", "Docker"]
author: "Echo Yin"
excerpt: "This guide outlines how to deploy Jenkins on a Linux server using Docker and run Pipeline scripts within Docker containers. This approach simplifies using various Node.js or Java sandbox environments."
---

## Deploying Jenkins

Due to common network restrictions in some regions, directly pulling Docker images might be challenging. A recommended workaround is to download the Jenkins and Jenkins agent images on a local machine with VPN access and then transfer them to your server.

### 1. Download and Transfer Jenkins Images

First, pull the necessary Docker images and save them as `.tar` files. We'll use the `lts-jdk21` tag to get the latest Long-Term Support version for JDK 21.

```bash
# Get the latest LTS Jenkins image for JDK 21
docker pull jenkins/jenkins:lts-jdk21

# Save the Docker image to a local file
docker save -o jenkins-lts-jdk21.tar jenkins/jenkins:lts-jdk21

# Get the latest Jenkins agent image for JDK 21
docker pull jenkins/ssh-agent:latest-jdk21

# Save the Docker image to a local file
docker save -o jenkins-ssh-agent-latest-jdk21.tar jenkins/ssh-agent:latest-jdk21
```

Next, transfer these `.tar` files to your Linux server. Replace `152.22.3.186` with your server's IP address and adjust the `scp` port (`-P 2222`) if needed.

```bash
# Upload to the server
+scp -P 2222 jenkins-lts-jdk21.tar root@152.22.3.186:/home/docker-images
+scp -P 2222 jenkins-ssh-agent-latest-jdk21.tar root@152.22.3.186:/home/docker-images

```

### 2. Create a Custom Jenkins Image with Docker Support

To allow Jenkins to interact with the Docker daemon on your host, you'll need a custom Jenkins image that includes the Docker CLI. Create a `Dockerfile` with the following content:

```dockerfile
# Use the official Jenkins JDK 21 image as the base
FROM jenkins/jenkins:lts-jdk21

# Switch to root user to install Docker CLI and create necessary groups
USER root

# Install necessary packages for Docker CLI (curl, gnupg2, lsb-release, software-properties-common are often pre-installed or not strictly needed for static binary)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    lsb-release \
    software-properties-common \
    # Clean up apt caches to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Install a specific version of Docker CLI from the static binaries
# Choose a stable version that matches your host's Docker version or a recent one
ARG DOCKER_VERSION=26.1.4
RUN curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz" | tar xzvf - --strip-components=1 -C /usr/local/bin docker/docker

# Create the 'docker' group if it doesn't exist and add the 'jenkins' user to it
# The GID of the 'docker' group inside the container should ideally match the GID of the 'docker' group on the host.
# You might need to find the GID on your host (e.g., `getent group docker | cut -d: -f3`) and specify it here:
# RUN groupadd -g <HOST_DOCKER_GID> docker || true && usermod -aG docker jenkins
# For simplicity, we assume the default 'docker' group creation is sufficient or pre-exists.
RUN groupadd docker || true && usermod -aG docker jenkins

# Switch back to the jenkins user
USER jenkins
```

Build your new Jenkins image. Replace `my-jenkins-docker-2468-jdk21` with a descriptive tag.

```bash
docker build -t my-jenkins-docker:lts-jdk21 .
```

Save the newly built image and transfer it to your server:

```bash
docker save -o my-jenkins-docker-2468-jdk21.tar my-jenkins-docker-2468-jdk21
scp -P 2222 my-jenkins-docker-2468-jdk21.tar root@152.22.3.186:/home/docker-images
```

### 3. Load Images on the Server

Once the `.tar` files are on your server, load them into Docker:

```bash
# On your server
docker load -i /home/docker-images/jenkins-lts-jdk21.tar
docker load -i /home/docker-images/jenkins-ssh-agent-jdk21.tar
docker load -i /home/docker-images/my-jenkins-docker-lts-jdk21.tar
```

### 4. Configure and Start Jenkins with Docker Compose

Create a `docker-compose.yml` file in a directory on your server. This file defines the Jenkins service and its dependencies.

```yaml
version: "3.8" # Use a recent Docker Compose file format version

services:
  jenkins:
    image: my-jenkins-docker-lts-jdk21 # Use your custom Jenkins image
    ports:
      - "8086:8080" # Map host port 8086 to container port 8080 (Jenkins UI)
      - "50000:50000" # Map host port 50000 to container port 50000 (for Jenkins agents)
    volumes:
      # Persistent storage for Jenkins data
      - jenkins_home:/var/jenkins_home
      # Mount the Docker socket to allow Jenkins to run Docker commands
      - /var/run/docker.sock:/var/run/docker.sock
      # Optional: Mount the Docker CLI binary if it's not installed in the image
      # - /usr/bin/docker:/usr/bin/docker
    # Recommended: Set a restart policy to ensure Jenkins restarts with the Docker daemon
    restart: unless-stopped
    # Optional: Set resource limits
    # deploy:
    #   resources:
    #     limits:
    #       cpus: '2'
    #       memory: '4G'

  ssh-agent:
    image: jenkins/ssh-agent:jdk21
    # This agent typically connects to Jenkins via JNLP, no direct port mapping needed unless specific use case.
    # It's usually managed by Jenkins itself when running pipeline steps.

volumes:
  jenkins_home: # Define the named volume for Jenkins data persistence
```

Navigate to the directory containing `docker-compose.yml` and start Jenkins:

```bash
docker compose up -d # Start Jenkins in detached mode
```

To stop and remove Jenkins:

```bash
docker compose down # Stop and remove all containers, networks, volumes, and images defined in the Docker Compose file
```

After starting, Jenkins will be accessible at `http://152.22.3.186:8086/`.

---

## Jenkins Configuration

### 1. Install Plugins

Install the **Git Parameter Plug-In** to enable automatic loading of repository branches in your CI builds. You can do this via **Manage Jenkins** > **Manage Plugins** > **Available Plugins**.

After installation, configure the Git Parameter in **Manage Jenkins** > **System**.

### 2. Add Credentials

You'll need to add SSH and SCP credentials for Jenkins to interact with your Git repositories and remote servers.

Generate an SSH key pair on your local machine or Jenkins server (if you plan to use a key generated there):

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_jenkins # Use a specific filename to avoid overwriting
```

Copy the **private key** content (from `id_rsa_jenkins` or similar file) and add it as a "SSH Username with private key" credential in Jenkins (**Manage Jenkins** > **Manage Credentials** > **(global)** > **Add Credentials**).

### 3. Create a New Pipeline Job

Create a new Jenkins job, selecting "Pipeline" as the type.

### 4. Configure Pipeline Job

In the job configuration, set up the **Git Parameter** to read branches during the build process.

Under the "Build Triggers" or "General" section (depending on your Jenkins version and installed plugins), you can add a "Choice Parameter" or similar to select between "production" or "development" modes before the build starts. This value can then be accessed in your Pipeline script.

### 5. Specify Pipeline Script Location

Choose **Pipeline script from SCM** and configure it to point to your Git repository and the `Jenkinsfile` within it. For example, if your `Jenkinsfile` is on the `config` branch, specify that.

---

## Running Pipeline Scripts

### Node.js Environment

To run Node.js applications within your Jenkins pipelines, install the **Docker Pipeline** plugin. This plugin allows your pipeline to build and use Docker containers.

Before running, ensure you have the required Node.js Docker images available on your Jenkins server. Pull and save them as you did for Jenkins images:

```bash
# Pull latest Node.js LTS versions (replace with desired versions)
docker pull node:18
docker pull node:20
docker pull node:22

# Save to local files (example for Node.js 20)
docker save -o node20.tar node:20

# Upload to server
scp -P 2222 node20.tar root@152.22.3.186:/home/docker-images

# On server, load the images
docker load -i /home/docker-images/node20.tar
```

Here's an example of a **Pipeline script** that uses a Node.js 20 Docker image:

```groovy
pipeline {
    agent {
        docker {
            image 'node:20'
            // Mount NPM cache directory for faster builds.
            // Using a path within the Jenkins workspace for easy permissions management.
            args '-v ${WORKSPACE}/.npm:/home/node/.npm'
        }
    }
    environment {
        // Define environment variables for your project
        GIT_URL="http://152.22.3.186:8081/mall/h5.git" // Use HTTPS for better security if available
        GIT_AUTH = "" // Replace with your Jenkins Credentials ID for Git
        GIT_BRANCH = "${branch}" // Parameter from Jenkins job
        PROJECT_ENV = "${project_env}" // Parameter from Jenkins job (e.g., "vip", "dev")
        VIP_HOST = '152.22.3.186'
        VIP_REMOTE_DIR = "/mnt/mall/h5"
        LOCAL_BUILD_DIR = "${WORKSPACE}/h5_vip/dist/" // Assuming 'dist' is output dir
    }
    stages {
        stage('Git Checkout') {
            steps {
                echo "🏆 WORKSPACE: ${WORKSPACE}"
                echo "🎯 Branch: ${GIT_BRANCH}"
                echo "🏅 Project Environment: ${PROJECT_ENV}"
                script {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "${GIT_BRANCH}" ]],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [[$class: 'CleanBeforeCheckout']], // Add clean checkout for consistency
                        submoduleCfg: [],
                        userRemoteConfigs: [[
                            credentialsId: "${GIT_AUTH}",
                            url: "${GIT_URL}"
                        ]]
                    ])
                }
                sh 'pwd'
                sh 'ls -la'
            }
        }
        stage('Build and Deploy Frontend') {
            when {
                expression {
                    // Only proceed if the previous stage was successful or skipped
                    currentBuild.result == null || currentBuild.result == 'SUCCESS'
                }
            }
            steps {
                sh 'pwd'
                script {
                    switch (PROJECT_ENV) {
                        case "vip":
                            // Navigate to the project directory, install dependencies, build
                            sh '''
                            ls -la
                            cd h5_vip
                            npm install --cache /home/node/.npm --registry=https://registry.npmmirror.com/ # Use a reliable registry
                            npm run build
                            '''
                            // Ensure the 'dist' directory exists and rename it as needed
                            sh 'cd h5_vip && mv dist test_dir'

                            withCredentials([sshUserPrivateKey(credentialsId: '', // Fill this with your credentials ID
                                keyFileVariable: 'SSH_KEY')]) {
                                // Connect to remote server, remove old deployment, and upload new files
                                sh '''
                                ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no root@${VIP_HOST} "rm -rf ${VIP_REMOTE_DIR}/test_dir"
                                scp -i ${SSH_KEY} -o StrictHostKeyChecking=no -P 22 -r "${WORKSPACE}/h5_vip/test_dir" root@${VIP_HOST}:${VIP_REMOTE_DIR}
                                '''
                            }
                            break
                        case "dev":
                            echo "Development deployment logic (not implemented in this example)"
                            break
                    }
                }
            }
        }
    }
    post {
        success {
            echo 'Success: Build and deployment completed.'
        }
        failure {
            echo 'Failure: Build or deployment failed. Check logs for details.'
        }
        always {
            // Clean up workspace if needed
            // cleanWs()
        }
    }
}
```

### Java Environment

To run Java applications with Maven, create a custom Docker image based on `openjdk:11` (or your desired Java version) and install Maven.

Here's the `Dockerfile` for your custom Java/Maven image:

```dockerfile
# Use the official OpenJDK 11 image as the base
FROM openjdk:11

# Set environment variables for Maven
ENV MAVEN_VERSION=3.9.6 # Update to a recent stable Maven version
ENV MAVEN_HOME=/opt/maven
ENV PATH="${MAVEN_HOME}/bin:${PATH}"

# Install necessary packages for downloading and extracting Maven
# Install `gnupg` for verifying Maven downloads (good practice, though not strictly used in this Dockerfile)
USER root
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    gnupg \
    # Clean up apt caches to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Download, extract, and symlink Maven
RUN wget https://dlcdn.apache.org/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz -O /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
    && tar xzf /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /opt \
    && ln -s /opt/apache-maven-${MAVEN_VERSION} ${MAVEN_HOME} \
    && rm /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz

# Create a non-root user 'jenkins' with UID 1000 and GID 1000
# This matches the default Jenkins user UID in the official Jenkins image, which is good for volume permissions.
RUN groupadd -r jenkins --gid 1000 && useradd -r -g jenkins -m -d /home/jenkins --uid 1000 jenkins \
    && mkdir -p /home/jenkins/.m2/repository \
    && chown -R jenkins:jenkins /home/jenkins/.m2

# Switch to the non-root user
USER jenkins

# Verify Maven version
RUN mvn -version
```

Build your new Java/Maven image. Replace `my-openjdk-maven:3.9.6` with your chosen tag.

```bash
docker build -t my-openjdk-maven:3.9.6 .
```

Save the image and transfer it to your server:

```bash
docker save -o my-openjdk-maven-3.9.6.tar my-openjdk-maven:3.9.6
scp -P 2222 my-openjdk-maven-3.9.6.tar root@106.55.8.163:/home/docker-images
```

Load the image on your server:

```bash
docker load -i ./my-openjdk-maven-3.9.6.tar
```

### Caching Maven Dependencies

To cache downloaded Maven packages and avoid re-downloading them on every build, you can mount a host directory as the Maven local repository within the container.

First, identify the UID/GID of the `jenkins` user inside your Maven Docker image:

```bash
docker run --rm my-openjdk-maven:3.9.6 id jenkins
# Expected output: uid=1000(jenkins) gid=1000(jenkins) groups=1000(jenkins)
```

On your **host machine**, create a directory for Maven caching and ensure it's owned by the same UID/GID that the `jenkins` user has inside the Docker container (typically 1000:1000 for standard Jenkins/Maven setups):

```bash
sudo mkdir -p /opt/jenkins-maven-cache
sudo chown -R 1000:1000 /opt/jenkins-maven-cache
sudo chmod -R 775 /opt/jenkins-maven-cache # Give group write permissions for flexibility
```

Now, here's a **Pipeline script** example that uses the custom Java/Maven Docker image and caches Maven dependencies:

```groovy
pipeline {
    agent {
        docker {
            image 'my-openjdk-maven:3.9.6'
            // Mount the host's Maven repository to the container's Maven home
            // Ensure the host path (/opt/jenkins-maven-cache) is correctly owned/permissioned
            args '-v /opt/jenkins-maven-cache:/home/jenkins/.m2/repository:rw'
        }
    }
    environment {
        // Define environment variables for your project
        GIT_URL="http://106.55.8.163:8081/mall/springboot-mall.git" // Use HTTPS if available
        GIT_AUTH = "" // Fill with your Jenkins Credentials ID for Git
        GIT_BRANCH = "${branch}" // Parameter from Jenkins job
        PROJECT_ENV = "${project_env}" // Parameter from Jenkins job (e.g., "pro", "dev")
        VIP_HOST = '152.22.3.186' // Your VIP server's IP address
        VIP_REMOTE_DIR = "/mnt/mall/admin"
    }
    stages {
        stage('Git Checkout') {
            steps {
                echo 'Checking out Git repository...'
                script {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "${GIT_BRANCH}" ]],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [
                            // Only pull the latest commit for faster checkouts
                            [$class: 'CloneOption', depth: 1, shallow: true, noTags: true]
                        ],
                        submoduleCfg: [],
                        userRemoteConfigs: [[
                            credentialsId: "${GIT_AUTH}",
                            url: "${GIT_URL}"
                        ]]
                    ])
                }
            }
        }
        stage('Maven Build') {
            steps {
                echo 'Starting Maven build...'
                // Execute Maven package, skipping tests, and specifying the local repository path
                sh "mvn clean package -Dmaven.test.skip=true -Dmaven.repo.local=/home/jenkins/.m2/repository -U"
            }
        }
        stage('Deploy Backend') {
            when {
                expression {
                    // Only proceed if the previous stage was successful or skipped
                    currentBuild.result == null || currentBuild.result == 'SUCCESS'
                }
            }
            steps {
                script {
                    switch (PROJECT_ENV) {
                        case "pro":
                            // Use SSH credentials for deployment
                            withCredentials([sshUserPrivateKey(credentialsId: '',  keyFileVariable: 'SSH_KEY')]) {
                                // Transfer compiled JAR and dependencies, then restart the service
                                sh '''
                                scp -i ${SSH_KEY} -o StrictHostKeyChecking=no -P 22 "${WORKSPACE}/admin/target/lib" "root@${VIP_HOST}:${VIP_REMOTE_DIR}"
                                scp -i ${SSH_KEY} -o StrictHostKeyChecking=no -P 22 "${WORKSPACE}/admin/target/admin-2.3.jar" "root@${VIP_HOST}:${VIP_REMOTE_DIR}"
                                ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no root@${VIP_HOST} '/mnt/sh/admin-8000.sh restart;'
                                '''
                            }
                            break
                        case "dev":
                            echo "Development deployment logic (not implemented in this example)"
                            break
                    }
                }
            }
        }
    }
    post {
        success {
            echo 'Success: Java build and deployment completed.'
        }
        failure {
            echo 'Failure: Java build or deployment failed. Check logs for details.'
        }
        always {
            // Clean up workspace if needed
            // cleanWs()
        }
    }
}
```

This comprehensive guide should help you deploy Jenkins with Docker and run your Node.js and Java pipelines efficiently. Remember to replace placeholder values like IP addresses, credentials, and image versions with your actual details.
