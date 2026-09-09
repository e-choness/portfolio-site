---
layout: "post"
title: "Chapter 0.1 - Before Anything, Let's Go Back to the Root - Linux Commands and Operations"
date: "2025-07-09"
category: "devops"
tags: ["Platform Engineering", "DevOps", "Chapter Zero", "Linux"]
author: "Echo Yin"
excerpt: "This guide is a comprehensive guide to over 100 essential Linux commands, crucial for anyone working with cloud infrastructure or as a professional developer. It covers commands for file management, searching and filtering text, input/output redirection, archiving, file transfer, and managing file permissions and system processes. The guide aims to significantly boost productivity for Linux users by explaining the syntax and practical applications of each command."
---

At the time of writing, Linux holds a mere 2.68% global market share on desktops. Yet, it reigns supreme in the cloud, powering over 90% of all cloud infrastructure and hosting services. For this reason alone, mastering popular Linux commands is absolutely crucial.

According to a StackOverflow survey, Linux is the operating system of choice for professional developers, boasting an impressive 55.9% market share. This isn't just a coincidence. Linux is free, open-source, offers superior security compared to its competitors, and features a robust command line that empowers developers and advanced users to work with unparalleled efficiency.

The core focus of Linux has never been its graphical user interface. It was fundamentally designed to give you complete control over the operating system through the command line. This can seem daunting to Linux newcomers, and the thousands of available commands only make it appear more challenging.

## **Learn More Command Line**

In this guide, we'll delve into over 100 of the most useful Linux commands. As a Linux user, simply learning a fraction of these commands can significantly boost your productivity.

**What are Linux Commands?**
**Most Commonly Used Linux Commands**
**More Linux Commands**
**7 Top Tips for Using Linux Commands**
**Linux Command Cheat Sheet**

## **What are Linux Commands?**

Linux commands are programs or utilities executed on the command line. The command line itself is an interface that accepts lines of text and processes them as instructions for the computer.

Any Graphical User Interface (GUI) is merely an abstraction of command-line programs. For instance, when you close a window by clicking the "X," a command is running behind that action.

**Flags** are options we can pass to the commands you run. Most Linux commands have a help page, which we can invoke using the `-h` flag. In most cases, flags are optional.

An **argument** or **parameter** is the input we provide to a command for it to function correctly. In most cases, a parameter is a file path, but it can be anything you type in the terminal.

Flags can be invoked using a single hyphen (`-`) and a double hyphen (`--`), while the execution of parameters depends on the order in which they are passed to the function.

## **Most Commonly Used Linux Commands**

Before we dive into the most commonly used Linux commands, make sure to launch your terminal. In most Linux distributions, you can do this by pressing `Ctrl + Alt + T`. If that doesn't work, simply search for "terminal" in your applications panel.

[Image: Linux Terminal Emulator]

Now, let's explore over 100 of the most commonly used Linux commands. Many of these offer numerous options that can be chained together, so be sure to consult the command's manual page.

## **Linux File Management Commands**

**1. `ls` – List Directory Contents**

`ls` is likely the very first command every Linux user types into their terminal. It allows you to list the contents of any desired directory (the current directory by default), including files and other nested directories.

```bash
ls
```

It boasts a plethora of options, so it's best to use `--help` for assistance. This flag returns all possible arguments that can be used with `ls`.

**Syntax:**

```bash
ls [options] [directory]
```

**Some of the most useful `ls` options include:**

- `-l` – Displays results in a long format, showing additional details like permissions, ownership, size, and modification date for each file and directory.
- `-a` – Shows hidden files and directories that start with a dot (`.`), unless they are explicitly hidden.
- `-R` – Recursively lists the contents of all subdirectories, delving infinitely into subfolders.
- `-S` – Sorts by file size, with the largest files appearing first.
- `-t` – Sorts by timestamp, with the most recent files at the top.

For example, to colorize the output of the `ls` command, you can use:

```bash
ls --color=auto
```

[Image: `ls` colored command output]

Now that the `ls` command output is colorized, you can easily distinguish between directories and files.

However, typing the `--color` flag every time is inefficient. This is precisely why we use command **aliases**.

**2. `cd` – Change Directory**

The `cd` command, alongside `ls`, is incredibly popular. It stands for "change directory," and as its name suggests, it allows you to navigate to the directory you wish to access.

When you run the `cd` command by itself, it will return you to your home directory. You can also change directories via a specific path. For example:

- `cd /usr/local` – Changes to the `/usr/local` directory.
- `cd ..` – Moves up one level to the parent directory.
- `cd ~/pictures` – Switches to the `pictures` folder within your home directory.

**Syntax:**

```bash
cd [directory]
```

For instance, if you're in your `Documents` directory and trying to access one of its subfolders named `Videos`, you can enter it by typing:

```bash
cd Videos
```

You can also provide the absolute path to the folder:

```bash
cd /home/wbolt/Documents/Videos
```

There are a few tricks you can use with the `cd` command to save a lot of time:

1. **Go to the home folder:**

   ```bash
   cd
   ```

2. **Move up one level:**

   ```bash
   cd ..
   ```

3. **Go back to the previous directory:**

   ```bash
   cd -
   ```

**3. `mkdir` – Create New Directories**

To create a folder in your shell, you can use the `mkdir` command. Simply specify the name of your new folder, ensure it doesn't already exist, and you're good to go.

**Syntax:**

```bash
mkdir [options] <directory>
```

This will create a directory named "newproject" in your current working directory.

**Some useful `mkdir` options:**

- `-p` – Creates parent directories as needed, recursively.
- `-v` – Displays verbose output of directories being created.

For example, to create a directory to store all your images, simply type:

```bash
mkdir images/
```

To create subdirectories with a single command, use the parent (`-p`) flag:

```bash
mkdir -p movies/2004/
```

**4. `rmdir` – Remove Directories**

To remove an empty directory, use the `rmdir` command. Please note that `rmdir` can only delete empty directories; we need to use the `rm` command to remove non-empty directories.

**Syntax:**

```bash
rmdir [options] <directory>
```

**Some options for `rmdir` include:**

- `-v` – Verbose output when deleting directories.
- `-p` – Recursively removes parent directories as needed.

For example:

```bash
rmdir -v ~/project/code
```

This will remove the "code" subdirectory under "project" while displaying detailed output.

**5. `touch` – Create New Empty Files**

The `touch` command allows you to update the access and modification times of a specified file.

**Syntax:**

```bash
touch [options] filename
```

**Some useful `touch` options include:**

- `-c` – Does not create the file if it already exists. This prevents accidental overwriting of existing files.
- `-m` – Updates only the modification timestamp of an existing file, rather than creating a new one. This can be used to change the modification time.

To change its modification date to the current time, we need to use the `-m` flag:

```bash
touch -m old_file
```

Nevertheless, most of the time, you won't use `touch` to modify file dates, but rather to create new empty files:

```bash
touch new_file_name
```

**6. `cp` – Copy Files and Directories**

Copying files and folders directly on the Linux terminal is incredibly easy, and sometimes it can even replace traditional file managers.

**Syntax:**

```bash
cp [options] source destination
```

**Some useful `cp` options:**

- `-r` – Recursively copies directories, descending into subdirectories while copying their contents. This is mandatory when copying directories.
- `-i` – Prompts before overwriting any existing files at the destination. It prevents accidental data loss.
- `-v` – Displays verbose output of each file during the copy process. Helpful for confirming exactly what was copied.

To use the `cp` command, simply type it along with the source and destination files:

```bash
cp file_to_copy.txt new_file.txt
```

You can also copy entire directories using the recursive flag:

```bash
cp -r dir_to_copy/ new_copy_dir/
```

Remember that in Linux, folders end with a forward slash (`/`).

**7. `mv` – Move or Rename Files and Directories**

You can use the `mv` command to move (or rename) files and directories within your file system.

**Syntax:**

```bash
mv [options] source destination
```

**Useful `mv` options:**

- `-i` – Prompts before overwriting any existing files at the destination. This prevents accidental data loss.
- `-v` – When moving files or directories, generates verbose output showing each file or directory. This helps confirm precisely what was moved.

To use this command, type its name along with the source and destination files:

```bash
mv source_file destination_folder/
```

```bash
mv command_list.txt commands/
```

To use absolute paths, use:

```bash
mv /home/wbolt/BestMoviesOfAllTime ./
```

...where `./` is your current directory.

You can also use `mv` to rename a file while keeping it in the same directory:

```bash
mv old_file.txt new_named_file.txt
```

**8. `rm` – Remove Files and Directories**

Now that you know how to copy files, it will be helpful to understand how to delete them.

You can use the `rm` command to delete files and directories. But be cautious when using it, as recovering deleted files with this method is extremely difficult (though not impossible).

**Syntax:**

```bash
rm [options] name
```

**Useful `rm` options:**

- `-r` – Recursively deletes directories, including all their contents. This is necessary when deleting directories.
- `-f` – Forces deletion and suppresses all confirmation prompts. This is a dangerous command, as files cannot be recovered once deleted\!
- `-i` – Prompts for confirmation before deleting each file or directory, to prevent accidental deletion.

To delete a regular file, type:

```bash
rm file_to_copy.txt
```

If you want to delete an empty directory, you can use the recursive (`-r`) flag:

```bash
rm -r dir_to_remove/
```

On the other hand, to delete a directory containing content, you'll need to use both the force (`-f`) and recursive flags:

```bash
rm -rf dir_with_content_to_remove/
```

**Warning:** Misusing these two flags could wipe out an entire day's work\!

**9. `find` – Search for Files in a Directory Hierarchy**

The `find` command recursively searches directories for files that match given criteria.

**Syntax:**

```bash
find [path] [criteria]
```

**Some useful `find` criteria options include:**

- `-type f` – Searches only for regular files, omitting directories.
- `-mtime +30` – Searches for files modified more than 30 days ago.
- `-user jane` – Searches for files owned by the user "jane."

**Example:**

```bash
find . -type f -mtime +30
```

This will find all regular files older than 30 days within the current directory (represented by a dot). The `find` command allows searching for files based on a variety of advanced criteria such as name, size, permissions, timestamps, ownership, and more.

**10. `du` – Estimate File Space Usage**
The `du` command is used to measure file space usage for specified directories. When run without options, it displays the disk usage of the current working directory.

**Syntax:**

```bash
du [options] [path]
```

**Practical `du` options:**

- `-h` – Displays file sizes in a human-readable format, like K for kilobytes, instead of byte counts. This makes it easier to parse.
- `-s` – Shows only the total size for a directory, rather than listing each subdirectory and file. Ideal for summarization.
- `-a` – Displays the size of individual files in addition to the total. Helps identify large files.

**Example:**

```bash
du -sh pictures
```

This will print the total size of the "pictures" directory in a user-friendly format. The `du` command is helpful for analyzing disk usage of directory trees and identifying files that are consuming excessive space.

**Linux Search and Filter Commands**
Now, let's explore commands that allow you to search, filter, and process text directly within the Linux command line.

**11. `grep` Command – Search Text with Conditional Matching**

`grep` is one of the most powerful tools for working with text files.

**Syntax:**

```bash
grep [options] pattern [files]
```

**Some useful `grep` options:**

- `-i` – Ignores case distinctions in the condition.
- `-R` – Recursively searches subdirectories.
- `-c` – Prints only the count of matching lines.
- `-v` – Inverts the match, printing lines that do not match.

It searches for lines that match a regular expression and prints them. For example, the command below will search for the word "linux" in the `long.txt` file, ignoring case sensitivity.

```bash
grep "linux" long.txt
```

You can use the `-c` flag to count the number of times a given condition matches:

```bash
grep -c "linux" long.txt
# 2
```

**12. `awk` – Conditional Scanning and Processing Language**

The `awk` command allows for more advanced text processing based on specified conditions and actions. It operates line by line, splitting each line into fields.

**Syntax:**

```bash
awk 'pattern { action }' input-file
```

**Example:**

```bash
awk '/error/ {print $1}' /var/log/syslog
```

This will print the first field of any line containing "error." `awk` can also use built-in variables like `NR` (number of records) and `NF` (number of fields).

**`awk`'s advanced features include:**

- Field mathematical calculations
- Conditional statements
- Built-in functions for string, number, and date processing
- Output format control

`awk` is incredibly powerful because it is a standalone programming language, and as a Linux command, it gives you a lot of control.

**13. `sed` – Stream Editor for Filtering and Transforming Text**

The `sed` command allows for filtering and transforming text. It can perform search/replace, deletion, shifting, and other operations. However, unlike `awk`, `sed` is designed for line-by-line editing based on instructions.

**Syntax:**

```bash
sed options 'commands' input-file
```

**Example:**

```bash
sed 's/foo/bar/' file.txt
```

This will replace "foo" with "bar" in `file.txt`.

**Some useful `sed` commands:**

- `s` – Search and replace text
- `/pattern/d` – Deletes lines matching a pattern
- `10,20d` – Deletes lines 10-20
- `1,3!d` – Deletes all lines except 1-3

`sed` is perfect for bulk find/replace operations, selective line deletion, and other text stream editing tasks.

**14. `sort` – Sort Lines of Text Files**

When you're dealing with large amounts of text or data, or even a lot of content outputted from other commands, sorting is a great way to make things manageable. The `sort` command will sort lines of text files alphabetically or numerically.

**Syntax:**

```bash
sort [options] [file]
```

**Useful `sort` options:**

- `-n` – Sorts numerically instead of alphabetically.
- `-r` – Reverses the sort order.
- `-k` – Sorts based on a specific field or column.

**Example:**

```bash
sort -n grades.txt
```

This will numerically sort the contents of `grades.txt`. Sorting facilitates ordering file contents, making output or analysis more readable.

**15. `uniq` – Report or Omit Duplicate Lines**

The `uniq` command filters out duplicate adjacent lines from input. This command is often used in conjunction with the `sort` command.

**Syntax:**

```bash
uniq [options] [input]
```

**Options:**

- `-c` – Prefixes unique lines with their occurrence count.
- `-d` – Shows only duplicate lines, not unique ones.

**Example:**

```bash
sort data.txt | uniq
```

This will remove any duplicate lines from `data.txt` after sorting. `uniq` gives you control over filtering duplicate text.

**16. `diff` – Compare Files Line by Line**
The `diff` command compares two files line by line and prints the differences. It's commonly used to show changes between file versions.

**Syntax:**

```bash
diff [options] file1 file2
```

**Options:**

- `-b` – Ignores changes in whitespace.
- `-B` – Shows differences within lines, highlighting changes.
- `-u` – Outputs differences with three lines of context.

**Example:**

```bash
diff original.txt updated.txt
```

This will output the differing lines between `original.txt` and `updated.txt`. `diff` is incredibly useful for comparing text files and revisions of source code.

**17. `wc` – Print Newline, Word, and Byte Counts**
The `wc` (word count) command prints the number of newlines, words, and bytes in a file.

**Syntax:**

```bash
wc [options] [file]
```

**Options:**

- `-l` – Prints only the line count.
- `-w` – Prints only the word count.
- `-c` – Prints only the byte count.

**Example:**

```bash
wc report.txt
```

This command will print the newline, word, and byte counts in `report.txt`.

**Linux Redirection Commands**
Redirection commands are used to control input and output sources in Linux, allowing you to send and append output streams to files, take input from files, connect multiple commands, and split output to multiple destinations.

