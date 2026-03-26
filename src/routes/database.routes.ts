import express, { Request, Response } from 'express';
import {
    createUser,
    createProject,
    getUserById,
    getProjectById,
    getProjectsByUserId,
    deleteUserById,
    deleteProjectById,
    deleteProjectsByUserId,
    updateProjectStatusById,
} from '../services/database.service';

const router = express.Router();

router.post('/users', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }
        const user = await createUser(name);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.get('/users/:id', async (req: Request, res: Response) => {
    try {
        const user = await getUserById(req.params.id as string);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.get('/users/:id/projects', async (req: Request, res: Response) => {
    try {
        const projects = await getProjectsByUserId(req.params.id as string);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        await deleteProjectsByUserId(req.params.id as string);
        const user = await deleteUserById(req.params.id as string);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.post('/projects', async (req: Request, res: Response) => {
    try {
        const { name, githubRepoURL, userId } = req.body;
        if (!name || !githubRepoURL || !userId) {
            return res.status(400).json({ error: 'name, githubRepoURL and userId are required' });
        }
        const project = await createProject(name, githubRepoURL, userId);
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.get('/projects/:id', async (req: Request, res: Response) => {
    try {
        const project = await getProjectById(req.params.id as string);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.patch('/projects/:id/status', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }
        const project = await updateProjectStatusById(req.params.id as string, status);
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.delete('/projects/:id', async (req: Request, res: Response) => {
    try {
        const project = await deleteProjectById(req.params.id as string);
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

export default router;

