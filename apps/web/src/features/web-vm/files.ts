import { type FileNode, type FileSystemTree } from "@webcontainer/api"

const code: FileNode = {
  file: {
    contents: ``
  }
}

const ai: FileNode = {
  file: {
    contents: ``
  }
}

export const binDirectory: FileSystemTree = {
  ".bin": {
    directory: {
      code,
      ai
    }
  }
}

const expressFiles: FileSystemTree = {
  "index.js": {
    file: {
      contents: `
import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
res.send('Hello world!');
});

app.listen(port, () => {
console.log(\`App is live at http://localhost:\${port}\`);
});`
    }
  },
  "package.json": {
    file: {
      contents: `
{
"name": "example-app",
"type": "module",
"dependencies": {
  "express": "latest",
  "nodemon": "latest"
},
"scripts": {
  "start": "nodemon --watch './' index.js"
}
}`
    }
  }
}
