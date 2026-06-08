const fs = require('fs');
const path = require('path');

function getRelativePath(fromPath, toPath) {
    let rel = path.relative(path.dirname(fromPath), toPath);
    // Replace backslashes with forward slashes for imports
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

            // Find all imports matching @/custom-hooks/
            const regex = /from\s+["']@\/custom-hooks\/([^"']+)["']/g;
            content = content.replace(regex, (match, hookName) => {
                const targetHookDir = path.join(__dirname, 'src', 'custom-hooks');
                const relPath = getRelativePath(fullPath, targetHookDir);
                updated = true;
                return `from "${relPath}/${hookName}"`;
            });

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'src'));
