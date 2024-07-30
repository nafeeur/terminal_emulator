document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    let currentDirectory = '/home/user';
    let fileSystem = {
        '/': {
            'home': {
                'user': {
                    'file1.txt': 'This is file1 content',
                    'file2.txt': 'This is file2 content',
                    'directory1': {}
                }
            }
        }
    };

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const command = input.value.trim();
            input.value = '';

            // Display the command in the output
            output.innerHTML += `<div class="command">$ ${command}</div>`;
            output.scrollTop = output.scrollHeight;

            // Process the command
            const result = processCommand(command);
            output.innerHTML += `<div class="result">${result}</div>`;
            output.scrollTop = output.scrollHeight;
        }
    });

    function processCommand(command) {
        const [cmd, ...args] = command.split(' ');
        switch (cmd) {
            case 'ls':
                return lsCommand();
            case 'pwd':
                return pwdCommand();
            case 'echo':
                return echoCommand(args);
            case 'help':
                return helpCommand();
            case 'clear':
                return clearCommand();
            case 'cd':
                return cdCommand(args);
            case 'mkdir':
                return mkdirCommand(args);
            case 'rm':
                return rmCommand(args);
            case 'cat':
                return catCommand(args);
            case 'touch':
                return touchCommand(args);
            case 'mv':
                return mvCommand(args);
            case 'cp':
                return cpCommand(args);
            case 'date':
                return dateCommand();
            default:
                return `${cmd}: command not found`;
        }
    }

    function lsCommand() {
        const directory = getDirectory(currentDirectory);
        if (directory) {
            return Object.keys(directory).join(' ');
        } else {
            return `ls: cannot access '${currentDirectory}': No such file or directory`;
        }
    }

    function pwdCommand() {
        return currentDirectory;
    }

    function echoCommand(args) {
        return args.join(' ');
    }

    function helpCommand() {
        return `Available commands:
        ls     - list directory contents
        pwd    - print name of current/working directory
        echo   - display a line of text
        help   - display this help message
        clear  - clear the terminal screen
        cd     - change the directory
        mkdir  - make directories
        rm     - remove files or directories
        cat    - concatenate and display files
        touch  - create a new file
        mv     - move or rename files
        cp     - copy files
        date   - display the current date and time`;
    }

    function clearCommand() {
        output.innerHTML = '';
        return '';
    }

    function cdCommand(args) {
        if (args.length !== 1) {
            return 'cd: wrong number of arguments';
        }
        const path = args[0];
        if (path === '..') {
            const parts = currentDirectory.split('/');
            parts.pop();
            currentDirectory = parts.length > 1 ? parts.join('/') : '/';
            return '';
        } else {
            const newDirectory = getDirectory(resolvePath(path));
            if (newDirectory) {
                currentDirectory = resolvePath(path);
                return '';
            } else {
                return `cd: no such file or directory: ${path}`;
            }
        }
    }

    function mkdirCommand(args) {
        if (args.length !== 1) {
            return 'mkdir: wrong number of arguments';
        }
        const path = resolvePath(args[0]);
        const parts = path.split('/');
        const dirName = parts.pop();
        const parentDir = getDirectory(parts.join('/'));
        if (parentDir && !parentDir[dirName]) {
            parentDir[dirName] = {};
            return '';
        } else {
            return `mkdir: cannot create directory ‘${args[0]}’: File exists or parent directory does not exist`;
        }
    }

    function rmCommand(args) {
        if (args.length !== 1) {
            return 'rm: wrong number of arguments';
        }
        const path = resolvePath(args[0]);
        const parts = path.split('/');
        const itemName = parts.pop();
        const parentDir = getDirectory(parts.join('/'));
        if (parentDir && parentDir[itemName]) {
            delete parentDir[itemName];
            return '';
        } else {
            return `rm: cannot remove ‘${args[0]}’: No such file or directory`;
        }
    }

    function catCommand(args) {
        if (args.length !== 1) {
            return 'cat: wrong number of arguments';
        }
        const path = resolvePath(args[0]);
        const file = getFile(path);
        if (file !== undefined) {
            return file;
        } else {
            return `cat: ${args[0]}: No such file or directory`;
        }
    }

    function touchCommand(args) {
        if (args.length !== 1) {
            return 'touch: wrong number of arguments';
        }
        const path = resolvePath(args[0]);
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentDir = getDirectory(parts.join('/'));
        if (parentDir && !parentDir[fileName]) {
            parentDir[fileName] = '';
            return '';
        } else {
            return `touch: cannot create file ‘${args[0]}’: File exists or parent directory does not exist`;
        }
    }

    function mvCommand(args) {
        if (args.length !== 2) {
            return 'mv: wrong number of arguments';
        }
        const [src, dest] = args.map(resolvePath);
        const srcFile = getFile(src);
        if (srcFile === undefined) {
            return `mv: cannot stat ‘${args[0]}’: No such file or directory`;
        }
        const destParts = dest.split('/');
        const destName = destParts.pop();
        const destDir = getDirectory(destParts.join('/'));
        if (destDir) {
            deleteFile(src);
            destDir[destName] = srcFile;
            return '';
        } else {
            return `mv: cannot move ‘${args[0]}’ to ‘${args[1]}’: No such directory`;
        }
    }

    function cpCommand(args) {
        if (args.length !== 2) {
            return 'cp: wrong number of arguments';
        }
        const [src, dest] = args.map(resolvePath);
        const srcFile = getFile(src);
        if (srcFile === undefined) {
            return `cp: cannot stat ‘${args[0]}’: No such file or directory`;
        }
        const destParts = dest.split('/');
        const destName = destParts.pop();
        const destDir = getDirectory(destParts.join('/'));
        if (destDir) {
            destDir[destName] = srcFile;
            return '';
        } else {
            return `cp: cannot copy ‘${args[0]}’ to ‘${args[1]}’: No such directory`;
        }
    }

    function dateCommand() {
        return new Date().toString();
    }

    function resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        } else {
            return `${currentDirectory}/${path}`.replace(/\/+/g, '/');
        }
    }

    function getDirectory(path) {
        const parts = path.split('/').filter(p => p);
        let dir = fileSystem['/'];
        for (const part of parts) {
            if (dir[part] && typeof dir[part] === 'object') {
                dir = dir[part];
            } else {
                return null;
            }
        }
        return dir;
    }

    function getFile(path) {
        const parts = path.split('/').filter(p => p);
        let dir = fileSystem['/'];
        for (let i = 0; i < parts.length - 1; i++) {
            if (dir[parts[i]] && typeof dir[parts[i]] === 'object') {
                dir = dir[parts[i]];
            } else {
                return undefined;
            }
        }
        return dir[parts.pop()];
    }

    function deleteFile(path) {
        const parts = path.split('/').filter(p => p);
        let dir = fileSystem['/'];
        for (let i = 0; i < parts.length - 1; i++) {
            if (dir[parts[i]] && typeof dir[parts[i]] === 'object') {
                dir = dir[parts[i]];
            } else {
                return;
            }
        }
        delete dir[parts.pop()];
    }
});