**18. `>` – Redirect Standard Output**
The redirection operator `>` redirects a command's standard output stream to a file instead of printing it to the terminal. Any existing content in the file will be overwritten.

**Example:**

```bash
ls -l /home > homelist.txt
```

This will execute `ls -l`, listing the contents of the `/home` directory. The `>` symbol will then capture the standard output and write it to `homelist.txt`, overwriting existing file content, rather than printing the output to the terminal. Redirecting standard output is useful for saving command results to files for storage, debugging, or chaining commands together.

**19. `>>` – Append Standard Output**
The `>>` operator appends a command's standard output to a file without overwriting existing content.

**Example:**

```bash
tail /var/log/syslog >> logfile.txt
```

This will append the last 10 lines of the syslog log file to the end of `logfile.txt`. Unlike `>`, `>>` adds output without erasing the current contents of `logfile.txt`. Appending is helpful for collecting command output in one place without losing existing data.

**20. `<` – Redirect Standard Input**
The `<` redirection operator feeds file content as standard input into a command, rather than taking input from the keyboard.

**Example:**

```bash
wc -l < myfile.txt
```

This command sends the content of `myfile.txt` as input to the `wc` command, which will then count the lines in that file instead of waiting for keyboard input. Redirecting input is very useful for batch processing files and automating workflows.

**21. `|` – Pipe Output to Another Command**
The pipe `|` operator sends the output of one command as input to another, chaining them together.

**Example:**

```bash
ls -l | less
```

This command pipes the output of `ls -l` into the `less` command, allowing you to scroll through the file listing. Piping is commonly used to chain commands where the output of one command informs the input of another. This allows for building complex operations from smaller, single-purpose programs.

