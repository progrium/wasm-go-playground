"use strict";

(() => {
  const enosys = () => {
		const err = new Error("not implemented");
		err.code = "ENOSYS";
		return err;
	};
  
  const encoder = new TextEncoder("utf-8");
	const decoder = new TextDecoder("utf-8");
	const filesystem = {};
	let workingDirectory = '/';

	let absPath = (path) => {
			if (path[0] == '/') {
					return path;
			}
			return workingDirectory + path.replace(/^\.\/?/, '');
	};
	globalThis.readFromGoFilesystem = (path) => filesystem[absPath(path)];
	globalThis.writeToGoFilesystem = (path, content) => {
			if (typeof content === 'string') {
					filesystem[absPath(path)] = encoder.encode(content);
			} else {
					filesystem[absPath(path)] = content;
			}
	};
	globalThis.goStdout = (buf) => {};
	globalThis.goStderr = (buf) => {};

	const openFiles = new Map();
	let nextFd = 1000;
	let stat = (path, callback) => {
		let mode = 0;
		if (path === '/') {
				mode |= 0x80000000;
		} else if (filesystem[path] === undefined) {
				const err = new Error('no such file');
				err.code = 'ENOENT';
				callback(err);
				return;
		}
		callback(null, {
				mode,
				dev: 0,
				ino: 0,
				nlink: 0,
				uid: 0,
				gid: 0,
				rdev: 0,
				size: 0,
				blksize: 0,
				blocks: 0,
				atimeMs: 0,
				mtimeMs: 0,
				ctimeMs: 0,
				isDirectory: () => !!(mode & 0x80000000),
		});
	};

  let outputBuf = "";
  globalThis.fs = {
    constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 }, // unused
    writeSync(fd, buf) {
      if (fd === 1) {
        globalThis.goStdout(buf);
      } else if (fd === 2) {
        globalThis.goStderr(buf);
      } else {
          const file = openFiles[fd];
          const source = filesystem[file.path];
          let destLength = source.length + buf.length;
          if (file.offset < source.length) {
              destLength = file.offset + buf.length;
              if (destLength < source.length) {
                  destLength = source.length;
              }
          }
          const dest = new Uint8Array(destLength);
          for (let i = 0; i < source.length; ++i) {
              dest[i] = source[i];
          }
          for (let i = 0; i < buf.length; ++i) {
              dest[file.offset + i] = buf[i];
          }
          openFiles[fd].offset += buf.length;
          filesystem[file.path] = dest;
      }
      // outputBuf += decoder.decode(buf);
      // const nl = outputBuf.lastIndexOf("\n");
      // if (nl != -1) {
      // 	console.log(outputBuf.substring(0, nl));
      // 	outputBuf = outputBuf.substring(nl + 1);
      // }
      // return buf.length;
    },
    write(fd, buf, offset, length, position, callback) {
      if (offset !== 0 || length !== buf.length) {
        throw new Error('write not fully implemented: ' + offset + ', ' + length + '/' + buf.length);
      }
      if (position !== null) {
          openFiles[fd].offset = position;
      }
      this.writeSync(fd, buf);
      callback(null, length);
      // if (offset !== 0 || length !== buf.length || position !== null) {
      // 	callback(enosys());
      // 	return;
      // }
      // const n = this.writeSync(fd, buf);
      // callback(null, n);
    },
    chmod(path, mode, callback) { callback(enosys()); },
    chown(path, uid, gid, callback) { callback(enosys()); },
    close(fd, callback) {
      console.log('close(' + fd + ')');
      openFiles.delete(fd);
      callback(null);
  },
    fchmod(fd, mode, callback) {
      console.log('fchmod(' + fd + ', ' + mode + ')');
      callback(null);
  },
    fchown(fd, uid, gid, callback) { callback(enosys()); },
    fstat(fd, callback) { callback(enosys()); },
    fsync(fd, callback) { callback(null); },
    ftruncate(fd, length, callback) { callback(enosys()); },
    lchown(path, uid, gid, callback) { callback(enosys()); },
    link(path, link, callback) { callback(enosys()); },
    lstat(path, callback) {
      console.log('lstat(' + path + ')');
      stat(absPath(path), callback);
  },
    mkdir(path, perm, callback) { callback(enosys()); },
    open(path, flags, mode, callback) {
      console.log('open(' + path + ', ' + mode + ')');
      path = absPath(path);
      if (!filesystem[path]) {
          if (flags & globalThis.fs.constants.O_CREAT) {
              filesystem[path] = new Uint8Array(0);
          } else {
              const err = new Error('no such file');
              err.code = 'ENOENT';
              callback(err);
              return;
          }
      }
      if (flags & globalThis.fs.constants.O_TRUNC) {
          filesystem[path] = new Uint8Array(0);
      }
      const fd = nextFd++;
      openFiles[fd] = {
          offset: 0,
          path,
      };
      callback(null, fd);
  },
    read(fd, buffer, offset, length, position, callback) {
      if (offset !== 0) {
          throw new Error('read not fully implemented: ' + offset);
      }
      if (position !== null) {
          openFiles[fd].offset = position;
      }
      const file = openFiles[fd];
      const source = filesystem[file.path];
      let n = length;
      if (file.offset + length > source.length) {
          n = source.length - file.offset;
      }
      for (let i = 0; i < n; ++i) {
          buffer[i] = source[file.offset + i];
      }
      openFiles[fd].offset += n;
      callback(null, n);
  },
    readdir(path, callback) { callback(enosys()); },
    readlink(path, callback) { callback(enosys()); },
    rename(from, to, callback) { callback(enosys()); },
    rmdir(path, callback) { callback(enosys()); },
    stat(path, callback) {
      console.log('stat(' + path + ')');
      stat(absPath(path), callback);
  },
    symlink(path, link, callback) { callback(enosys()); },
    truncate(path, length, callback) { callback(enosys()); },
    unlink(path, callback) {
      console.log('unlink(' + path + ')');
      callback(null);
  },
    utimes(path, atime, mtime, callback) { callback(enosys()); },
  };

  globalThis.process.cwd = () => workingDirectory;
  

})();