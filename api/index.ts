import { PrismaClient } from '@prisma/client';
import { ZenStackMiddleware } from '@zenstackhq/server/express';
import RestApiHandler from '@zenstackhq/server/api/rest';
import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { compareSync } from 'bcryptjs';
import { withPresets } from '@zenstackhq/runtime';
import type { Request } from 'express';
import swaggerUI from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
dotenv.config();


function getUser(req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('TOKEN:', token);
    if (!token) {
        return undefined;
    }
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        return { id: decoded.sub };
    } catch {
        // bad token
        return undefined;
    }
}

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
        where: { email },
    });
    if (!user || !compareSync(password, user.password)) {
        res.status(401).json({ error: 'Invalid credentials' });
    } else {
        const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!);
        res.json({ id: user.id, email: user.email, token });
    }
});

// Vercel can't properly serve the Swagger UI CSS from its npm package, here we load it from a public location
const options = { customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.css' };
const spec = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../discord-api.json'), 'utf8')
);
app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(spec, options));

// TODO: Replace with API URL
const apiHandler = RestApiHandler({ endpoint: `${process.env.HOST}/api` });

app.use(
    '/api',
    ZenStackMiddleware({
        getPrisma: (req) => {
            return withPresets(prisma, { user: getUser(req) });
        },
        handler: apiHandler,
    })
);

export default app;