const fs = require('fs');
const path = require('path');

function getRelativePath(fromPath, toPath) {
    let rel = path.relative(path.dirname(fromPath), toPath);
    rel = rel.replace(/\\/g, '/');
    if (!rel.startsWith('.')) {
        rel = './' + rel;
    }
    return rel;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = false;

            // Find all imports matching @/something
            const regex = /from\s+["']@\/([^"']+)["']/g;
            content = content.replace(regex, (match, importPath) => {
                const targetDir = path.join(__dirname, 'src', path.dirname(importPath));
                const targetFile = path.basename(importPath);
                
                let relPath = getRelativePath(fullPath, targetDir);
                // If it's importing from just "@/types", path.dirname is "."
                if (importPath === 'types') {
                     const typesDir = path.join(__dirname, 'src');
                     relPath = getRelativePath(fullPath, typesDir);
                     updated = true;
                     return `from "${relPath}/types"`;
                }

                updated = true;
                return `from "${relPath}/${targetFile}"`;
            });

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'src'));