**22. `tee` – Read from Standard Input and Write to Standard Output and Files**
The `tee` command splits standard input into two streams. It writes the input to standard output (displaying the main command's output) while simultaneously saving a copy to a file.

**Example:**

```bash
cat file.txt | tee copy.txt
```

This will display the contents of `file.txt` to the terminal while also writing it to `copy.txt`. `tee` differs from redirection in that with redirection, you would only see the output if you opened the file it was redirected to.

**Linux Archiving Commands**
Archiving commands allow you to bundle multiple files and directories into compressed archive files for easy portability and storage. Common archive formats in Linux include `.tar`, `.gz`, and `.zip`.

**23. `tar` – Store and Extract Files from Archive Files**
The `tar` command helps you work with tape archive files (`.tar`). It can help you bundle multiple files and directories into a single, compressed `.tar` file.

**Syntax:**

```bash
tar [options] filename
```

**Useful `tar` options:**

- `-c` – Creates a new `.tar` archive.
- `-x` – Extracts files from a `.tar` archive.
- `-f` – Specifies the archive filename, rather than stdin/stdout.
- `-v` – Displays verbose output of the archiving process.
- `-z` – Uses `gzip` compression or decompression for the archive.

**Example:**

```bash
tar -cvzf images.tar.gz /home/user/images
```

This creates a gzip-compressed archive named `images.tar.gz` containing the `/home/user/images` folder.

**24. `gzip` – Compress or Expand Files**
The `gzip` command compresses files using LZ77 encoding to reduce their size for storage or transmission. With `gzip`, you can work with `.gz` files.

**Syntax:**

```bash
gzip [options] filename
```

**Useful `gzip` options:**

- `-c` – Writes output to stdout, rather than a file.
- `-d` – Decompresses files, rather than compressing them.
- `-r` – Recursively compresses directories.

**Example:**

```bash
gzip -cr documents/
```

The command above recursively compresses the `documents` folder and outputs to stdout.

**25. `gunzip` – Decompress Files**
The `gunzip` command is used to decompress `.gz` files.

**Syntax:**

```bash
gunzip filename.gz
```

**Example:**

```bash
gunzip documents.tar.gz
```

The command above will extract the uncompressed contents of `documents.tar.gz`.

**26. `zip` – Package and Compress Files**
The `zip` command is used to create `.zip` archives containing compressed file contents.

**Syntax:**

```bash
zip [options] archive.zip filenames
```

**Useful `zip` options:**

- `-r` – Recursively compresses a directory.
- `-e` – Encrypts content with a password.

**Example:**

```bash
zip -re images.zip pictures
```

This encrypts and compresses the `pictures` folder into `images.zip`.

**27. `unzip` – Extract Files from ZIP Archives**
Similar to `gunzip`, the `unzip` command extracts and decompresses files from `.zip` archives. The `unzip` command allows you to extract the contents of `.zip` files directly from your terminal. Again, this package might not be installed by default, so be sure to read more about it on its download page.

**Syntax:**

```bash
unzip archive.zip
```

**Example:**

```bash
unzip images.zip
```

The example command above extracts all files from `images.zip` into the current directory.

**Linux File Transfer Commands**
File transfer commands allow you to move files between systems over a network. This is useful for copying files to remote servers or downloading content from the internet.

**28. `scp` – Securely Copy Files Between Hosts**
The `scp` (secure copy) command copies files between hosts over an SSH connection. All data transfer is encrypted to ensure security.

The `scp` syntax copies a file from a source path to a destination defined as `user@host`:

```bash
scp source user@host:destination
```

**Example:**

```bash
scp image.jpg user@server:/uploads/
```

This copies `image.jpg` as `user` to the `/uploads/` folder on `server`. `scp` works similarly to the `cp` command but is used for remote file transfers. It leverages SSH (Secure Shell) for data transfer, providing encryption capabilities to ensure sensitive data like passwords are not exposed over the network. Authentication typically uses SSH keys, but passwords can also be used. Files can be copied both to and from a remote host.

**29. `rsync` – Synchronize Files Between Hosts**
The `rsync` tool synchronizes files between two locations while minimizing data transfer using delta encoding. This makes synchronizing large directory trees much faster.

The `rsync` syntax synchronizes source files to a destination:

```bash
rsync [options] source destination
```

**Example:**

```bash
rsync -ahv ~/documents user@server:/backups/
```

The example command above recursively synchronizes the `documents` folder to `server:/backups/` and displays verbose, human-readable output.

**Useful `rsync` options:**

- `-a` – Archive mode: recursively synchronizes and preserves permissions, times, etc.
- `-h` – Human-readable output.
- `-v` – Verbose output.

`rsync` is an ideal tool for synchronizing files and folders to remote systems and maintaining decentralized backups and security.

**30. `sftp` – Secure File Transfer Program**
The `sftp` program provides interactive file transfer over SSH, similar to regular FTP but encrypted. It can transfer files between remote systems.

`sftp` connects to a host and then accepts commands like:

```bash
sftp user@host
get remotefile localfile
put localfile remotefile
```

This allows you to fetch `remotefile` from the server and copy `localfile` to the remote host. `sftp` has an interactive shell for browsing remote file systems, transferring files and directories, and managing permissions and attributes.

**31. `wget` Command – Retrieve Files from the Web**
`wget` (World Wide Web get) is a utility for retrieving content from the internet. It has one of the largest sets of flags.

**Useful `wget` options:**

- `-c` – Resumes interrupted downloads.
- `-r` – Recursively downloads.
- `-O` – Saves to a specific filename.

`wget` is ideal for writing automated download scripts and mirroring websites.

Here's how you can fetch a Python file from GitHub:

```bash
wget https://raw.githubusercontent.com/DaniDiazTech/Object-Oriented-Programming-in-Python/main/object_oriented_programming/cookies.py
```

**32. `curl` – Transfer Data From or To a Server**
The `curl` command transfers data to and from network servers using supported protocols. This includes REST, HTTP, FTP, and more.

**Example:**

```bash
curl -L https://example.com
```

The command above fetches data from an HTTPS URL and outputs it.

**Useful `curl` options:**

- `-o` – Writes output to a file.
- `-I` – Shows only response headers.
- `-L` – Follows redirects.

`curl` is designed for programmatically transferring data across networks.

**Linux File Permissions Commands**
File permission commands allow you to modify user access rights. This includes setting read/write/execute permissions, changing ownership, and default file modes.

**33. `chmod` Command – Change File Mode or Access Permissions**
The `chmod` command allows you to quickly change a file's mode (permissions). It has many available options.

**Basic file permissions include:**

- `r` (read-only)
- `w` (write)
- `x` (execute)

There are three sets of permissions – user, group, and public. Permissions are set using an octal (numeric) mode from 0 to 7:

- `7` – Read, write, and execute.
- `6` – Read and write.
- `4` – Read-only.
- `0` – No permissions.

This sets owner permissions to 7 (rwx), group permissions to 5 (r-x), and public permissions to 5 (r-x). You can also refer to users and groups symbolically:

```bash
chmod g+w file.txt
```

The `g+w` syntax adds group write permission to a file. Setting appropriate file and directory permissions is crucial for Linux security and access control.

One of the most common use cases for `chmod` is to make a file executable by a user. To do this, type `chmod` and the flag `+x`, followed by the file whose permissions you want to modify:

```bash
chmod +x script
```

You can use this to make scripts executable, allowing you to run them directly using the `./` symbol.

**34. `chown` – Change File Owner and Group**
The `chown` command changes the ownership of a file or directory. Ownership consists of two parts – the owner user and the owning group.

**Example:**

```bash
chown john:developers file.txt
```

The example command above sets the owner user to "john" and the owner group to "developers." Only the root superuser account can change file owners using `chown`. It can modify owners and groups as needed to resolve permission issues.

**35. `umask` – Set Default File Permissions**
The `umask` command controls the default permissions given to newly created files. It takes an octal mask as input, which is subtracted from 666 for files and 777 for directories.

**Example:**

```bash
umask 007
```

New files will have default permissions of 750 instead of 666, and new directories will have 700 instead of 777. Setting `umask` allows you to configure default file permissions rather than relying on system defaults. The `umask` command is useful for restricting permissions on new files without requiring someone to manually add restrictions.

**Linux Process Management Commands**
These commands allow you to view, monitor, and control running processes on your Linux system. This is useful for determining resource usage and stopping misbehaving programs.

**36. `ps` – Report Current Processes Overview**
Using `ps`, you can view the processes currently running in your shell session. It prints useful information about running programs, such as Process ID, TTY (teletypewriter), time, and command name.

```bash
ps
```

**Example:**

```bash
ps aux
```

This will display every process running as all users, along with other details like CPU and memory usage.

**Some useful `ps` options:**

- `aux` – Shows processes for all users.
- `--forest` – Displays parent/child process trees.

`ps` gives you a snapshot of processes currently running on your system. If you want something more interactive, you can use `htop`.

**37. `top` – Display Linux Processes**
The `top` command displays real-time Linux process information, including PID, user, CPU %, memory usage, uptime, and more. Unlike `ps`, it dynamically updates the display to reflect current usage.

**Example:**

```bash
top -u mysql
```

The command above monitors only processes for the "mysql" user. It's helpful for identifying resource-intensive programs.

**38. `htop` – Interactive Process Viewer**
`htop` is an interactive process viewer that allows you to manage your computer's resources directly from the terminal. In most cases, it's not installed by default, so be sure to read more about it on its download page.

```bash
htop
```

Simply type `htop` in your command line to view processes. Compared to `top`, `htop` has enhanced user interface elements, adding color, scrolling, and mouse support for easier navigation. It's excellent for investigating processes.

**39. `kill` – Send Signals to Processes**
It's annoying when a program isn't responding, and you can't close it by any means. Fortunately, the `kill` command solves these kinds of problems. Simply put, `kill` sends a TERM or kill signal to the process, terminating it.

You can terminate processes by typing their PID (Process ID) or the program's binary name:

```bash
kill 533494
```

```bash
kill firefox
```

Another example:

```bash
kill -15 12345
```

The command above sends the `SIGTERM (15)` signal to gracefully stop the process with PID 12345. Be careful when using this command – you might accidentally delete work you're performing when using `kill`\!

**40. `pkill` – Send Signals to Processes by Name**
The `pkill` command kills processes by name rather than PID. This is easier than finding the PID first.

**Example:**

```bash
pkill -9 firefox
```

This will force-stop all Firefox processes with `SIGKILL (9)`. `pkill` targets processes by matching names, users, and other criteria instead of PIDs.

**41. `nohup` – Run Commands Immune to Hangup**
The `nohup` command runs processes immune to hangups, so they continue running even if you log out or disconnect.

**Example:**

```bash
nohup python script.py &
```

The example command above starts a detached `script.py` in the background, and it will not be affected by hangups. `nohup` is commonly used to start persistent background daemons and services.

**Linux Performance Monitoring Commands**
These commands provide valuable system performance statistics, helping to analyze resource utilization, identify bottlenecks, and optimize efficiency.

**42. `vmstat` – Report Virtual Memory Statistics**
The `vmstat` command prints detailed reports on memory, swap, I/O, and CPU activity. This includes metrics like used/free memory, swap in/out, disk blocks read/written, and CPU process/idle times.

**Example:**

```bash
vmstat 5
```

**Other useful `vmstat` options:**

- `-a` – Displays active and inactive memory.
- `-s` – Shows event counters and memory statistics.
- `-S` – Outputs in KB instead of blocks.
- `5` – Refreshes the output every 5 seconds.

The example above outputs memory and CPU data every 5 seconds until interrupted, which is very useful for monitoring real-time system performance.

**43. `iostat` – Report CPU and I/O Statistics**
The `iostat` command monitors and displays CPU utilization and disk I/O metrics. This includes CPU load, IOPS, read/write throughput, and more.

**Example:**

```bash
iostat -d -p sda 5
```

**Some `iostat` options:**

- `-c` – Displays CPU utilization information.
- `-t` – Prints a timestamp for each report.
- `-x` – Displays extended statistics like service time and wait counts.
- `-d` – Displays detailed statistics for each disk/partition rather than aggregated totals.
- `-p` – Displays statistics for specific disk devices.

The command above displays detailed I/O statistics for each device on `sda` every 5 seconds. `iostat` helps analyze disk subsystem performance and identify hardware bottlenecks.

**44. `free` – Display Amount of Free and Used Memory**
The `free` command displays the total, used, and free amounts of physical and swap memory in the system. This provides an overall picture of available memory.

**Example:**

```bash
free -h
```

**Some options for the `free` command:**

- `-b` – Displays output in bytes.
- `-k` – Displays output in KB (kilobytes) instead of default bytes.
- `-m` – Displays output in MB (megabytes) instead of bytes.
- `-h` – Prints statistics in human-readable format like GB, MB, etc., instead of bytes.

This prints memory statistics in a human-readable format (GB, MB, etc.). It's very useful when you want a quick overview of your memory capacity.

**45. `df` – Report File System Disk Space Usage**
The `df` command displays the disk space usage of file systems. It shows the file system name, total/used/available space, and capacity.

**Example:**

```bash
df -h
```

The command above will print disk utilization in a human-readable format. You can also run the command without arguments to get the same data in block size.

**46. `sar` – Collect and Report System Activity**
The `sar` tool collects and records system activity information over time for CPU, memory, I/O, network, and more. Analyzing this data can reveal performance issues.

**Example:**

```bash
sar -u 5 60
```

This samples CPU utilization every 5 seconds for 60 iterations. `sar` provides detailed historical system performance data that real-time tools cannot.

**Linux User Management Commands**
When working with multi-user systems, you'll likely need commands to help you manage users and groups to control access rights. Let's explore these commands.

**47. `useradd` – Create New Users**
The `useradd` command is used to create new user accounts and home directories. It sets up the new user's UID, group, shell, and other defaults.

**Example:**

```bash
useradd -m john
```

**Useful `useradd` options:**

- `-m` – Creates the user's home directory.
- `-g` – Specifies the primary group instead of the default.
- `-s` – Sets the user's login shell.

The command above will create a new user "john" with a username and home directory at `/home/john`.

**48. `usermod` – Modify User Accounts**
The `usermod` command can modify settings for existing user accounts. This can change usernames, home directories, shells, groups, expiration dates, and more.

**Example:**

```bash
usermod -a developers john
```

With this command, you can add the user `john` to an additional group – "developers." The `-a` flag appends to the existing list of groups the user is added to.

**49. `userdel` – Delete User Accounts**
The `userdel` command is used to delete user accounts, home directories, and mail spools.

**Example:**

```bash
userdel -rf john
```

**Useful `userdel` options:**

- `-r` – Removes the user's home directory and mail spool.
- `-f` – Forces deletion even if the user is still logged in.

This will force delete the user "john" and remove associated files. Specifying options like `-r` and `-f` in `userdel` ensures a complete removal of the user account, even if the user is still logged in or has active processes.

**50. `groupadd` – Add a Group**
The `groupadd` command is used to create a new user group. Groups represent teams or roles in terms of permissions.

**Example:**

```bash
groupadd -r sysadmin
```

**Useful `groupadd` options:**

- `-r` – Creates a system group for core system functions.
- `-g` – Specifies the GID for the new group instead of using the next available GID.

The command above creates a new "sysadmin" group with system privileges. When creating new groups, `-r` or `-g` can help set them up correctly.

**51. `passwd` – Update User's Authentication Tokens**
`passwd` allows you to change the password for a user account. First, it will prompt you for your current password, then ask for a new password and confirmation. It's similar to any other password change you've seen elsewhere, but in this case, it's directly in your terminal:

```bash
passwd
```

**Example:**

```bash
passwd john
```

This will prompt the user "john" to interactively enter a new password. If you lose the password for an account, you can log into Linux with `sudo` or `su` privileges and modify the password the same way. Be careful when using it – you might accidentally mix up user passwords\!

**Linux Network Commands**
These commands are used for monitoring connections, troubleshooting networks, routing, DNS queries, and interface configuration.

**52. `ping` – Send ICMP ECHO_REQUEST to Network Hosts**
`ping` is one of the most popular network terminal tools for testing network connectivity. `ping` has many options, but in most cases, you'll use it to request a domain or IP address:

```bash
ping google.com
```

```bash
PING google.com (142.251.42.78): 56 data bytes
64 bytes from 142.251.42.78: icmp_seq=0 ttl=112 time=8.590 ms
64 bytes from 142.251.42.78: icmp_seq=1 ttl=112 time=12.486 ms
64 bytes from 142.251.42.78: icmp_seq=2 ttl=112 time=12.085 ms
64 bytes from 142.251.42.78: icmp_seq=3 ttl=112 time=10.866 ms
--- google.com ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 8.590/11.007/12.486/1.518 ms
```

**Useful `ping` options:**

- `-c [count]` – Limits the number of packets sent.
- `-i [interval]` – Seconds to wait between pings.

Using the command above, you can ping `google.com` and output round-trip statistics showing connectivity and latency. Generally, the `ping` command is used to check if the system you are trying to connect to is present and connected to the network.

**53. `ifconfig` – Configure Network Interfaces**
The `ifconfig` command displays and configures network interface settings, including IP addresses, netmasks, broadcast, MTU, and hardware MAC addresses.

**Example:**

```bash
ifconfig
```

```bash
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255
        inet6 fe80::a00:27ff:fe1e:ef1d  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:1e:ef:1d  txqueuelen 1000  (Ethernet)
        RX packets 23955654  bytes 16426961213 (15.3 GiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 12432322  bytes 8710937057 (8.1 GiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

Running `ifconfig` without other arguments will display a list of all available network interfaces, along with IP and other network information. `ifconfig` can also be used to set addresses, enable/disable interfaces, and change options.

**54. `netstat` – Network Statistics**
The `netstat` command can display network connections, routing tables, interface statistics, masquerade connections, and multicast membership information.

**Example:**

```bash
netstat -pt tcp
```

This command will output all active TCP connections and the processes using them.

**55. `ss` – Socket Statistics**
The `ss` command will dump socket statistics similar to `netstat`. It can show open TCP and UDP sockets, send/receive buffer sizes, and more.

**Example:**

```bash
ss -t -a
```

This prints all open TCP sockets. It's more efficient than `netstat`.

**56. `traceroute` – Trace Route to Host**
The `traceroute` command prints the path that packets take to a network host, showing each hop and transmission time along the way. Useful for network debugging.

**Example:**

```bash
traceroute google.com
```

This traces the path to `google.com` and outputs each network jump.

**57. `dig` – DNS Lookup**
The `dig` command performs DNS lookups and returns DNS record information for a domain.

**Example:**

```bash
dig google.com
```

```bash
; <<>> DiG 9.10.6 <<>> google.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 60290
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1
;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1280
;; QUESTION SECTION:
;google.com.                    IN      A

;; ANSWER SECTION:
google.com.             220     IN      A       142.251.42.78

;; Query time: 6 msec
;; SERVER: 2405:201:2:e17b::c0a8:1d01#53(2405:201:2:e17b::c0a8:1d01)
;; WHEN: Wed Nov 15 01:36:16 IST 2023
;; MSG SIZE  rcvd: 55
```

It queries DNS servers for records related to `google.com` and prints detailed information.

**58. `nslookup` – Interactively Query DNS Servers**
The `nslookup` command interactively queries DNS servers to perform name resolution queries or display DNS records. It enters an interactive shell that allows you to manually query hostnames, reverse IP addresses, look up DNS record types, and more.

For example, some common `nslookup` usages. Type `nslookup` in your command line:

```bash
nslookup
```

Next, we'll set the Google 8.8.8.8 DNS server for queries.

```bash
> server 8.8.8.8
```

Now, let's query the A record for `stackoverflow.com` to find its IP address.

```bash
> set type=A
> stackoverflow.com
Server:         8.8.8.8
Address:        8.8.8.8#53

Non-authoritative answer:
Name:   stackoverflow.com
Address: 104.18.32.7
Name:   stackoverflow.com
Address: 172.64.155.249
```

Now, let's look up the MX records for `github.com` to see its mail servers.

```bash
> set type=MX
> github.com
Server:         8.8.8.8
Address:        8.8.8.8#53

Non-authoritative answer:
github.com mail exchanger = 1 aspmx.l.google.com.
github.com mail exchanger = 5 alt1.aspmx.l.google.com.
github.com mail exchanger = 5 alt2.aspmx.l.google.com.
github.com mail exchanger = 10 alt3.aspmx.l.google.com.
github.com mail exchanger = 10 alt4.aspmx.l.google.com.
```

Interactive querying makes `nslookup` very useful for exploring DNS and troubleshooting name resolution issues.

**59. `iptables` – IPv4 Packet Filtering and NAT**
The `iptables` command allows you to configure Linux netfilter firewall rules to filter and process network packets. It sets policies and rules for how the system handles different types of inbound and outbound connections and traffic.

**Example:**

```bash
iptables -A INPUT -s 192.168.1.10 -j DROP
```

The command above will block all input from IP `192.168.1.10`. `iptables` provides powerful control over the Linux kernel firewall for routing, NAT, packet filtering, and other traffic control. It's an essential tool for securing Linux servers.

**60. `ip` – Manage Network Devices and Routing**
The `ip` command allows you to manage and monitor various network device-related activities, such as assigning IP addresses, setting subnets, displaying link details, and configuring routing options.

**Example:**

```bash
ip link show
```

```bash
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 08:00:27:8a:5c:04 brd ff:ff:ff:ff:ff:ff
```

The command above displays all network interfaces, their status, and other information. This command is intended to replace `ifconfig` with more modern Linux network management capabilities. `ip` can control network devices, routing tables, and other network protocol stack settings.

**Linux Package Management Commands**
Package managers allow for easy installation, updating, and removal of software on Linux distributions. Common package managers include APT, YUM, DNF, Pacman, and Zypper.

**61. `apt` – Debian/Ubuntu Package Manager**
The `apt` command manages packages on Debian/Ubuntu systems using APT software repositories. It allows for installing, updating, and removing packages.

**Examples:**

```bash
apt update
```

This command fetches the latest package versions and metadata from the software repositories.

```bash
apt install nginx
```

The command above installs the `nginx` package from the configured APT sources.

```bash
apt upgrade
```

This command upgrades packages and dependencies to newer versions. `apt` makes installing software simpler by fetching packages from software sources.

**62. `pacman` – Arch Linux Package Manager**
`pacman` manages packages on Arch Linux from the Arch User Repository. It can install, upgrade, and remove packages.

**Examples:**

```bash
pacman -S nmap
```

Installs the `nmap` package from the configured software sources.

```bash
pacman -Syu
```

Synchronizes with software sources and upgrades all packages. `pacman` keeps Arch Linux up-to-date and allows for easy package management.

**63. `dnf` – Fedora Package Manager**
`dnf` installs, updates, and removes packages on Fedora Linux distributions using RPM packages. It replaces Yum as the next-generation package manager.

**Examples:**

```bash
dnf install util-linux
```

Installs the `util-linux` package.

```bash
dnf upgrade
```

Upgrades all installed packages to their latest versions. `dnf` makes Fedora package management fast and efficient.

**64. `yum` – Red Hat Package Manager**
`yum` manages packages on RHEL and CentOS Linux distributions using RPM packages. It fetches packages from Yum repositories for installation and updates.

**Examples:**

```bash
yum update
```

Updates all installed packages to their latest versions.

```bash
yum install httpd
```

The command above installs the Apache `httpd` package. `yum` is the primary package manager for keeping Red Hat distributions updated.

**65. `zypper` – OpenSUSE Package Manager**
`zypper` manages packages on SUSE/openSUSE Linux. It can add software sources, search, install, and upgrade packages.

**Examples:**

```bash
zypper refresh
```

`zypper`'s refresh command refreshes the metadata for added software sources.

```bash
zypper install python
```

This command installs the Python package from the configured software sources. `zypper` makes package management on SUSE/openSUSE systems easy and efficient.

**66. `flatpak` – Flatpak Application Package Manager**
The `flatpak` command helps you manage Flatpak applications and runtimes. `flatpak` allows sandboxed desktop applications to be distributed on Linux.

**Example:**

```bash
flatpak install flathub org.libreoffice.LibreOffice
```

For example, the command above will install LibreOffice from the Flathub software source.

```bash
flatpak run org.libreoffice.LibreOffice
```

This launches the sandboxed LibreOffice Flatpak application. `flatpak` provides a centralized, cross-distribution Linux application repository, so you're no longer limited to packages in specific distribution package libraries.

**67. `appimage` – AppImage Application Package Manager**
AppImage packages are standalone applications that run on most Linux distributions. The `appimage` command can run existing AppImages.

**Examples:**

```bash
chmod +x myapp.AppImage
./myapp.AppImage
```

This allows you to directly run the AppImage binary. `AppImage` enables the deployment of applications without full system installation. Think of an AppImage as a small container that includes all files, allowing the application to run without too many external dependencies.

**68. `snap` – Snappy Application Package Manager**
The `snap` command manages packages encapsulated as Snaps. Snaps are similar to Flatpak, automatically updating and running across Linux distributions.

**Examples:**

```bash
snap install vlc
```

This simple command installs the VLC media player snap.

```bash
snap run vlc
```

Once installed, you can use the command above to run packages installed via `snap`. Snaps decouple applications from the base system for portability and allow for cleaner installations.

**Linux System Information Commands**
These commands allow you to view detailed information about your Linux system's hardware, kernel, distribution, hostname, uptime, and more.

**69. `uname` – Print System Information**
The `uname` command can print detailed information about your Linux system's kernel, hardware architecture, hostname, and operating system. This includes version numbers and machine information.

`uname` (short for Unix name) prints actionable system information that is convenient when you know your current Linux version. Most of the time, you will use the `-a` (`--all`) flag, as the default output is not as useful:

```bash
uname
# Linux
uname -a
# Linux wboltmanjaro 5.4.138-1-MANJARO #1 SMP PREEMPT Thu Aug 5 12:15:21 UTC 2021 x86_64 GNU/Linux
```

**Example:**

```bash
uname -a
```

```bash
Linux hostname 5.4.0-48-generic x86_64 GNU/Linux
```

`uname` is very useful for querying these core system details. Some options include:

- `-a` – Prints all available system information.
- `-r` – Prints only the kernel version number.

The command above prints extended system information, including kernel name/version, hardware architecture, hostname, and operating system.

```bash
uname -r
```

This will print only the kernel version number. The `uname` command displays details about the core components of your Linux system.

**70. `hostname` – Show or Set System Hostname**
The `hostname` command will print or set the hostname identifier for your Linux system on a network. Without arguments, it displays the current hostname. Passing a name will update the hostname.

**Example:**

```bash
hostname
```

```bash
linuxserver
```

This will display the configured system hostname `linuxserver`.

```bash
hostname UbuntuServer
```

Hostnames identify systems on a network. `hostname` retrieves or configures the identifying name of a system on a network. The second command can help you change your local hostname to `UbuntuServer`.

**71. `uptime` – How Long the System Has Been Running**
The `uptime` command shows how long the Linux system has been running since its last reboot. It prints the uptime and current time.

Simply run the command below to get your system's uptime data:

```bash
uptime
```

```bash
23:51:26 up 2 days, 4:12, 1 user, load average: 0.00, 0.01, 0.05
```

This prints the system uptime, showing how long the system has been running since its last boot.

**72. `whoami` – Print Effective User ID**
The `whoami` command will print the effective username of the currently logged-in user on the system. It also shows your operational permission level.

This command (short for "who am I") shows the `whoami` username currently in use:

```bash
whoami
# wbolt
```

You can get the same result using `echo` and the `$USER` environment variable:

```bash
echo $USER
# wbolt
```

Type the command in your terminal to get the ID:

```bash
whoami
```

```bash
john
```

This will print the effective username under which the current user is logged in and operating, useful in scripts or diagnostics to identify the user account performing actions.

**73. `id` – Print Real and Effective User and Group IDs**
The `id` command prints detailed user and group information about the current user's effective IDs and names. This includes:

- Real user ID and name.
- Effective user ID and name.
- Real group ID and name.
- Effective group ID and name.

To use the `id` command, simply type:

```bash
id
```

```bash
uid=1000(john) gid=1000(john) groups=1000(john),10(wheel),998(developers)
```

The `id` command will print the real and effective user ID and group ID of the current user. The user and group details shown by `id` are useful for determining file access permissions.

**74. `lscpu` – Display CPU Architecture Information**
The `lscpu` command displays detailed CPU architecture information, including:

- Number of CPU cores
- Number of sockets
- Model name
- Cache size
- CPU frequency
- Address size

To use the `lscpu` command, simply type:

```bash
lscpu
```

```bash
Architecture:        x86_64
CPU op-mode(s):      32-bit, 64-bit
Byte Order:          Little Endian
CPU(s):              16
On-line CPU(s) list: 0-15
```

`lscpu` lists detailed CPU architecture, such as core count, sockets, model name, cache, and more.

**75. `lsblk` – List Block Devices**
The `lsblk` command lists information about all available block devices, including local disks, partitions, and logical volumes. The output includes device name, label, size, and mount point.

```bash
lsblk
```

```bash
NAME    MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINT
sda       8:0    0   1.8T  0 disk
|-sda1    8:1    0   512M  0 part  /boot
|-sda2    8:2    0    16M  0 part
`-sda5    8:5    0   1.8T  0 part
  `-lvm1 254:0    0   1.8T  0 lvm   /
```

`lsblk` lists all block devices, including disks, partitions, and logical volumes. It provides an overview of storage devices.

**76. `lsmod` – Show the Status of Linux Kernel Modules**
The `lsmod` command prints currently loaded kernel modules (like device drivers). This includes network, storage, and other hardware-related modules that the Linux kernel uses to connect internal and external devices.

```bash
lsmod
```

```bash
Module                  Size  Used by
ipv6                  406206  27
evdev                   17700  0
crct10dif_pclmul       16384  1
crc32_pclmul           16384  0
ghash_clmulni_intel    16384  0
aesni_intel           399871  0
aes_x86_64             20274  1 aesni_intel
```

As you can see, it lists currently loaded kernel modules (like device drivers). In this example, it shows network, input, encryption, and cryptographic module usage.

**77. `dmesg` – Print or Control the Kernel Ring Buffer**
The `dmesg` command dumps information from the kernel ring buffer. This includes important system events logged by the kernel during boot and runtime.

```bash
dmesg | grep -i error
```

```bash
[   12.345678] Error receiving batched read response: -110
[   23.456789] tplink_mdio 0000:03:00.0: Direct firmware load for tplink-mdio/leap_p8_v1_0.bin failed with error -2
[   40.567890] iwlwifi 0000:09:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-59.ucode failed with error -2
```

Searching for "error" shows issues encountered when loading specific firmware. This will print buffered kernel log messages, including system events like boot, errors, warnings, and more.

**Linux System Administration Commands**
System administrator commands help you run programs as other users, shut down or reboot the system, and manage init systems and services.

**78. `sudo` – Execute a Command as Another User**
The `sudo` command allows you to run commands as another user, typically the superuser. After entering the `sudo` command, you'll be prompted for your password for authentication. This provides elevated access for tasks like installing packages, editing system files, managing services, and more.

This command stands for "superuser do," and it allows you to act as the superuser or root user when running specific commands. This is how Linux protects itself from users accidentally modifying the machine's file system or installing inappropriate packages. `sudo` is commonly used to install software or edit files outside your user's home directory:

```bash
sudo apt install gimp
```

```bash
sudo cd /root/
```

Before running the command you typed, it will ask for your administrator password.

Another example:

```bash
sudo adduser bob
[sudo] password for john:
System user `bob' added.
```

This creates a new user "bob" using `sudo`. Without `sudo`, a regular user typically cannot add users.

**79. `su` – Change User ID or Become Superuser**
The `su` command allows you to switch to another user account, including the superuser. The password for the target user must be provided for authentication. This allows you to run commands directly within another user's environment.

**Example:**

```bash
su bob
Password:
bob@linux:~$
```

After entering `bob`'s password, the command switches the current user to user "bob." The shell prompt will reflect the new user.

**80. `shutdown` – Shut Down or Reboot Linux**
The `shutdown` command is used to shut down, halt, or reboot the system after a specified timer or immediately. To safely reboot or shut down a multi-user Linux system, this command is necessary.

As you might guess, the `shutdown` command allows you to power off your machine. However, it can also be used to halt and reboot it.

To immediately power off your computer (defaulting to one minute), type:

```bash
shutdown now
```

You can also schedule the system to shut down in 24-hour format:

```bash
shutdown 20:40
```

To cancel a previous `shutdown` call, you can use the `-c` flag:

```bash
shutdown -c
```

Another example:

```bash
shutdown -r now
```

```bash
Broadcast message from root@linux Fri 2023-01-20 18:12:37 CST:

The system is going down for reboot NOW!
```

This immediately reboots the system and broadcasts a warning to users.

**81. `reboot` – Reboot or Restart the System**
The `reboot` command restarts the Linux operating system, logging out all users and safely restarting the system. It synchronizes disks and cleanly shuts down before rebooting.

**Example:**

```bash
reboot
```

```bash
Restarting system.
```

`reboot` is a simpler alternative to `shutdown -r`.

**82. `systemctl` – Control the systemd System and Service Manager**
The `systemctl` command allows you to manage `systemd` services, such as starting, stopping, restarting, or reloading them. `systemd` is the newer init system used by most modern Linux distributions, replacing SysV init.

**Example:**

```bash
systemctl start apache2
```

```bash
==== AUTHENTICATING FOR org.freedesktop.systemd1.manage-units ===
Authentication is required to start 'apache2.service'.
Authenticating as: User Name
Password:
==== AUTHENTICATION COMPLETE ===
```

After authentication, the `apache2` service will start.

**83. `service` – Run System V Init Scripts**
The `service` command runs System V init scripts used to control services. This allows starting, stopping, restarting, and reloading services managed under traditional SysV init.

**Example:**

```bash
service iptables start
```

```bash
[ ok ] Starting iptables (via systemctl): iptables.service.
```

The command above started the `iptables` firewall service using its SysV init script.

## **More Linux Commands**

**84. `mount`** – Mounts or "connects" a hard drive to your system.
**85. `umount`** – Unmounts or "removes" a hard drive from your system.
**86. `xargs`** – Builds and executes command lines from standard input.
**87. `alias`** – Creates shortcuts for lengthy or complex commands. The `alias` command allows you to define temporary aliases within your shell session. When creating an alias, you instruct the shell to replace a word with a sequence of commands. For example, to set `ls` to color without typing the `--color` flag every time, you would use:

```bash
alias ls="ls --color=auto"
```

As you can see, the `alias` command takes a key-value pair argument: `alias NAME="VALUE"`. Note that the value must be enclosed in quotes. If you want to list all aliases in your shell session, you can run the `alias` command without arguments.

```bash
alias
```

**88. `jobs`** – Lists programs currently running as background tasks.
**89. `bg`** – Resumes stopped or paused background processes.
**90. `killall`** – Terminates processes by program name instead of PID.
**91. `history`** – Displays previously used commands in the current terminal session. If you're struggling to remember a command, `history` comes in handy. This command displays an enumerated list of commands you've used in the past:

```bash
history
```

**92. `man`** – Accesses a command's help manual directly in the terminal. Another important Linux command is `man`. It displays the manual page for any other command (as long as one exists). To see the manual page for the `mkdir` command, type:

```bash
man mkdir
```

You can even view the `man` command's manual page:

```bash
man man
```

**93. `screen`** – Manages multiple terminal sessions from one window.
**94. `ssh`** – Establishes secure, encrypted connections to remote servers.
**95. `tcpdump`** – Captures network traffic based on specific criteria.
**96. `watch`** – Repeats a command at regular intervals and highlights differences in output.
**97. `tmux`** – A terminal multiplexer for persistent sessions and splits.
**98. `nc`** – Opens TCP or UDP connections for testing and data transfer.
**99. `nmap`** – Host discovery, port scanning, and OS fingerprinting.
**100. `strace`** – Debugs processes by tracing operating system signals and calls.
**101. `unalias`** – As its name implies, the `unalias` command is designed to remove an `alias` from defined aliases. To remove the previous `ls` alias, you can use:

```bash
unalias ls
```

**102. `pwd`** – Stands for "print working directory," and it outputs the absolute path of the directory you are currently in. For example, if your username is "john" and you are in the `Documents` directory, its absolute path would be `/home/john/Documents`. To use it, simply type `pwd` in your terminal:

```bash
pwd
# My result: /home/wbolt/Documents/linux-commands
```

**103. `./`** – Perhaps the `./` symbol itself isn't a command, but it deserves a mention in this list. It allows the shell to run executable files directly from the terminal and install any interpreters in your system. No more double-clicking files in graphical file managers\! For example, with this command, you can run Python scripts or programs only available in `.run` format, like XAMPP. When running an executable, ensure it has executable (`x`) permissions, which you can modify using the `chmod` command. Here's a simple Python script and how to run it using the `./` symbol:

```python
#! /usr/bin/python3
# filename: script
for i in range(20):
print(f"This is a cool script {i}")
```

Here's how we'd make the script executable and run it:

```bash
chmod +x script
./script
```

**104. `exit`** – Automatically closes the terminal in use. The `exit` command does exactly what its name implies: using it, you can end your shell session, and in most cases, automatically close the terminal you are using:

```bash
exit
```

**105. `apt`, `yum`, `pacman` commands** – Regardless of which Linux distribution you are using, you are likely using a package manager to install, update, and delete the software you use daily. You can access these package managers through the command line and use one or another depending on the distribution your computer is running. The examples below will install GIMP, a free and open-source software usually available in most package managers:

1. **Debian-based (Ubuntu, Linux Mint)**

   ```bash
   sudo apt install gimp
   ```

2. **Red Hat-based (Fedora, CentOS)**

   ```bash
   sudo yum install gimp
   ```

3. **Arch-based (Manjaro, Arco Linux)**

   ```bash
   sudo pacman -S gimp
   ```

**106. `echo`** – Displays defined text in the terminal. The `echo` command displays defined text in the terminal – it's that simple:

```bash
echo "Cool message"
```

Its main use is to print environment variables within these messages:

```bash
echo "Hey $USER"
# Hey wbolt
```

**107. `cat`** – Used to create, view, and concatenate files directly from the terminal. `cat` is short for "concatenate" and is used to create, view, and concatenate files directly from the terminal. It's mainly used to preview files without opening a graphical text editor:

```bash
cat long_text_file.txt
```

**108. `vim`** – Edits plain text files with efficient keybindings. `vim` is a free and open-source terminal text editor that has been around since the 90s. It allows you to edit plain text files using efficient keybindings. Some find it difficult to use – exiting Vim is one of the most common StackOverflow questions – but once you get used to it, it becomes one of your best allies in the command line. To launch Vim, simply type:

```bash
vim
```

**109. `which`** – Outputs the full path of a shell command. The `which` command outputs the full path of a shell command. If it cannot recognize the given command, it will throw an error. For example, we can use it to check the binary paths for Python and the Brave web browser:

```bash
which python
# /usr/bin/python
which brave
# /usr/bin/brave
```

**110. `shred`** – This command repeatedly overwrites a file's contents. If you want a file to be almost unrecoverable, `shred` can help you with this task. This command repeatedly overwrites a file's contents, making the given file extremely difficult to recover. Here's a file with little content:

Now, let's do the job by typing the `shred` command:

```bash
shred file_to_shred.txt
```

If you want to delete the file immediately, you can use the `-u` flag:

```bash
shred -u file_to_shred.txt
```

**111. `less`** – A program that allows you to inspect files both forwards and backward. `less` (as opposed to `more`) is a program that allows you to inspect files both forwards and backward:

```bash
less large_text_file.txt
```

The advantage of `less` is that it incorporates both `more` and `vim` commands within its interface. If you need something more interactive than `cat`, `less` is a good choice.

**112. `tail`** – Prints the last few lines of a file's content. Similar to `cat`, `tail` prints file content with one major caveat: it only outputs the last few lines. By default, it prints the last 10 lines, but you can modify that number using `-n`. For example, to print the last few lines of a large text file, you can use:

```bash
tail long.txt
```

To view only the last four lines, do:

```bash
tail -n 4 long.txt
```

**113. `head`** – Outputs the first 10 lines of a text file. This is the complement to the `tail` command. `head` outputs the first 10 lines of a text file, but you can set any number of lines to display using the `-n` flag:

```bash
head long.txt
head -n 5 long.txt
```

**114. `whatis`** – Prints a single-line description of any other command. `whatis` prints a single-line description of any other command, making it a useful reference:

```bash
whatis python
# python (1) - an interpreted, interactive, object-oriented programming language
whatis whatis
# whatis (1) - display one-line manual page descriptions
```

**115. `neofetch`** – CLI (Command Line Interface) tool. `Neofetch` is a CLI (Command Line Interface) tool that displays information about your system, such as kernel version, shell, and hardware, alongside an ASCII logo of your Linux distribution:

```bash
neofetch
```

On most computers, this command is not available by default, so be sure to install it first using your package manager.

## **7 Top Tips for Using Linux Commands**

1. **Know Your Shell:** Bash, zsh, or fish? Different shells have unique features. Choose the one that best suits your needs.
2. **Master Core Tools:** `ls`, `cat`, `grep`, `sed`, `awk`, etc., form the core of the Linux toolkit.
3. **Stick to Pipes:** Avoid using too many temporary files. Skillfully pipe programs together.
4. **Verify Before Overwriting:** Always double-check before overwriting files using `>` and `>>`.
5. **Track Workflows:** Document complex commands and workflows for future reuse or sharing.
6. **Craft Your Own Tools:** Write simple shell scripts and aliases for frequently performed tasks.
7. **Start Without `sudo`:** Initially use a standard user account to understand permissions.

Remember to constantly test new commands on a virtual machine or VPS server so they become second nature before you start using them on production servers.

**Linux Command Cheat Sheet**
Whenever you need a quick reference, just check the table below:

| Command                | Usage                                               |
| :--------------------- | :-------------------------------------------------- |
| `ls`                   | Lists the contents of a directory.                  |
| `alias`                | Defines or displays aliases.                        |
| `unalias`              | Removes an alias definition.                        |
| `pwd`                  | Prints the working directory.                       |
| `cd`                   | Changes directory.                                  |
| `cp`                   | Copies files and directories.                       |
| `rm`                   | Deletes files and directories.                      |
| `mv`                   | Moves (renames) files and directories.              |
| `mkdir`                | Creates directories.                                |
| `man`                  | Displays the manual page for other commands.        |
| `touch`                | Creates empty files.                                |
| `chmod`                | Changes file permissions.                           |
| `./`                   | Runs executable files.                              |
| `exit`                 | Exits the current shell session.                    |
| `sudo`                 | Executes commands as a superuser.                   |
| `shutdown`             | Shuts down your machine.                            |
| `htop`                 | Displays process and resource information.          |
| `unzip`                | Unzips zip files.                                   |
| `apt`, `yum`, `pacman` | Package managers.                                   |
| `echo`                 | Displays lines of text.                             |
| `cat`                  | Prints file content.                                |
| `ps`                   | Reports shell process status.                       |
| `kill`                 | Terminates programs.                                |
| `ping`                 | Tests network connectivity.                         |
| `vim`                  | Efficient text editing.                             |
| `history`              | Displays a list of previous commands.               |
| `passwd`               | Changes user passwords.                             |
| `which`                | Returns the full binary path of a program.          |
| `shred`                | Overwrites files to hide their content.             |
| `less`                 | Interactively inspects files.                       |
| `tail`                 | Shows the last few lines of a file.                 |
| `head`                 | Shows the first 10 lines of a file.                 |
| `grep`                 | Prints lines matching a given condition.            |
| `whoami`               | Outputs the username.                               |
| `whatis`               | Displays a single-line description.                 |
| `wc`                   | Word counts files.                                  |
| `uname`                | Displays operating system information.              |
| `neofetch`             | Displays operating system and hardware information. |
| `find`                 | Searches for files following a pattern.             |
| `wget`                 | Retrieves files from the internet.                  |

**Summary**
Learning Linux can take some time, but once you grasp a few of its tools, it becomes your best ally, and you won't regret choosing it as your daily driver. One remarkable aspect of Linux is that even as an experienced user, you'll never stop learning ways to boost your productivity with it.
