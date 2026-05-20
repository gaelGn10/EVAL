const fs = require('fs');
const path = require('path');

function copyFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            copyFiles(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const destPath = fullPath + '.txt';
            fs.copyFileSync(fullPath, destPath);
            console.log(`Copied ${fullPath} to ${destPath}`);
        }
    }
}

copyFiles('.');
console.log('Duplication complete.');
