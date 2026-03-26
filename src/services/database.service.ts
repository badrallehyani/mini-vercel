import { Status } from "../generated/enums";
import { prisma } from "../utils/prisma";

async function createUser(name: string) {
    const user = await prisma.user.create({
        data: {
            name,
        }
    });
    return user;
}

async function createProject(name: string, githubRepoURL: string, userId: string) {
    const project = await prisma.project.create({
        data: {
            name,
            githubRepoURL,
            userId,
        }
    });
    return project;
}

async function getUserById(id: string) {
    const user = await prisma.user.findUnique({
        where: {
            id,
        }
    });
    return user;
}

async function getProjectById(id: string) {
    const project = await prisma.project.findUnique({
        where: {
            id,
        }
    });
    return project;
}

async function getProjectsByUserId(userId: string) {
    const projects = await prisma.project.findMany({
        where: {
            userId,
        }
    });
    return projects;
}

async function deleteUserById(id: string) {
    const user = await prisma.user.delete({
        where: {
            id,
        }
    });
    return user;
}

async function deleteProjectById(id: string) {
    const project = await prisma.project.delete({
        where: {
            id,
        }
    });
    return project;
}

async function deleteProjectsByUserId(userId: string) {
    const projects = await prisma.project.deleteMany({
        where: {
            userId,
        }
    });
    return projects;
}

async function updateProjectStatusById(id: string, status: Status) {
    const project = await prisma.project.update({
        where: {
            id,
        },
        data: {
            status
        }
    });
    return project;
}

async function main() {
    const user = await prisma.user.create({
        data: {
            name: "Test User",
        }
    });
    console.log("Created user:", user);

    const userID = user.id;

    const project = await prisma.project.create({
        data: {
            name: "Test Project",
            githubRepoURL: "",
            userId: userID,
        }
    });
    console.log("Created project:", project);



}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });