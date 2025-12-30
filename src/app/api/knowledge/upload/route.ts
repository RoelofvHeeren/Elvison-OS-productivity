import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// POST /api/knowledge/upload - Handle file upload
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string || undefined;
        const category = formData.get('category') as string || 'DOCUMENT';
        const tags = formData.get('tags') as string || '';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Ensure upload directory exists
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // Write file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Read file content for text files
        let content = '';
        const textExtensions = ['.txt', '.md', '.json', '.csv', '.html', '.xml'];
        if (textExtensions.includes(ext.toLowerCase())) {
            content = buffer.toString('utf-8');
        } else {
            content = `[File: ${file.name}]\nPath: /uploads/${filename}\nSize: ${file.size} bytes\nType: ${file.type}`;
        }

        // Create knowledge item
        const item = await prisma.knowledgeItem.create({
            data: {
                userId: MOCK_USER_ID,
                title: title || file.name,
                category: category as any,
                content,
                tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [],
            },
        });

        return NextResponse.json({
            ...item,
            filePath: `/uploads/${filename}`,
        }, { status: 201 });
    } catch (error) {
        console.error('Failed to upload file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
