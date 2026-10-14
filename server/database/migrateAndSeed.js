const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const dataStore = require('../services/dataStore');

async function runMigrateAndSeed() {
  console.log('🚀 Running ProjectPulse Database Migration & Seed...');

  try {
    // 1. Run Base Schema
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await db.pool.query(schemaSql);
    console.log('✅ Base schema verified / executed.');

    // 2. Run ProjectPulse Extension Migration
    const extSql = fs.readFileSync(path.join(__dirname, 'migrations', '001_projectpulse_tables.sql'), 'utf-8');
    await db.pool.query(extSql);
    console.log('✅ ProjectPulse extended tables verified / executed.');

    // 3. Seed Users if table is empty
    const usersCountRes = await db.pool.query('SELECT COUNT(*) FROM users');
    const usersCount = parseInt(usersCountRes.rows[0].count);

    if (usersCount === 0) {
      console.log('🌱 Seeding initial authentic Tamil users dataset into PostgreSQL...');
      for (const u of dataStore.users) {
        const hashedPassword = await bcrypt.hash(u.password || 'password', 10);
        await db.pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, status, dept, academic_year, credits, approved_projects, skills, domain_of_interest, initials)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            u.id,
            u.name,
            u.email,
            hashedPassword,
            u.role,
            u.status || 'Active',
            u.dept,
            u.academic_year || '—',
            u.credits || 0,
            u.approved_projects || 0,
            u.skills || [],
            u.domain_of_interest || '',
            u.initials || ''
          ]
        );
      }
      await db.pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
      console.log(`✅ ${dataStore.users.length} users seeded.`);
    }

    // 4. Seed Projects if table is empty
    const projCountRes = await db.pool.query('SELECT COUNT(*) FROM projects');
    const projCount = parseInt(projCountRes.rows[0].count);

    if (projCount === 0) {
      console.log('🌱 Seeding authentic projects dataset into PostgreSQL...');
      for (const p of dataStore.projects) {
        const author = dataStore.users.find(u => u.name === p.author);
        const authorId = author ? author.id : 1;

        await db.pool.query(
          `INSERT INTO projects (id, type, status, title, author_id, author_name, dept, category, likes_count, comments_count, views_count, abstract, description, github_url, doc_url, ppt_url, cert_url, demo_url, vercel_url, tech_stack)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
           ON CONFLICT (id) DO NOTHING`,
          [
            p.id,
            p.type,
            p.status,
            p.title,
            authorId,
            p.author,
            p.dept,
            p.category,
            p.likes || 0,
            p.commentsCount || 0,
            p.views || 0,
            p.abstract || '',
            p.description || p.abstract || '',
            p.github || '',
            p.doc || '',
            p.ppt || '',
            p.cert || '',
            p.demo || '',
            p.vercel || '',
            p.tech || []
          ]
        );
      }
      await db.pool.query(`SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects))`);
      console.log(`✅ ${dataStore.projects.length} projects seeded.`);
    }

    // 5. Seed Historical Submissions and Rejected Project Archetype
    const subCountRes = await db.pool.query('SELECT COUNT(*) FROM submissions');
    const subCount = parseInt(subCountRes.rows[0].count);

    if (subCount === 0) {
      console.log('🌱 Seeding initial submissions and historical rejected reference...');
      for (const p of dataStore.projects) {
        const author = dataStore.users.find(u => u.name === p.author);
        await db.pool.query(
          `INSERT INTO submissions (id, project_id, student_id, student_name, student_dept, title, category, type, abstract, problem_statement, objectives, methodology, tech_stack, github_url, doc_url, ppt_url, status, originality_score, similarity_score, assigned_faculty)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
           ON CONFLICT (id) DO NOTHING`,
          [
            p.id,
            p.id,
            author ? author.id : 1,
            p.author,
            p.dept,
            p.title,
            p.category,
            p.type,
            p.abstract || '',
            'Automated academic solution tackling standard university domain challenges.',
            'Deliver high accuracy, modular implementation and verified demonstration.',
            'Full-stack architecture with modular components, REST APIs and edge telemetry.',
            p.tech || [],
            p.github || '',
            p.doc || '',
            p.ppt || '',
            p.status === 'Approved' ? 'Approved' : 'Pending Review',
            95.0,
            5.0,
            p.assignedFaculty || 'Dr. Arumugam Pillai'
          ]
        );
      }

      // Seed a canonical PREVIOUSLY REJECTED submission for cross-faculty originality testing
      const rejectedSubId = 999;
      await db.pool.query(
        `INSERT INTO submissions (id, project_id, student_id, student_name, student_dept, title, category, type, abstract, problem_statement, objectives, methodology, tech_stack, status, originality_score, similarity_score, assigned_faculty)
         VALUES ($1, NULL, 6, 'Dhanush Ram', 'Electronics', 'Smart IoT Waste Bin with Ultrasonic Level Tracking', 'Internet of Things', 'Internal',
                 'An automated smart waste bin node utilizing ultrasonic sensors to monitor fill levels in university campus and alert sanitary workers over LoRaWAN network to optimize waste collection routes.',
                 'Campus garbage overflow leads to sanitary hazards and inefficient manual collection rounds.',
                 'Measure garbage bin capacity in real-time, generate alerts when bins hit 85% full, and plot shortest route on university map.',
                 'Arduino Uno with HC-SR04 ultrasonic sensor, ESP8266 Wi-Fi module, LoRa gateway, and Flask server dashboard.',
                 ARRAY['Arduino', 'C++', 'LoRaWAN', 'Flask', 'Ultrasonic HC-SR04'],
                 'Rejected', 32.0, 78.0, 'Dr. Arumugam Pillai')
         ON CONFLICT (id) DO NOTHING`,
        [rejectedSubId]
      );

      // Add corresponding historical review decision
      await db.pool.query(
        `INSERT INTO review_decisions (submission_id, reviewer_id, reviewer_name, decision, rejection_reason, faculty_comments, similarity_snapshot)
         VALUES ($1, 13, 'Dr. Arumugam Pillai', 'Rejected',
                 'Plagiarism & duplicate implementation of previous batch repository',
                 'This proposal mirrors the 2024 IoT Waste Management node by the senior batch with minimal original novelty in hardware design. The problem formulation and ultrasonic sensor pipeline are 85% identical without proper attribution or advancement.',
                 '{"overallSimilarity": 78.5, "matchedSection": "Abstract & Sensor Methodology", "priorBatchRef": "BATCH-2024-IOT-09"}'::jsonb)`,
        [rejectedSubId]
      );

      await db.pool.query(`SELECT setval('submissions_id_seq', (SELECT GREATEST(MAX(id), 1000) FROM submissions))`);
      console.log('✅ Submissions seeded with canonical historical rejected reference (ID 999).');
    }

    console.log('🎉 ProjectPulse Database Migration & Seed completed successfully!');
  } catch (err) {
    console.error('❌ Migration/seed error:', err);
    throw err;
  }
}

if (require.main === module) {
  runMigrateAndSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrateAndSeed;
