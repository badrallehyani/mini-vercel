import fs from 'node:fs/promises';
import * as path from "node:path";

const skippedFiles = ["node_modules", ".git", ".github", "dist", "build"];
export const PROJECTS_TYPES = {
    NPM: "npm",
    VANILLA: "vanilla",
    UNKNOWN: "unknown"
};

export async function getAllFiles(
    dirPath: string
): Promise<{ name: string; parentPath: string; absolutePath: string; relativePath: string }[]> {

    const files = (await fs.readdir(dirPath, { recursive: true, withFileTypes: true }))
        .filter((entry) => {
            // entry.parentPath gives the directory; entry.name gives the file/folder name
            const relativePath = path.join(entry.parentPath, entry.name);

            // 'folder/.git/config' -> ['folder', '.git', 'config'])
            const pathParts = relativePath.split(path.sep);

            // RULE 1: skip files that are in the skippedFiles list
            const shouldSkip = pathParts.some(part => skippedFiles.includes(part));
            if (shouldSkip) return false;

            // RULE 2: skip directories
            if (entry.isDirectory()) return false;

            // RULE 3: ignore zip files
            if (entry.name.endsWith('.zip')) return false;

            return true;
        });

    const relativePaths = files.map(file => {
        const relativePath = path.relative(dirPath, path.join(file.parentPath, file.name));
        return {
            name: file.name,
            parentPath: file.parentPath,
            absolutePath: path.join(file.parentPath, file.name),
            relativePath
        };
    });

    return relativePaths;
}


export async function getProjectType(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    if (files.some(file => file.name === "package.json" && file.isFile())) {
        return PROJECTS_TYPES.NPM;
    }

    if (files.some(file => file.name === "index.html" && file.isFile())) {
        return PROJECTS_TYPES.VANILLA;
    }

    return PROJECTS_TYPES.UNKNOWN;

}

export function getLogFilePath(projectID: string): string {
    const logsDir = path.join(__dirname, "..", "..", "tmp");
    return path.join(logsDir, `${projectID}.log`);
}