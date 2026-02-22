import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("locker.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT,
    group_name TEXT,
    version_chain_id TEXT,
    is_final INTEGER DEFAULT 0,
    upload_date TEXT,
    content_snippet TEXT,
    page_count INTEGER,
    weight INTEGER DEFAULT 0,
    sender TEXT,
    priority TEXT DEFAULT '中优先级'
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    file_id TEXT,
    question TEXT,
    options TEXT,
    answer TEXT,
    evidence_page INTEGER,
    difficulty TEXT
  );
`);

function seedDatabase() {
  try {
    const existing = db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number };
    console.log(`Current file count: ${existing.count}`);
    
    // Always re-seed to ensure the user has the requested files
    console.log("Re-seeding database with requested files...");
    db.prepare("DELETE FROM files").run();
    console.log("Existing files deleted.");
    
    const insertFile = db.prepare("INSERT INTO files (id, name, group_name, version_chain_id, is_final, upload_date, content_snippet, page_count, weight, sender, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    const requiredFiles = [
      { id: "f1", name: "2026四级词汇大纲_校对版.pdf", group: "2025级本科生英语课通知群", chain: "cet4_outline", final: 0, date: "2024-02-21", snippet: "本大纲包含2026年四级考试核心词汇...", pages: 52, weight: 100, sender: "李助教", priority: "高优先级" },
      { id: "f2", name: "2026四级词汇大纲_初稿.pdf", group: "2025级本科生英语课通知群", chain: "cet4_outline", final: 0, date: "2024-02-15", snippet: "初步整理的四级词汇...", pages: 48, weight: 50, sender: "王老师", priority: "低优先级" },
      { id: "f3", name: "四级作文万能模板汇总.pdf", group: "2025级本科生英语课通知群", chain: "cet4_writing", final: 1, date: "2024-02-20", snippet: "开头段、中间段、结尾段万能句型...", pages: 15, weight: 80, sender: "王老师", priority: "高优先级" },
      { id: "f4", name: "四级听力高频词.pdf", group: "2025级本科生英语课通知群", chain: "cet4_listening", final: 1, date: "2024-02-18", snippet: "听力场景词汇、同义替换词...", pages: 22, weight: 90, sender: "李助教", priority: "中优先级" },
      { id: "f5", name: "环境保护词汇思维导图.png", group: "2025级本科生英语课通知群", chain: "env_mindmap", final: 1, date: "2024-02-21", snippet: "关于环境保护、污染、气候变化的思维导图...", pages: 0, weight: 95, sender: "王老师", priority: "高优先级" },
      
      { id: "d1", name: "四级真题必刷题.pdf", group: "309宿舍小分队", chain: "dorm_cet4", final: 1, date: "2024-02-21", snippet: "历年四级真题解析...", pages: 120, weight: 100, sender: "李盈盈", priority: "高优先级" },
      { id: "d2", name: "宿舍电费分摊_2025.pdf", group: "309宿舍小分队", chain: "dorm_elec", final: 1, date: "2024-02-15", snippet: "2025年宿舍电费明细...", pages: 2, weight: 50, sender: "张三", priority: "中优先级" },
      { id: "d3", name: "期末考试划重点_计算机网络.pdf", group: "309宿舍小分队", chain: "dorm_net", final: 1, date: "2024-02-20", snippet: "计算机网络期末复习重点...", pages: 10, weight: 80, sender: "李盈盈", priority: "高优先级" },
      { id: "d4", name: "宿舍照片合集.zip", group: "309宿舍小分队", chain: "dorm_photos", final: 0, date: "2024-02-18", snippet: "宿舍聚餐及活动照片...", pages: 0, weight: 30, sender: "张三", priority: "低优先级" }
    ];

    const transaction = db.transaction((files) => {
      for (const f of files) {
        insertFile.run(f.id, f.name, f.group, f.chain, f.final, f.date, f.snippet, f.pages, f.weight, f.sender, f.priority);
        console.log(`Inserted file: ${f.name} in group: ${f.group}`);
      }
    });

    transaction(requiredFiles);
    console.log("Database seeded successfully.");
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

seedDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/files", (req, res) => {
    try {
      const { group_name } = req.query;
      console.log(`API: Fetching files for group: ${group_name}`);
      
      const count = db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number };
      if (count.count === 0) {
        console.log("Database empty, seeding initial demo state...");
        seedDatabase();
      }
      
      let files;
      const orderBy = `
        CASE priority 
          WHEN '高优先级' THEN 1 
          WHEN '中优先级' THEN 2 
          WHEN '低优先级' THEN 3 
          ELSE 4 
        END ASC, 
        weight DESC
      `;
      
      if (group_name) {
        files = db.prepare(`SELECT * FROM files WHERE group_name = ? ORDER BY ${orderBy}`).all(String(group_name));
      } else {
        files = db.prepare(`SELECT * FROM files ORDER BY ${orderBy}`).all();
      }
      
      console.log(`API: Returning ${files.length} files`);
      res.json(files);
    } catch (err) {
      console.error("API Error fetching files:", err);
      res.status(500).json({ error: "Internal server error", details: String(err) });
    }
  });

  app.post("/api/files", (req, res) => {
    const { name, group_name, content_snippet, page_count, sender, priority } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const version_chain_id = name.split('.')[0].toLowerCase().replace(/\s+/g, '_');
    const upload_date = new Date().toISOString().split('T')[0];
    
    db.prepare("INSERT INTO files (id, name, group_name, version_chain_id, is_final, upload_date, content_snippet, page_count, weight, sender, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, name, group_name, version_chain_id, 0, upload_date, content_snippet || "新导入的文件内容...", page_count || 1, 10, sender || "系统导入", priority || "中优先级");
    
    res.json({ success: true, id });
  });

  app.post("/api/files/set-final", (req, res) => {
    const { id, version_chain_id } = req.body;
    // Reset others in chain
    db.prepare("UPDATE files SET is_final = 0 WHERE version_chain_id = ?").run(version_chain_id);
    // Set this one as final
    db.prepare("UPDATE files SET is_final = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/files/:id", (req, res) => {
    db.prepare("DELETE FROM files WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/questions", (req, res) => {
    const questions = db.prepare("SELECT * FROM questions").all();
    res.json(questions);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
