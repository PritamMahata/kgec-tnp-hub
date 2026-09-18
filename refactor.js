const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('getSession()')) {
        // Handle session.js itself
        if (fullPath.endsWith('session.js')) {
          content = content.replace(
            /export function getSession\(\) \{[\s\n]+const raw = \/\* @next-codemod-error.*?\*\/[\s\n]*cookies\(\)\.get\(SESSION_COOKIE\)\?\.value;/g,
            "export async function getSession() {\n  const raw = (await cookies()).get(SESSION_COOKIE)?.value;"
          );
          content = content.replace(
            /export function getSession\(\) \{\s+const raw = cookies\(\)\.get\(SESSION_COOKIE\)\?\.value;/g,
            "export async function getSession() {\n  const raw = (await cookies()).get(SESSION_COOKIE)?.value;"
          );
        } else {
          // Replace `getSession()` with `await getSession()`
          content = content.replace(/const session = getSession\(\)/g, 'const session = await getSession()');
          
          // Make sure the containing export function is async
          content = content.replace(/export default function (\w+)/g, 'export default async function $1');
          content = content.replace(/export function (GET|POST|PUT|PATCH|DELETE)/g, 'export async function $1');
          
          // Clean up double async
          content = content.replace(/async\s+async/g, 'async');
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
