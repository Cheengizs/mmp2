const express = require('express');
const path = require('path');
const multer = require('multer');
const methodOverride = require('method-override');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');

const db = require('./db');

const app = express();
const PORT = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    const { status, subject, sort } = req.query;

    let query = `
        SELECT t.*, c.name as category_name, s.name as subject_name, st.name as status_name 
        FROM tasks t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN statuses st ON t.status_id = st.id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        query += ` AND t.status_id = ?`;
        params.push(status);
    }
    if (subject) {
        query += ` AND t.subject_id = ?`;
        params.push(subject);
    }

    if (sort === 'deadline_asc') {
        query += ` ORDER BY t.deadline ASC`;
    } else if (sort === 'deadline_desc') {
        query += ` ORDER BY t.deadline DESC`;
    } else {
        query += ` ORDER BY t.deadline ASC`;
    }

    const tasks = db.prepare(query).all(params);
    
    const tasksWithFiles = tasks.map(task => {
        const files = db.prepare(`SELECT * FROM task_files WHERE task_id = ?`).all(task.id);
        return { ...task, files };
    });

    const statuses = db.prepare('SELECT * FROM statuses').all();
    const subjects = db.prepare('SELECT * FROM subjects').all();

    res.render('index', { 
        tasks: tasksWithFiles, 
        statuses, 
        subjects, 
        filters: { status, subject, sort } 
    });
});

app.get('/tasks/new', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    const subjects = db.prepare('SELECT * FROM subjects').all();
    const statuses = db.prepare('SELECT * FROM statuses').all();
    res.render('task_form', { task: null, categories, subjects, statuses });
});

app.post('/tasks', upload.array('files'), (req, res) => {
    const { title, category_id, subject_id, status_id, note, deadline } = req.body;
    
    const info = db.prepare(`
        INSERT INTO tasks (title, category_id, subject_id, status_id, note, deadline) 
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, category_id || null, subject_id || null, status_id || null, note, deadline);
    
    const taskId = info.lastInsertRowid;

    if (req.files && req.files.length > 0) {
        const insertFile = db.prepare(`INSERT INTO task_files (task_id, file_name, original_file_name) VALUES (?, ?, ?)`);
        req.files.forEach(file => {
            insertFile.run(taskId, file.filename, file.originalname);
        });
    }

    res.redirect('/');
});

app.get('/tasks/:id/edit', (req, res) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).send('Task not found');
    
    task.files = db.prepare('SELECT * FROM task_files WHERE task_id = ?').all(task.id);

    const categories = db.prepare('SELECT * FROM categories').all();
    const subjects = db.prepare('SELECT * FROM subjects').all();
    const statuses = db.prepare('SELECT * FROM statuses').all();
    
    res.render('task_form', { task, categories, subjects, statuses });
});

app.put('/tasks/:id', upload.array('files'), (req, res) => {
    const { title, category_id, subject_id, status_id, note, deadline } = req.body;
    const taskId = req.params.id;
    
    db.prepare(`
        UPDATE tasks 
        SET title = ?, category_id = ?, subject_id = ?, status_id = ?, note = ?, deadline = ?
        WHERE id = ?
    `).run(title, category_id || null, subject_id || null, status_id || null, note, deadline, taskId);
    
    if (req.files && req.files.length > 0) {
        const insertFile = db.prepare(`INSERT INTO task_files (task_id, file_name, original_file_name) VALUES (?, ?, ?)`);
        req.files.forEach(file => {
            insertFile.run(taskId, file.filename, file.originalname);
        });
    }

    res.redirect('/');
});

app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const files = db.prepare('SELECT file_name FROM task_files WHERE task_id = ?').all(taskId);
    files.forEach(f => {
        const filePath = path.join(__dirname, 'uploads', f.file_name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId); 
    res.redirect('/');
});

app.delete('/tasks/:taskId/files/:fileId', (req, res) => {
    const { taskId, fileId } = req.params;
    const file = db.prepare('SELECT file_name FROM task_files WHERE id = ?').get(fileId);
    if (file) {
        const filePath = path.join(__dirname, 'uploads', file.file_name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        db.prepare('DELETE FROM task_files WHERE id = ?').run(fileId);
    }
    res.redirect('/tasks/' + taskId + '/edit');
});

app.get('/dictionaries', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    const statuses = db.prepare('SELECT * FROM statuses').all();
    const subjects = db.prepare('SELECT * FROM subjects').all();
    res.render('dictionaries', { categories, statuses, subjects });
});

app.post('/categories', (req, res) => {
    try {
        db.prepare('INSERT INTO categories (name) VALUES (?)').run(req.body.name);
    } catch(err) {
        console.error(err);
    }
    res.redirect('/dictionaries');
});
app.put('/categories/:id', (req, res) => {
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(req.body.name, req.params.id);
    res.redirect('/dictionaries');
});
app.delete('/categories/:id', (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.redirect('/dictionaries');
});

app.post('/statuses', (req, res) => {
    try {
        db.prepare('INSERT INTO statuses (name) VALUES (?)').run(req.body.name);
    } catch(err) {
        console.error(err);
    }
    res.redirect('/dictionaries');
});
app.put('/statuses/:id', (req, res) => {
    db.prepare('UPDATE statuses SET name = ? WHERE id = ?').run(req.body.name, req.params.id);
    res.redirect('/dictionaries');
});
app.delete('/statuses/:id', (req, res) => {
    db.prepare('DELETE FROM statuses WHERE id = ?').run(req.params.id);
    res.redirect('/dictionaries');
});

app.post('/subjects', (req, res) => {
    try {
        db.prepare('INSERT INTO subjects (name) VALUES (?)').run(req.body.name);
    } catch(err) {
        console.error(err);
    }
    res.redirect('/dictionaries');
});
app.put('/subjects/:id', (req, res) => {
    db.prepare('UPDATE subjects SET name = ? WHERE id = ?').run(req.body.name, req.params.id);
    res.redirect('/dictionaries');
});
app.delete('/subjects/:id', (req, res) => {
    db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    res.redirect('/dictionaries');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
